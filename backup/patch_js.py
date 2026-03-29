import re

with open('g:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.6.js', 'r', encoding='utf-8') as f:
    text = f.read()

overview_code = """
    renderOverviewSection(item, type) {
      if (!item) return '';
      const isMold = (type === 'mold');
      const e = (v) => this.escapeHtml(v);
      const safeText = (v) => (!v || String(v).trim() === '') ? '-' : String(v).trim();
      
      const design = typeof this.getMoldDesignInfoSafe === 'function' ? this.getMoldDesignInfoSafe(item, type) : null;
      const job = typeof this.getJobInfoSafe === 'function' ? this.getJobInfoSafe(item, type) : null;
      
      // 1. Tên khuôn/Dao cắt
      const nameCode = isMold 
        ? safeText(item.MoldCode || item.MoldID) 
        : safeText(item.CutterNo || item.CutterCode || item.CutterID);
        
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
        
      // 6. Ngày sản xuất
      const productionDate = isMold
        ? safeText(item.ProductionDate || job?.DeliveryDeadline || item.displayDate)
        : safeText(item.CutterManufactureDate || item.CutterEntry);
        
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
      
      // 11. Số pocket
      const pockets = safeText(design?.Pockets || design?.PocketCount || design?.CavityCount || design?.PocketNumbers || job?.Pockets || job?.PocketCount || item.PocketCount);
      
      // 12. Khối lượng khay
      const trayWeight = safeText(
        item.trayInfo?.TrayWeight || item.trayInfo?.ActualTrayWeight || 
        design?.TrayWeight || design?.ProductWeight || 
        job?.TrayWeight || job?.ProductWeight
      );
      
      // 13. Ngày xuất hàng đầu tiên
      const firstShipment = safeText(job?.FirstShipmentDate || job?.FirstExport || item.FirstShipmentDate);

      const fields = [
        { label: this.biLabel('金型コード/抜型', 'Tên khuôn/Dao cắt'), rawValue: nameCode },
        { label: this.biLabel('寸法', 'Kích thước'), rawValue: dimensions },
        { label: this.biLabel('重量', 'Khối lượng'), rawValue: weightText },
        { label: this.biLabel('タイプ', 'Kiểu khuôn/Dao'), rawValue: itemType },
        { label: this.biLabel('枚数', 'Số mảnh'), rawValue: pieceCount },
        { label: this.biLabel('製造日', 'Ngày sản xuất'), rawValue: productionDate },
        { label: this.biLabel('トレイ名称(客先)', 'Thông tin khay theo KH'), rawValue: trayNameCustomer, full: true },
        { label: this.biLabel('トレイ情報(指示書)', 'Thông tin khay (từ chỉ thị)'), rawValue: trayInfoInstruction, full: true },
        { label: this.biLabel('樹脂', 'Loại nhựa'), rawValue: plasticType },
        { label: this.biLabel('トレイ寸法', 'Kích thước khay'), rawValue: trayDim, full: true },
        { label: this.biLabel('ポケット数', 'Số pocket'), rawValue: pockets },
        { label: this.biLabel('トレイ重量', 'Khối lượng (khay)'), rawValue: trayWeight },
        { label: this.biLabel('初回出荷日', 'Ngày xuất hàng ĐT'), rawValue: firstShipment }
      ];

      return `
        <div class="modal-section">
          <div class="section-header color-rose">
            <i class="fas fa-clipboard-list"></i>
            <span>概要 / Tổng quan</span>
          </div>
          ${(typeof this.renderInfoGrid === 'function' ? this.renderInfoGrid(fields, "dp-info-grid-modern cols-4 dp-kv-maininfo") : '')}
        </div>
      `;
    }
"""

if "renderOverviewSection(" not in text:
    text = text.replace("renderBasicInfoSection(item, type) {", overview_code + "\n    renderBasicInfoSection(item, type) {")

mold_old = """               <!-- Cột 1: Ảnh + Kỹ thuật -->
               <div class="dp-d2-col">
                   <div class="dp-d2-card pt-0">
                      <div class="dp-d2-card-body">
                         ${this.renderDesktopPhotoPreview(mold)}
                      </div>
                   </div>
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-ruler-combined"></i> 技術・製品 (Kỹ thuật & Sản phẩm)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderTechnicalInfoSection(mold, 'mold')}
                         ${this.renderProductInfoSection(mold, 'mold')}
                      </div>
                   </div>
               </div>

               <!-- Cột 2: Thông tin chung + Lưu trữ -->
               <div class="dp-d2-col">
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-map-marker-alt"></i> 保管・ステータス (Lưu trữ & Trạng thái)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderLocationSection(mold, 'mold')}
                         ${this.renderStatusNotesSection(mold, 'mold')}
                      </div>
                   </div>
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-info-circle"></i> 基本情報 (Thông tin chung)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderBasicInfoSection(mold, 'mold')}
                      </div>
                   </div>
               </div>"""

mold_new = """               <!-- Cột 1: Ảnh + Liên kết -->
               <div class="dp-d2-col">
                   <div class="dp-d2-card pt-0">
                      <div class="dp-d2-card-body">
                         ${this.renderDesktopPhotoPreview(mold)}
                      </div>
                   </div>
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-link"></i> 関連デバイス (Thiết bị liên kết)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderDesktopMiniRelated(mold, 'mold')}
                      </div>
                   </div>
               </div>

               <!-- Cột 2: Lưu trữ + Tổng quan -->
               <div class="dp-d2-col">
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-map-marker-alt"></i> 保管・ステータス (Lưu trữ & Trạng thái)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderLocationSection(mold, 'mold')}
                         ${this.renderStatusNotesSection(mold, 'mold')}
                      </div>
                   </div>
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-clipboard-list"></i> 概要 (Tổng quan)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderOverviewSection(mold, 'mold')}
                      </div>
                   </div>
               </div>"""

text = text.replace(mold_old, mold_new)

cutter_old = """               <!-- Cột 1: Ảnh + Kỹ thuật -->
               <div class="dp-d2-col">
                   <div class="dp-d2-card pt-0">
                      <div class="dp-d2-card-body">
                         ${this.renderDesktopPhotoPreview(cutter)}
                      </div>
                   </div>
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-ruler-combined"></i> 技術・製品 (Kỹ thuật & Sản phẩm)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderTechnicalInfoSection(cutter, 'cutter')}
                         ${this.renderProductInfoSection(cutter, 'cutter')}
                         ${this.renderDesktopMiniRelated(cutter, 'cutter')}
                      </div>
                   </div>
               </div>

               <!-- Cột 2: Thông tin chung + Lưu trữ -->
               <div class="dp-d2-col">
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-map-marker-alt"></i> 保管・ステータス (Lưu trữ & Trạng thái)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderLocationSection(cutter, 'cutter')}
                         ${this.renderStatusNotesSection(cutter, 'cutter')}
                      </div>
                   </div>
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-info-circle"></i> 基本情報 (Thông tin chung)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderBasicInfoSection(cutter, 'cutter')}
                      </div>
                   </div>
               </div>"""

cutter_new = """               <!-- Cột 1: Ảnh + Liên kết -->
               <div class="dp-d2-col">
                   <div class="dp-d2-card pt-0">
                      <div class="dp-d2-card-body">
                         ${this.renderDesktopPhotoPreview(cutter)}
                      </div>
                   </div>
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-link"></i> 関連デバイス (Thiết bị liên kết)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderDesktopMiniRelated(cutter, 'cutter')}
                      </div>
                   </div>
               </div>

               <!-- Cột 2: Lưu trữ + Tổng quan -->
               <div class="dp-d2-col">
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-map-marker-alt"></i> 保管・ステータス (Lưu trữ & Trạng thái)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderLocationSection(cutter, 'cutter')}
                         ${this.renderStatusNotesSection(cutter, 'cutter')}
                      </div>
                   </div>
                   <div class="dp-d2-card">
                      <div class="dp-d2-card-head"><i class="fas fa-clipboard-list"></i> 概要 (Tổng quan)</div>
                      <div class="dp-d2-card-body">
                         ${this.renderOverviewSection(cutter, 'cutter')}
                      </div>
                   </div>
               </div>"""

text = text.replace(cutter_old, cutter_new)

mobile_old = """      html += this.renderLocationSection(this.currentItem, this.currentItemType);
      html += this.renderBasicInfoSection(this.currentItem, this.currentItemType);
      html += this.renderProductInfoSection(this.currentItem, this.currentItemType);
      html += this.renderTechnicalInfoSection(this.currentItem, this.currentItemType);
      html += this.renderStatusNotesSection(this.currentItem, this.currentItemType);
      html += this.renderAdditionalDataSection(this.currentItem, this.currentItemType);"""

mobile_new = """      html += this.renderLocationSection(this.currentItem, this.currentItemType);
      html += this.renderOverviewSection(this.currentItem, this.currentItemType);
      html += this.renderStatusNotesSection(this.currentItem, this.currentItemType);
      html += this.renderAdditionalDataSection(this.currentItem, this.currentItemType);"""

text = text.replace(mobile_old, mobile_new)

with open('g:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.6.js', 'w', encoding='utf-8') as f:
    f.write(text)
