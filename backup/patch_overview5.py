import re
import sys

with open('detail-panel-v8.6.8.js', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'// --- NEW LOGIC FOR FIELDS ---.*?return `\s*<style>.*?</div>\s*`;\s*\}', re.DOTALL)
match = pattern.search(text)

if not match:
    print("Could not find the target block to replace!")
    sys.exit(1)

new_logic = """// --- NEW LOGIC FOR FIELDS ---
      const moldDimBadge = dimensions !== '-' && dimensions !== '' ? `<span class="dp-badge-dim mold-dim">${dimensions}</span>` : '-';
      const prodDimBadge = trayDim !== '-' && trayDim !== '' ? `<span class="dp-badge-dim prod-dim">${trayDim}</span>` : '-';

      const row1 = [
        { label: this.biLabel(isMold ? '金型ID' : '抜型ID', isMold ? 'ID Khuôn' : 'ID Dao cắt'), rawValue: itemID },
        { label: this.biLabel('名称', 'Tên khuôn/Dao cắt'), rawValue: nameCode },
        { label: this.biLabel('タイプ', 'Kiểu khuôn/Dao'), rawValue: itemType }
      ];
      
      const row2 = [
        { label: this.biLabel('トレイ情報(指示書)', 'Thông tin khay (từ chỉ thị)'), rawValue: trayInfoInstruction }
      ];
      
      const row3 = [
        { label: this.biLabel('樹脂', 'Loại nhựa'), rawValue: plasticType }
      ];
      
      const row4 = [
        { label: this.biLabel('初回出荷日', 'Ngày xuất hàng ĐT'), rawValue: firstShipment }
      ];
      
      const row5 = [
        { label: this.biLabel('金型寸法', 'Kích thước khuôn'), rawValue: moldDimBadge },
        { label: this.biLabel('重量', 'Khối lượng khuôn'), rawValue: weightText },
        { label: this.biLabel('枚数', 'Số mảnh khuôn'), rawValue: pieceCount }
      ];
      
      const row6 = [
        { label: this.biLabel('製品寸法', 'Kính thước SP'), rawValue: prodDimBadge },
        { label: this.biLabel('製品重量', 'Khối lượng SP'), rawValue: trayWeight }
      ];

      const renderGrid = (arr, cols) => {
         let html = `<div class="ov-row ov-cols-${cols}">`;
         for (const f of arr) {
           const itemDir = cols === 1 ? 'row' : 'column';
           const align = cols === 1 ? 'align-items: baseline; justify-content: space-between;' : 'align-items: flex-start; justify-content: flex-start; gap: 4px;';
           const labelMargin = cols === 1 ? 'margin-bottom: 0;' : 'margin-bottom: 4px;';
           
           html += `
             <div class="ov-item" style="display: flex !important; flex-direction: ${itemDir} !important; ${align} padding: 10px 14px; background: rgba(248, 250, 252, 0.6); border: 1px solid rgba(15, 23, 42, 0.06); border-radius: 12px;">
               <div class="info-label" style="border: none !important; padding: 0 !important; width: ${cols===1 ? '40%' : '100%'} !important; flex: none !important; ${labelMargin} !important; font-size: 11px !important;">${f.label}</div>
               <div class="info-value" style="width: ${cols===1 ? '60%' : '100%'} !important; text-align: ${cols===1 ? 'right' : 'left'} !important; word-break: break-word !important; padding: 0 !important; border: none !important; font-size: 14px !important;">${f.rawValue ?? '-'}</div>
             </div>
           `;
         }
         html += `</div>`;
         return html;
      };

      return `
        <style>
          .ov-row { display: grid; gap: 12px; margin-bottom: 12px; }
          .ov-cols-1 { grid-template-columns: 1fr; }
          .ov-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .ov-cols-3 { grid-template-columns: repeat(3, 1fr); }
          @media (max-width: 640px) {
             .ov-row { grid-template-columns: 1fr !important; }
             .ov-item { flex-direction: column !important; align-items: flex-start !important; }
             .ov-item .info-label { width: 100% !important; margin-bottom: 4px !important; border-bottom: 1px dashed rgba(15,23,42,0.06) !important; padding-bottom: 4px !important; }
             .ov-item .info-value { width: 100% !important; text-align: left !important; }
          }
          .dp-overview-rows {
             display: flex;
             flex-direction: column;
          }
        </style>
        <div class="modal-section">
          <div class="section-header color-rose">
            <i class="fas fa-clipboard-list"></i>
            <span>概要 / Tổng quan</span>
          </div>
          <div class="dp-overview-rows">
            ${renderGrid(row1, 3)}
            ${renderGrid(row2, 1)}
            ${renderGrid(row3, 1)}
            ${renderGrid(row4, 1)}
            ${renderGrid(row5, 3)}
            ${renderGrid(row6, 2)}
          </div>
        </div>
      `;
    }"""

full_text = text[:match.start()] + new_logic + text[match.end():]
with open('detail-panel-v8.6.8.js', 'w', encoding='utf-8') as f:
    f.write(full_text)

print("Custom Inline Grid Replace Successful!")
