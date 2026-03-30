# Lịch sử Phiên Làm Việc: Giao diện Detail Panel Rút Gọn, Phân Cấp Rules & Khởi Tạo GitHub
*Ngày: 2026-03-29 (Sáng)*

## Tóm tắt nội dung Chat
1. **Gỡ bỏ Extend Tab**: 
   - Đạt được mong muốn của phiên trước: Xóa toàn bộ logic nhảy Tab (Jump scroll), xoá HTML chứa thẻ Mở rộng, dọn dẹp hàm `renderExtended*` nằm sâu trong JS lõi.
   - Quá trình này đã tuân thủ nghiêm ngặt theo Workflow (Version clone: `v8.6.17` cho file JS, `v8.6.27` cho file CSS và Update an toàn lên `index.html`). 

2. **Dập lỗi Encoding Khẩn Cấp**:
   - Ở bước trước (khi dùng Lệnh Text Replacement trên PowerShell mặc định), do không thiết lập charset=utf-8, Script của AI đã làm hỏng toàn bộ tiếng Việt/Nhật thành chữ `???`.
   - Lập tức xử lý, phát hiện ra root cause và chạy Python Script để ép ghi đè nội dung gốc bằng `utf-8` mà không có BOM. UI khôi phục hoàn thiện.

3. **Cải tiến Tổ Chức Cấu Trúc Rule bằng Mô Hình Tầng (Hierarchical Agents)**:
   - Dựa trên ví dụ repository mới của Cộng đồng AI (`Class-AI-Agent`), Agent & User đã thảo luận và quyết định Băm-Nhỏ toàn bộ Base Rule của Workspace.
   - Đã gỡ bỏ sự sao chép rườm rà tại `G:\AntiGravity\MoldCutterSearch` và `G:\AntiGravity\LLM_YSD_AI`.
   - Chuyển quyền "Lưu trữ Workflows, Skills, và Global Principles" lên cho cha mẹ của nó: Thư mục `G:\AntiGravity\.agents\`.
   - Chỉ giữ lại **project-rules.md** ở từng thư mục con để nén Token và Neo-ngữ-cảnh (Hook Linking) khi Load AI Session.

4. **Tích hợp cứng Git lên `toanysd/ysd`**:
   - Người dùng yêu cầu đồng bộ với Repos trên Github, đồng thời tạo một cách thao tác ngầm cho Agent đẩy File mà User ko cần gõ lệnh.
   - Thư mục được `git init` thành Git repo. Xử lý thành công lỗi "Merge Unrelated History Conflict" giữa branch cục bộ trên máy và branch vừa sinh trên Github, ép override cho file local.
   - Tạo ngầm Slash Command mới tên là `/deploy-github`, biến kỹ năng Auto Commit & Auto Push trở thành "Mệnh lệnh cửa miệng" ở cuối mổi Session lập trình sau này!
