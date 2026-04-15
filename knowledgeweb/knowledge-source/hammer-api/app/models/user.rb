class User < ApplicationRecord
  include NotificationHelper
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
  acts_as_paranoid
  extend Enumerize
  mount_uploader :avatar, AvatarUploader
  attr_accessor :modify_file_name, :relation_with_current_user
  serialize :role, Array

  phony_normalize :phone_number, as: :phone_number_normalized, country_code: :country_code, default_country_code: 'SG'
  # validates :phone_number_normalized, uniqueness: { allow_blank: true }
  validates :email, uniqueness: { allow_blank: true, message: "email is already taken" }
  validates :phone_number, uniqueness: { allow_blank: true, message: "phone number is already taken" }

  validate :check_invitor_exist
  # validates :phone_number, uniqueness: { message: "Phone Number already exsits!"}

  enumerize :role, in: [:user, :instructor], default: [:user], multiple: true
  enumerize :status, in: [:active, :suspended, :reported, :deactivated], default: :active, scope: :having_status
  enumerize :sign_up_status, in: [:pending, :selecting_interests, :completed], default: :pending, scope: :having_sign_up_status

  after_create :create_settings
  after_create :check_email
  after_update :check_email
  after_save   :update_suggestion_keyword, if: :saved_change_to_status?
  after_save   :resize_image, if: :saved_change_to_avatar?
  after_destroy :update_follow_count

  belongs_to :invitor, class_name: 'User', foreign_key: 'invite_by_id', optional: true
  has_one :user_profile, -> { with_deleted }, dependent: :destroy
  has_one :instructor_profile, -> { with_deleted }, dependent: :destroy
  has_one :notification_setting, dependent: :destroy
  has_one :privacy_setting, dependent: :destroy
  has_one :cart, -> { where(status: :created) }, foreign_key: 'user_id', class_name: "Order"
  has_one :user_stream_provider

  has_many :invitees, class_name: 'User', foreign_key: 'invite_by_id'
  has_many :providers, dependent: :destroy
  has_many :musics
  has_many :posts
  has_many :comments
  has_many :hashtags
  has_many :reports, as: :reportable, dependent: :destroy
  has_many :reportage, class_name: "Report", foreign_key: "user_id"
  has_many :class_rooms
  has_many :payment_methods
  has_many :payout_methods
  has_many :payouts
  has_many :orders, -> { where(status: :completed) }
  has_many :all_orders, class_name: "Order", foreign_key: "user_id"
  has_many :order_items, class_name: "OrderItem", through: :all_orders
  has_many :line_items, class_name: "LineItem", through: :order_items
  has_many :completed_order_items, source: :order_items, through: :orders
  has_many :completed_line_items, source: :line_items, through: :completed_order_items
  has_many :paid_items, dependent: :destroy
  has_many :owned_class_rooms, through: :paid_items, source: :class_room
  has_many :user_announcements
  has_many :courses, class_name: "ClassRoom", through: "paid_items"
  has_many :reviews, dependent: :destroy
  has_many :transfers
  has_many :instructor_transfers, class_name: "Transfer", foreign_key: "instructor_id"
  has_many :refunds
  has_many :transfer_reports, foreign_key: "instructor_id"
  has_many :event_staffs

  #this following code help us get list blocked_user of specific User by using User.find(:id).blocked_users
  has_many :blocked_users_blocks,
           :foreign_key => :owner_id,
           :class_name => 'BlockedUser'

  has_many :blocked_users,
           :through => :blocked_users_blocks,
           :foreign_key => :blocked_user_id,
           :class_name => 'User'

  has_many :blocked_users_owners,
           :foreign_key => :blocked_user_id,
           :class_name => "BlockedUser"

  has_many :owners,
           :through => :blocked_users_owners,
           :foreign_key => :owner_id,
           :class_name => 'User'

  #this following code help us get list user you follow by User.find(:id).followings and get all users who follow you by User.find(:id).followers
  has_many :follows_followings, -> { where('follows.status = 2')},
           :foreign_key => :follower_id,
           :class_name => 'Follow'

  has_many :followings,
           :through => :follows_followings,
           :foreign_key => :following_id,
           :class_name => 'User'

  has_many :follows_followers, -> { where('follows.status = 2')},
           :foreign_key => :following_id,
           :class_name => "Follow"

  has_many :followers,
           :through => :follows_followers,
           :foreign_key => :follower_id,
           :class_name => 'User'

  has_many :registrations
  has_many :user_interests, dependent: :destroy
  has_many :user_music_favorites, dependent: :destroy
  has_many :user_post_likes, dependent: :destroy
  has_many :user_post_favorites, dependent: :destroy
  has_many :user_class_room_favorites, dependent: :destroy

  has_and_belongs_to_many :interests, -> { distinct }, class_name: "Interest", join_table: "user_interests"
  has_and_belongs_to_many :music_favorites, -> { distinct }, class_name: "Music", join_table: "user_music_favorites"
  has_and_belongs_to_many :post_likes, -> { distinct }, class_name: "Post", join_table: "user_post_likes", before_add: :increase_total_likes_at_post, after_add: :push_noti_user_likes
  has_and_belongs_to_many :post_favorites, -> { distinct }, class_name: "Post", join_table: "user_post_favorites"
  has_and_belongs_to_many :class_room_favorites, -> { distinct }, class_name: "ClassRoom", join_table: "user_class_room_favorites"

  has_and_belongs_to_many :comment_likes, -> { distinct }, class_name: "Comment", join_table: "user_comment_likes"
  has_and_belongs_to_many :comment_excludes, -> { distinct }, class_name: "Comment", join_table: "user_comment_excludes"

  has_many :not_interests, dependent: :destroy

  has_many :send_notifications, as: :targetable
  has_many :notifications, through: :send_notifications
  has_many :produced_notifications, class_name: "Notification",  foreign_key: :producer_id
  has_many :related_notifications, -> { where("notifications.object_type = 'User'")}, class_name: "Notification",  foreign_key: :object_id # notifications which have the user as the object

  accepts_nested_attributes_for :user_profile, reject_if: :all_blank
  accepts_nested_attributes_for :instructor_profile, reject_if: :all_blank
  accepts_nested_attributes_for :payment_methods, reject_if: :all_blank

  delegate :name, :username, :bio, :total_followings, :total_followers, to: :user_profile, prefix: true, allow_nil: true
  delegate :username, :name, :avatar_url, to: :user_profile
  delegate :first_name, :last_name, :full_name, :about, :status, to: :instructor_profile, prefix: true, allow_nil: true
  delegate :total_students, to: :instructor_profile, allow_nil: true

  delegate :private_account, to: :privacy_setting

  scope :standard_users, -> { where("users.role not like '%instructor%'") }
  scope :instructors, -> { where("users.role like '%instructor%'") }
  scope :available, -> { where(status: ["active", "reported"]) }
  scope :unavailable, -> { where(status: ["deactivated", "suspended"]) }
  scope :deactivated, -> { where(status: "deactivated") }
  scope :banned, -> { where(status: "suspended") }

  # Ex:- scope :active, -> {where(:active => true)}

  def follow_request_received
    User.where(id: Follow.where(following_id: self.id, status: "requested").pluck(:follower_id))
  end

  def follow_request_sent
    User.where(id: Follow.where(follower_id: self.id, status: "requested").pluck(:following_id))
  end

  def avatar_url
    self.avatar.url
  end

  def check_email
    if self.email.nil?
      self.email = ""
    end
  end

  def is_private?
    self.private_account == true
  end

  def report_name
    self.user_profile_name
  end

  def is_instructor?
    self.role.include? "instructor"
  end

  def is_read_noti? notification
    if self.notifications.include? notification
      self.send_notifications.find(notification.id).is_read
    else
      nil
    end
  end

  def mark_as_read_noti send_notification_id
    self.send_notifications.find(send_notification_id).update!(is_read: true)
  end


  def mark_as_read_noti_all 
    self.send_notifications.update_all(is_read: true)
  end

  def mark_as_read_noti_by_type notification_type
    # self.send_notifications.where(notification_type: notification_type).update!(is_read: true)
    self.send_notifications.joins(:notification).where("notifications.notification_type = ?", notification_type).update_all(is_read: true)
  end

  def is_friend_with user
    if self.followings.include? user and user.followings.include? self
      return true
    end
    return false
  end


  def is_owner_of? post
    return true if post.user = self
    return false
  end

  def group_chats
    (GroupChat.where(sender_user_id: self.id)
      .joins(:chat_messages)
      .where('group_chats.sender_deleted_at IS NULL OR (group_chats.sender_deleted_at IS NULL OR (group_chats.sender_deleted_at IS NOT NULL AND chat_messages.created_at >= group_chats.sender_deleted_at))')
    .or(GroupChat.where(receiver_user_id: self.id)
      .joins(:chat_messages)
      .where('group_chats.receiver_deleted_at IS NULL OR (group_chats.receiver_deleted_at IS NOT NULL AND chat_messages.created_at >= group_chats.receiver_deleted_at)'))
    ).distinct
  end

  def invitor_username
    invitor.present? ? invitor.user_profile.username : nil
  end

  def mark_as_deactivated
    self.update!(status: "deactivated")
  end

  def available?
    ["active", "reported"].include? self.status
  end

  def deactivated?
    self.status == "deactivated"
  end

  def banned?
    self.status == "suspended"
  end

  def resize_image
    return if previous_changes['avatar'].uniq.size == 1
    GenerateUserThumbAvatarWorker.perform_async(self.id)
  end

  def update_follow_count
    UpdateFollowCountAfterDeleteUserWorker.perform_async(self.id)
  end

  private
    def create_settings
      self.create_notification_setting()
      self.create_privacy_setting()
    end

    def increase_total_likes_at_post(post)
      unless self.post_likes.include? post
        post.total_likes += 1
        post.save
        post.user.user_profile.total_likes += 1
        post.user.user_profile.save
      end
    end

    # def decrease_total_likes_at_post(post)
    #   if self.post_likes.include? post
    #     post.total_likes -= 1 if post.total_likes > 0
    #     post.save
    #     post.user.user_profile.total_likes -= 1 if post.user.user_profile.total_likes > 0
    #     post.user.user_profile.save
    #   end
    # end

    # def increase_total_followings(user)
    #   unless self.followings.include? user
    #     self.user_profile.total_followings += 1
    #     self.user_profile.save
    #     user.user_profile.total_followers += 1
    #     user.user_profile.save
    #   end
    # end

    # def increase_total_followers(user)
    #   unless self.followers.include? user
    #     self.user_profile.total_followers += 1
    #     self.user_profile.save
    #     user.user_profile.total_followings += 1
    #     user.user_profile.save
    #   end
    # end

    # def decrease_total_followings(user)
    #   if self.followings.include? user
    #     self.user_profile.total_followings -= 1 if self.user_profile.total_followings > 0
    #     self.user_profile.save
    #     user.user_profile.total_followers -= 1 if user.user_profile.total_followers > 0
    #     user.user_profile.save
    #   end
    # end

    # def decrease_total_followers(user)
    #   if self.followers.include? user
    #     self.user_profile.total_followers -= 1 if self.user_profile.total_followers > 0
    #     self.user_profile.save
    #     user.user_profile.total_followings -= 1 if user.user_profile.total_followings > 0
    #     user.user_profile.save
    #   end
    # end

    def push_noti_user_likes(post)
      post_owner = post.user
      return if post_owner == self
      return unless available_settings(post_owner).include? "Likes"

      message = {
        title: 'notification.title.like_notification',
        body: 'notification.body.like_notification',
        notification_type: 'Likes'
      }

      options = {
        data: {
          multi_language: {
            username: "#{self.username}"
          }
        }
      }

      push_noti(self, post_owner, post, message, options)
    end

    def update_suggestion_keyword
      if self.status == "active"
        SuggestionKeyword.create(keyword: self.user_profile&.username, filter_type: "user")
      elsif self.status == "deactivated"
        SuggestionKeyword.delete_by(keyword: self.user_profile&.username, filter_type: "user")
      end
    end

    def check_invitor_exist
      if invite_by_id == 0
        errors.add(:invitor_username, "Invation Code not exist")
      end
    end

  protected
    def email_required?
      false
    end

    def password_required?
      # !persisted? || !password_confirmation.nil?
      false
    end
end
