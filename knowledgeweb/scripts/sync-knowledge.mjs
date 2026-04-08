import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd(), '..')
const outFile = path.resolve(process.cwd(), 'src/data/graph.generated.json')

const SOURCE_OF_TRUTH = 'NotecuaQuyen/knowledge-base.md'

const read = (relPath) => fs.readFileSync(path.resolve(root, relPath), 'utf-8')
const exists = (relPath) => fs.existsSync(path.resolve(root, relPath))

const countLines = (text) => text.split(/\r?\n/).length

const oldFolders = ['docs', 'Quyennote', 'docs-old', 'Notion-export']
const oldFoldersFound = oldFolders.filter((f) => exists(f))

const markdownFiles = [
  'NotecuaQuyen/knowledge-base.md',
  'NotecuaQuyen/hammer_wallet.md',
  'NotecuaQuyen/hammer_businessmodel.md',
  'NotecuaQuyen/hammer_toan-bo-du-an.md',
  'NotecuaQuyen/thuat-ngu.md',
  'NotecuaQuyen/kpi.md',
  'NotecuaQuyen/open-issues.md',
  'README.md',
  '.github/copilot-instructions.md',
]

const sourceFiles = [
  'hammer-api/config/routes.rb',
  'hammer-api/app/models/user.rb',
  'hammer-api/app/models/class_room.rb',
  'hammer-api/app/models/order.rb',
  'hammer-api/app/models/transfer.rb',
  'hammer-api/app/models/event_refund.rb',
]

const safeRead = (relPath) => {
  try {
    return read(relPath)
  } catch {
    return ''
  }
}

const docsContent = markdownFiles
  .filter(exists)
  .map((f) => ({ file: f, content: safeRead(f) }))

const sourceContent = sourceFiles
  .filter(exists)
  .map((f) => ({ file: f, content: safeRead(f) }))

const allText = [...docsContent, ...sourceContent].map((x) => x.content).join('\n')
const has = (keyword) => allText.toLowerCase().includes(keyword.toLowerCase())

const assumptions = []
if (has('co the khong can role instructor') || has('có thể không cần role instructor')) {
  assumptions.push('Event Organizer payout eligibility doc lap voi role instructor (Giả định)')
}
if (has('chua thay logic tao transfer') || has('chưa thấy logic tạo transfer')) {
  assumptions.push('Event refund settlement transfer doi ung chua duoc xac nhan day du (Giả định)')
}

const entities = [
  {
    slug: 'actor-learner',
    type: 'actor',
    title: 'Learner',
    subtitle: 'Nguoi mua va tieu thu noi dung',
    summary: 'Tham gia checkout class/event, hoc noi dung va co the yeu cau refund.',
    detail: 'Xac nhan tu docs va flow checkout/refund.',
    color: '#0B6E99',
    tags: ['actor', 'buyer', 'class', 'event'],
    highlights: ['class checkout', 'event checkout', 'refund request'],
    questions: ['Refund lead time hien tai la bao lau?'],
  },
  {
    slug: 'actor-instructor',
    type: 'actor',
    title: 'Instructor',
    subtitle: 'Nguoi tao class va nhan payout',
    summary: 'Phat sinh class earnings, payout request va class refund deduction.',
    detail: 'Xac nhan tu payout + transfer flow.',
    color: '#1E8449',
    tags: ['actor', 'seller', 'class'],
    highlights: ['class earnings', 'payout'],
    questions: ['Co nen tach payout policy class/event?'],
  },
  {
    slug: 'actor-event-organizer',
    type: 'actor',
    title: 'Event Organizer',
    subtitle: 'Nguoi tao event va ban ticket',
    summary: 'Quan ly event, ticket va event earnings.',
    detail: 'Theo docs co kha nang khong can role instructor (Giả định).',
    color: '#AF4D98',
    tags: ['actor', 'seller', 'event'],
    highlights: ['event create', 'ticket sell'],
    questions: ['Payout event dung chung engine voi instructor khong?'],
  },
  {
    slug: 'actor-admin-operations',
    type: 'actor',
    title: 'Admin/Operations',
    subtitle: 'Xu ly refund, payout, moderation',
    summary: 'Actor van hanh chot trang thai flow tai chinh quan trong.',
    detail: 'Xac nhan tu admin controllers va docs BA.',
    color: '#6C5B4C',
    tags: ['actor', 'operations', 'admin'],
    highlights: ['approve refund', 'process payout'],
    questions: ['Can SLA nao cho refund/payout?'],
  },
  {
    slug: 'module-wallet-ledger',
    type: 'module',
    title: 'Hammer Wallet Ledger',
    subtitle: 'User-centric ledger theo stream class/event',
    summary: 'Mot wallet logic theo user, balance suy ra tu transaction.',
    detail:
      'Bucket muc tieu: class_pending, class_available, event_pending, event_available, locked_for_payout.',
    color: '#283593',
    tags: ['module', 'wallet', 'ledger'],
    highlights: ['auditability', 'idempotency', 'stream separation'],
    questions: ['Khi nao pending duoc release thanh available?'],
    diagram:
      'flowchart LR\\nA[Purchase] --> B[Pending]\\nB --> C[Release]\\nC --> D[Available]\\nD --> E[Payout Request]\\nE --> F[Locked]\\nF --> G[Payout Processed]',
  },
  {
    slug: 'module-class-commerce',
    type: 'module',
    title: 'Class Commerce',
    subtitle: 'Order, paid item, refund, payout',
    summary: 'Class flow co settlement log qua Transfer.',
    detail: 'Xac nhan tu checkout/refund/payout class flows.',
    color: '#005792',
    tags: ['module', 'class'],
    highlights: ['order', 'paid item', 'transfer'],
    questions: ['Partial refund duoc xu ly ra sao?'],
  },
  {
    slug: 'module-event-commerce',
    type: 'module',
    title: 'Event Commerce',
    subtitle: 'Event order, ticket, event refund',
    summary: 'Event purchase/refund records da co, settlement can chot them.',
    detail: 'Event refund settlement transfer dang la diem mo (Giả định).',
    color: '#F18F01',
    tags: ['module', 'event'],
    highlights: ['event user', 'ticket code', 'event refund'],
    questions: ['Event earning timing la khi nao?'],
  },
  {
    slug: 'flow-class-purchase',
    type: 'flow',
    title: 'Class Purchase',
    subtitle: 'Checkout class va cap entitlement',
    summary: 'Order completed, paid item duoc cap va transfer sales duoc tao.',
    detail: 'Xac nhan tu checkout.rb va transfer model.',
    color: '#2E8B57',
    tags: ['flow', 'class_purchase'],
    highlights: ['order completed', 'paid item', 'transfer sales'],
    questions: ['Can bo sung buyer-side ledger entry khong?'],
  },
  {
    slug: 'flow-event-refund',
    type: 'flow',
    title: 'Event Refund',
    subtitle: 'Admin cap nhat trang thai hoan tien event',
    summary: 'Da co EventRefund status flow, settlement doi ung can xac nhan.',
    detail: 'Admin event_refunds controller co status updates.',
    color: '#D95D39',
    tags: ['flow', 'event_refund'],
    highlights: ['pending', 'processing', 'refunded', 'declined'],
    questions: ['Khi approved, co tao transfer debit seller khong?'],
  },
  {
    slug: 'concept-transfer',
    type: 'concept',
    title: 'Transfer',
    subtitle: 'Settlement log hien tai',
    summary: 'Ghi nhan sales/refund/payout, can map voi wallet transaction moi.',
    detail: 'Hien tai co callback cap nhat instructor_profile.balance.',
    color: '#455A64',
    tags: ['concept', 'finance'],
    highlights: ['sales', 'refund', 'payout'],
    questions: ['Transfer va wallet transaction map 1-1 hay 1-n?'],
  },
  {
    slug: 'metric-gmv-class',
    type: 'metric',
    title: 'GMV Class',
    subtitle: 'Tong gia tri giao dich class',
    summary: 'KPI bat buoc theo doi theo stream class.',
    detail: 'Nguon docs KPI va reporting reminders.',
    color: '#1D70B8',
    tags: ['metric', 'class'],
    highlights: ['revenue class'],
    questions: ['Trang thai nao duoc tinh vao GMV class?'],
  },
  {
    slug: 'metric-gmv-event',
    type: 'metric',
    title: 'GMV Event',
    subtitle: 'Tong gia tri giao dich event',
    summary: 'KPI bat buoc theo doi theo stream event.',
    detail: 'Can tach khoi class de tranh nhieu bao cao.',
    color: '#138A9A',
    tags: ['metric', 'event'],
    highlights: ['revenue event'],
    questions: ['Refund event tru KPI theo moc nao?'],
  },
  {
    slug: 'system-hammer-api',
    type: 'system',
    title: 'hammer-api',
    subtitle: 'Rails backend domain va operations',
    summary: 'Nguon su that cho order/refund/payout/event records.',
    detail: 'Doi chieu entity names tu routes/models quan trong.',
    color: '#334E68',
    tags: ['system', 'backend'],
    highlights: ['routes', 'models', 'admin'],
    questions: ['Wallet service nen dat o app/services nao?'],
  },
  {
    slug: 'source-knowledge-base',
    type: 'source',
    title: 'NotecuaQuyen/knowledge-base.md',
    subtitle: 'Single source of truth',
    summary: 'Nguon uu tien de suy dien tri thuc cho knowledge web.',
    detail: 'Moi ket luan can bam sat knowledge-base va docs lien quan.',
    color: '#1B263B',
    tags: ['source', 'docs'],
    highlights: ['actors', 'flows', 'kpis'],
    questions: ['Khi co thay doi lon, da update knowledge-base truoc chua?'],
  },
  {
    slug: 'module-social',
    type: 'module',
    title: 'Social Community',
    subtitle: 'Follow, post, comment, chat, feed',
    summary: 'Tao demand va giu chan user qua social graph. Chu yeu tren mobile.',
    detail: 'Post/comment/like/favorite, follow/follower, chat, group chat, notification, feed by interest.',
    color: '#6A0572',
    tags: ['module', 'social', 'mobile'],
    highlights: ['post', 'follow', 'feed', 'chat'],
    questions: ['Feed algorithm dua tren interest va follow co dung Engagement score khong?'],
  },
  {
    slug: 'module-identity',
    type: 'module',
    title: 'Identity & Account',
    subtitle: 'User, profile, auth, role',
    summary: 'Quan ly danh tinh nguoi dung, role va cai dat tai khoan.',
    detail: 'User co the dong thoi la buyer, seller va event organizer. Auth qua SSO/OTP/email.',
    color: '#2C3E50',
    tags: ['module', 'identity', 'auth'],
    highlights: ['user', 'profile', 'role', 'auth'],
    questions: ['Role event organizer co tach biet hoan toan khoi instructor khong?'],
  },
  {
    slug: 'flow-class-refund',
    type: 'flow',
    title: 'Class Refund',
    subtitle: 'Buyer request -> Admin approve -> Transfer refund',
    summary: 'Admin duyet refund, tao Transfer refund, xoa PaidItem va chuyen LineItem sang refunded.',
    detail: 'Xac nhan tu admin/refunds_controller.rb va transfer model.',
    color: '#C0392B',
    tags: ['flow', 'class_refund', 'finance'],
    highlights: ['refund approved', 'transfer refund', 'paid item removed'],
    questions: ['Partial refund tren mot order item duoc xu ly ra sao?'],
  },
  {
    slug: 'flow-instructor-payout',
    type: 'flow',
    title: 'Instructor Payout',
    subtitle: 'Instructor request -> Admin process -> Transfer payout',
    summary: 'Instructor tao Payout request, admin xu ly, tao Transfer payout va tru balance.',
    detail: 'Xac nhan tu admin/payouts_controller.rb va transfer.after_create callback.',
    color: '#1A5276',
    tags: ['flow', 'payout', 'instructor'],
    highlights: ['payout request', 'transfer payout', 'balance update'],
    questions: ['Can tach payout theo stream class/event o flow nay khong?'],
  },
  {
    slug: 'flow-event-checkout',
    type: 'flow',
    title: 'Event Checkout',
    subtitle: 'Buyer chon ticket -> Checkout -> EventUser + ticket codes',
    summary: 'Buyer checkout event, he thong tao EventUser/EventUserItem, sinh ticket_code.',
    detail: 'Xac nhan tu api/v1/users/events/checkout_event_order.rb va pay_now_event.rb.',
    color: '#D68910',
    tags: ['flow', 'event_purchase', 'ticket'],
    highlights: ['event user', 'event user item', 'ticket code'],
    questions: ['Earnings log co duoc ghi ngay luc checkout hay cho event ket thuc?'],
  },
  {
    slug: 'system-hammer-web',
    type: 'system',
    title: 'hammer-web',
    subtitle: 'Next.js web, instructor + learner ops',
    summary: 'Kenh chinh cho instructor dashboard, checkout class/event, transaction history.',
    detail: 'Module-based: Classes, Checkout, Event, Instructor, Transactions, MyLearning, Profile, Search, Home.',
    color: '#1A237E',
    tags: ['system', 'frontend', 'web'],
    highlights: ['instructor dashboard', 'checkout', 'transactions'],
    questions: ['Web co hien thi wallet ledger (class_available/event_available) khong?'],
  },
  {
    slug: 'system-hammer-mobile',
    type: 'system',
    title: 'hammer-mobile',
    subtitle: 'React Native, social-first mobile',
    summary: 'Social feed, live stream, learning consumption, creator journey tren mobile.',
    detail: 'Screens: Feed, Explore, LiveStream, CreateVideo, Instructor, MyRefunds, Messages, Profile.',
    color: '#1B5E20',
    tags: ['system', 'frontend', 'mobile'],
    highlights: ['social feed', 'livestream', 'refund mobile'],
    questions: ['Mobile co can payout request UI hay do web xu ly?'],
  },
  {
    slug: 'metric-refund-rate',
    type: 'metric',
    title: 'Refund Rate',
    subtitle: 'Ti le giao dich hoan tien / tong giao dich',
    summary: 'KPI canh bao chat luong class/event va san sang cua refund flow.',
    detail: 'Nen tach refund rate class va refund rate event de tranh nhieu.',
    color: '#880E4F',
    tags: ['metric', 'refund', 'risk'],
    highlights: ['refund class', 'refund event'],
    questions: ['Refund rate nguong nao duoc coi la alert?'],
  },
  {
    slug: 'metric-payout-lead-time',
    type: 'metric',
    title: 'Payout Lead Time',
    subtitle: 'Thoi gian tu request den processed',
    summary: 'KPI van hanh cho payout. Thu ngan lead time giam rui ro va tang tin nhiem voi creator.',
    detail: 'Nguon: cot created_at va updated_at tren Payout model.',
    color: '#01579B',
    tags: ['metric', 'payout', 'operations'],
    highlights: ['payout sla', 'ops efficiency'],
    questions: ['SLA hien tai cho payout la bao nhieu ngay?'],
  },
  {
    slug: 'rule-ledger-idempotency',
    type: 'rule',
    title: 'Ledger Idempotency Rule',
    subtitle: 'Moi giao dich co reference id + idempotency key',
    summary: 'Khong duoc tao trung finance transaction. Can trace day du theo reference id.',
    detail: 'Rule nay la bat buoc cho payment/refund/payout de dam bao auditability.',
    color: '#4A235A',
    tags: ['rule', 'finance', 'idempotency'],
    highlights: ['idempotency key', 'reference id', 'audit trail'],
    questions: ['Da co unique constraint theo idempotency key cho wallet transaction chua?'],
  },
  {
    slug: 'open-issue-event-settlement',
    type: 'open_issue',
    title: 'Open Issue: Event Settlement',
    subtitle: 'Event earning/refund settlement chua chot',
    summary: 'Can chot event earning timing va event refund settlement doi ung voi seller.',
    detail: 'Lien quan truc tiep den payout policy event va doi soat doanh thu rong.',
    color: '#7B241C',
    tags: ['open_issue', 'event', 'settlement'],
    highlights: ['event earning timing', 'event refund transfer'],
    questions: ['Event refund approved co tao transfer debit seller ngay khong?'],
  },
]

const edges = [
  { from: 'actor-learner', to: 'flow-class-purchase', type: 'participates', label: 'buyer' },
  { from: 'actor-learner', to: 'flow-event-refund', type: 'initiates', label: 'refund request' },
  { from: 'actor-instructor', to: 'module-class-commerce', type: 'owns', label: 'class seller' },
  { from: 'actor-event-organizer', to: 'module-event-commerce', type: 'owns', label: 'event seller' },
  { from: 'actor-admin-operations', to: 'flow-event-refund', type: 'decides', label: 'approve/decline' },
  { from: 'module-class-commerce', to: 'concept-transfer', type: 'writes', label: 'sales/refund/payout' },
  { from: 'module-event-commerce', to: 'flow-event-refund', type: 'contains', label: 'refund flow' },
  { from: 'module-wallet-ledger', to: 'module-class-commerce', type: 'normalizes', label: 'class stream' },
  { from: 'module-wallet-ledger', to: 'module-event-commerce', type: 'normalizes', label: 'event stream' },
  { from: 'module-class-commerce', to: 'metric-gmv-class', type: 'measured_by', label: 'gmv class' },
  { from: 'module-event-commerce', to: 'metric-gmv-event', type: 'measured_by', label: 'gmv event' },
  { from: 'system-hammer-api', to: 'module-wallet-ledger', type: 'supports', label: 'domain implementation' },
  { from: 'source-knowledge-base', to: 'module-wallet-ledger', type: 'documents', label: 'business source' },
  // New edges for full project scope
  { from: 'actor-learner', to: 'module-social', type: 'participates', label: 'social engagement' },
  { from: 'actor-instructor', to: 'module-social', type: 'participates', label: 'community building' },
  { from: 'actor-learner', to: 'flow-class-refund', type: 'initiates', label: 'refund request' },
  { from: 'actor-admin-operations', to: 'flow-class-refund', type: 'decides', label: 'approve/decline' },
  { from: 'actor-instructor', to: 'flow-instructor-payout', type: 'initiates', label: 'payout request' },
  { from: 'actor-admin-operations', to: 'flow-instructor-payout', type: 'decides', label: 'process' },
  { from: 'actor-learner', to: 'flow-event-checkout', type: 'participates', label: 'buyer' },
  { from: 'module-class-commerce', to: 'flow-class-refund', type: 'contains', label: 'refund flow' },
  { from: 'module-class-commerce', to: 'flow-instructor-payout', type: 'contains', label: 'payout flow' },
  { from: 'module-event-commerce', to: 'flow-event-checkout', type: 'contains', label: 'checkout flow' },
  { from: 'module-social', to: 'system-hammer-mobile', type: 'primary_channel', label: 'mobile-first' },
  { from: 'module-class-commerce', to: 'system-hammer-web', type: 'primary_channel', label: 'web checkout' },
  { from: 'system-hammer-web', to: 'module-identity', type: 'depends', label: 'auth' },
  { from: 'system-hammer-mobile', to: 'module-identity', type: 'depends', label: 'auth' },
  { from: 'system-hammer-api', to: 'module-social', type: 'supports', label: 'backend' },
  { from: 'system-hammer-api', to: 'module-identity', type: 'supports', label: 'user model' },
  { from: 'flow-class-refund', to: 'metric-refund-rate', type: 'measured_by', label: 'refund class rate' },
  { from: 'flow-instructor-payout', to: 'metric-payout-lead-time', type: 'measured_by', label: 'payout sla' },
  { from: 'module-wallet-ledger', to: 'rule-ledger-idempotency', type: 'governed_by', label: 'core rule' },
  { from: 'module-event-commerce', to: 'open-issue-event-settlement', type: 'has_risk', label: 'pending decision' },
]

const scenarios = [
  {
    slug: 'scenario-wallet-core',
    title: 'Wallet Core Lifecycle',
    summary: 'Tu purchase den payout processed theo bucket logic.',
    mood: 'transactional',
    steps: [
      { entitySlug: 'flow-class-purchase', caption: 'Buyer mua class, tao settlement record.' },
      { entitySlug: 'module-wallet-ledger', caption: 'Ghi pending bucket cho seller.' },
      { entitySlug: 'module-wallet-ledger', caption: 'Release pending sang available theo policy.' },
      { entitySlug: 'actor-instructor', caption: 'Tao payout request tu available.' },
      { entitySlug: 'concept-transfer', caption: 'Ghi payout processed settlement.' },
    ],
  },
  {
    slug: 'scenario-event-refund-gap',
    title: 'Event Refund Settlement Gap',
    summary: 'Mo ta diem mo giua status event refund va settlement transfer.',
    mood: 'risk-aware',
    steps: [
      { entitySlug: 'actor-learner', caption: 'Gui event refund request.' },
      { entitySlug: 'flow-event-refund', caption: 'Admin update status.' },
      { entitySlug: 'module-event-commerce', caption: 'Can xac nhan settlement doi ung (Giả định).' },
      { entitySlug: 'module-wallet-ledger', caption: 'Can chot rule debit seller/credit buyer theo stream.' },
    ],
  },
  {
    slug: 'scenario-full-project-actor-journey',
    title: 'Hành trình Actor trong Hammer Ecosystem',
    summary: 'Mot user co the la learner, instructor va event organizer cung luc. Toan bo journey tu social den commerce.',
    mood: 'overview',
    steps: [
      { entitySlug: 'module-identity', caption: 'User dang ky, tao profile.' },
      { entitySlug: 'module-social', caption: 'Theo doi instructor, xem post, tao engagement.' },
      { entitySlug: 'flow-class-purchase', caption: 'Learner checkout class, nhan PaidItem entitlement.' },
      { entitySlug: 'flow-event-checkout', caption: 'Learner mua ve event, nhan ticket code.' },
      { entitySlug: 'actor-instructor', caption: 'Instructor tao class, theo doi earnings.' },
      { entitySlug: 'flow-instructor-payout', caption: 'Instructor request payout, admin xu ly.' },
      { entitySlug: 'module-wallet-ledger', caption: 'Target: wallet ledger ghi nhan toan bo lifecycle tren.' },
    ],
  },
]

const migrationLog = {
  oldFoldersChecked: oldFolders,
  oldFoldersFound,
  filesRead: 0,
  mergedLines: 0,
  deletedFolders: [],
}

const VI_FIXES = new Map([
  ['doc lap voi role instructor', 'độc lập với role instructor'],
  ['doi ung chua duoc xac nhan day du', 'đối ứng chưa được xác nhận đầy đủ'],
  ['Nguoi mua va tieu thu noi dung', 'Người mua và tiêu thụ nội dung'],
  ['Tham gia checkout class/event, hoc noi dung va co the yeu cau refund.', 'Tham gia checkout class/event, học nội dung và có thể yêu cầu refund.'],
  ['Xac nhan tu docs va flow checkout/refund.', 'Xác nhận từ docs và flow checkout/refund.'],
  ['Refund lead time hien tai la bao lau?', 'Refund lead time hiện tại là bao lâu?'],
  ['Nguoi tao class va nhan payout', 'Người tạo class và nhận payout'],
  ['Phat sinh class earnings, payout request va class refund deduction.', 'Phát sinh class earnings, payout request và class refund deduction.'],
  ['Xac nhan tu payout + transfer flow.', 'Xác nhận từ payout + transfer flow.'],
  ['Co nen tach payout policy class/event?', 'Có nên tách payout policy class/event?'],
  ['Nguoi tao event va ban ticket', 'Người tạo event và bán ticket'],
  ['Quan ly event, ticket va event earnings.', 'Quản lý event, ticket và event earnings.'],
  ['Theo docs co kha nang khong can role instructor (Giả định).', 'Theo docs có khả năng không cần role instructor (Giả định).'],
  ['Payout event dung chung engine voi instructor khong?', 'Payout event dùng chung engine với instructor không?'],
  ['Xu ly refund, payout, moderation', 'Xử lý refund, payout, moderation'],
  ['Actor van hanh chot trang thai flow tai chinh quan trong.', 'Actor vận hành chốt trạng thái flow tài chính quan trọng.'],
  ['Xac nhan tu admin controllers va docs BA.', 'Xác nhận từ admin controllers và docs BA.'],
  ['Can SLA nao cho refund/payout?', 'Cần SLA nào cho refund/payout?'],
  ['Mot wallet logic theo user, balance suy ra tu transaction.', 'Một wallet logic theo user, balance suy ra từ transaction.'],
  ['Bucket muc tieu: class_pending, class_available, event_pending, event_available, locked_for_payout.', 'Bucket mục tiêu: class_pending, class_available, event_pending, event_available, locked_for_payout.'],
  ['Khi nao pending duoc release thanh available?', 'Khi nào pending được release thành available?'],
  ['Class flow co settlement log qua Transfer.', 'Class flow có settlement log qua Transfer.'],
  ['Xac nhan tu checkout/refund/payout class flows.', 'Xác nhận từ checkout/refund/payout class flows.'],
  ['Partial refund duoc xu ly ra sao?', 'Partial refund được xử lý ra sao?'],
  ['Event purchase/refund records da co, settlement can chot them.', 'Event purchase/refund records đã có, settlement cần chốt thêm.'],
  ['Event refund settlement transfer dang la diem mo (Giả định).', 'Event refund settlement transfer đang là điểm mở (Giả định).'],
  ['Event earning timing la khi nao?', 'Event earning timing là khi nào?'],
  ['Checkout class va cap entitlement', 'Checkout class và cấp entitlement'],
  ['Order completed, paid item duoc cap va transfer sales duoc tao.', 'Order completed, paid item được cấp và transfer sales được tạo.'],
  ['Xac nhan tu checkout.rb va transfer model.', 'Xác nhận từ checkout.rb và transfer model.'],
  ['Can bo sung buyer-side ledger entry khong?', 'Cần bổ sung buyer-side ledger entry không?'],
  ['Admin cap nhat trang thai hoan tien event', 'Admin cập nhật trạng thái hoàn tiền event'],
  ['Da co EventRefund status flow, settlement doi ung can xac nhan.', 'Đã có EventRefund status flow, settlement đối ứng cần xác nhận.'],
  ['Admin event_refunds controller co status updates.', 'Admin event_refunds controller có status updates.'],
  ['Khi approved, co tao transfer debit seller khong?', 'Khi approved, có tạo transfer debit seller không?'],
  ['Settlement log hien tai', 'Settlement log hiện tại'],
  ['Ghi nhan sales/refund/payout, can map voi wallet transaction moi.', 'Ghi nhận sales/refund/payout, cần map với wallet transaction mới.'],
  ['Hien tai co callback cap nhat instructor_profile.balance.', 'Hiện tại có callback cập nhật instructor_profile.balance.'],
  ['Transfer va wallet transaction map 1-1 hay 1-n?', 'Transfer và wallet transaction map 1-1 hay 1-n?'],
  ['Tong gia tri giao dich class', 'Tổng giá trị giao dịch class'],
  ['KPI bat buoc theo doi theo stream class.', 'KPI bắt buộc theo dõi theo stream class.'],
  ['Nguon docs KPI va reporting reminders.', 'Nguồn docs KPI và reporting reminders.'],
  ['Trang thai nao duoc tinh vao GMV class?', 'Trạng thái nào được tính vào GMV class?'],
  ['Tong gia tri giao dich event', 'Tổng giá trị giao dịch event'],
  ['KPI bat buoc theo doi theo stream event.', 'KPI bắt buộc theo dõi theo stream event.'],
  ['Can tach khoi class de tranh nhieu bao cao.', 'Cần tách khỏi class để tránh nhiễu báo cáo.'],
  ['Refund event tru KPI theo moc nao?', 'Refund event trừ KPI theo mốc nào?'],
  ['Nguon su that cho order/refund/payout/event records.', 'Nguồn sự thật cho order/refund/payout/event records.'],
  ['Doi chieu entity names tu routes/models quan trong.', 'Đối chiếu entity names từ routes/models quan trọng.'],
  ['Wallet service nen dat o app/services nao?', 'Wallet service nên đặt ở app/services nào?'],
  ['Nguon uu tien de suy dien tri thuc cho knowledge web.', 'Nguồn ưu tiên để suy diễn tri thức cho knowledge web.'],
  ['Moi ket luan can bam sat knowledge-base va docs lien quan.', 'Mọi kết luận cần bám sát knowledge-base và docs liên quan.'],
  ['Khi co thay doi lon, da update knowledge-base truoc chua?', 'Khi có thay đổi lớn, đã update knowledge-base trước chưa?'],
  ['Tao demand va giu chan user qua social graph. Chu yeu tren mobile.', 'Tạo demand và giữ chân user qua social graph. Chủ yếu trên mobile.'],
  ['Quan ly danh tinh nguoi dung, role va cai dat tai khoan.', 'Quản lý danh tính người dùng, role và cài đặt tài khoản.'],
  ['User co the dong thoi la buyer, seller va event organizer. Auth qua SSO/OTP/email.', 'User có thể đồng thời là buyer, seller và event organizer. Auth qua SSO/OTP/email.'],
  ['Role event organizer co tach biet hoan toan khoi instructor khong?', 'Role event organizer có tách biệt hoàn toàn khỏi instructor không?'],
  ['Admin duyet refund, tao Transfer refund, xoa PaidItem va chuyen LineItem sang refunded.', 'Admin duyệt refund, tạo Transfer refund, xóa PaidItem và chuyển LineItem sang refunded.'],
  ['Xac nhan tu admin/refunds_controller.rb va transfer model.', 'Xác nhận từ admin/refunds_controller.rb và transfer model.'],
  ['Partial refund tren mot order item duoc xu ly ra sao?', 'Partial refund trên một order item được xử lý ra sao?'],
  ['Instructor tao Payout request, admin xu ly, tao Transfer payout va tru balance.', 'Instructor tạo Payout request, admin xử lý, tạo Transfer payout và trừ balance.'],
  ['Xac nhan tu admin/payouts_controller.rb va transfer.after_create callback.', 'Xác nhận từ admin/payouts_controller.rb và transfer.after_create callback.'],
  ['Can tach payout theo stream class/event o flow nay khong?', 'Cần tách payout theo stream class/event ở flow này không?'],
  ['Buyer chon ticket -> Checkout -> EventUser + ticket codes', 'Buyer chọn ticket -> Checkout -> EventUser + ticket codes'],
  ['Buyer checkout event, he thong tao EventUser/EventUserItem, sinh ticket_code.', 'Buyer checkout event, hệ thống tạo EventUser/EventUserItem, sinh ticket_code.'],
  ['Xac nhan tu api/v1/users/events/checkout_event_order.rb va pay_now_event.rb.', 'Xác nhận từ api/v1/users/events/checkout_event_order.rb và pay_now_event.rb.'],
  ['Earnings log co duoc ghi ngay luc checkout hay cho event ket thuc?', 'Earnings log có được ghi ngay lúc checkout hay chờ event kết thúc?'],
  ['Kenh chinh cho instructor dashboard, checkout class/event, transaction history.', 'Kênh chính cho instructor dashboard, checkout class/event, transaction history.'],
  ['Social feed, live stream, learning consumption, creator journey tren mobile.', 'Social feed, live stream, learning consumption, creator journey trên mobile.'],
  ['Mobile co can payout request UI hay do web xu ly?', 'Mobile có cần payout request UI hay do web xử lý?'],
  ['Ti le giao dich hoan tien / tong giao dich', 'Tỉ lệ giao dịch hoàn tiền / tổng giao dịch'],
  ['KPI canh bao chat luong class/event va san sang cua refund flow.', 'KPI cảnh báo chất lượng class/event và sẵn sàng của refund flow.'],
  ['Nen tach refund rate class va refund rate event de tranh nhieu.', 'Nên tách refund rate class và refund rate event để tránh nhiễu.'],
  ['Refund rate nguong nao duoc coi la alert?', 'Refund rate ngưỡng nào được coi là alert?'],
  ['Thoi gian tu request den processed', 'Thời gian từ request đến processed'],
  ['KPI van hanh cho payout. Thu ngan lead time giam rui ro va tang tin nhiem voi creator.', 'KPI vận hành cho payout. Thu ngắn lead time giảm rủi ro và tăng tin nhiệm với creator.'],
  ['Nguon: cot created_at va updated_at tren Payout model.', 'Nguồn: cột created_at và updated_at trên Payout model.'],
  ['SLA hien tai cho payout la bao nhieu ngay?', 'SLA hiện tại cho payout là bao nhiêu ngày?'],
  ['Moi giao dich co reference id + idempotency key', 'Mỗi giao dịch có reference id + idempotency key'],
  ['Khong duoc tao trung finance transaction. Can trace day du theo reference id.', 'Không được tạo trùng finance transaction. Cần trace đầy đủ theo reference id.'],
  ['Rule nay la bat buoc cho payment/refund/payout de dam bao auditability.', 'Rule này là bắt buộc cho payment/refund/payout để đảm bảo auditability.'],
  ['Da co unique constraint theo idempotency key cho wallet transaction chua?', 'Đã có unique constraint theo idempotency key cho wallet transaction chưa?'],
  ['Event earning/refund settlement chua chot', 'Event earning/refund settlement chưa chốt'],
  ['Can chot event earning timing va event refund settlement doi ung voi seller.', 'Cần chốt event earning timing và event refund settlement đối ứng với seller.'],
  ['Lien quan truc tiep den payout policy event va doi soat doanh thu rong.', 'Liên quan trực tiếp đến payout policy event và đối soát doanh thu ròng.'],
  ['Event refund approved co tao transfer debit seller ngay khong?', 'Event refund approved có tạo transfer debit seller ngay không?'],
  ['Tu purchase den payout processed theo bucket logic.', 'Từ purchase đến payout processed theo bucket logic.'],
  ['Buyer mua class, tao settlement record.', 'Buyer mua class, tạo settlement record.'],
  ['Ghi pending bucket cho seller.', 'Ghi pending bucket cho seller.'],
  ['Release pending sang available theo policy.', 'Release pending sang available theo policy.'],
  ['Tao payout request tu available.', 'Tạo payout request từ available.'],
  ['Ghi payout processed settlement.', 'Ghi payout processed settlement.'],
  ['Mo ta diem mo giua status event refund va settlement transfer.', 'Mô tả điểm mở giữa status event refund và settlement transfer.'],
  ['Gui event refund request.', 'Gửi event refund request.'],
  ['Admin update status.', 'Admin update status.'],
  ['Can xac nhan settlement doi ung (Giả định).', 'Cần xác nhận settlement đối ứng (Giả định).'],
  ['Can chot rule debit seller/credit buyer theo stream.', 'Cần chốt rule debit seller/credit buyer theo stream.'],
  ['Mot user co the la learner, instructor va event organizer cung luc. Toan bo journey tu social den commerce.', 'Một user có thể là learner, instructor và event organizer cùng lúc. Toàn bộ journey từ social đến commerce.'],
  ['User dang ky, tao profile.', 'User đăng ký, tạo profile.'],
  ['Theo doi instructor, xem post, tao engagement.', 'Theo dõi instructor, xem post, tạo engagement.'],
  ['Learner checkout class, nhan PaidItem entitlement.', 'Learner checkout class, nhận PaidItem entitlement.'],
  ['Learner mua ve event, nhan ticket code.', 'Learner mua vé event, nhận ticket code.'],
  ['Instructor tao class, theo doi earnings.', 'Instructor tạo class, theo dõi earnings.'],
  ['Instructor request payout, admin xu ly.', 'Instructor request payout, admin xử lý.'],
  ['Target: wallet ledger ghi nhan toan bo lifecycle tren.', 'Target: wallet ledger ghi nhận toàn bộ lifecycle trên.'],
])

const applyVietnameseDiacritics = (value) => {
  if (typeof value === 'string') {
    let out = value
    for (const [oldText, newText] of VI_FIXES.entries()) {
      out = out.replaceAll(oldText, newText)
    }
    return out
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyVietnameseDiacritics(item))
  }

  if (value && typeof value === 'object') {
    const result = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = applyVietnameseDiacritics(v)
    }
    return result
  }

  return value
}

const output = {
  generatedAt: new Date().toISOString(),
  sourceOfTruth: SOURCE_OF_TRUTH,
  assumptions,
  migrationLog,
  entities,
  edges,
  scenarios,
}

const normalizedOutput = applyVietnameseDiacritics(output)

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, JSON.stringify(normalizedOutput, null, 2) + '\n', 'utf-8')

const docsLines = docsContent.reduce((s, x) => s + countLines(x.content), 0)
const sourceLines = sourceContent.reduce((s, x) => s + countLines(x.content), 0)

console.log('[knowledge:sync] done')
console.log(`[knowledge:sync] sourceOfTruth=${SOURCE_OF_TRUTH}`)
console.log(`[knowledge:sync] docsRead=${docsContent.length} files, lines=${docsLines}`)
console.log(`[knowledge:sync] sourceRead=${sourceContent.length} files, lines=${sourceLines}`)
console.log(`[knowledge:sync] oldFoldersFound=${oldFoldersFound.length}`)
console.log(`[knowledge:sync] output=${outFile}`)
