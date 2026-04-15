# Hammer Workspace

## Dự án này là gì?

Hammer là hệ sinh thái social + learning + event commerce cho creator và learner, với nguồn gốc domain mạnh từ dance community.

## Dự án gồm những thành phần nào?

- `hammer-api`: Ruby on Rails backend API, business rules, admin operations.
- `hammer-web`: Next.js web app cho learner journey và instructor operations.
- `hammer-mobile`: React Native app cho social-first experience và learning/event consumption.
- `NotecuaQuyen`: tài liệu BA chuẩn hóa (knowledge base, thuật ngữ, business model, KPI, open issues).

## Ai dùng hệ thống này?

- Learner: khám phá, mua lớp/sự kiện, học, hoàn tiền.
- Instructor: tạo lớp học, theo dõi hiệu suất, nhận payout.
- Event Organizer: tạo sự kiện, bán vé, quản lý người tham gia.
- Admin/Operations: moderation, xử lý refund/payout, vận hành hệ thống.

## Nên đọc gì trước?

1. `NotecuaQuyen/knowledge-base.md`
2. `NotecuaQuyen/thuat-ngu.md`
3. `NotecuaQuyen/hammer_businessmodel.md`
4. `NotecuaQuyen/kpi.md`
5. `NotecuaQuyen/open-issues.md`

## Command vận hành chuẩn

Workflow thường ngày chỉ dùng 2 lệnh:

1. `/knowledge-pipeline <feature/module|toan-bo-du-an>`
2. `/knowledge-pipeline --update <yeu-cau-moi>`

## Ghi chú

- (Giả định) `hammer-web` là kênh chính cho các thao tác vận hành instructor.
- (Giả định) Event organizer có thể không bắt buộc role instructor.
