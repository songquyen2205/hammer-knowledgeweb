# Hammer Knowledge Pipeline

Tài liệu command cho workflow thường ngày đã được chuẩn hóa về đúng 2 lệnh chính:

1. /knowledge-pipeline <feature/module|toan-bo-du-an>
2. /knowledge-pipeline --update <yeu-cau-moi>

## Ghi chú vận hành

- Knowledge Web runtime chạy bằng node server.js trong thư mục knowledgeweb.
- Cổng riêng theo dự án được lưu tại .knowledgeweb-port.
- One-click mở web: chạy knowledgeweb/open-knowledgeweb.cmd.
- Cơ chế always-on:
  - scripts/ensure-running.ps1: watchdog kiểm tra health và khởi động lại tối đa 3 vòng repair.
  - scripts/install-autostart.ps1: cài autostart (Scheduled Task hoặc fallback Startup script).

## Source of truth

- NotecuaQuyen/knowledge-base.md
