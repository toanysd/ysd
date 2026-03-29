# Chat History: Fix Context Menu & Photo Manager UI (2026-03-24)

## Vấn đề ban đầu
- Chuột phải (Context menu) trên ứng dụng Photo Manager cho cả PC và Mobile hoạt động chập chờn hoặc không hiện.
- Thẻ tên (Item Name) trên PC thỉnh thoảng click không được do lỗi line-clamp của Chromium.

## Phân tích & Quá trình sửa
1. **Lỗi Click Thẻ Tên**: Nhận thấy đoạn CSS bị lỗi hit-test khi dùng `-webkit-line-clamp`. Đã tạo pseudo-element `::after` phủ lên trên giúp bắt sự kiện chính xác (Cập nhật trong file `photo-manager-v8.4.10.css`).
2. **Event Delegation**: Đổi phương pháp bắt sự kiện từ từng phần tử sang `#pmContent` qua `document.addEventListener`.
3. **Lỗi Logic Runtime**: Sửa lỗi Closure `self` bị hỏng khiến context menu không báo lỗi nhưng không hiện menu. Viết lại hàm xử lý sự kiện dùng biến `window.PhotoManager` (File `photo-manager-v8.5.15.js`).
4. **Z-Index Conflict (Gốc rễ)**: Menu được chèn vào DOM (với `z-index: 10200`) nhưng bị ẩn vì hàm `_pmSetBaseZ` dùng để ưu tiên hiển thị ảnh/overlay lại đẩy Overlay lên mức `12000`. Cập nhật file style thành `photo-manager-v8.4.11.css` đặt `z-index: 20000` cho class `.pm-context-menu`.

## Kết quả
- Context menu hiện ngay trong lần gọi đầu tiên cả khi bấm chuột phải (PC) và ấn giữ lâu (Mobile).
- Menu luôn nằm trên cùng nhờ giải quyết dứt điểm z-index.
- Toàn bộ source code phiên bản cuối v8.5.38 đã được đóng gói thành công thông qua `BackupTool.ps1`.
