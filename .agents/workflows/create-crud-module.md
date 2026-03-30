---
description: Pipeline Xây dựng Module CRUD Web-App (Vanilla JS, Supabase) theo quy chuẩn.
---

# TẠO MỚI MODULE TRUY XUẤT DỮ LIỆU (CRUD)

Khi có yêu cầu từ User tạo một Tab quản lý hoặc File giao diện Quản Trị Hệ Thống (Ví dụ: "Làm trang quản lý User", "Tạo module quản lý Khuôn"), AI **BẮT BUỘC** làm theo từng bước checklist này để tránh rác code và lệch chuẩn giao diện:

## BƯỚC 1: XÂY DỰNG FILE MODULE (Logic JS/CSS riêng biệt)
❌ **KHÔNG** nhồi code vào `app.js` hay sửa đè `index.html` quá mức.
✅ **TẠO MỚI** file `ten-module-v8.x.x.js` (Lấy version mới nhất hiện hành trên file có liên quan) nằm ngang hàng với file index.

## BƯỚC 2: CẤU TẠO GIAO DIỆN (UI BẮT BUỘC)
- Cột tiêu đề phải luôn dùng Tremor Header Card Style.
- Tự động tích hợp **Thanh Phân Lọc (Search Box Box)** vào cạnh Nút *Thêm Mới*. (Viết Javascript lắng nghe sự kiện `input` và lọc Data cục bộ).
- Nút bấm phải luôn ở định dạng **Song Ngữ**: `<i class="fas fa-*"></i> <tag_JA> / <tag_VI>` (Vd: `編集 / Sửa`, `削除 / Xóa`). Đừng tiếc vài token cho Tiếng Nhật.

## BƯỚC 3: CẤU TẠO FORM / POPUP CHỈNH SỬA
- **KHÔNG** dùng thẻ `<dialog>` tĩnh hay chèn form nhúng thẳng vào bảng (Inline).
- **CHẾ TẠO CỨNG** Form Popup Overlay: 1 thẻ `div` bọc ngoài `position:fixed; z-index:99999; in-set:0; background:rgba(0,0,0,0.5)`, bao lấy thẻ bên trong form trung tâm `box-shadow`, `border-radius:12px`. Điều này giúp khung nhìn hiện đại.
- Tại nút Thoát (Cancel) hoặc Nhấn chữ "X", đặt lệnh đổi `style.display = 'none'` trả lại tương tác cho lớp nền.

## BƯỚC 4: KẾT NỐI API & DATABASE (SUPABASE)
- Sử dụng hàm `var sb = api.check()` mặc định của Hệ thống để bắt token.
- Render Data list sau khi Data Fetch qua hàm asyn `sb.from('table').select()...`
- Tạo hàm Update với `.eq('id', recordId)`. *Lưu ý: Luôn đổi dataId của row về dạng Chuỗi `String(x)` trước khi match if (Mã UUID/ BigInt thường bị lỗi nếu parse Number).*

## BƯỚC 5: XÁC THỰC LỖI ESCAPING JS (DEBUG TEMPLATE LITERALS)
- Giai đoạn AI xuất Code ra File, **HẾT SỨC CẨN THẬN** với dấu `` ` `` (Backtick) hoặc dấu Escape `\n` trong hàm nối HTML `el.innerHTML = \`<div>...</div>\``. AI thường hay thay thế chèn lặp các backtick chéo nhau dẫn đến Lỗi Cú Pháp Error. Luôn dùng Tool thay thế text `replace_file_content` theo các cục chunk nhỏ nếu không cần can thiệp toàn cục.
