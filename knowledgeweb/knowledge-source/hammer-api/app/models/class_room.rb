class ClassRoom < ApplicationRecord
  include NotificationHelper

  attr_accessor :modify_file_name_cover, :modify_file_name_preview_video

  validates :total_students, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  extend Enumerize

  before_update :update_total_classes_of_instructor

  after_save :preview_video_convert_to_hls_abr, :update_suggestion_keyword, if: :saved_change_to_status?
  after_save :resize_image, if: :saved_change_to_cover?

  def resize_image
    return if previous_changes['cover'].uniq.size == 1
    GenerateClassThumbCoverImageWorker.perform_async(self.id)
  end

  serialize :suitable_level, Array

  enumerize :suitable_level, in: [:beginner, :intermediate, :advanced, :professional, :kid], multiple: true
  enumerize :class_type, in: [:live_stream, :video_class, :virtual_class], default: :live_stream, scope: :having_class_type
  enumerize :status, in: [:draft, :publish, :archived, :unpublish, :cancelled], default: :draft, scope: :having_status

  mount_uploader :cover, CoverUploader
  mount_uploader :preview_video, PreviewVideoUploader

  def modify_file_name_video
    self.modify_file_name_preview_video
  end

  belongs_to :interest
  belongs_to :user, -> { with_deleted }, optional: true

  has_one    :user_profile, -> { with_deleted }, through: :user
  has_one    :instructor_profile, through: :user
  has_one     :meeting

  has_many :courses
  has_many :course_groups
  has_many :course_schedules, through: :course_groups
  has_many :paid_items
  has_many :students, class_name: "User", through: :paid_items, foreign_key: "user_id"
  has_many :reviews
  has_many :reports, as: :reportable
  has_many :hls_converts, as: :inputable
  has_many :order_items


  has_and_belongs_to_many :user_favorites, -> { distinct }, class_name: "User", join_table: "user_class_room_favorites"

  scope :featured, -> { where(in_featured_classes: true) }

  delegate :name, to: :user_profile, prefix: true
  delegate :full_name, to: :instructor_profile, prefix: true
  delegate :email, to: :user, prefix: true, allow_nil: true
  delegate :name, to: :interest, prefix: true

  accepts_nested_attributes_for :meeting, reject_if: :all_blank
  attr_accessor :meeting_link

  # after_save :push_noti_user_follows

  def meeting_link
    @meeting_link ||= "No meeting link available!"
  end

  def cover_url
    self.cover.url
  end

  def purchased_at_of user_id
    ClassRoom.joins('inner join order_items on order_items.class_room_id = class_rooms.id inner join orders on order_items.order_id = orders.id').where("order_items.class_room_id = #{self.id} and orders.user_id = #{user_id} ").select('order_items.updated_at as purchased_at')
  end

  def preview_video_url
    self.preview_video.url
  end

  def update_suggestion_keyword
    if self.status == "publish"
      SuggestionKeyword.find_or_create_by(keyword: self.title, filter_type: "class_room")
    elsif self.status == "unpublish" || self.status == "cancelled"
      SuggestionKeyword.delete_by(keyword: self.title, filter_type: "class_room") unless ClassRoom.find_by(title: self.title, status: "publish")
    end
  end

  def owned_courses_of user_id
    Course.where("id in (?)", PaidItem.find_by("paid_items.class_room_id = ? and paid_items.user_id = ?", self.id, user_id).courses)
  end

  def owned_course_groups_of user_id
    CourseGroup.where("id in (?)", PaidItem.where("paid_items.class_room_id = ? and paid_items.user_id = ?", self.id, user_id).select("paid_items.course_group_id"))
  end

  def unpublish
    self.update(status: "unpublish")
  end

  def publish
    self.update(status: "publish")
  end

  def push_noti_new
    self.push_noti_user_follows()
  end

  def push_noti_cancel_livestream
    self.push_noti_user_cancelled_class()
  end

  private
    # before save callbacks
    def update_total_classes_of_instructor
      return if self.status == "draft" or self.instructor_profile.nil?
      if self.status == "publish"
        self.instructor_profile.update!(total_classes: self.instructor_profile.total_classes + 1)
      else
        self.instructor_profile.update!(total_classes: ClassRoom.where(user_id: self.user_id, status: "publish").count)
      end

      self.total_students = PaidItem.where(class_room_id: self.id).count
    end

    # after save callbacks
    def preview_video_convert_to_hls_abr
      return
      if self.class_type == "video_class" and self.courses.size > 0
        self.courses.each{|c| c.update!( status: self.status )}
      end

      return unless self.status == "publish"

      return if Rails.env == "development"
      return if self.preview_video.nil?

      mc = Amazons::EmcServices.new('preview_video')
      job = mc.convert_with_ABR(self.attributes["preview_video"])
      if job.present?
        hls_params = {
          object_type: "preview_video",
          job_id: job.id,
          job_status: job.status,
          file_name: File.basename(self.attributes["preview_video"], ".*")
        }
        self.hls_converts.create!(hls_params)
      end

    end


    def push_noti_user_follows
      begin
        return if self.status != "publish" 
        teacher = User.find(self.user_id)
        followers = UsersServices::FilterServices.new('').list_followers_of_user(teacher)
        return if followers.count == 0
  
        message = {
          title: "notification.title.new_class",
          body: "notification.body.new_class",
          notification_type: 'Classes'
        }
  
        options = {
          data: {
            multi_language: {
              username: "#{teacher.username}",
              class_name: "#{self.title}",
            }
          }
        }
        
        push_noti_multi(teacher, followers, self, message, options) if followers.count > 0
  
      rescue StandardError => e

      ensure
      end
    end

    def push_noti_user_cancelled_class
      begin
        return if self.class_type != "live_stream" 
        return if self.status != "cancelled" 
        teacher = User.find(self.user_id)
  
        message_teacher = {
          title: "notification.title.cancel_class_teacher",
          body: "notification.body.cancel_class_teacher",
          notification_type: 'Classes'
        }
  
        options_teacher = {
          data: {
            multi_language: {
              # username: "#{teacher.username}",
              class_name: "#{self.title}",
            }
          }
        }

        push_noti(teacher, teacher, self, message_teacher, options_teacher)

        return if self.students == 0
  
        message_students = {
          title: "notification.title.cancel_class_student",
          body: "notification.body.cancel_class_student",
          notification_type: 'Classes'
        }
  
        options_students = {
          data: {
            multi_language: {
              # username: "#{teacher.username}",
              class_name: "#{self.title}",
              class_time: "#{self.start_time_at}",
            }
          }
        }
        
        push_noti_multi(teacher, self.students, self, message_students, options_students)
  
      rescue StandardError => e
        puts e
      ensure
      end
    end
end
