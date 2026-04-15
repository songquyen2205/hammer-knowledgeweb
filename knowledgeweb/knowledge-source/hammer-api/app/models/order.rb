class Order < ApplicationRecord
  before_save :set_total_price
  extend Enumerize
  enumerize :status, in: [:created, :completed], default: :created, scope: :having_status

  belongs_to :user
  has_many :order_items, dependent: :destroy

  def calculate_subtotal_price
    ### Total price of order items
  end

  def set_total_price
    if self.changed.include?("subtotal_price") || self.changed.include?("tax_price") || self.changed.include?("discount_price")
      self.total_price = (self.subtotal_price  + self.tax_price) - self.discount_price
    end
  end
end
