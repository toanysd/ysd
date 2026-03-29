# SESSION STATE OBJECTIVE: TIẾP TỤC XÓA "EXTEND TAB" TRONG DETAIL PANEL

## 1. Ngữ cảnh (Context)
* Công việc hiện tại đang dừng ở bước: **Chuẩn bị xóa Tab Extend (Extended Data)** nằm trong thành phần Detail Panel, sau khi nhận thấy nó không còn cần thiết và cồng kềnh.
* Trước đó, do vấn đề version lịch sử chồng chéo, chúng ta đã **hoàn thành dọn dẹp Workspace**: Di chuyển hơn 150 files (bao gồm HTML version cũ, JS, CSS obsolete, và các script `.py` tự động) vào thư mục `backup`.
* Workspace gốc bây giờ đã gọn gàng, chỉ chứa đúng bản build mới nhất (có file `index.html` là root, và các file mã nguồn v8.6 đang chạy).
* File gốc Index được lưu một bản backup hoàn thiện với tên `index-v8.5.63.html`.

## 2. Mục tiêu tiếp theo (Next Action)
* **Nhiệm vụ:** Tìm và xóa toàn bộ phần HTML sinh ra Modal/Panel Tab Extend, bộ nút bấm Navigator Tab (Info, Image, Extend...), các logic liên quan, và class CSS rác.
* **File liên quan đang theo dõi:** 
  1. `detail-panel-v8.6.16.js` (logic tạo tab/navigator và UI Extend content).
  2. `detail-panel-v8.6.26.css` (stylesheet hiện tại).
  3. `index.html` (để nhúng version file js/css mới).
* **Quy trình:** Tạo file cloned -> `detail-panel-v8.6.17.js` và `detail-panel-v8.6.27.css`. Sau đó update vào `index.html` (kèm tạo 1 phiên bản index cloned lưu trữ tương ứng).

## 3. Luồng luật áp dụng (Active Run Rules)
* **RULE 1:** Tuyệt đối tăng version number (Tạo bản sao mới và tăng số version hậu tố) khi sửa module không có lỗi từ hệ thống.
* **RULE 2:** Nêu trước kế hoạch: Mục tiêu -> File cần tạo mới/chỉnh sửa -> Lên phương án sửa và xin phép (chờ phê duyệt) trước khi viết mã.
* **RULE 3:** Toàn bộ quá trình giải thích trên khung giờ/lệnh bằng Tiếng Việt.
* **RULE 4:** Ưu tiên tối đa bảo toàn tính tương thích với file `data-manager` và luồng nghiệp vụ hiện hữu (Render CSV - Data - Display).
