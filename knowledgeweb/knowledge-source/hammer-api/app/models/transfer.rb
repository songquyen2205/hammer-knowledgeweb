class Transfer < ApplicationRecord
  after_create :update_instructor_balance
  extend Enumerize
  enumerize :transfer_type, in: { sales: 1, refund: 2, payout: 3 }, scope: :having_transfer_type
  belongs_to :user, -> { with_deleted }
  belongs_to :instructor, class_name: "User"
  belongs_to :transferable, polymorphic: true

  def update_instructor_balance
    case self.transfer_type
    when 'sales'
      instructor_profile = self.instructor.instructor_profile
      instructor_profile.update!(balance: instructor_profile.balance + self.amount)
    when 'refund'
      instructor_profile = self.instructor.instructor_profile
      instructor_profile.update!(balance: instructor_profile.balance - self.transferable.amount)
    when 'payout'
      instructor_profile = User.find(self.user_id).instructor_profile
      instructor_profile.update!(balance: instructor_profile.balance - self.transferable.amount - self.transferable.fee)
    end
  end

  def status
    return nil if self.transfer_type != 'refund'
    return self.transferable.status
  end
end
