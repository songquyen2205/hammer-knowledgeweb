# Hammer Knowledge Base

## 1. Bối cảnh dự án

Hammer là hệ sinh thái social + learning + event commerce, vận hành trên 3 ứng dụng chính:

- hammer-api (Rails backend + admin)
- hammer-web (Next.js web)
- hammer-mobile (React Native)

Nguồn gốc domain gắn với dance community (Danz People), nhưng sản phẩm hiện đã mở rộng thành mô hình creator economy đa luồng giao dịch.

## 2. Actor và vai trò

- Learner: khám phá, mua, học, hoàn tiền.
- Instructor: tạo/livestream/virtual/video class, theo dõi hiệu suất, nhận payout.
- Event Organizer: tạo event, bán vé, quản lý participant.
- Admin/Operations: moderation, refund/payout handling, báo cáo vận hành.

Ghi chú quan trọng:

- Một user có thể đồng thời là buyer và seller.
- Event seller có thể không bắt buộc là instructor.

## 3. Domain capabilities

### 3.1 Social

- profile
- follow/follower
- post/comment/like/favorite
- chat

### 3.2 Class commerce

- class types: livestream, virtual class, video class
- order/cart/checkout
- paid_item làm entitlement
- refund và review

### 3.3 Event commerce

- tạo/cập nhật/hủy event
- ticket types
- event order và ticket code
- event refund

### 3.4 Finance operations

- payment methods
- refund workflows
- payout workflows
- transfer logging

## 4. Luồng nghiệp vụ chính

### 4.1 Mua class

1. Buyer checkout.
2. Order/order_items completed.
3. Paid_item được cấp quyền học.
4. Transfer sales được ghi nhận.

### 4.2 Hoàn tiền class

1. Buyer request refund.
2. Admin review.
3. Approved -> transfer refund + cập nhật entitlement.

### 4.3 Mua event

1. Buyer chọn ticket.
2. Event order checkout.
3. Event user completed.
4. Ticket codes được sinh.

### 4.4 Hoàn tiền event

1. Buyer request.
2. Admin xử lý pending/processing/refunded/declined.

### 4.5 Payout

1. Seller/instructor request payout.
2. Admin process.
3. Transfer payout và cập nhật balance.

## 5. Hiện trạng và khoảng trống hệ thống tài chính

Hiện trạng:

- Đã có records cho order/refund/payout/transfer.
- Balance instructor đang cập nhật mutable theo callback.

Khoảng trống:

- Chưa có user-centric wallet ledger thống nhất.
- Chưa có chuẩn before/after balance cho mọi transaction.
- Chưa tách rõ earnings stream class/event ở mức payout policy.
- Reconciliation/audit chưa thành framework đầy đủ.

## 6. Định hướng Hammer Wallet

Định hướng ưu tiên:

- Một ledger thống nhất theo user.
- Wallet transaction là source of truth.
- Balance là trạng thái suy ra từ ledger.
- Tách payout theo stream class/event thay vì role cứng.

Nguyên tắc thiết kế:

- Không cập nhật số dư bằng callback rải rác ở nhiều model.
- Mọi biến động tiền phải được ghi transaction có reference rõ ràng.
- Mỗi transaction cần idempotency key để tránh tạo trùng.
- Hỗ trợ audit và reconciliation theo provider reference.

Các business types nên chuẩn hóa:

- class_purchase
- event_purchase
- class_earning
- event_earning
- class_refund
- event_refund
- event_payout
- instructor_payout_legacy

## 7. Wallet logic hợp nhất (class + event)

Mô hình khuyến nghị:

- Một wallet trên mỗi user.
- Tách balance bucket theo stream:
	- class_pending
	- class_available
	- event_pending
	- event_available
	- locked_for_payout

Lý do:

- Một user có thể đồng thời là buyer, event seller và instructor.
- Payout policy có thể khác nhau giữa class và event.

Quy tắc payout:

- payout_class chỉ dùng class_available.
- payout_event chỉ dùng event_available.
- Khi request payout: chuyển available -> locked.
- Khi processed: giảm locked và cập nhật `event_payout.status = processed`.
- Khi fail/declined: hoàn locked về available đúng stream.
- Không tách `event_payout_request` và `event_payout_processed` thành hai transaction type; dùng một type `event_payout` với status `pending/processed/declined`.

### 7.1 Quy ước UI My Balance (chốt 2026-04)

- My Balance hiển thị 1 số tổng + breakdown:
	- Event available
	- Course/Class available
	- Locked payout
- Số tiền cho phép payout trong Wallet phase = `event_available` sau khi trừ locked; khi request payout phải validate `amount + fee <= event_available`.
- Không cho payout Course/Class tại My Balance; CTA dẫn về Teaching Space cho class flow legacy.
- Trên UI cần có icon thông tin (`i`) giải thích rõ phạm vi payout để tránh user hiểu nhầm.

### 7.2 Quy ước màn History (chốt 2026-04)

- Tabs bắt buộc: `All`, `Event (n)`, `Course/Class (n)` + ô search.
- Mỗi tab có thể bật advanced filter (status, chiều tiền vào/ra, method nếu có).
- Event tab:
	- Tiền vào: event_refund dưới dạng status/refund record, event_earning target.
	- Tiền ra: event_purchase, event_payout target.
- Course tab:
	- Tiền vào: class_refund dưới dạng refund về payment method gốc, class_earning.
	- Tiền ra: class_purchase, class payout (legacy record/deeplink).
- Nếu user mua xong rồi hủy khóa/vé: purchase row gốc vẫn giữ completed; History thêm `class_refund` hoặc `event_refund` theo status pending/processing/refunded/declined.

### 7.3 Quy ước màn Transaction Detail (chốt 2026-04)

- Bố cục theo bill/order detail:
	- Tên giao dịch, số tiền, trạng thái
	- Payment method + provider (Stripe/card cho purchase/refund hiện tại; bank/payout method cho payout)
	- Thời gian phát sinh
	- Reference ID có nút copy
	- Thanh tiến độ trạng thái theo loại: refund dùng pending -> processing -> refunded/declined; payout dùng pending -> processed/declined
- Màn Detail/History là informational view; không tạo nghĩa vụ phí Apple riêng.
- Phần cần compliance riêng là luồng thanh toán digital goods trong iOS app (nếu có), không phải màn tra cứu giao dịch.

### 7.4 Quy ước truyền thông mockup (chốt 2026-04)

- Chỉ giữ một phương án chính thức: **Hybrid Wallet theo SOW** (không duy trì nhiều phương án song song trong cùng màn demo).
- Ghi chú bên phải của mockup phải ngắn gọn, tách 3 lớp để cả team và client đọc nhanh:
	- **Cho Design**: định hướng hierarchy, hành vi UI và clarity cho end-user.
	- **Cho Dev**: rule triển khai, mapping dữ liệu/logic, validation chính.
	- **Cho Client**: thông điệp nghiệp vụ và phạm vi phase hiện tại.
- Không đặt ghi chú dài trong phone frame; phone frame chỉ chứa nội dung end-user.

## 8. Luồng nghiệp vụ tài chính chi tiết

### 8.1 Luồng mua class

1. Buyer thanh toán thành công.
2. Source hiện tại charge qua Stripe/card, không có buyer wallet debit.
3. Source hiện tại tạo Transfer sales và cộng `instructor_profile.balance`.
4. Pending/hold là target policy cần chốt, chưa thấy trong code hiện tại.

### 8.2 Luồng mua event

1. Buyer thanh toán vé event.
2. Source hiện tại charge qua Stripe/card và tạo EventUser/EventUserItem/ticket.
3. Chưa thấy Transfer earnings cho Event owner trong code hiện tại.
4. Event pending/available là target policy cần chốt khi triển khai Event settlement.

### 8.3 Luồng refund class/event

- Class refund hiện tại hoàn về payment method/card gốc theo UI hiện hữu; Transfer refund trừ `instructor_profile.balance` và revoke entitlement.
- Event refund hiện tại có status/timestamp nhưng chưa thấy Transfer/settlement đối ứng.
- Quy tắc trừ pending trước, thiếu mới trừ available là target policy cần chốt cho Wallet ledger, chưa phải code hiện tại.

### 8.4 Luồng release pending

- Scheduler kiểm tra giao dịch đủ điều kiện.
- Chuyển pending -> available.
- Ghi transaction release để audit.

## 9. Flow analysis — Hammer Wallet

Tài liệu chi tiết của module này được bảo trì tại `NotecuaQuyen/hammer_wallet.md`.

Điểm chốt mới nhất của module:

- Class flow đã có settlement log cơ bản qua `Transfer`.
- Event flow đã có purchase/refund record nhưng chưa hoàn chỉnh settlement log.
- Wallet mục tiêu nên tách balance bucket theo stream class/event trong cùng một user-centric ledger.
- State transition mục tiêu của Wallet Transaction đã được bổ sung trong `NotecuaQuyen/hammer_wallet.md` để chuẩn hóa lifecycle pending/completed/reversed.

## 9.1 Mục tiêu nghiệp vụ

- Actor chính: Learner, Instructor, Event Organizer, Admin/Operations.
- Bài toán cần giải: tạo một Wallet Ledger thống nhất theo user để ghi nhận đầy đủ giao dịch mua, giao dịch bán, hoàn tiền, payout và trạng thái số dư theo stream class/event.

Phân loại mức độ xác nhận:

- ✅ Đã xác nhận từ code: class checkout, class refund, payout instructor, event checkout, event refund record.
- ⚠️ Giả định thiết kế: tách bucket class/event trong cùng một wallet.
- ❓ Cần chốt: event payout policy, event refund settlement rule, hold period theo stream.

## 9.2 Luồng chính

### Luồng A — Class purchase

1. Buyer checkout cart.
2. Hệ thống cập nhật order item và line item sang completed.
3. Hệ thống tạo/ghi `PaidItem` để cấp entitlement.
4. Hệ thống tạo `Transfer` loại `sales` cho seller/instructor.

Dựa trên code:

- `hammer-api/app/controllers/api/v1/users/cart/checkout.rb`
- `hammer-api/app/models/transfer.rb`

### Luồng B — Class refund

1. Buyer tạo request `Refund`.
2. Admin update status sang refunded/processing/declined.
3. Nếu refunded: hệ thống tạo `Transfer` loại `refund`.
4. `PaidItem` bị xóa và `LineItem` chuyển sang refunded.

Dựa trên code:

- `hammer-api/app/controllers/admin/refunds_controller.rb`
- `hammer-api/app/models/transfer.rb`

### Luồng C — Instructor payout

1. Instructor tạo `Payout` request.
2. Admin xử lý payout.
3. Nếu processed: hệ thống tạo `Transfer` loại `payout`.
4. Callback trong `Transfer` trừ `instructor_profile.balance`.

Dựa trên code:

- `hammer-api/app/controllers/admin/payouts_controller.rb`
- `hammer-api/app/models/transfer.rb`

### Luồng D — Event checkout

1. Buyer checkout event order.
2. Hệ thống tạo `EventUser` và `EventUserItem`.
3. Hệ thống sinh `EventUserTicket` và `ticket_code`.
4. Order chuyển completed và lưu `purchase_id`.

Dựa trên code:

- `hammer-api/app/controllers/api/v1/users/events/checkout_event_order.rb`
- `hammer-api/app/controllers/api/v1/users/events/pay_now_event.rb`

### Luồng E — Event refund

1. Buyer tạo `EventRefund` request.
2. Admin update status refunded/processing/declined.
3. Hiện tại chưa thấy logic tạo `Transfer` hay settlement đối ứng khi event refund được approved.

Dựa trên code:

- `hammer-api/app/models/event_refund.rb`
- `hammer-api/app/controllers/admin/event_refunds_controller.rb`

## 9.3 Data source

| Entity/Table | Field quan trọng | Vai trò |
| --- | --- | --- |
| Order | status, subtotal_price, purchase_id | Đơn hàng class tổng |
| OrderItem | class_room_id, status, unit_price | Mục mua class/package |
| LineItem | status, unit_price | Chi tiết course/schedule |
| PaidItem | user_id, class_room_id | Entitlement sau mua class |
| Refund | status, amount, order_item_id | Request hoàn tiền class |
| Payout | status, amount, fee | Request payout cho seller/instructor |
| Transfer | transfer_type, amount, transferable_type/id | Log dịch chuyển tiền hiện tại |
| EventUser | status, purchase_id, total | Event order |
| EventUserItem | quantity, unit_price, total_amount | Chi tiết ticket purchase |
| EventUserTicket | ticket_code, status | Vé event cụ thể |
| EventRefund | status, amount, event_user_id | Request hoàn tiền event |

## 9.4 Business rules

- ✅ `Transfer` hiện là record gần nhất với finance ledger, nhưng mới mạnh ở phía instructor settlement.
- ✅ `Transfer.after_create` đang cập nhật trực tiếp `instructor_profile.balance`.
- ✅ Class checkout có tạo `Transfer sales`.
- ✅ Class refund có tạo `Transfer refund`.
- ✅ Payout có tạo `Transfer payout`.
- ⚠️ Event checkout hiện tạo order/ticket nhưng chưa thấy ghi `Transfer` earnings song song.
- ⚠️ Event refund hiện có record trạng thái nhưng chưa thấy settlement log đối ứng.
- ⚠️ Nếu xây Hammer Wallet, `Transfer` không đủ làm source of truth vì thiếu buyer view, before/after balance, pending/available/locked và stream typing rõ ràng.
- ❓ Cần chốt event seller có đi qua cùng payout engine với instructor hay qua stream event riêng.

## 9.5 Kết luận phân tích cho Hammer Wallet

Kết luận BA:

- Hammer đã có finance records đủ để suy ra business flow class.
- Event flow đã có purchase/refund record nhưng finance settlement còn chưa hoàn chỉnh.
- Wallet phù hợp nhất là `user-centric ledger` với `multi-bucket balance` trong cùng một wallet.
- Payout nên tách theo `earning stream` thay vì theo role cứng.

Mô hình mục tiêu:

- one wallet per user
- class_pending / class_available
- event_pending / event_available
- locked_for_payout

## 9.6 Câu hỏi cần chốt

- [ ] Event earning được ghi nhận ở thời điểm checkout hay sau khi event kết thúc?
- [ ] Event refund có cần tạo settlement log và debit seller giống class refund không?
- [ ] Event Organizer có dùng cùng payout method/payout flow với Instructor không?
- [ ] Hold period cho class và event có giống nhau không?

## 9.7 Open issues / giả định

| # | Mô tả | Trạng thái |
| --- | --- | --- |
| 1 | Class flow đã có transfer sales/refund/payout trong code | ✅ |
| 2 | Event checkout đã có order/ticket record nhưng chưa thấy transfer earnings | ⚠️ |
| 3 | Event refund approved chưa tạo transfer/refund settlement tương ứng | ⚠️ |
| 4 | Wallet bucket theo stream class/event là hướng thiết kế, chưa phải code hiện tại | ⚠️ |
| 5 | Payout by earning stream là khuyến nghị, chưa phải business rule chốt cuối | ❓ |

## 10. Yêu cầu hiển thị và báo cáo tối thiểu

Wallet UI tối thiểu cần có:

- Wallet Overview (pending/available/locked theo stream).
- Transaction History có filter date/type/stream/status.
- Earnings Breakdown theo class/event.
- Payout Request có stream_type.
- Payout Detail có linked transactions và provider reference.

KPI nên theo dõi:

- GMV class, GMV event.
- Refund rate class/event.
- Payout lead time.
- Net revenue sau refund và fee.

## 11. Quy tắc BA khi cập nhật tài liệu

- Mọi thay đổi business rule phải cập nhật file này trước.
- Thuật ngữ mới phải thêm vào `thuat-ngu.md`.
- Câu hỏi chưa chốt chuyển sang `open-issues.md`.
- KPI mới cập nhật ở `kpi.md`.

## 12. Danh sách nguồn đã hợp nhất

- NotecuaQuyen/hammer_businessmodel.md
- docs/business-model.md
- docs/knowledge-base.md
- docs/kpi.md
- docs/open-issues.md
- docs/README.md
- docs/thuat-ngu.md
- docs/_template-flow.md
- docs/_template-state-machine.md
- Quyennote/hammerbiz.md
- Quyennote/logic.md
- Quyennote/wallet.md
- hammerbiz.md
- README các module trong workspace

## 13. Migration log

- Folder cũ phát hiện: docs, Quyennote.
- Tổng file markdown đã đọc: 11 files.
- Tổng số dòng đã quét khi migrate: 1205 lines.
- Sau khi hợp nhất: NotecuaQuyen là thư mục BA docs duy nhất.

## 14. Assumptions hiện tại

- Web là kênh chính cho instructor operations.
- Mobile thiên về social-first và consumption journey.
- Event organizer có thể là user thường, payout policy cần tách stream event.

## 15. Build Knowledge Web log (2026-03-28)

### 15.1 Auto-discovery & migration old docs

- Folder BA cu da kiem tra tuan tu: `docs/`, `Quyennote/`, `docs-old/`, `Notion-export/`.
- Ket qua: khong phat hien folder nao ton tai trong workspace hien tai.
- Migration run nay:
	- So file markdown doc tu folder cu da doc: `0`
	- So dong du lieu duoc hop nhat vao knowledge base: `0`
	- So folder cu da xoa sau migrate: `0`

### 15.2 Nguon duoc dung de dung Knowledge Web

- Uu tien cao nhat: `NotecuaQuyen/knowledge-base.md`.
- Nguon bo tro: `README.md` (root), `.github/copilot-instructions.md`, `NotecuaQuyen/*.md`.
- Doi chieu ten entity tu source code:
	- `hammer-api/config/routes.rb`
	- `hammer-api/app/models/class_room.rb`
	- `hammer-api/app/models/order.rb`
	- `hammer-api/app/models/transfer.rb`
	- `hammer-api/app/models/user.rb`

### 15.3 Tich hop web explorer

- Da bo sung Knowledge Web explorer tren `hammer-web` route `/knowledge-web`.
- Data layer dung object model `entities`, `edges`, `scenarios` de tra cuu theo doi tuong.
- Ask AI duoc grounded tu data noi bo; co model API path va fallback local rule-based khi chua co token.

## 16. Build Knowledge Web (folder knowledgeweb) log (2026-03-28)

### 16.1 Compliance voi folder output

- Da scaffold web tri thuc o folder duy nhat: `knowledgeweb/`.
- Da kiem tra folder `web/`: khong ton tai.
- Khong dung lai module web cu trong `hammer-web/` cho workflow nay.

### 16.2 Auto-sync pipeline

- Lenh dong bo mot lan:
	- `knowledgeweb/package.json` -> `knowledge:sync`
- Lenh watch dong bo lien tuc:
	- `knowledgeweb/package.json` -> `knowledge:watch`
- Lenh chay local one-command:
	- `knowledgeweb/package.json` -> `knowledge:dev`
- Watch targets da cau hinh:
	- `NotecuaQuyen/**/*.md`
	- `README.md`
	- `hammer-api/config/routes.rb`
	- `hammer-api/app/models/*.rb`
- Output data duoc ghi de:
	- `knowledgeweb/src/data/graph.generated.json`

### 16.3 Production rebuild trigger

- Da bo sung workflow:
	- `.github/workflows/knowledgeweb-rebuild.yml`
- Trigger khi push thay doi docs/source lien quan va chay:
	1. `npm install`
	2. `npm run knowledge:sync`
	3. `npm run build`

### 16.4 Migration old docs (run nay)

- Folder cu da check: `docs/`, `Quyennote/`, `docs-old/`, `Notion-export/`.
- Folder cu tim thay: khong co.
- So file markdown doc tu folder cu da doc: `0`.
- So dong du lieu hop nhat tu folder cu: `0`.
- So folder cu da xoa: `0`.

### 16.5 Local runtime note

- Prompt yeu cau dia chi mac dinh bat dau tu `http://localhost:3000`.
- Kiem tra tai thoi diem 2026-03-28:
	- Port `3000` dang ban.
	- Port `3001` dang ban.
	- Port trong tiep theo la `3002`.
- `knowledge:dev` da duoc thiet ke de tu dong chon port trong va in ra URL standalone cho user copy mo trinh duyet.

### 16.6 Runtime rule update (node server)

- Da bo sung `knowledgeweb/server.js` de chay local bang `node server.js`.
- `server.js` thuc hien:
	- run `knowledge:sync` khi boot,
	- watch thay doi docs/source va tu re-sync,
	- expose endpoint `GET /health` (200),
	- expose `GET /api/data` va `POST /api/ask` (grounded + local fallback),
	- tu dong chon port trong bat dau tu 3000 va in mot dong URL standalone.
- Validation run 2026-03-28:
	- Start command: `C:\Program Files\nodejs\node.exe server.js`
	- URL runtime: `http://localhost:3001`
	- Health-check: `GET /health` -> `200`.

### 16.7 Update mode run (2026-03-28)

- Da chay update nhanh theo rule moi:
	- `C:\Program Files\nodejs\node.exe server.js --sync-once`
- Ket qua:
	- sync thanh cong, graph data duoc cap nhat.
	- Runtime dev dang chay o `http://localhost:3002`.
	- Health-check bat buoc: `GET /health` -> `200`.

### 16.8 Update mode run (2026-03-30)

- Da chay lai quick update theo `--update` mode:
	- `C:\Program Files\nodejs\node.exe server.js --sync-once`
- Ket qua:
	- sync thanh cong, `knowledgeweb/src/data/graph.generated.json` da duoc refresh.
	- Runtime hien tai van phuc vu o `http://localhost:3002`.
	- Health-check bat buoc: `GET /health` -> `200`.

## 17. Knowledge Pipeline — Toàn bộ dự án (2026-03-30)

### 17.1 Phạm vi

- Pipeline được chạy với argument `toàn-bộ-dự-án` — bao phủ toàn bộ hệ sinh thái Hammer.
- 3 platforms: hammer-api (Rails 7), hammer-web (Next.js), hammer-mobile (React Native).

### 17.2 Step 1 — Foundation check

- `NotecuaQuyen/` đã tồn tại và đầy đủ — không cần tạo lại.
- `knowledgeweb/` đã tồn tại với server.js + public/index.html — chạy nhánh update delta.
- Không phát hiện folder cũ (docs/, Quyennote/) cần migrate.

### 17.3 Step 2 — BA update

- Cập nhật `NotecuaQuyen/hammer_businessmodel.md`:
	- Thêm Tech platform map (api/web/mobile với stack và vai trò).
	- Thêm Module map chi tiết theo từng platform.
	- Thêm Social capabilities section.
	- Thêm Admin capabilities section.
- Dữ liệu nguồn mới được đọc: `hammer-web/src/modules/`, `hammer-api/app/controllers/admin/`.

### 17.4 Step 3 — Knowledge Web update

- Thêm 9 entity mới vào `scripts/sync-knowledge.mjs`:
	- module-social, module-identity
	- flow-class-refund, flow-instructor-payout, flow-event-checkout
	- system-hammer-web, system-hammer-mobile
	- metric-refund-rate, metric-payout-lead-time
- Thêm 19 edge mới liên kết platforms, social, identity, flows với actors và metrics.
- Thêm scenario mới: "Hành trình Actor trong Hammer Ecosystem".
- Cập nhật `public/index.html` với 3 tab: Dashboard, Khám phá, Focus.
	- Tab Dashboard: platform cards, entity stats, KPI grid, open issues, scenario preview.
	- Tab Khám phá: entity browser với search/filter (giữ nguyên + nâng cấp CSS).
	- Tab Focus: capability map theo stream, Actor × Module matrix, architecture concerns, flow list.

### 17.5 Runtime

- Sync thành công: 8 docs/1206 lines + 6 source/757 lines.
- Entity tổng: 23 entities, edges tổng: 32 edges, scenarios: 3.
- Server khởi động lại, chọn port 3001.
- Health-check `GET /health` → `200` `{"status":"ok"}`.
- URL: `http://localhost:3001`.

### 17.6 Giả định từ pipeline này

- Social Community là driver chính cho mobile; web tập trung vào commerce + instructor ops.
- module-identity phục vụ chung cho cả web và mobile.
- Event Organizer role vẫn chưa được chốt tách độc lập với instructor — ghi là open issue.

### 17.7 Câu hỏi mở sau pipeline này

- Khi nào sẽ xây Wallet Ledger service thực sự trong hammer-api?
- Event Organizer có payout flow riêng hay dùng chung với instructor?
- Social feed algorithm có liên quan đến learning recommendation không?

## 18. Knowledge Pipeline — Universal Standard update (2026-03-30)

### 18.1 Step 1 — Command registry cleanup

- User-level prompts được kiểm tra tại thư mục VS Code prompts.
- Chỉ còn `knowledge-pipeline.prompt.md`, không còn prompt legacy.
- Global registry `knowledge-pipeline-repos.json` đã sync:
	- synced repos: `2` (`IOT`, `Hammer`)
	- stale removed: `0`
	- docs updated bởi cross-repo replacement: `0`

### 18.2 Step 2 — BA update (toàn bộ dự án)

- Tạo mới module doc:
	- `NotecuaQuyen/hammer_toan-bo-du-an.md`
- Tài liệu mới theo object-oriented format gồm:
	- Actor objects
	- Module objects
	- Flow objects
	- Data/KPI objects
	- Rules/Open-issue objects
- Có đầy đủ nhóm section bắt buộc cho cập nhật chuyên sâu:
	- Đề xuất cải thiện
	- Lý do đề xuất
	- Hướng tiếp cận dùng để đưa ra đề xuất
	- Pros/Cons
	- Tác động business
	- Tác động kỹ thuật
	- Rủi ro + điều kiện triển khai

### 18.3 Step 3 — Knowledge web compliance refactor

- Runtime server cập nhật:
	- Đọc cổng riêng từ `.knowledgeweb-port` (ưu tiên cổng lưu theo dự án)
	- Thêm API:
		- `GET /api/raw-markdown`
		- `GET /api/extracted`
- Data model cập nhật:
	- Bổ sung `rule` object và `open_issue` object.
	- Bổ sung nguồn markdown `hammer_toan-bo-du-an.md` vào sync pipeline.
- UI cập nhật toàn diện:
	- VI mặc định + EN switch.
	- Object-oriented explorer theo type.
	- Khu `Markdown gốc` và `Nội dung trích xuất từ Markdown`.
	- Mermaid 3-layer diagrams (overview/relation/detailed flow) + zoom in/out/reset.
	- Deep-dive tabs theo module dưới Dashboard.

### 18.4 Always-on

- Bổ sung watchdog script:
	- `knowledgeweb/scripts/ensure-running.ps1`
- Bổ sung autostart installer:
	- `knowledgeweb/scripts/install-autostart.ps1`
- Package scripts mới:
	- `knowledge:ensure-running`
	- `knowledge:install-autostart`

### 18.5 Project command docs chuẩn hóa

- Cập nhật:
	- `README.md`
	- `knowledgeweb/README.md`
- Workflow thường ngày chỉ còn 2 command:
	1. `/knowledge-pipeline <feature/module|toan-bo-du-an>`
	2. `/knowledge-pipeline --update <yeu-cau-moi>`

## 19. Knowledge Pipeline — Universal Standard delta 2 (2026-03-30)

### 19.1 Runtime repair and sticky URL

- `knowledgeweb/scripts/ensure-running.ps1` được nâng cấp:
	- self-repair tối đa 3 vòng nếu server không lên.
	- reset sticky port khi phát hiện cấu hình port lỗi.
	- kill stale `node server.js` process của cùng project trước khi retry.
- Sticky project port giữ theo `.knowledgeweb-port`.

### 19.2 One-click open

- Bổ sung script mở web một chạm:
	- `knowledgeweb/open-knowledgeweb.cmd`
- Script sẽ:
	1. gọi `ensure-running.ps1`,
	2. đọc URL runtime từ `.knowledgeweb-runtime.json`,
	3. mở trình duyệt tự động.

### 19.3 UI compliance bổ sung

- Refactor layout theo kiểu trang quản lý:
	- sidebar trái ~20%.
	- content phải ~80%.
- Sidebar chứa:
	- object search/filter/list,
	- panel `Tiến trình tri thức` theo 6 bước chuẩn.
- Panel tiến trình tự refresh từ API `/api/progress`.
- Mermaid được harden:
	- sanitize id/label trước khi render,
	- fallback block khi render lỗi,
	- không treo loading nếu diagram fail.

## 21. Hammer Wallet focus enhancement (2026-03-31)

- Cập nhật context triển khai chi tiết cho Hammer Wallet ở `NotecuaQuyen/hammer_wallet.md`:
	- phạm vi công việc 1.1 -> 1.9,
	- transaction taxonomy,
	- cách hệ thống ghi nhận ledger,
	- flow Mermaid riêng cho wallet,
	- nguyên tắc hiển thị mobile wallet dashboard/history/detail.
- Cập nhật knowledge web để hiển thị trực tiếp:
	- tab `Focus: Hammer Wallet` đặt trên cùng sidebar,
	- bảng loại giao dịch + ledger impact,
	- diagram Mermaid chuyên biệt cho lifecycle wallet,
	- mockup mobile có thao tác filter/list/detail để mô phỏng hành vi ghi nhận giao dịch.

## 20. Knowledge Pipeline run (2026-03-31) — feature `hammer wallet`

### 20.1 Step 1 — Registry & docs cleanup

- Kiểm tra prompt global: giữ đúng `knowledge-pipeline.prompt.md`.
- Đồng bộ registry global và cross-repo command cleanup theo pattern legacy.

### 20.2 Step 2 — BA docs delta

- Cập nhật `NotecuaQuyen/hammer_wallet.md` với section `15. Delta update`.
- Delta bám 4 lớp tài liệu: toàn cảnh, trung gian, chi tiết, delta impact.

### 20.3 Step 3 — Knowledge web delta

- Chỉnh `knowledgeweb/public/index.html` theo chuẩn mới:
	- sidebar 25%,
	- keyword bar theo section,
	- điều hướng hai chiều top-down/down-top rõ ràng.
- Popup `Đối chiếu Markdown` giữ ở góc phải và mở/thu gọn được.
- Focus tab vẫn pinned đầu sidebar.

### 20.4 Runtime & URL

- Sync dữ liệu graph thành công.
- Ensure-running thành công.
- Health-check `/health` trả `200`.
- URL sticky project: `http://localhost:3190`.

## 20. Knowledge Pipeline — toan-bo-du-an run (2026-03-31)

### 20.1 Auto-detect trạng thái

- Dự án ở nhánh update delta:
	- `NotecuaQuyen/` tồn tại.
	- `NotecuaQuyen/knowledge-base.md` tồn tại.
	- `knowledgeweb/` tồn tại.
	- `.github/copilot-instructions.md` tồn tại.

### 20.2 Command registry sync

- User prompts đã đúng chuẩn:
	- chỉ còn `knowledge-pipeline.prompt.md`.
- Registry global đã sync:
	- synced repos: `4` (`Hammer`, `IOT`, `NDSQ`, `Dihouse`).
	- stale removed: `0`.
	- docs bị legacy command cần sửa: `0`.

### 20.3 Delta cập nhật lần này

- Chỉnh layout sidebar về đúng chuẩn bắt buộc:
	- `knowledgeweb/public/index.html` từ `25%` -> `20%`.
- Giữ nguyên các phần đã đạt chuẩn:
	- VI mặc định + EN switch.
	- Object-oriented knowledge model/UI.
	- Mermaid 3-layer + sanitize + fallback + zoom.
	- Panel `Tiến trình tri thức` 6 bước + auto refresh.
	- `open-knowledgeweb.cmd` + `ensure-running.ps1` + sticky URL theo `.knowledgeweb-port`.
