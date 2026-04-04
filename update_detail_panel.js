const fs = require('fs');
let content = fs.readFileSync('g:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.16.js', 'utf8');

content = content.replace(
  '<button class=\"detail-tab\" data-tab=\"status\" type=\"button\">\r\n            <i class=\"fas fa-clipboard-check\"></i>\r\n            <span class=\"tab-label-ja\">状態</span>\r\n            <span class=\"tab-label-vi\">Tình trạng</span>\r\n          </button>',
  '<button class=\"detail-tab\" data-tab=\"devices\" type=\"button\">\r\n            <i class=\"fas fa-link\"></i>\r\n            <span class=\"tab-label-ja\">関連デバイス</span>\r\n            <span class=\"tab-label-vi\">Thiết bị</span>\r\n          </button>'
);

content = content.replace('<div class=\"detail-tab-content\" data-tab-content=\"status\"></div>', '<div class=\"detail-tab-content\" data-tab-content=\"devices\"></div>');

content = content.replace("case 'status': html = this.renderStatusTab(); break;", "case 'devices': html = this.renderDevicesTab(); break;");

content = content.replace(
  ">\r\n      let html = '';\r\n      html += this.renderLocationSection(this.currentItem, this.currentItemType);\r\n      html += this.renderOverviewSection(this.currentItem, this.currentItemType);\r\n      html += this.renderStatusNotesSection",
  ">\r\n      let html = '';\r\n      html += this.renderLocationSection(this.currentItem, this.currentItemType);\r\n      html += this.renderOverviewSection(this.currentItem, this.currentItemType);\r\n      html += this.renderMobileRelatedSection(this.currentItem, this.currentItemType);\r\n      html += this.renderStatusNotesSection"
);

// Fallback for the above replace since it depends on exact spaces
content = content.replace(
  'html += this.renderOverviewSection(this.currentItem, this.currentItemType);\r\n      html += this.renderStatusNotesSection(this.currentItem, this.currentItemType);',
  'html += this.renderOverviewSection(this.currentItem, this.currentItemType);\r\n      html += this.renderMobileRelatedSection(this.currentItem, this.currentItemType);\r\n      html += this.renderStatusNotesSection(this.currentItem, this.currentItemType);'
);

content = content.replace(
  "if (target === 'teflon') { tab = 'teflon'; }",
  "if (target === 'teflon') { tab = 'teflon'; }\r\n          else if (target === 'devices') { tab = 'devices'; }"
);

content = content.replace(
  "if (key === 'teflon') { this.switchTab('teflon'); return; }",
  "if (key === 'teflon') { this.switchTab('teflon'); return; }\r\n      if (key === 'devices') { this.switchTab('devices'); return; }"
);

const newMethods = `
    renderDevicesTab() {
      return \`<div class="dp-tab-pane active" style="padding-bottom: 2rem;">
        <div class="dp-d2-card" style="margin-top: 1rem;">
           <div class="dp-d2-card-body">
             \${this.renderDesktopMiniRelated(this.currentItem, this.currentItemType)}
           </div>
        </div>
      </div>\`;
    }

    renderMobileRelatedSection(item, type) {
      if (this.isDesktopWide()) return '';

      try {
        const t = String(type || '').toLowerCase();
        let list = [];
        let title = '';
        let rowItemType = '';

        if (t === 'mold') {
          title = 'Dao cắt liên quan';
          rowItemType = 'cutter';
          list = this.getRelatedCuttersForMold(item) || [];
        } else {
          title = 'Khuôn liên quan';
          rowItemType = 'mold';
          list = this.getSharedMoldsForCutter(item) || [];
        }

        const total = Array.isArray(list) ? list.length : 0;
        if (!total) return '';
        
        const displayList = list.slice(0, 3);
        const remaining = total - 3;

        let html = '';
        html += \`
          <div class="modal-section dp-related-section">
            <div class="section-header color-indigo">
              <i class="fas fa-link"></i>
              <span>\${this.escapeHtml(title)} (\${total})</span>
            </div>
            <div class="dp-related-list" style="padding-top:8px;">
        \`;

        for (const r of displayList) {
          html += this.renderRelatedRow(r, rowItemType);
        }
        
        if (remaining > 0) {
          html += \`
            <button class="btn-load-more dp-action-btn" type="button" data-jump="devices" style="width:100%; border-radius:8px; display:block; padding:8px; text-align:center; background:#f1f5f9; color:#475569; font-weight:600; font-size:13px; margin-top:8px; border:1px solid #e2e8f0; cursor:pointer;">
              <i class="fas fa-chevron-right" style="margin-right:4px;"></i> Xem tất cả \${total} thiết bị
            </button>
          \`;
        }
        
        html += \`</div></div>\`;
        return html;
      } catch (e) {
        return '';
      }
    }

    renderDesktopMiniRelated(item, type) {`;

content = content.replace('    renderDesktopMiniRelated(item, type) {', newMethods);

fs.writeFileSync('g:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.16.js', content, 'utf8');
console.log('Update Complete!');
