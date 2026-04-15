# Hammer Workspace Instructions

## Scope

- hammer-api: Backend Rails API, domain logic, payment/refund/payout, admin operations.
- hammer-web: Frontend web cho learner và instructor operations.
- hammer-mobile: Frontend mobile social-first cho learner/creator journey.
- NotecuaQuyen: Tài liệu BA và tri thức nghiệp vụ chuẩn hóa (nguồn chính).

## Primary Language

- Ngôn ngữ chính cho tài liệu và comment nghiệp vụ: Tiếng Việt.
- Có thể giữ tên biến/field/API bằng tiếng Anh theo codebase hiện tại.

## Thuật ngữ bắt buộc

- Class Room
- Livestream
- Virtual Class
- Video Class
- Event
- Order / Order Item / Line Item
- Paid Item (entitlement)
- Refund
- Payout
- Transfer
- Wallet Ledger

## Repository Context

Dự án không chỉ là nền tảng học trực tuyến. Hammer là hệ sinh thái gồm social community + class commerce + event commerce, có admin operations để vận hành refund/payout/moderation.

## Backend Guidance

- Framework: Ruby on Rails 7.
- Ưu tiên tách rõ domain logic và API layer.
- Tránh cập nhật balance bằng callback rải rác khi xử lý tài chính; ưu tiên transaction service + ledger.
- Mọi logic tài chính cần idempotency, auditability, và trace bằng reference id.
- Với thay đổi nghiệp vụ payment/refund/payout, luôn kiểm tra tác động chéo giữa class flow và event flow.

## Frontend Guidance

- hammer-web: Next.js + module-based architecture (`src/modules`, `src/services`, `src/stores`).
- hammer-mobile: React Native + screen/store/saga pattern.
- UI hiển thị transaction phải có filter theo stream (class/event), trạng thái, thời gian, chiều tiền vào/ra.
- Không trộn logic tính toán tài chính ở UI; chỉ hiển thị dữ liệu đã chuẩn hóa từ backend.

## Documentation Guidance

- `NotecuaQuyen/knowledge-base.md` là nguồn tri thức chính (single source of truth).
- Các tài liệu còn lại tóm tắt theo chủ đề: thuật ngữ, business model, KPI, open issues.
- Khi có thay đổi nghiệp vụ lớn, cập nhật `NotecuaQuyen/knowledge-base.md` trước, sau đó mới cập nhật file chuyên đề.

## Editing Rules

- Giữ thay đổi nhỏ, đúng mục tiêu.
- Không đổi tên thuật ngữ business lõi nếu chưa có quyết định thống nhất.
- Với flow tài chính, luôn mô tả rõ actor, trigger, status transition, và side-effect.

## Reporting Reminders

- Theo dõi tối thiểu: GMV class, GMV event, refund rate, payout lead time, net revenue.
- Báo cáo phải tách theo stream class/event để tránh nhiễu số liệu.

## Assumptions

- hammer-web là kênh chính cho instructor operations và payout request.
- hammer-mobile thiên về social engagement và learning consumption.
- Event organizer có thể không cần role instructor.
