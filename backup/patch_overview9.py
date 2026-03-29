import sys
import re

js_file_old = 'detail-panel-v8.6.9.js'
js_file_new = 'detail-panel-v8.6.10.js'

with open(js_file_old, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Bỏ dp-dash2-header của Mold, đưa vào dp-d2-col 1
pattern_mold_centric = re.compile(r'(renderInfoTabDesktopMoldCentric\(\) \{.*?return `\s*<div class="dp-dash2-layout">)\s*<div class="dp-dash2-header">.*?</div>\s*(<div class="dp-dash2-masonry">\s*<!-- Cột 1: Ảnh \+ Liên kết -->\s*<div class="dp-d2-col">)', re.DOTALL)
match_mold = pattern_mold_centric.search(text)
if match_mold:
    part1 = match_mold.group(1)
    part2 = match_mold.group(2)
    new_header_mold = r"""
                   <div style="display:flex; flex-direction:column; gap:4px; margin-bottom: 12px; padding: 0 4px;">
                       <div style="font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.1;">${this.safeText(mold.MoldCode || mold.MoldID || '-')}</div>
                       <div style="font-size: 13px; font-weight: 600; color: #64748b; line-height: 1.2;">
                         <span style="color: #94a3b8;">#${this.safeText(mold.MoldID)}</span>
                         <span style="margin:0 6px;">・</span><span>${this.safeText(mold.MoldName)}</span>
                       </div>
                       <div>
                         <span class="dp-d2-badge" style="display:inline-block; margin-top:4px;">${this.safeText(mold.MoldReturning ? 'Trả khuôn' : (mold.MoldDisposing ? 'Hủy' : 'Bình thường'))}</span>
                       </div>
                   </div>
"""
    text = text[:match_mold.start()] + part1 + "\n           " + part2 + new_header_mold + text[match_mold.end():]


# 2. Bỏ dp-dash2-header của Cutter, đưa vào dp-d2-col 1
pattern_cutter_centric = re.compile(r'(renderInfoTabDesktopCutterCentric\(\) \{.*?return `\s*<div class="dp-dash2-layout">)\s*<div class="dp-dash2-header">.*?</div>\s*(<div class="dp-dash2-masonry">\s*<!-- Cột 1: Ảnh \+ Liên kết -->\s*<div class="dp-d2-col">)', re.DOTALL)
match_cutter = pattern_cutter_centric.search(text)
if match_cutter:
    part1 = match_cutter.group(1)
    part2 = match_cutter.group(2)
    new_header_cutter = r"""
                   <div style="display:flex; flex-direction:column; gap:4px; margin-bottom: 12px; padding: 0 4px;">
                       <div style="font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.1;">${this.safeText(cutter.CutterNo || cutter.CutterCode || cutter.CutterID || '-')}</div>
                       <div style="font-size: 13px; font-weight: 600; color: #64748b; line-height: 1.2;">
                         <span style="color: #94a3b8;">#${this.safeText(cutter.CutterID)}</span>
                         <span style="margin:0 6px;">・</span><span>${this.safeText(cutter.CutterName || cutter.CutterDesignName)}</span>
                       </div>
                       <div>
                         <span class="dp-d2-badge" style="display:inline-block; margin-top:4px;">${this.safeText(cutter.Returning ? 'Đã trả' : (cutter.Disposing ? 'Hủy' : 'Bình thường'))}</span>
                       </div>
                   </div>
"""
    text = text[:match_cutter.start()] + part1 + "\n           " + part2 + new_header_cutter + text[match_cutter.end():]


# 3. Tối ưu renderOverviewSection (Xoá Mã, Tên to có badge cho Cutter)
pattern_overview = re.compile(r'(// --- NEW LOGIC FOR FIELDS ---.*?const row1 = \[).*?(\];\s*const row2)', re.DOTALL)
match_ov = pattern_overview.search(text)
if match_ov:
    part1 = match_ov.group(1)
    part2 = match_ov.group(2)
    
    new_row1 = r"""
        { 
          label: this.biLabel('名称', 'Tên'), 
          rawValue: isMold 
            ? `<span style="font-size: 16px; font-weight: 700; color:#0f172a;">${this.safeText(item.MoldName)}</span>`
            : `<span class="dp-badge-cutter-no" style="display:inline-block; padding:2px 8px; font-size:14px; border-radius:6px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${this.safeText(item.CutterNo || item.CutterCode)}</span> <span style="font-size: 16px; font-weight: 800; color:#0f172a; margin-left:6px;">${this.safeText(item.CutterName)}</span>`
        },
        { label: this.biLabel('タイプ', 'Kiểu'), rawValue: itemType }
    """
    text = text[:match_ov.start()] + part1 + new_row1 + part2 + text[match_ov.end():]

# Sửa renderGrid(row1, 3) thành renderGrid(row1, 2)
text = text.replace('${renderGrid(row1, 3)}', '${renderGrid(row1, 2)}')

# 4. Thêm CutterType badge trong renderRelatedRow
pattern_typebadge = re.compile(r'(const typeCls = isMold \? \'dp-type-chip dp-type-chip--mold\' : \'dp-type-chip dp-type-chip--cutter\';)')
match_tb = pattern_typebadge.search(text)
if match_tb:
    part1 = match_tb.group(1)
    new_badge_code = r"""
      let cutterTypeBadge = '';
      if (!isMold && row?.CutterType) {
          cutterTypeBadge = `<span class="dp-badge-dim" style="background:#e0e7ff; color:#1e40af; border-color:#bfdbfe; font-size:10px; margin-left:4px; padding:1px 4px;">${this.escapeHtml(row.CutterType)}</span>`;
      }
"""
    text = text[:match_tb.start()] + part1 + "\n" + new_badge_code + text[match_tb.end():]

# Chèn cutterTypeBadge vào dòng 1
pattern_line1 = re.compile(r'(<span class="dp-related-code">\$\{this\.escapeHtml\(String\(codeText \|\| \'---\'\)\)\}</span>)')
match_l1 = pattern_line1.search(text)
if match_l1:
    part1 = match_l1.group(1)
    text = text[:match_l1.start()] + part1 + "${cutterTypeBadge}" + text[match_l1.end():]


with open(js_file_new, 'w', encoding='utf-8') as f:
    f.write(text)

for html_file in ['index.html', 'index-v8.5.51.html']:
    with open(html_file, 'r', encoding='utf-8') as f:
        html_data = f.read()
    html_data = html_data.replace('detail-panel-v8.6.9.js', 'detail-panel-v8.6.10.js')
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_data)

print(f"Generated {js_file_new} with Top Hero stripped and Row1 updated.")
