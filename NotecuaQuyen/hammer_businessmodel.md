# Business Model Overview

## Hammer là gì?

Hammer là nền tảng creator-led commerce kết hợp:

- social community để tạo demand và giữ chân user
- learning commerce để bán lớp học
- event commerce để bán vé sự kiện

## Vấn đề được giải quyết

- Creator/instructor cần kênh xây dựng cộng đồng và kiếm tiền.
- Learner cần nơi khám phá, theo dõi và mua trải nghiệm học tập.
- Platform cần công cụ vận hành để xử lý giao dịch, refund, payout.

## Actor chính

- Learner
- Instructor
- Event Organizer
- Admin/Operations

## Value proposition theo actor

- Learner: khám phá nội dung + mua lớp/sự kiện + quản lý lịch sử học và giao dịch.
- Instructor: tạo lớp, theo dõi hiệu suất, nhận payout.
- Event Organizer: tạo event, bán vé, quản lý participant.
- Admin: giám sát vận hành, xử lý rủi ro và chất lượng.

## Revenue streams

- Doanh thu từ giao dịch mua lớp học.
- Doanh thu từ giao dịch mua vé sự kiện.
- Phí nền tảng và điều phối payout (tùy chính sách).

## Capability map cấp cao

- Identity & account
- Social graph & engagement
- Class commerce
- Event commerce
- Finance operations (refund/payout/reporting)
- Admin governance

## Điểm cần nâng cấp

- Chuẩn hóa finance architecture theo user-centric wallet ledger.
- Tách payout policy theo earning stream class/event.
- Tăng khả năng audit/reconciliation.

## Tech platform map

| Platform | Stack | Vai trò chính |
| --- | --- | --- |
| hammer-api | Ruby on Rails 7 | Domain logic, admin ops, REST API, payment/refund/payout |
| hammer-web | Next.js (module-based) | Instructor dashboard, learner checkout, class/event mgmt |
| hammer-mobile | React Native | Social-first feed, learning consumption, creator journey |

## Module map theo platform

### hammer-api (backend)

- `app/controllers/admin/` — refunds, payouts, events, instructors, sales, tickets
- `app/controllers/api/v1/` — class_rooms, events, users, posts, instructors, tickets
- `app/models/` — order, order_item, line_item, paid_item, refund, payout, transfer, event, event_user, event_refund, class_room, user, instructor_profile
- `app/services/` — orders, paidItems, payments_services, classrooms, users_services

### hammer-web (web frontend)

- `src/modules/Classes` — class browse, detail
- `src/modules/Checkout` — cart, checkout flow
- `src/modules/Event` — event browse, detail, checkout
- `src/modules/Instructor` — instructor dashboard, revenue, class mgmt
- `src/modules/Transactions` — lịch sử giao dịch learner
- `src/modules/MyLearning` — class đã mua
- `src/modules/Profile` — profile, settings
- `src/modules/Search` — tìm kiếm cross-module
- `src/modules/Home` — trang chủ feed

### hammer-mobile (mobile)

- `src/screens/Feed` — social feed
- `src/screens/Explore` — khám phá class/event
- `src/screens/LiveStream` — stream phát live
- `src/screens/CreateVideo` — tạo video class
- `src/screens/Instructor` — instructor mobile view
- `src/screens/MyRefunds` — lịch sử refund learner
- `src/screens/Messages` — chat
- `src/screens/Profile` — profile

## Social capabilities

Hammer xây dựng demand thông qua social graph:

- Follow/follower giữa user (learner ↔ instructor ↔ event organizer).
- Post/comment/like/favorite để tạo engagement.
- Chat message và group chat để duy trì cộng đồng.
- Feed algorithm dựa trên interest và follow.
- Notification đa kênh (push, in-app).

## Admin capabilities

- User moderation: reports, content review.
- Finance ops: refund approval, payout processing, transfer log.
- Class ops: courses, schedules, livestream, videoclass, virtualclass.
- Event ops: event management, ticket review.
- Sales reporting, exchange rate, payout methods.
- Dashboard aggregate metrics.
