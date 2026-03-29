import sys

def patch_js():
    with open('detail-panel-v8.6.8.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    start_idx = -1
    fields_start_idx = -1
    fields_end_idx = -1
    for i, line in enumerate(lines):
        if '// 1. Tên khuôn/Dao cắt' in line:
            start_idx = i
        if 'const fields = [' in line:
            fields_start_idx = i
        if fields_start_idx != -1 and '];' in line and fields_end_idx == -1:
            fields_end_idx = i
            
    if start_idx == -1 or fields_start_idx == -1 or fields_end_idx == -1:
        print("Failed to find indexes")
        return
        
    dim_idx = -1
    for i in range(start_idx, fields_start_idx):
        if '// 2. Kích thước' in lines[i]:
            dim_idx = i
            break
            
    if dim_idx == -1:
        print("Failed to find dim_idx")
        return
        
    new_name_code = """      // 1. ID khuôn/dao cắt
      const itemID = isMold ? safeText(item.MoldID || item.MoldCode) : safeText(item.CutterID);
      
      // 1b. Tên khuôn/Dao cắt
      let nameCode = '';
      if (isMold) {
        nameCode = safeText(item.MoldCode || item.MoldName);
      } else {
        const cNo = safeText(item.CutterNo || item.CutterCode);
        const cName = safeText(item.CutterName);
        if (cNo !== '-' && cNo !== '') {
          nameCode = `<span class="dp-badge-cutter-no">${cNo}</span> ${cName}`;
        } else {
          nameCode = cName;
        }
      }
"""
    new_fields = """      const moldDimBadge = dimensions !== '-' && dimensions !== '' ? `<span class="dp-badge-dim mold-dim">${dimensions}</span>` : '-';
      const prodDimBadge = trayDim !== '-' && trayDim !== '' ? `<span class="dp-badge-dim prod-dim">${trayDim}</span>` : '-';

      const fields = [
        // 1. ID, Tên, Kiểu
        { label: this.biLabel(isMold ? '金型ID' : '抜型ID', isMold ? 'ID Khuôn' : 'ID Dao cắt'), rawValue: itemID },
        { label: this.biLabel('名称', 'Tên khuôn/Dao cắt'), rawValue: nameCode },
        { label: this.biLabel('タイプ', 'Kiểu khuôn/Dao'), rawValue: itemType },
        
        // 2. Thông tin khay từ chỉ thị
        { label: this.biLabel('トレイ情報(指示書)', 'Thông tin khay (từ chỉ thị)'), rawValue: trayInfoInstruction, full: true },
        
        // 3. Loại nhựa
        { label: this.biLabel('樹脂', 'Loại nhựa'), rawValue: plasticType },
        
        // 4. Ngày xuất hàng đầu tiên
        { label: this.biLabel('初回出荷日', 'Ngày xuất hàng ĐT'), rawValue: firstShipment },
        
        // 5. Kích thước khuôn (badge), Khối lượng khuôn, số mảnh khuôn
        { label: this.biLabel('金型寸法', 'Kích thước khuôn'), rawValue: moldDimBadge },
        { label: this.biLabel('金型重量', 'Khối lượng khuôn'), rawValue: weightText },
        { label: this.biLabel('枚数', 'Số mảnh khuôn'), rawValue: pieceCount },
        
        // 6. Kích thước sản phẩm (badge), khối lượng sản phẩm
        { label: this.biLabel('製品寸法', 'Kính thước SP'), rawValue: prodDimBadge },
        { label: this.biLabel('製品重量', 'Khối lượng SP'), rawValue: trayWeight }
      ];
"""
    
    final_lines = lines[:start_idx] + [new_name_code] + lines[dim_idx:fields_start_idx] + [new_fields] + lines[fields_end_idx+1:]
    
    with open('detail-panel-v8.6.8.js', 'w', encoding='utf-8') as f:
        f.writelines(final_lines)
    print("Patched JS!")

def patch_css():
    css_to_add = """
/* ============================================================================
   BADGE STYLES FOR OVERVIEW (v8.6.11)
============================================================================ */
:where(#detailPanel, .dp-preview-modal) .dp-badge-cutter-no {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  margin-right: 6px;
  vertical-align: baseline;
  box-shadow: 0 1px 2px rgba(249,115,22,0.3);
  line-height: normal;
}
:where(#detailPanel, .dp-preview-modal) .dp-badge-dim {
  display: inline-flex !important;
  align-items: center;
  padding: 3px 8px;
  font-size: 13px;
  font-weight: 800;
  border-radius: 6px;
  letter-spacing: 0.3px;
  border: 1px solid;
  line-height: normal;
  white-space: nowrap;
}
:where(#detailPanel, .dp-preview-modal) .dp-badge-dim.mold-dim {
  background: #e0f2fe;
  color: #0369a1;
  border-color: #bae6fd;
}
:where(#detailPanel, .dp-preview-modal) .dp-badge-dim.prod-dim {
  background: #ecfccb;
  color: #4d7c0f;
  border-color: #d9f99d;
}
"""
    with open('detail-panel-v8.6.11.css', 'a', encoding='utf-8') as f:
        f.write(css_to_add)
    print("Patched CSS!")

patch_js()
patch_css()
