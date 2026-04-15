# Open Issues và Giả định

## Mục đích

Ghi lại các câu hỏi chưa chốt để BA/PO/Tech Lead theo dõi tập trung.

## Câu hỏi mở hiện tại

1. Event organizer có điều kiện gì để được request payout?
2. Payout event và payout class có SLA giống nhau hay tách riêng?
3. Chính sách hold period cho class và event là bao lâu?
4. Khi refund, trừ pending trước hay trừ available theo quy tắc nào?
5. Có cần multi-currency ngay phase đầu wallet không?
6. Mức độ tự động hóa reconciliation với payment provider cần đến đâu?
7. Event refund khi approved có cần tạo settlement log/transfer giống class refund không?
8. Event checkout có cần ghi earnings log ngay lúc mua hay chờ event hoàn tất?

## Giả định đang dùng (best effort)

- Event có thể do user thường tạo và bán vé.
- Instructor flow vẫn là luồng chính cho class commerce.
- Reporting class và event nên tách stream để tránh sai lệch.

## Rủi ro nếu chưa chốt

- Lệch logic payout giữa web/mobile/admin.
- Số liệu doanh thu ròng không nhất quán.
- Tăng chi phí support do thiếu quy tắc rõ ràng.
- Dòng tiền event không đối soát được với class nếu thiếu settlement log tương ứng.

## Quy tắc quản lý issue

- Mỗi issue cần owner và hạn chốt.
- Mỗi quyết định cần ghi ngày hiệu lực.
- Khi issue được chốt, cập nhật vào `knowledge-base.md`.
