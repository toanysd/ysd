import sys
import re

with open('detail-panel-v8.6.8.js', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to find the start and end of renderOverviewSection
start_str = "renderOverviewSection(item, type) {"
end_str = 'return `\n        <div class="modal-section">\n          <div class="section-header color-rose">\n            <i class="fas fa-clipboard-list"></i>\n            <span>概要 / Tổng quan</span>\n          </div>'

idx_start = text.find(start_str)
idx_end = text.find(end_str)

if idx_start == -1 or idx_end == -1:
    print("Could not find start or end block:")
    print("start found:", idx_start != -1)
    print("end found:", idx_end != -1)
    sys.exit(1)

new_body = """renderOverviewSection(item, type) {
      if (!item) return '';
      const isMold = (type === 'mold');
      const e = (v) => this.escapeHtml(v);
      const safeText = (v) => (!v || String(v).trim() === '') ? '-' : String(v).trim();
      
      const design = typeof this.getMoldDesignInfoSafe === 'function' ? this.getMoldDesignInfoSafe(item, type) : null;
      const job = typeof this.getJobInfoSafe === 'function' ? this.getJobInfoSafe(item, type) : null;
      
      // 1. ID khuôn/dao cắt
      const itemID = isMold ? safeText(item.MoldID || item.MoldCode) : safeText(item.CutterID);
      
      // 1b. Tên khuôn/Dao cắt
      let nameCode = '';
      if (isMold) {
        nameCode = safeText(item.MoldCode || item.MoldName);
        if (nameCode !== '-' && nameCode !== '') {
          nameCode = `<span class="dp-badge-cutter-no" style="background:var(--primary-color,#0f172a);">${nameCode}</span>`;
        }
      } else {
        const cNo = safeText(item.CutterNo || item.CutterCode);
        const cName = safeText(item.CutterName);
        if (cNo !== '-' && cNo !== '') {
          nameCode = `<span class="dp-badge-cutter-no">${cNo}</span> ${cName}`;
        } else {
          nameCode = cName;
        }
      }
      
      // 2. Kích thước
      let dimensions = '-';
      if (isMold) {
        const lRaw = item.MoldLengthModified ?? this.pick(design, ['MoldDesignLength']);
        const wRaw = item.MoldWidthModified ?? this.pick(design, ['MoldDesignWidth']);
        const hRaw = item.MoldHeightModified ?? this.pick(design, ['MoldDesignHeight']);
        dimensions = safeText(
          item.displayDimensions || item.displaySize || item.Dimensions || item.Size ||
          (typeof this.formatLWH === 'function' ? this.formatLWH(lRaw, wRaw, hRaw) : '') ||
          (design ? (typeof this.formatLWH === 'function' ? this.formatLWH(design.MoldDesignLength, design.MoldDesignWidth, design.MoldDesignHeight) : '') : '')
        );
      } else {
        const overall = item.OverallDimensions || item.CutterDim;
        const lwh = (typeof this.formatLWH === 'function' ? this.formatLWH(item.CutterLength, item.CutterWidth, item.CutterHeight) : '');
        dimensions = safeText(overall && overall !== '-' ? overall : lwh);
      }
      
      // 3. Khối lượng
      let weightText = '-';
      if (isMold) {
        const weightRaw = item.MoldWeightModified ?? item.MoldWeight ?? this.pick(design, ['MoldDesignWeight']) ?? design?.DesignWeight ?? item.Weight;
        weightText = (weightRaw == null || String(weightRaw).trim() === '') ? '-' : (String(weightRaw).toLowerCase().includes('kg') ? String(weightRaw) : `${weightRaw} kg`);
      } else {
        weightText = '-';
      }
      
      // 4. Kiểu khuôn/dao cắt
      const itemType = isMold 
        ? safeText(this.pick(design, ['MoldSetupType']) || item.MoldType) 
        : safeText(item.CutterType);
        
      // 5. Số mảnh
      const pieceCount = isMold 
        ? safeText(this.pick(design, ['PieceCount', 'PieceNumbers']) || item.PieceCount) 
        : safeText(item.BladeCount || item.Blades);
        
      // 7. Thông tin khay theo KH
      const trayNameCustomer = safeText(
        item.trayInfo?.CustomerTrayName || item.trayInfo?.TrayName || 
        job?.TrayName || job?.ProductName || job?.CustomerTrayName || job?.CustomerProductName || 
        design?.CustomerTrayName || design?.TrayName || design?.ProductName
      );
      
      // 8. Thông tin khay từ chỉ thị
      const trayInfoInstruction = safeText(
        job?.TrayInfo || job?.TrayInstruction || job?.InstructionTray || job?.TrayInfoFromInstruction || job?.NPCode || job?.NP || job?.NPNo ||
        design?.TrayInfoForMoldDesign || design?.TrayInfo
      );
      
      // 9. Loại nhựa
      const plasticType = safeText(
        design?.PlasticType || design?.Material || design?.Resin || design?.Plastic || design?.DesignForPlasticType ||
        job?.Material || job?.PlasticType ||
        item.PlasticType || item.PlasticCutType
      );
      
      // 10. Kích thước khay (sản phẩm)
      const cutX = (design?.CutlineX ?? design?.CutlineLength ?? design?.CutLength ?? design?.CutX ?? item?.CutlineLength ?? item?.CutLength ?? '').toString().trim();
      const cutY = (design?.CutlineY ?? design?.CutlineWidth ?? design?.CutWidth ?? design?.CutY ?? item?.CutlineWidth ?? item?.CutWidth ?? '').toString().trim();
      let fbCutter = null;
      if (isMold) {
        try {
          const related = item.relatedCutters || (typeof this.getRelatedCuttersForMold === 'function' ? this.getRelatedCuttersForMold(item) : []);
          if (Array.isArray(related) && related.length) fbCutter = related[0];
        } catch(e) {}
      }
      const fCutX = fbCutter ? String(fbCutter.CutlineLength ?? fbCutter.CutLength ?? fbCutter.CutlineL ?? fbCutter.CutX ?? '').trim() : '';
      const fCutY = fbCutter ? String(fbCutter.CutlineWidth ?? fbCutter.CutWidth ?? fbCutter.CutlineW ?? fbCutter.CutY ?? '').trim() : '';
      
      const depth = safeText(design?.MoldDesignDepth || design?.Depth || design?.CavityDepth || item.MoldDepth);
      const r = (design?.CornerR ?? design?.R ?? design?.CutR ?? design?.ProductR ?? fbCutter?.CutterCorner ?? fbCutter?.CornerR ?? item.CutterCorner ?? item.CornerR ?? '').toString().trim();
      const c = (design?.ChamferC ?? design?.C ?? design?.CutC ?? design?.ProductC ?? fbCutter?.CutterChamfer ?? fbCutter?.ChamferC ?? item.CutterChamfer ?? item.ChamferC ?? '').toString().trim();
      
      const baseXY = (cutX && cutY) ? `${cutX}×${cutY}` : ((fCutX && fCutY) ? `${fCutX}×${fCutY}` : '-');
      const tailRC = `${r ? ` - ${r}R` : ''}${c ? ` ${c}C` : ''}`.trim();
      const trayDim = (baseXY === '-') ? '-' : `${baseXY}${(depth === '-' ? '' : '×' + depth)}${tailRC ? ' ' + tailRC : ''}`;
      
      // 12. Khối lượng khay
      const trayWeight = safeText(
        item.trayInfo?.TrayWeight || item.trayInfo?.ActualTrayWeight || 
        design?.TrayWeight || design?.ProductWeight || 
        job?.TrayWeight || job?.ProductWeight
      );
      
      // 13. Ngày xuất hàng đầu tiên
      const firstShipment = safeText(job?.FirstShipmentDate || job?.FirstExport || item.FirstShipmentDate);

      // --- NEW LOGIC FOR FIELDS ---
      const moldDimBadge = dimensions !== '-' && dimensions !== '' ? `<span class="dp-badge-dim mold-dim">${dimensions}</span>` : '-';
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
        { label: this.biLabel('重量', 'Khối lượng khuôn'), rawValue: weightText },
        { label: this.biLabel('枚数', 'Số mảnh khuôn'), rawValue: pieceCount },
        
        // 6. Kích thước sản phẩm (badge), khối lượng sản phẩm
        { label: this.biLabel('製品寸法', 'Kính thước SP'), rawValue: prodDimBadge },
        { label: this.biLabel('製品重量', 'Khối lượng SP'), rawValue: trayWeight }
      ];

      """
      
pre_text = text[:idx_start]
post_text = text[idx_end:]

full_new_text = pre_text + new_body + post_text

with open('detail-panel-v8.6.8.js', 'w', encoding='utf-8') as f:
    f.write(full_new_text)

print("Patch applied cleanly!")
