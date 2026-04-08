# Hammer Toàn Bộ Dự Án

## 1. Mục tiêu module

Tài liệu này mô tả theo hướng object-oriented cho phạm vi toàn bộ dự án Hammer, bao gồm social community, class commerce, event commerce và finance operations trên 3 platform: hammer-api, hammer-web, hammer-mobile.

## 2. Actor objects

| Actor | Vai trò chính | Hành vi cốt lõi |
| --- | --- | --- |
| Learner | Buyer + consumer | Khám phá, checkout class/event, học, refund |
| Instructor | Class seller | Tạo class, theo dõi earnings, request payout |
| Event Organizer | Event seller | Tạo event, bán ticket, quản lý participant |
| Admin/Operations | Điều phối vận hành | Moderation, xử lý refund/payout, theo dõi rủi ro |

## 3. Module objects

### 3.1 Social Community

- Follow/follower
- Post/comment/like/favorite
- Chat/group chat
- Notification

### 3.2 Identity & Account

- User, profile, role
- Auth (email/OTP/SSO)
- Privacy & settings

### 3.3 Class Commerce

- Class Room (Livestream / Virtual Class / Video Class)
- Order / Order Item / Line Item
- Paid Item entitlement
- Class refund

### 3.4 Event Commerce

- Event
- Ticket types
- Event order (EventUser, EventUserItem)
- Event refund

### 3.5 Finance Operations

- Transfer
- Refund
- Payout
- Wallet Ledger (target architecture)

## 4. Flow objects

### 4.1 Class purchase flow

1. Learner checkout.
2. Order completed.
3. Paid Item được cấp.
4. Transfer sales được ghi nhận.

### 4.2 Class refund flow

1. Learner tạo refund request.
2. Admin review.
3. Approved -> Transfer refund + cập nhật entitlement.

### 4.3 Instructor payout flow

1. Instructor tạo payout request.
2. Admin process.
3. Transfer payout và cập nhật số dư liên quan.

### 4.4 Event checkout flow

1. Learner chọn ticket.
2. Event checkout completed.
3. EventUser/EventUserItem được tạo.
4. Ticket code được sinh.

### 4.5 Event refund flow

1. Learner request event refund.
2. Admin cập nhật trạng thái.
3. Settlement đối ứng seller còn là điểm cần chốt.

## 5. Data/KPI objects

### 5.1 Data objects

- Order, Order Item, Line Item
- Paid Item
- EventUser, EventUserItem, EventUserTicket
- Refund, EventRefund
- Payout
- Transfer

### 5.2 KPI objects

- GMV Class
- GMV Event
- Refund Rate (class/event)
- Payout Lead Time
- Net Revenue

## 6. Rules/Open-issue objects

### 6.1 Rules

- Mọi transaction tài chính cần idempotency key.
- Mọi settlement cần reference id để audit/reconciliation.
- Tách reporting theo stream class/event.

### 6.2 Open issues

- Event earning timing: checkout hay sau event kết thúc?
- Event refund approved có tạo transfer debit seller hay không?
- Event Organizer payout policy có tách riêng với Instructor không?
- Hold period class/event có cùng SLA hay khác nhau?

## 7. Đề xuất cải thiện

- Xây Wallet Ledger user-centric làm source of truth.
- Tách balance bucket theo stream class/event (pending/available/locked).
- Tách payout policy theo earning stream thay vì role cứng.
- Chuẩn hóa trạng thái transaction để truy vết xuyên suốt buyer/seller/admin.

## 8. Lý do đề xuất

- Hiện tại settlement mạnh ở class flow, event flow còn khoảng trống.
- Cập nhật balance bằng callback rải rác gây rủi ro sai lệch số dư.
- Cần giảm chi phí đối soát thủ công và hỗ trợ audit tốt hơn.

## 9. Hướng tiếp cận dùng để đưa ra đề xuất

Framework phân tích đã dùng:

- Domain decomposition theo actor/module/flow.
- Event-storming nhẹ theo các transaction lifecycle.
- Gap analysis giữa trạng thái hiện tại và target architecture wallet ledger.
- Risk-based prioritization theo tác động dòng tiền.

## 10. Pros/Cons

### Pros

- Tăng auditability và traceability.
- Giảm lỗi tính số dư do callback phân tán.
- Dễ mở rộng đa stream và policy phức tạp.

### Cons

- Cần migration dữ liệu và chuẩn hóa reference.
- Tăng độ phức tạp ở service layer ban đầu.
- Cần kế hoạch chuyển đổi KPI/reconciliation song song.

## 11. Tác động business

- Tăng độ tin cậy payout/refund cho creator và learner.
- Cải thiện chất lượng báo cáo theo stream class/event.
- Giảm rủi ro vận hành khi scale volume giao dịch.

## 12. Tác động kỹ thuật

- Thêm transaction service trung tâm cho wallet ledger.
- Refactor callback balance sang ledger-based computation.
- Bổ sung idempotency + unique index + reconciliation jobs.

## 13. Rủi ro + điều kiện triển khai

### Rủi ro

- Migration không đầy đủ có thể gây lệch số dư tạm thời.
- Rule event settlement chưa chốt có thể làm chậm rollout.

### Điều kiện triển khai

- Chốt policy event payout/refund trước khi coding sâu.
- Chuẩn hóa reference id từ payment provider.
- Có kế hoạch dual-write/dual-read theo phase để giảm rủi ro cutover.
