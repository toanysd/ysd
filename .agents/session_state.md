# TÌNH TRẠNG HIỆN TẠI (Mold Cutter Search)
Ngày cập nhật: 2026-03-29

## 1. Mạch logic/Dữ liệu đang làm
- Đã hoàn tất gỡ bỏ hoàn toàn logic và HTML của "Extend Tab" khỏi thư mục làm việc (Detail Panel rút gọn còn 8 tính năng lõi gọn nhẹ).
- Đã sửa triệt để lỗi mất Font (UTF-8 encoding) cho toàn bộ Javascript và CSS.
- Đã chuyển bản cũ vào thư mục `backup/` theo quy tắc dọn dẹp thư mục.
- Các file mới nhất cho module Detail Panel là: `detail-panel-v8.6.17.js` và `detail-panel-v8.6.27.css`. File chạy chính là `index.html`.

## 2. Lưu ý về KIẾN TRÚC MÁY CHỦ AI MỚI: 
Hệ thống AI Workspace đã được chuyển sang giao thức **Global vs Local** (Hierarchical Paradigm):
1. **Rule Cục Bộ (Vị trí hiện tại):** `.agents/rules/project-rules.md`. Chứa Hook link ép AI lên Global đọc luật và khai báo nghiệp vụ riêng (bắt buộc dùng HTML thuần, versioning).
2. **Quy Tắc Tối Cao & Kỹ Năng (Vị trí mẹ):** AI BẮT BUỘC ĐỌC luật hệ thống tại `G:\AntiGravity\.agents\rules\global-principles.md` trước khi làm việc. Bất kỳ lệnh `/workflow` nào cũng lấy ở thư mục mẹ (`G:\AntiGravity\.agents\workflows\`). Không tự tiện chế Workflows nội bộ.

## 3. Quản lý Phiên bản (Git Sync)
Dự án đã được Git Initialize và ép tích hợp cứng vào nhánh chính `main` của Repo `https://github.com/toanysd/ysd`.
Conflict giữa 2 nhánh unrelated history đã được vá thành công theo chiều hướng `Local thắng Remote`.

**=> Phiên mới (New Chat) sẵn sàng:** Khi mở phiên mới, hãy chờ yêu cầu từ người dùng (User sẽ vạch ra feature mới hoặc yêu cầu design khác). Đừng quên, AI giờ đã có /deploy-github trong tay để Push.
