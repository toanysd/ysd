# AI KNOWLEDGE BASE & WORKFLOW SYSTEM

Thư mục `.agents/` là "Bộ Nhớ Dài Hạn" (Memory/Skills) của AI Engine.
Đây là nơi chứa các kịch bản Workflow, Chat History và Memory Prompt do AI tự xây dựng nhằm chống lại hiện tượng Quên Ngữ Cảnh hoặc Hallucination.

## QUY TẮC PHÁT TRIỂN SKILLS & WORKFLOWS (THEO CHUẨN MASTERY)

### 1. Format Workflow Cứng (.md)
Tất cả các file kịch bản phải đặt tại `.agents/workflows/`. Bạn phải coi đây là **"Chiến Binh Tiền Tuyến"** – Nếu user yêu cầu tính năng nào đã có sẵn trong danh sách Workflow, BẠN BẮT BUỘC phải đọc Workflow đó và làm THEO ĐÚNG TỪNG BƯỚC một cách cứng nhắc, KHÔNG ĐƯỢC CHẾ THÊM trừ khi có ngoại lệ.

Cấu trúc file Workflow chuẩn phải có Frontmatter:
```markdown
---
description: Hướng dẫn tích hợp Form CRUD Modal
---
## Bước 1: Khai báo...
## Bước 2: Thiết kế UI...
```

### 2. Auto-run / Turbo Mode
Khi cấu hình các bước Shell / Bash an toàn, dùng `// turbo` trước khối code để tự động kích hoạt chế độ Auto-run, giúp luồng làm việc tự động hóa mượt mà (Tham khảo kiến trúc Phase 11: Automation & Headless).

### 3. Nguyên lý Tự Đúc Kết (Self-Documentation)
Bất cứ khi nào bạn (Agent) phát hiện ra bạn vừa hoàn thành một Task cực kỳ phức tạp cùng với User (VD: Tối ưu hoá file JS lớn, Phân tích dữ liệu Supabase bị lỗi Cache...), hãy CHỦ ĐỘNG đề xuất với người dùng: "Việc này khá phức tạp nếu tôi bị quên trong phiên giao tiếp sau. Bạn có muốn tôi sao lưu quy trình này thành 1 file `.md` trong `.agents/workflows` không?". Do it. It saves costs and makes things robust.
