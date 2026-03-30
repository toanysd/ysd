# MoldCutterSearch - Hệ thống WMS & AI System Guidelines

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
Đây là hệ thống quản lý Kho, Khuôn, và Máy Cắt (WMS & ERP) chạy hoàn toàn trên trình duyệt (Vanilla JS/HTML/CSS) kết hợp Backend là Supabase.
Mọi AI Agent KHI tham gia dự án này BẮT BUỘC phải tuân thủ các quy tắc trong file này để giữ hệ thống đồng bộ, an toàn và sạch sẽ.

---

## 2. QUY TẮC TỔ CHỨC FILE & ARCHITECTURE
- **Không Framework**: Chỉ sử dụng thuần Vanilla JS/CSS/HTML. Tránh dùng Tailwind/React.
- **Cấu trúc Module bóc tách**: Mỗi tính năng lớn nằm trong module JS riêng biệt ghi rõ version (vd: `plastic-manager-v8.5.13.js`). Không dồn tất cả hàm vào `app.js` quá tải.
- **Index Header**: Kéo các file CSS và JS vào `index.html` thông qua `<link>` và `<script>`.
- **Dọn dẹp mã cũ (Tech Debt)**: Khi một file JS (ví dụ `app-v8.5.5.js`) được nâng cấp lên bản mới, file cũ PHẢI được khoanh vùng xoá hoặc ném vào `/backup` lập tức để giảm tải bộ nhớ nạp của AI.

---

## 3. QUY CÁCH GIAO DIỆN (UI/UX)
- **Giao diện Song Ngữ Bắt Buộc (JA/VI)**: Mọi Tiêu đề (Header), Cột bảng (TH), Labels nhập liệu, Thông báo, Nút bấm (Button) phải hỗ trợ hiển thị song ngữ Nhật-Việt theo chuẩn.
  - Ví dụ UI Cột: `<span class="tag-ja">操作</span><br><span class="tag-vi">Thao tác</span>`
  - Ví dụ Nút Bấm: `<i class="fas fa-edit"></i> 編集 / Sửa`
  - Ví dụ Cảnh báo Confirm: `if(confirm("警告: 削除しますか？\\nCẢNH BÁO: Xóa?"))`
- **Popup UI Model**: Mọi Form CRUD đều phải ưu tiên kết cấu Overlay (Modal che mờ màn hình) với z-index > 9999, dùng `fixed inset-0` thay vì đẩy trôi giao diện bên dưới. Thẻ chứa Modal luôn ưu tiên dùng bóng `box-shadow` và bo góc chuẩn `border-radius: 12px`.
- **Bảng Responsive**: Các Data Grid Table phải đi kèm hộp tìm kiếm đa năng tức thời (Live Searchbox), gõ chữ tới đâu dòng ẩn tới đó.

---

## 4. AI WORKFLOW & AGENTIC LOOP
Khi AI tiếp nhận xử lý yêu cầu thay đổi (Đặc biệt liên quan CRUD Data):
1. Tham chiếu `CLAUDE.md` gốc để lấy định dạng.
2. Thiết kế `task.md` Checklist dạng Todo Tracking (Phase).
3. Tuyệt đối chú ý cẩn thận việc thoát nội dung **Template Literals JS** (Dấu backtick \` và chuỗi escape `$ { }` hoặc `\n`) khi thao tác trên file chứa nhiều HTML thuần bằng Tool API để tránh bung vỡ IDE Lints.
4. Mọi thông tin thiết kế và thay đổi mang tầm ảnh hưởng rộng bắt buộc phải được xuất ra `walkthrough.md` hoặc `implementation_plan.md` cho User tham duyệt.

---

## 5. BẢO MẬT & SANDBOX
- Bỏ qua mọi file/thư mục nằm trong `/backup`.
- API gọi xuống Supabase mặc định dùng `.eq()` an toàn. Không tuỳ biến CSDL khi chưa phân tích kỹ cấu trúc Schema hiện hành.
- Tuyệt đối tự động hóa và giả lập ID an toàn bằng biến số hoặc String-matching thay cho Number vì ID của User đa dạng kiểu (Int vs String vs UUID).
