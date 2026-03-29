# Mục tiêu (Cập nhật Module Photo Upload)

Cập nhật giao diện và luồng xử lý của module Tải/Chụp ảnh (`photo-upload`) theo yêu cầu:
1. **Không tự động chuyển tab Ảnh** khi mở popup từ Detail Panel.
2. **Cập nhật nút Footer**: "Gửi và tiếp tục phiên mới", "Gửi và đóng", "Đóng".
3. **Hiển thị nút Xóa Liên Kết**: Bổ sung nút hủy liên kết hoặc cho phép nhập mã mới ngay cả khi mở từ Detail Panel.
4. **Bảo mật Camera Trước**: Bổ sung tuỳ chọn "Xác nhận gửi (Bảo mật)" mặc định bật. Khi áp dụng ảnh web, nếu tuỳ chọn này bật, sẽ chụp ẩn một tấm ảnh từ camera trước (giữ kích thước gốc) dùng để gửi mail và upload storage nhưng không lưu vào database web.

---

## Thay đổi đề xuất

### 1. `detail-panel-v8.5.12-4.js` (Bản sao từ `v8.5.12-3.js`)
- **[MODIFY]**: Trong hàm `handleQuickAction(action)`, vô hiệu hoá (comment) dòng chuyển tab tự động:
  ```js
  // if (action === 'photo') this.switchTab('photos');
  ```
- Tính năng vẫn sẽ kích hoạt event để PhotoUpload tự hiển thị giống như hoạt động độc lập, không làm thay đổi tab bên dưới.

### 2. `photo-upload-v8.5.9.js` (Bản sao từ `v8.5.8.js`)
- **[MODIFY] HTML Template `TMPL_MAIN`**:
  - Đổi các nút ở `pu-footer`: `puSendNewBtn` (Gửi & phiên mới), `puSendCloseBtn` (Gửi & đóng), `puCancelBtn` (Đóng).
  - Đưa nút "Xóa liên kết" ra ngoài để có thể click hoặc bổ sung 1 nút "Unlink" nhỏ (dạng `<i class="fas fa-unlink"></i> Thay đổi`) ngay cạnh badge tên thiết bị trong popup.
  - Thêm checkbox `puSecurityConfirmCheck` ("Xác nhận gửi (Bảo mật)") vào vùng Cài đặt gửi.

- **[MODIFY] Logic Xóa Liên Kết**:
  - Gắn sự kiện click chon nút Unlink mới. Nó sẽ gội hàm `this._clearDeviceLink()`. Hàm gỡ bỏ `this._device` hiện tại, xoá badge thiết bị cố định và mở khối tìm kiếm thả nổi cho phép nhập mã khác tuỳ ý.

- **[MODIFY] Logic Submit (Gửi & đóng / Gửi & phiên mới)**:
  - Cập nhật hàm `_submit(sendMail, closeAfter)`. Nếu `closeAfter` là `false`, popup vẫn giữ nguyên sau thành công (đã reset trạng thái danh sách ảnh). Nếu `true`, tự động tắt popup bằng lệnh `this.close()`.

- **[MODIFY] Xử lý sự kiện "Áp dụng" (Editor Apply)**:
  - Khi người dùng ấn "Áp dụng", kiểm tra Checkbox "Xác nhận gửi".
  - Nếu Checkbox bật: Hiển thị popup "Đang xử lý ảnh..." -> Lấy stream Camera Trước (`user`) qua `navigator.mediaDevices` -> Chụp một frame với Canvas gốc -> Tắt popup -> Trả lại giao diện chính.
  - Sau khi chụp sẽ lưu blob ảnh "Camera Trước" vào biến `this._securityPhotoBlob`.

- **[MODIFY] Giao tiếp Supabase (Không hiển thị trên Web)**:
  - Trong quá trình Submit: Nếu tồn tại `this._securityPhotoBlob`, upload trực tiếp qua SDK:
    ```js
    global.supabaseClient.storage.from('device-photos').upload(path, blob)
    ```
  - Bước này hoàn toàn qua Storage (giống cơ chế Push notification file đính kèm), không INSERT dòng mới vào data `device_photos`.
  - Bổ sung URL của file vừa upload này vào danh sách `edgePhotos` để Edge Function gửi vào luồng CC/Email chung.

### 3. Cập nhật `index-v8.5.22.html` (Bản sao từ `index-v8.5.21.html`)
- **[MODIFY]** script src thành bản cập nhật mới nhất: `detail-panel-v8.5.12-4.js` và `photo-upload-v8.5.9.js`.

---

## Kế hoạch kiểm thử (Verification Plan)
1. **Kiểm tra Tab**: Mở thông tin khuôn từ Detail Panel, ấn nút "Ảnh" -> Popup `PhotoUpload` mở ra nhưng tab bên dưới vẫn nằm ở "Thông tin" chứ không bị đẩy sang "Ảnh".
2. **Kiểm tra Nút Thay Đổi Thiết Bị**: Thấy thông tin thiết bị bị khoá phía trên (badge), bấm vào nút "Xóa" để làm rỗng mã, thay đổi thành tìm tên khác. Nhập mã mới và kiểm tra hệ thống chấp nhận mã vừa đổi.
3. **Kiểm tra Session**: Thêm ảnh, gõ mã, tuỳ chọn mục "Gửi và tiếp tục phiên mới" -> Sau thao tác upload thành công popup rỗng lại nội dung sẵn sàng chu kỳ tiếp theo. "Gửi và đóng" sẽ tự tắt.
4. **Kiểm tra Camera (Bảo mật)**:
   - Dùng Laptop/Mobile. Mở chế độ Chụp, ấn Áp Dụng. Quá trình hỏi quyền truy cập Camera để lấy hình từ camera phụ.
   - Khi gửi, dữ liệu đính kèm email (theo edgePhotos) phải bao gồm link public của hình phụ.
   - Ở thẻ tab "Ảnh", thiết bị chỉ lưu hình gốc từ camera sau lên thư viện để không gây lộ thông tin cá nhân.
