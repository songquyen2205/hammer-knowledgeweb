class EventRefund < ApplicationRecord
  mount_uploader :attachment, AttachmentUploader
  attr_accessor :modify_file_name

  extend Enumerize
  enumerize :status, in: { pending: 1, processing: 2, refunded: 3, declined: 4 }, scope: :having_status
  enumerize :reason, in: { not_suitable_event: 1, organizer_cancel: 2, other: 3 }, scope: :having_reason

  belongs_to :user, -> { with_deleted }
  belongs_to :administrator, optional: true
  belongs_to :event
  belongs_to :event_user

  private
end
