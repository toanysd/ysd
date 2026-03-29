# Nhật ký làm việc - 2026-03-24 21:15

## Vấn đề giải quyết
1. **Sửa lỗi khởi tạo**: Khắc phục runtime error `this.initResizable is not a function` tàn dư từ Sidebar cũ.
2. **Loại bỏ hard-code CSS JS**: Xoá inline styles trực tiếp từ JS gây lỗi ép chữ khi cửa sổ bị co lại (Grid nút Quick Actions wrap sai).
3. **Thí điểm UI Mới**: Thiết kế giao diện Dashboard Tri-pane, xoá bỏ toàn bộ giao diện Card Box lồng nhau làm phình to layout.
4. **Viết lại Architecture**: Xây dựng Layout Masonry 12 Cột (đặt tên `.dp-dash2-layout`) với các thẻ card `.dp-d2-card` cho riêng Detail Panel v8.6.0. Lấy cảm hứng từ bức ảnh V4 hệ thống cũ của người dùng chia sẻ (với nút bấm vuông cực sít và khối Info chỉ hiển thị text không có viền bao).

## File đã sửa đổi
- `detail-panel-v8.6.0.js`: 
  - Đã loại bỏ kiến trúc Drawer 2 cột `renderInfoTabDesktop*Centric`.
  - Hợp nhất cấu trúc lưới dashboard định vị cứng 12 cột, nhúng các hàm render cũ vào các block `dp-d2-card` chuyên biệt.
- `detail-panel-v8.6.0.css`: 
  - Ép CSS classes mới quản lý Masonry Grid (`.col-3`, `.col-4`, `.col-6`, ...).
  - Ép Flex-list dọc thay vì Grid ngang cho các Component thông số kĩ thuật nhằm tạo mật độ High-density.
  - Viết hệ thống CSS Cascade Overrides cực mạnh (`!important`) để xoá các viền mảng, background thừa rác trả ra từ các hàm Render JS Legacy cũ.

## Rủi ro & Kết quả
- Layout chạy thành công nhưng chưa thoả mãn mắt thẩm mỹ của người dùng.
- Tỷ lệ Box chưa co giãn đủ mượt và tự nhiên dành cho content có độ dài ngắn khác nhau. 
- Yêu cầu dừng phiên này để chuyển sang hội thoại mới xây dựng chuyên sâu bằng UI library standard cấp cao hơn.
