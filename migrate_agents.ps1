# Tái cấu trúc (Global AI Agents)
# Script này sẽ tạo các thư mục Global và di chuyển file theo cấu trúc đã vạch ra.

# 1. Khởi tạo cây thư mục chuẩn
New-Item -ItemType Directory -Force -Path "G:\AntiGravity\.agents\rules"
New-Item -ItemType Directory -Force -Path "G:\AntiGravity\.agents\workflows"
New-Item -ItemType Directory -Force -Path "G:\AntiGravity\.agents\skills"

# 2. Hút dữ liệu từ MoldCutterSearch ra Global (Cột sống chung)
Copy-Item -Path "G:\AntiGravity\MoldCutterSearch\.agents\workflows\*" -Destination "G:\AntiGravity\.agents\workflows\" -Recurse -Force
Copy-Item -Path "G:\AntiGravity\MoldCutterSearch\.agents\skills\*" -Destination "G:\AntiGravity\.agents\skills\" -Recurse -Force

# 3. Ghi file global-principles.md
$globalRules = @"
# YSD AI V8 GLOBAL RULES (Quy tắc Vũ trụ) 

## 1. COMMUNICATION (GIAO TIẾP & BÁO CÁO)
- **100% Tiếng Việt**. Trả lời rành mạch, không phóng đại.
- Hỏi lại nếu thiếu thông tin (Max 3 câu hỏi quan trọng).

## 2. WORKFLOW (BẮT BUỘC TIẾN TRÌNH LÀM VIỆC)
- Tương thích ngược (Backward Compatibility). Tôn trọng logic hiện hữu.
- **Trước khi Code:** (1) Phân tích, (2) Nêu đúng file cần chỉnh, (3) Plan MVP thu gọn, (4) CHỜ PHÊ DUYỆT.
- **Debug:** Systematic Debugging. Không thay đổi 2 biến/điều kiện cùng lúc. Lỗi 3 lần thì STOP.

## 3. SESSION HANDOFF (KẾT THÚC CÔNG VIỆC)
- Khi user thông báo "kết thúc", bắt buộc cập nhật tình trạng vào `.agents/session_state.md`.
- Ghi log lại buổi làm việc vào folder `.agents/chat_history/`. Mọi session mới phải đọc lướt qua file `session_state.md`.
"@
Set-Content -Path "G:\AntiGravity\.agents\rules\global-principles.md" -Value $globalRules -Encoding UTF8

# 4. Ghi file project-rules.md cục bộ để nối móc (Hook)
$localMoldCutter = @"
# LUẬT DỰ ÁN MOLD CUTTER

> **AI INSTRUCTION (CRITICAL HOOK):**
> 1. Bạn LUÔN PHẢI tham chiếu luật tối cao tại Global: `G:\AntiGravity\.agents\rules\global-principles.md`. Không được bỏ qua.
> 2. Mọi Workflow của bạn đều nằm ở thư mục mẹ: `G:\AntiGravity\.agents\workflows\`.

## NGHIỆP VỤ RIÊNG CỦA PROJECT NÀY:
- **Ngôn ngữ/Kiến trúc:** Bám sát tư tưởng Single-file HTML/JS/CSS không dùng Next/React/SASS. Data bằng CSV lưu offline. Rendering trên web thuần.
- **VERSIONING CẤP TẬP (BẮT BUỘC): KHÔNG GHI ĐÈ FILE ỔN ĐỊNH.** Khi sửa module, phải clone ra version mới (VD: `app-v8.js` -> `app-v8-1.js`), rồi gắn vào thẻ script `index.html`. Backup `index.html` của bản trước lại (vd `index-v8.X.html`).
- **Dọn dẹp tự động:** Ngay khi xác nhận version mới ĐÃ CHẠY, đóng gói 100% file .js, .css, .html phiên bản cũ (không được file chạy chính gọi tới nữa) vào thư mục `backup/`.
"@
Set-Content -Path "G:\AntiGravity\MoldCutterSearch\.agents\rules\project-rules.md" -Value $localMoldCutter -Encoding UTF8

# Quét sạch file rác ở MoldCutterSearch
Clear-Content -Path "G:\AntiGravity\MoldCutterSearch\.agents\rules\antigravity-rules.md" -Force
Clear-Content -Path "G:\AntiGravity\MoldCutterSearch\.agents\rules\core_principles.md" -Force
Remove-Item -Path "G:\AntiGravity\MoldCutterSearch\.agents\workflows\*" -Recurse -Force
Remove-Item -Path "G:\AntiGravity\MoldCutterSearch\.agents\skills\*" -Recurse -Force

# Lặp lại tương tự cho LLM_YSD_AI để clean (Nếu cắm)
# Quét sạch file rác ở LLM_YSD_AI
if (Test-Path "G:\AntiGravity\LLM_YSD_AI\.agents\") {
    Clear-Content -Path "G:\AntiGravity\LLM_YSD_AI\.agents\rules\antigravity-rules.md" -Force
    Clear-Content -Path "G:\AntiGravity\LLM_YSD_AI\.agents\rules\core_principles.md" -Force
    Remove-Item -Path "G:\AntiGravity\LLM_YSD_AI\.agents\workflows\*" -Recurse -Force
    Remove-Item -Path "G:\AntiGravity\LLM_YSD_AI\.agents\skills\*" -Recurse -Force
    
$localLLM = @"
# LUẬT DỰ ÁN LLM_YSD_AI

> **AI INSTRUCTION (CRITICAL HOOK):**
> 1. Bạn LUÔN PHẢI tham chiếu luật tối cao tại Global: `G:\AntiGravity\.agents\rules\global-principles.md`. Không được bỏ qua.
> 2. Mọi Workflow của bạn đều nằm ở thư mục mẹ: `G:\AntiGravity\.agents\workflows\`.

## NGHIỆP VỤ RIÊNG CỦA PROJECT NÀY:
- **Kiến trúc:** Dự án Mail Processing V4 sử dụng Vector Database và tích hợp Email Outlook. Phải đảm bảo logic đa luồng (Mail Parsing, YSD AI Assistant).
- Tham khảo mô hình Data Fallback từ hệ thống cũ.
"@
    Set-Content -Path "G:\AntiGravity\LLM_YSD_AI\.agents\rules\project-rules.md" -Value $localLLM -Encoding UTF8
}
