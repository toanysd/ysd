# Walkthrough: Sửa chữa lỗi Mobile UI, Font chữ & Search Reset

## Các vấn đề đã được giải quyết

### 1. Phục hồi lỗi hiển thị Tiếng Nhật (Mojibake UTF-8) trên HTML
- **Lỗi**: Trong lần build thứ 1, file `index-v8.5.14.html` bị sửa bằng Powershell làm mất Encoding UTF-8, biến thành text lạ (`驥大梛...`) trên tiêu đề và placeholder.
- **Giải pháp**: Phục hồi bản sao chuẩn từ `index-v8.5.13.html` lên các bản `15` và hiện tại là `index-v8.5.16.html` bằng công cụ copy native, hoàn toàn bảo tồn mã hoá kĩ tự chuẩn Nhật Bản.

### 2. Khắc phục triệt để lỗi "Reset Results Area" sau Toast Cập nhật
- **Lỗi cũ**: Hàm `loadData` chỉ làm mới `FilteredItems`. Càng sửa vào hàm này càng bất ổn vì xung đột giữa Search (textbox) và Filter (thanh trượt bên).
- **Lỗi phát sinh thêm**: Khi tải Check-in xong, **FilterModule** (xử lý sidebar) bắt được Event Refresh nên tự động lọc ra 6328 kết quả và bắn cho `App.js` ép vẽ giao diện bỏ qua lệnh Search "Jae210" luôn. Code cũ "đè" toàn bộ nhau gây bế tắc.
- **Giải pháp tối mật (Kế Thừa Chuỗi)**: Trong `app-v8.5.6-5.js`, Event Listener tên `filterapplied` đã được sửa lại:
  * Nhận kết quả từ **FilterModule** (`6328 rows`) và cất vào kho tạm: `this._lastFilterResults = detail.results`.
  * Sau đó gọi tiếp `this.applyFilters()`.
  * Hàm `applyFilters` sẽ bốc luôn cái `_lastFilterResults` ra, rồi cho **SearchModule** lặp lọc tiếp xuống còn 1. Bằng cách nối tiếp nhau thay vì triệt tiêu nhau, giao diện UI luôn giữ được chuẩn xác kết quả lai ghép!

### 3. Cột Hành động (Action) đè mất dữ liệu Vị trí khi cuộn (Mobile)
- **Lỗi**: Thiết kế ban đầu cài đặt `sticky` lên toàn bộ cột thao tác khiến màn hình mobile bị thu hẹp diện tích, người dùng cuộn ngang bị che khuất Cột Vị trí đằng sau.
- **Giải pháp**: Thông qua thao tác DOM ở css `results-table-renderer-v8.5.12-3.js`, CSS được thu nhỏ phạm vi với selector `tr.focused-row`. Giờ đây, cột sẽ trôi tuột ẩn đi, ngoại trừ hàng dữ liệu nào bị user chạm (focus), thì riêng nút của hàng đó sẽ neo bên phải màn hình.

## Files phiên bản mới nhất (Final)
- `index-v8.5.16.html` (chạy gốc)
- `app-v8.5.6-5.js`
- `results-table-renderer-v8.5.12-3.js`

## Cách kiểm tra thủ công (Q&A)
- Vui lòng vào thẳng url **`index-v8.5.16.html`**. Code sửa lỗi search nằm duy nhất trên file này.
- Thử kéo lưới kết quả, gõ tìm 1 chữ ngẫu nhiên (ví dụ Jae210). Rồi thử thực hiện một thao tác nhanh Check-in / Change Location. Khi Notification báo xanh lên ở góc, hãy quan sát bảng dữ liệu lúc đó KHÔNG bị nhảy về 6 ngàn dòng mà vẫn kẹt ở danh sách `jae210` như ước muốn!

### 4. Tuỳ biến cấu trúc "Compact UI" cho Mobile Detail Panel
- Giải quyết yêu cầu thu gọn bảng Detail Panel khi xem trên điện thoại, đặc biệt tập trung tại cụm **Thông tin lưu trữ** và **Nút thao tác nhanh**.
- **Chi tiết thực hiện**:
  - `CSS (detail-panel-v8.5.3-9.css)`: Rút gọn `padding` và khoảng cách các hộp chứa. Giảm tỷ lệ chữ cho phần `section-header` để giao diện trên iPhone/Android trở nên nhẹ nhàng, mượt mắt hơn.
  - `Quick Actions`: Đảo trục (flex-direction) của các nút gọi thao tác. Chuyển Icon sấm sét sang phía tay trái và dồn chữ thành 2 hàng mini (Tiếng Nhật/ Tiếng Việt) sang mạn phải. Bằng cách này các ngón tay có thể tuỳ ý bấm rất nhạy mà màn hình vẫn không bị choáng mất nửa bảng Panel.
  - `JS (detail-panel-v8.5.12-2.js)`: Tháo gỡ mạng DOM tại khu Lưu trữ. Tạo tỷ lệ vàng 1/3 cho khu ảnh `camera` (Thumb), 2/3 dành cho 4 hạng mục cột dọc. Còn riêng 3 trường dài dòng như Vị trí và Ghi chú thì đẩy xuống hàng đơn `100% width` nằm song song bên dưới (flex-row nowrap) giúp text không bao giờ bị chèn ép.
- **File cập nhật mới nhất**:
  - `index-v8.5.17.html`
  - `detail-panel-v8.5.12-2.js`
  - `detail-panel-v8.5.3-9.css`

### 5. Đồng bộ hoá CSS Giao diện: Nút Assistive Sấm sét & Nút Bottom Action
- **Mục tiêu**: Cân bằng lại trải nghiệm trên di động giữa 2 chế độ Action (Nút hỗ trợ nổi vs Thanh bám đáy). Bổ sung dấu cách (khoảng trắng) cho các nhãn Nhật-Việt ở tab Thông tin.
- **Chi tiết thực hiện**:
  - Gộp chung CSS (`global-assistive-touch-v8.5.7-4.js`): Hợp nhất định dạng `flex-row` hiển thị 2 cột, 2 thứ tiếng cho Thanh Action Bar dưới đáy. 
  - Màu sắc được thiết lập tỉ mỉ chung cho cả 2 Menu nhằm phân biệt công năng thao tác (Vàng Cam Nhập/Xuất, Xanh Cyan Kiểm kê, Xanh ngọc Teflon...).
  - Mã hoá dấu ngoặc kép cho Nhãn Tiếng Việt bằng thủ thuật trực tiếp (`detail-panel-v8.5.12-3.js`).
- **File phiên bản mới nhất**:
  - `index-v8.5.18.html`
  - `detail-panel-v8.5.12-3.js`
  - `global-assistive-touch-v8.5.7-4.js`

### 6. Tinh chỉnh Layout 2 Cột ngang theo ý thích & Bộ màu sắc Pastel
- **Mục tiêu**: Người dùng đánh giá cao bộ màu Pastel được phân tách, nhưng mong muốn bố cục thu nhỏ gọn gàng hơn và quay về 2 Cột lưới với cấu trúc Icon trái - Label phải (như bản cũ).
- **Chi tiết thực hiện**:
  - Gộp chung CSS (`global-assistive-touch-v8.5.7-6.js` và `detail-panel-v8.5.3-11.css`): Đưa hệ thống lưới trở về `repeat(2, 1fr)`. Ép flex về lại `row`.
  - Icon gọt dũa giảm còn `28px` vuông. Nút thắt chặt chiều cao `min-height: 44px`. Các nhãn tịnh tiến sát viền mạn trái.
  - Giữ lại hệ thống màu "trầm ấm" cực kỳ rõ ràng (Soft Blue, Peach, Mint, Rose...)
- **File cập nhật cuối cùng**:
  - `index-v8.5.20.html`
  - `detail-panel-v8.5.3-11.css`
  - `global-assistive-touch-v8.5.7-6.js`

### 7. Siêu nén diện tích - Lưới 3 cột ngang (V21)
- **Mục tiêu**: Thực hiện thay đổi cuối cùng về bố cục: Tiếp tục duy trì thiết kế Row (icon trái, nhãn phải) nhưng phải nén được thành **3 Nút trên 1 Hàng** thay vì 2.
- **Chi tiết thực hiện**:
  - Đẩy Layout sang `repeat(3, 1fr)`.
  - Ép khuôn Icon xuống tỉ lệ bé nhất chuẩn Mobile là `24x24px`.
  - Giảm font chữ Nhãn Nhật còn `9.5px` và Nhãn Việt `8px`. Bật cờ `white-space: normal` (wrap text line) để đảm bảo nếu nhãn quá dài, nó sẽ ngắt dòng chứ không bị cắt mất.
  - Cấu hình này giúp toàn bộ 7 nút Action Fit trọn vẹn vào chỉ khoảng chưa đến 2.5 Hàng. 
- **File phiên bản áp dụng**:
  - `index-v8.5.21.html`
  - `detail-panel-v8.5.3-12.css`
  - `global-assistive-touch-v8.5.7-7.js`

### 8. Tối ưu hoá luồng tải ảnh và Bổ sung Camera bảo mật ẩn
- **Mục tiêu**: Ngăn chặn tình trạng ứng dụng tự động nhảy sang Tab "Ảnh" khi kích hoạt module Upload từ Detail Panel. Nâng cấp các nút bấm Thao tác cuối (Gửi tiếp / Gửi đóng / Đóng) và bổ sung tính năng Chụp hình người đang thi hành (bảo mật) từ camera trước.
- **Chi tiết thực hiện**:
  - `detail-panel-v8.5.12-4.js`: Vô hiệu hoá đoạn mã gọi `switchTab('photos')` khi khởi chạy biến cố `photo`. Phím tắt Ảnh trên panel chỉ kích hoạt popup.
  - `photo-upload-v8.5.9.js`: 
    - Giao diện (HTML): Thay cụm nút dưới footer thành 3 nút riêng biệt `Gửi & phiên mới`, `Gửi & đóng`, và `Đóng`.
    - Bổ sung tuỳ chọn Checkbox "Xác nhận gửi (Bảo mật - gửi ảnh ẩn)" đã được bật mặc định tại Tab Cài đặt.
    - Logic Bảo Mật: Khi bấm nút `Áp dụng` ở thao tác chỉnh sửa cắt ghép ảnh cuối cùng, hệ thống tự động gọi ngầm `getUserMedia({ facingMode: 'user' })` để lấy video stream (có timeout cho auto-exposure tự khởi chạy) và chụp 1 hình từ camera trước. Ảnh này trực tiếp bypass cơ sở dữ liệu (`device_photos`), mà upload thẳng một tệp tin tĩnh lên Storage Bucket `device-photos` của hệ thống thông qua Supabase SDK API. Sau đó lấy URL công khai đưa vào array của Edge Function để đính kèm theo Email tới nhóm kiểm duyệt. Kết quả sẽ vĩnh viễn không được list lại trên trang Web, đảm bảo quyền riêng tư.
    - Hệ thống xử lý tự động xoá Stream gốc khỏi UI và báo cáo lỗi nếu người dùng huỷ cấp quyền cấp cho Website.
- **File phiên bản áp dụng**:
  - `index-v8.5.22.html`
  - `detail-panel-v8.5.12-4.js`
  - `photo-upload-v8.5.9.js`
