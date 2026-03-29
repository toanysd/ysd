import sys
import re
import os

js_file_old = 'detail-panel-v8.6.8.js'
js_file_new = 'detail-panel-v8.6.9.js'

with open(js_file_old, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update renderOverviewSection fields, gap, label widths
pattern_overview = re.compile(r'(// --- NEW LOGIC FOR FIELDS ---.*?return `\s*<style>.*?</style>)', re.DOTALL)
match_ov = pattern_overview.search(text)
if not match_ov:
    print("Could not find overview section!")
    sys.exit(1)

new_overview = r"""// --- NEW LOGIC FOR FIELDS ---
      const moldDimBadge = dimensions !== '-' && dimensions !== '' ? `<span class="dp-badge-dim mold-dim">${dimensions}</span>` : '-';
      const prodDimBadge = trayDim !== '-' && trayDim !== '' ? `<span class="dp-badge-dim prod-dim">${trayDim}</span>` : '-';

      // Pick Cost field
      const costRaw = this.pick(item, ['Cost', 'OriginalCost', 'Price', 'UnitPrice', 'NguyenGia', 'CostPrice']) || this.pick(job, ['Cost', 'Price']);
      const costBadge = costRaw ? `<span style="font-weight:600; color:#b91c1c;">${this.safeText(costRaw)}</span>` : '-';

      const row1 = [
        { label: this.biLabel(isMold ? '金型コード' : '抜型コード', isMold ? 'Mã Khuôn' : 'Mã Dao cắt'), rawValue: isMold ? this.safeText(item.MoldCode) : this.safeText(item.CutterNo || item.CutterCode) },
        { label: this.biLabel('名称', 'Tên'), rawValue: isMold ? this.safeText(item.MoldName) : this.safeText(item.CutterName) },
        { label: this.biLabel('タイプ', 'Kiểu'), rawValue: itemType }
      ];
      
      const row2 = [
        { label: this.biLabel('トレイ情報(指示書)', 'Thông tin khay (từ chỉ thị)'), rawValue: trayInfoInstruction }
      ];
      
      const row3 = [
        { label: this.biLabel('樹脂', 'Loại nhựa'), rawValue: plasticType }
      ];
      
      const row4 = [
        { label: this.biLabel('初回出荷日', 'Ngày xuất hàng ĐT'), rawValue: firstShipment },
        { label: this.biLabel('原価', 'Nguyên giá'), rawValue: costBadge }
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
           const rawLbl = String(f.label || '');
           let processedLabel = rawLbl;
           if (rawLbl.includes('|||')) {
              const parts = rawLbl.split('|||');
              processedLabel = `<div style="display:flex; flex-direction:column; line-height:1.3; gap:2px;">
                 <span style="font-weight: 700; color: #475569; font-size: 11.5px;">${parts[0]}</span>
                 <span style="font-size: 10px; color: #94a3b8; font-weight: normal;">${parts[1]}</span>
              </div>`;
           }
           
           html += `
             <div class="ov-item" style="display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; padding: 6px 10px; background: rgba(248, 250, 252, 0.6); border: 1px solid rgba(15, 23, 42, 0.06); border-radius: 12px; gap: 8px;">
               <div class="info-label" style="border: none !important; padding: 0 !important; flex: 0 1 auto !important; margin-bottom: 0 !important; margin-right: 8px !important;">${processedLabel}</div>
               <div class="info-value" style="flex: 1 1 auto !important; text-align: right !important; word-break: break-word !important; padding: 0 !important; border: none !important; font-size: 13.5px !important; font-weight: 500 !important; color: #0f172a !important;">${f.rawValue ?? '-'}</div>
             </div>
           `;
         }
         html += `</div>`;
         return html;
      };

      return `
        <style>
          .ov-row { display: grid; gap: 8px; margin-bottom: 8px; }
          .ov-cols-1 { grid-template-columns: 1fr; }
          .ov-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .ov-cols-3 { grid-template-columns: repeat(3, 1fr); }
          @media (max-width: 800px) {
             .ov-row { grid-template-columns: 1fr !important; }
             .ov-item { flex-direction: column !important; align-items: flex-start !important; }
             .ov-item .info-label { width: 100% !important; margin-bottom: 6px !important; border-bottom: 1px dashed rgba(15,23,42,0.06) !important; padding-bottom: 6px !important; }
             .ov-item .info-value { width: 100% !important; text-align: left !important; }
          }
          .dp-overview-rows {
             display: flex;
             flex-direction: column;
          }
        </style>"""

text = text[:match_ov.start()] + new_overview + text[match_ov.end():]

# 2. Update renderDesktopMiniSnapshots to use stack label
pattern_snap = re.compile(r'(renderDesktopMiniSnapshots\([^\)]+\)\s*\{.*?return `\s*<div class="modal-section">.*?)(<div class="info-grid-2col dp-kv-compact dp-kv-1col">.*?)(<div class="dp-actions-grid")([^\}]+})', re.DOTALL)
match_snap = pattern_snap.search(text)

if match_snap:
    part1, old_grid, part3, part4 = match_snap.groups()
    new_grid = r"""<div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
            ${ [ 
               {lbl: this.biLabel('最新ステータス', 'Trạng thái mới nhất'), val: this.safeText(lastStatus?.Status)},
               {lbl: this.biLabel('ステータス日時', 'Thời gian trạng thái'), val: this.safeText(this.formatDate(lastStatus?.Timestamp))},
               {lbl: this.biLabel('テフロン', 'Teflon'), val: this.safeText(teflonStatus)},
               {lbl: this.biLabel('テフロン日時', 'Thời gian Teflon'), val: this.safeText(this.formatDate(teflonDate))}
              ].map(f => {
                 let processedLabel = f.lbl;
                 if (processedLabel.includes('|||')) {
                    const parts = processedLabel.split('|||');
                    processedLabel = `<div style="display:flex; flex-direction:column; line-height:1.3; gap:2px;">
                       <span style="font-weight: 700; color: #475569; font-size: 11px;">${parts[0]}</span>
                       <span style="font-size: 10px; color: #94a3b8; font-weight: normal;">${parts[1]}</span>
                    </div>`;
                 }
                 return `
                 <div class="ov-item" style="display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; padding: 6px 10px; background: rgba(248, 250, 252, 0.6); border: 1px solid rgba(15, 23, 42, 0.06); border-radius: 12px; gap: 8px;">
                   <div style="flex: 0 1 auto; margin-right: 8px;">${processedLabel}</div>
                   <div style="flex: 1 1 auto; text-align: right; font-size: 13.5px; font-weight: 600; color: #0f172a;">${f.val || '-'}</div>
                 </div>`;
              }).join('') 
            }
          </div>
          """
    text = text[:match_snap.start()] + part1 + new_grid + part3 + part4 + text[match_snap.end():]

# 2.5 Ensure renderDesktopMiniSnapshotsCutter matches renderDesktopMiniSnapshots
# It'll just call renderDesktopMiniSnapshots internally or replicate it if cutter doesn't work.
# Wait, actually let's just insert renderDesktopMiniSnapshotsCutter right after renderDesktopMiniSnapshots.
append_cutter = r"""
    renderDesktopMiniSnapshotsCutter(cutter) {
       return this.renderDesktopMiniSnapshots(cutter);
    }
"""
text = text.replace('renderDesktopMiniSnapshots(mold) {', append_cutter + '    renderDesktopMiniSnapshots(mold) {')

# 3. Add SeparateCutter rule to renderRelatedRow
pattern_related = re.compile(r'(const kindBadge = kind \? this\.renderLinkKindBadge\(kind\) \: \'\';)')
match_related = pattern_related.search(text)
if match_related:
    new_related = match_related.group(1) + r"""
      let separateBadge = '';
      if ('SeparateCutter' in row || 'Separate' in row || 'Betsunuki' in row || 'separate' in row || 'separateCutter' in row) {
         const sepVal = String(row.SeparateCutter || row.Separate || row.Betsunuki || row.separate || row.separateCutter || '').toUpperCase();
         if (sepVal === 'YES' || sepVal === '1' || sepVal === 'CÓ' || sepVal === 'TRUE') {
             separateBadge = `<span style="background:#fee2e2; color:#dc2626; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; border:1px solid #fca5a5; margin-left: 6px; white-space:nowrap;">別抜き YES</span>`;
         } else if (sepVal === 'NO' || sepVal === '0' || sepVal === 'KHÔNG' || sepVal === 'FALSE') {
             separateBadge = `<span style="background:#f1f5f9; color:#64748b; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; border:1px solid #cbd5e1; margin-left: 6px; white-space:nowrap;">別抜き NO</span>`;
         } else {
             separateBadge = `<span style="background:#fef3c7; color:#d97706; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; border:1px solid #fcd34d; margin-left: 6px; white-space:nowrap;">別抜き ${this.escapeHtml(sepVal)}</span>`;
         }
      }
"""
    # Put separateBadge inside line1 HTML
    text = text[:match_related.start()] + new_related + text[match_related.end():]
    text = text.replace('${kindBadge}', '${kindBadge} ${separateBadge}')


# Write to new file
with open(js_file_new, 'w', encoding='utf-8') as f:
    f.write(text)

# 4. Update index.html and index-v8.5.51.html
for html_file in ['index.html', 'index-v8.5.51.html']:
    with open(html_file, 'r', encoding='utf-8') as f:
        html_data = f.read()
    html_data = html_data.replace('detail-panel-v8.6.8.js', 'detail-panel-v8.6.9.js')
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_data)

print(f"Generated {js_file_new} and updated html files successfully!")
