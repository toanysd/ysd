# Issue Resolution Follow-up Plan

- [x] Issue 1: Lỗi font chữ bị Mojibake do Powershell ghi đè sai encoding. Phục hồi từ bản 13 gốc.
- [x] Issue 2: Lỗi Reset kết quả sau toast Checkout do `loadData()` chưa gọi `applyFilters()`.
- [x] Issue 3: Lỗi che dữ liệu: Gỡ bỏ `position: sticky` toàn cục của cột thao tác, chỉ áp dụng cho dòng đang được focus (`tr.focused-row td.col-actions`).
- [x] Khắc phục lỗi Mất Search sau CheckIn/Out (Lần 3): Ứng dụng "Kế thừa chuỗi" giữa FilterModule và App.js.
- [ ] Tuỳ biến cấu trúc "Compact UI" cho Mobile Detail Panel: Thu nhỏ layout, nút và khoảng cách viền.
- [x] Đồng bộ hoá CSS/Bố cục/Màu sắc giữa Assistive Touch Menu và Bottom Action Bar (Cập nhật `global-assistive-touch-v8.5.7-4`).
- [x] Khắc phục việc các nhãn Nhật - Việt nằm dính sát vào nhau tại cụm "Thông tin lưu trữ" (Bổ sung dấu ngoặc `()`).
- [x] Khôi phục bố cục Lưới 2 cột ngang (Icon trái cỡ 28px, chữ vi/ja phải cỡ 10px) kết hợp màu sắc nhạt trầm (Cập nhật `global-assistive-touch-v8.5.7-6.js`).
- [x] Nén tỷ lệ vàng cho Action Bar: Grid 3 nút một hàng, Flex-Row, chữ tự động wrap để tiết kiệm không gian trên Mobile (`v-8.5.21`).
- [x] Sửa tính năng tự động chuyển Tab của Detail Panel khi bấm Upload Ảnh (`detail-panel-v8.5.12-4.js`)
- [x] Tái thiết kế cụm nút Footer PhotoUpload (Gửi & phiên mới / Gửi & đóng / Đóng) 
- [x] Thêm tính năng Chụp Ảnh Bảo Mật (Camera trước, gửi thẳng storage qua Edge Function) (`photo-upload-v8.5.9.js`)
