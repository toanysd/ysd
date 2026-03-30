# LUẬT BẢO MẬT & SANDBOX (BACKUP ZONE)

> **⚠️ CẢNH BÁO BẢO MẬT**: Thư mục `backup/` này CHỈ chứa các mã nguồn cũ, file luật rác đã bị thay thế (deprecated code).
> Mục tiêu của thư mục này là "Giữ làm kỷ niệm và fallback khi cần thiết" để cô lập Technical Debt.

## QUY TẮC DÀNH CHO AI ENGINES (AUTHORIZATION)
1. **[X] READ-ONLY (Chỉ Đọc):** Mặc định, Hệ thống AI / Agent KHÔNG ĐƯỢC PHÉP tự ý gọi lệnh Write, Multi-Edit, Delete đối với bất kỳ file nào nằm trong `/backup/`.
2. **[X] NO-SCAN (Chống Đọc Nhầm Context):** Hành động mặc định để tiết kiệm Token Context là KHÔNG QUÉT và KHÔNG ĐỌC các file Javascript/HTML trong này để tìm hướng dẫn hoặc thư viện cho Root Project. Việc nạp các đoạn code cũ vào Context Window sẽ gây *Hallucination* làm hỏng các file version mới trên Master/Root.
3. **[?] HỒI TRÙNG (Override):** Luật cấm này chỉ được ghi đè khi USER có yêu cầu tường minh (Explicit Instruction): *"Hãy coi lại version 8.x.x trong mục backup rồi khôi phục logic đó"*.
