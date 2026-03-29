# Kiến trúc Dữ liệu & Quy tắc Mở rộng (AntiGravity v8.5)
*Tài liệu này lưu trữ nguyên tắc hoạt động cốt lõi của ứng dụng để truyền đạt cho Agent (AI) trong các phiên làm việc tiếp theo hoặc trên thiết bị khác.*

## 1. Luồng chạy Dữ liệu (Access Data Flow)
Hệ thống lấy dữ liệu từ 2 nguồn và hợp nhất tại Client thay vì đè lên Server cứng:
- **Nguồn Access (Base CSV):** Các bảng gốc (`molds.csv`, `molddesign.csv`, `cutters.csv`...) được lấy trực tiếp. Nguồn này là Base.
- **Nguồn Web (Update CSV & History Logs):** Khi người dùng thao tác trên Web, thay vì sửa trực tiếp file base, hệ thống ghi đè thông tin mới nhất vào các tệp `web*.csv` (ví dụ: `webmolddesign.csv`, `webtrays.csv`) và BẮT BUỘC ghi log chi tiết từng trường vào `datachangehistory.csv`.
- **Quá trình Hợp nhất (Merge):** `data-manager` (cụ thể là file `data-manager-v8.x.x.js`) sẽ gánh vác trách nhiệm đọc base CSV, đối chiếu với lịch sử `datachangehistory.csv` và `web*.csv` thông qua hàm `overlayRowByHistory()` và `mergeLatestByLegacyOrId()` trong thủ tục `applyWebLatestMerge()`.
- *Lưu ý Dev:* Bất cứ khi nào tạo thêm một chức năng chỉnh sửa bảng phụ, phải nhớ mở `data-manager-v8.x.x.js` để định nghĩa Mapping Sync Data cho bảng đó.

## 2. Quy tắc Giao diện Mobile & Modal
- Ứng dụng theo đuổi trải nghiệm App-native UI/UX.
- Thanh công cụ (Bottom Navbar) trên thiết bị di động đã được cố định. 
- Mọi giao diện xem Chi tiết hoặc Modal chỉnh sửa mở rộng KHÔNG dùng `position: absolute;` phụ thuộc thẻ cha. Bắt buộc dùng `position: fixed; inset: 0; z-index: 999999;` để popup chiếm toàn bộ (100%) viewport màn hình, che toàn bộ Header và Navbar gốc, đảm bảo nút `< Back` hoặc `X Close` có không gian tuyệt đối.
- Ví dụ kinh điển: Thuộc tính bổ trợ CSS Stacking Context: `#ParentId:has(.child-modal-open) { z-index: 999999 !important; }` để ép thẻ cha nổi lên trên cùng màn hình.

## 3. Quy tắc Quản lý Code & Clone (Version Control Nội bộ)
Do hệ thống không sử dụng Git hoặc npm build local phực tạp:
- Clone theo version: Khi sửa một file lớn, hãy nhân bản thủ công trước. Ví dụ `data-manager-v8.4.7.js` thành `v8.4.8.js`, hoặc `index-v8.5.3-3.html` thành `v8.5.3-4.html`.
- Liên kết HTML: Chỉnh sửa thẻ `<link>` và `<script>` trong tệp `.html` tương ứng hướng vào file mới, để file `.html` cũ không bị sập và giữ vai trò như một bản Fallback/Rollback an toàn.
- Tool sửa đổi: Với AI, ưu tiên dùng `multi_replace_file_content` hoặc `replace_file_content` sửa cục bộ tại vị trí chính xác để giảm thiểu token hao tổn và rủi ro mất mã dòng.

## 4. Nhật ký Sửa đổi (Từ Phiên v8.5.3-4) 
- Chữa dứt điểm lỗi Frontend không load được data mới lưu của Table Mở rộng (`molddesign`, `tray`, `companies`...): Do `applyWebLatestMerge` bị rỗng mapping, đã vá 13 bảng vào `data-manager-v8.4.8.js`.
- Bứt phá Stacking Context của Modal Mobile: Đã áp dụng `inset: 0` và `:has` CSS Selector để popup Extended Editor leo lên tận cùng Z-index, đè bẹp thẻ `detail-tabs`. Mọi thứ đã App-Like hoàn toàn.
