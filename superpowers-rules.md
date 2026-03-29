# Superpowers Core Rules
Bộ quy tắc cốt lõi được đúc kết từ Superpowers Guide, áp dụng cho mọi dự án phát triển phần mềm để đảm bảo tính kỷ luật, tự động hóa và chất lượng cao.

## 1. Triết lý Cốt lõi (Core Philosophy)
- **TDD First (Test-Driven Development):** Luôn viết test trước, thấy test fail (RED), viết code tối thiểu để pass (GREEN), sau đó refactor (REFACTOR). Không có ngoại lệ ("No exceptions means literally no exceptions").
- **YAGNI (You Aren't Gonna Need It):** Loại bỏ mọi thứ không cần thiết khỏi thiết kế. Không code những tính năng "có thể cần trong tương lai".
- **Evidence > Claims (Bằng chứng > Lời nói):** Không bao giờ nói "Done" hay "Tests pass" mà không có log/output để chứng minh. Chạy lệnh verify trước khi claim.

## 2. Quy trình Phát triển (Core Workflow)
Mọi luồng phát triển tính năng mới phải đi qua các bước:
1. **Brainstorming:** Hỏi để hiểu rõ yêu cầu, đề xuất phương án, chờ người dùng phê duyệt thiết kế trước khi viết dòng code đầu tiên. (HARD-GATE: Không code khi chưa chốt thiết kế).
2. **Isolation:** Tạo môi trường cách ly (worktree hoặc bản clone file mới). Đảm bảo xuất phát điểm sạch sẽ.
3. **Planning:** Viết Implementation Plan chi tiết. Chia nhỏ task thành các đơn vị 2-5 phút. Mỗi task phải bao gồm Test -> Fail -> Implement -> Pass.
4. **Execution:** Thực thi từng task. Ưu tiên dispatch subagents hoặc thực thi tuần tự. Đánh giá 2 giai đoạn (Mức độ đáp ứng Spec & Chất lượng Code).
5. **Code Review:** Tự đánh giá code hoặc dùng reviewer agent. Block ngay nếu có lỗi Critical. Push back các yêu cầu review vi phạm YAGNI.
6. **Completion:** Verify toàn bộ luồng, trình bày các lựa chọn tiếp theo (Merge/Discard/Keep) và dọn dẹp workspace.

## 3. Systematic Debugging (Debug có hệ thống)
Không bao giờ đoán mò và sửa random. Tuân thủ 4 pha:
- **Phase 1: Investigation:** Đọc error ACTUAL, reproduce bug, check file thay đổi gần nhất, trace data flow.
- **Phase 2: Pattern Analysis:** Tìm ví dụ đang chạy đúng, so sánh điểm khác biệt, kiểm tra timing/race condition.
- **Phase 3: Hypothesis:** Đặt giả thuyết CỤ THỂ ("Bug do X vì Y"). Test 1 biến số mỗi lần.
- **Phase 4: Implementation:** Tạo failing test -> Fix 1 điểm -> Verify pass.
*Luật sắt:* 3 lần fix thất bại = Vấn đề ở Kiến trúc (Architectural Problem), phải lùi lại đánh giá toàn cục, không cố đấm ăn xôi.

## 4. Verification Before Completion
- STOP ngay nếu dùng các từ: "should", "probably", "seems to".
- STOP ngay nếu nói "Done!" mà chưa chạy lệnh kiểm chứng độc lập.
- Không skip verification với lý do "đã test cái tương tự trước đó".

## 5. Tương thích với Dự án Hiện tại (AntiGravity v8.5)
Do dự án hiện tại là Vanilla HTML/JS/CSS không có npm/git cục bộ:
- **Isolation:** Thay vì `git worktree`, ta áp dụng "Clone file versioned" (ví dụ tạo html mới, js mới) để cách ly thay đổi.
- **TDD:** Mặc dù không có framework test tự động như Jest, ta cần định nghĩa "các bước test thủ công hoặc script test console" rõ ràng trước khi code. Phải verify lỗi xảy ra trên console trước khi tiến hành sửa file.
- **Plan Document:** Ghi rõ file sẽ clone, phương thức thay đổi nội dung, và các bước verify UI/Console.
