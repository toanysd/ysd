---
description: Pipeline Chuyển đổi Dịch Thuật hiển thị App sang Format Tích Hợp Song Ngữ (JA/VI)
---

# WORKFLOW CHUYỂN ĐỔI GIAO DIỆN SONG NGỮ (BILINGUAL)

User của hệ thống MoldCutterSearch có cả người Nhật Bản (cấp quản lý) và người Việt Nam (cấp vận hành nhà máy). Vì vậy, hệ thống không dùng i18n switcher mà MẶC ĐỊNH BẮT BUỘC toàn bộ UI phải hiển thị CÙNG LÚC 2 ngôn ngữ. 

Khi nhận yêu cầu: *"Xử lý giao diện thành song ngữ"*, AI thực hiện theo checklist sau:

## BƯỚC 1: TRANSLATE VÀ FORMAT TEXT
- Định dạng cơ bản: Tiếng Nhật luôn viết ở trước, Tiếng Việt viết phía sau.
- Cú pháp ghép nối Buttons: `<i class="fa fa-icon"></i> Tiếng_Nhật / Tiếng_Việt` (Vd: `編集 / Sửa`). Tuyệt đối giữ nguyên icon `fas` đã có.

## BƯỚC 2: BỌC THẺ `<SPAN>` CHO LABELS, HEADERS, TABLE COLUMNS
Ở những khối chữ lớn như Tiêu đề, Tên Form Input, Tiêu đề Cột của Bảng: 
- Cú pháp: `<span class="tag-ja">Tiếng Nhật</span> <span class="tag-vi">Tiếng Việt</span>`.
- Ở dạng Text đứng (Cột dọc hẹp), AI có thể sử dụng `<br>` để bẻ dòng: `<span class="tag-ja">材質</span><br><span class="tag-vi">Vật Liệu</span>`.

## BƯỚC 3: DỊCH CÁC HỘP THOẠI CẢNH BÁO (ALERTS / CONFIRMS)
- Khi gọi hàm `alert()` hoặc `confirm()`, luôn dùng ký tự ngắt dòng `\n` của Javascript.
- Cú pháp chuẩn: `confirm("警告: [Tiếng_Nhật]?\n\nCẢNH BÁO: [Tiếng_Việt]?")`.

## BƯỚC 4: PLACEHOLDER & TRẠNG THÁI LOADING
- Dịch các Text nằm trong thuộc tính HTML như `placeholder="検索 / Nhập từ khóa..."`.
- Text của Loading Data: `<i><i class="fas fa-spinner fa-spin"></i> 処理中 / Đang xử lý...</i>`.

## BƯỚC 5: TỰ ĐỘNG CHUẨN HOÁ TỪ VỰNG NGÀNH
Nếu chưa biết cung cấp từ chuẩn, hãy refer bảng sau:
- Thêm mới: 新規追加
- Chỉnh sửa (Edit): 編集
- Quản lý nhựa: プラスチック材料管理
- Tìm kiếm: 検索
- Hủy bỏ: キャンセル
- Xuất Excel: Excel出力
- Thao tác: 操作
