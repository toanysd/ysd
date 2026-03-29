import re
import sys

with open('detail-panel-v8.6.8.js', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'// --- NEW LOGIC FOR FIELDS ---.*?return `\s*<div class="modal-section">.*?</div>\s*`;\s*\}', re.DOTALL)
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
         return (typeof this.renderInfoGrid === 'function') 
            ? this.renderInfoGrid(arr, `dp-info-grid-modern dp-kv-maininfo overview-grid-${cols}`)
            : '';
      };

      return `
        <style>
          .overview-grid-1 { grid-template-columns: 1fr !important; }
          .overview-grid-2 { grid-template-columns: repeat(2, 1fr) !important; }
          .overview-grid-3 { grid-template-columns: repeat(3, 1fr) !important; }
          @media (max-width: 640px) {
             .overview-grid-1, .overview-grid-2, .overview-grid-3 {
                 display: flex !important;
                 flex-direction: column !important;
             }
          }
          .dp-overview-rows {
             display: flex;
             flex-direction: column;
             gap: 12px;
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

print("Regex replace successful!")
