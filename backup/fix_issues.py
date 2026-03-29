import re
import codecs

css_path = 'g:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.6.css'
js_path = 'g:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.6.js'

print("Fixing CSS...")
with codecs.open(css_path, 'r', 'utf-8') as f:
    css = f.read()

# Fix 1: Overview container flex-direction (row -> column)
css = re.sub(
    r'(\.dp-d2-card-body \.dp-info-grid-modern.*?\s*display:\s*flex\s*!important;\s*flex-direction:\s*)row(\s*!important;)',
    r'\g<1>column\g<2>',
    css, flags=re.DOTALL
)

# Fix 2: Label song ngữ dọc (row -> column)
css = re.sub(
    r'(\.dp-d2-card-body \.dp-item-stacked \.info-label \{.*?display:\s*flex\s*!important;\s*flex-direction:\s*)row(\s*!important;)',
    r'\g<1>column\g<2>',
    css, flags=re.DOTALL
)

with codecs.open(css_path, 'w', 'utf-8-sig') as f:
    f.write(css)

print("Fixing JS...")
with codecs.open(js_path, 'r', 'utf-8') as f:
    js = f.read()

# Fix 3: Standardize Quick Access buttons
quick_access_old = """                           <div class="dp-actions-grid">
                             <button class="dp-action-btn" type="button" data-jump="design" style="display:flex;flex-direction:row;align-items:center;text-align:left;gap:6px;padding:6px;"><i class="fas fa-drafting-compass"></i><div style="display:flex;flex-direction:column"><span>Design</span><span class="sub" style="font-size:9px">Thiết kế</span></div></button>
                             <button class="dp-action-btn" type="button" data-jump="customers" style="display:flex;flex-direction:row;align-items:center;text-align:left;gap:6px;padding:6px;"><i class="fas fa-building"></i><div style="display:flex;flex-direction:column"><span>Customers</span><span class="sub" style="font-size:9px">Khách hàng</span></div></button>
                             <button class="dp-action-btn" type="button" data-jump="product" style="display:flex;flex-direction:row;align-items:center;text-align:left;gap:6px;padding:6px;"><i class="fas fa-box"></i><div style="display:flex;flex-direction:column"><span>Product</span><span class="sub" style="font-size:9px">Job</span></div></button>
                             <button class="dp-action-btn" type="button" data-jump="storage" style="display:flex;flex-direction:row;align-items:center;text-align:left;gap:6px;padding:6px;"><i class="fas fa-warehouse"></i><div style="display:flex;flex-direction:column"><span>Storage</span><span class="sub" style="font-size:9px">Vị trí</span></div></button>
                             <button class="dp-action-btn" type="button" data-jump="transfer" style="display:flex;flex-direction:row;align-items:center;text-align:left;gap:6px;padding:6px;"><i class="fas fa-truck"></i><div style="display:flex;flex-direction:column"><span>Transfer</span><span class="sub" style="font-size:9px">Vận chuyển</span></div></button>
                             <button class="dp-action-btn" type="button" data-jump="extended" style="display:flex;flex-direction:row;align-items:center;text-align:left;gap:6px;padding:6px;"><i class="fas fa-arrow-right"></i><div style="display:flex;flex-direction:column"><span>Open</span><span class="sub" style="font-size:9px">Mở rộng</span></div></button>
                           </div>"""

quick_access_new = """                           <div class="dp-actions-grid">
                             <button class="dp-action-btn" type="button" data-jump="design" title="Design / Thiết kế"><i class="fas fa-drafting-compass" style="color:#6366f1"></i><div style="display:flex;flex-direction:column;align-items:flex-start;"><span class="dp-action-label-ja">Design</span><span class="sub dp-action-label-vi">Thiết kế</span></div></button>
                             <button class="dp-action-btn" type="button" data-jump="customers" title="Customers / Khách hàng"><i class="fas fa-building" style="color:#0ea5e9"></i><div style="display:flex;flex-direction:column;align-items:flex-start;"><span class="dp-action-label-ja">Customers</span><span class="sub dp-action-label-vi">Khách hàng</span></div></button>
                             <button class="dp-action-btn" type="button" data-jump="product" title="Product / Job"><i class="fas fa-box" style="color:#8b5cf6"></i><div style="display:flex;flex-direction:column;align-items:flex-start;"><span class="dp-action-label-ja">Product</span><span class="sub dp-action-label-vi">Job</span></div></button>
                             <button class="dp-action-btn" type="button" data-jump="storage" title="Storage / Vị trí"><i class="fas fa-warehouse" style="color:#eab308"></i><div style="display:flex;flex-direction:column;align-items:flex-start;"><span class="dp-action-label-ja">Storage</span><span class="sub dp-action-label-vi">Vị trí lưu trữ</span></div></button>
                             <button class="dp-action-btn" type="button" data-jump="transfer" title="Transfer / Vận chuyển"><i class="fas fa-truck" style="color:#10b981"></i><div style="display:flex;flex-direction:column;align-items:flex-start;"><span class="dp-action-label-ja">Transfer</span><span class="sub dp-action-label-vi">Vận chuyển</span></div></button>
                             <button class="dp-action-btn" type="button" data-jump="extended" title="Extended / Mở rộng"><i class="fas fa-arrow-right" style="color:#ec4899"></i><div style="display:flex;flex-direction:column;align-items:flex-start;"><span class="dp-action-label-ja">Extended</span><span class="sub dp-action-label-vi">Mở rộng Tab</span></div></button>
                           </div>"""

if quick_access_old in js:
    js = js.replace(quick_access_old, quick_access_new)

# Fix 4: Standardize Mini Snapshots buttons (History, Teflon, Extended)
snap_old = """          <div class="dp-actions-grid" >
            <button class="dp-action-btn" type="button" data-jump="history">
              <i class="fas fa-history"></i><span>履歴<br><span class="sub">History</span></span>
            </button>
            <button class="dp-action-btn" type="button" data-jump="teflon">
              <i class="fas fa-spray-can"></i><span>Teflon<br><span class="sub">Coating</span></span>
            </button>
            <button class="dp-action-btn" type="button" data-jump="extended">
              <i class="fas fa-layer-group"></i><span>拡張<br><span class="sub">Extended</span></span>
            </button>
          </div>"""
snap_new = """          <div class="dp-actions-grid" >
            <button class="dp-action-btn" type="button" data-jump="history" title="履歴 / Lịch sử">
              <i class="fas fa-history" style="color:#64748b"></i><div style="display:flex;flex-direction:column;align-items:flex-start;"><span class="dp-action-label-ja">履歴</span><span class="sub dp-action-label-vi">Lịch sử</span></div>
            </button>
            <button class="dp-action-btn" type="button" data-jump="teflon" title="Teflon / Mạ Teflon">
              <i class="fas fa-spray-can" style="color:#14b8a6"></i><div style="display:flex;flex-direction:column;align-items:flex-start;"><span class="dp-action-label-ja">ﾃﾌﾛﾝ</span><span class="sub dp-action-label-vi">Mạ Teflon</span></div>
            </button>
            <button class="dp-action-btn" type="button" data-jump="extended" title="拡張 / Mở rộng">
              <i class="fas fa-layer-group" style="color:#f43f5e"></i><div style="display:flex;flex-direction:column;align-items:flex-start;"><span class="dp-action-label-ja">拡張</span><span class="sub dp-action-label-vi">Biểu mẫu</span></div>
            </button>
          </div>"""

if snap_old in js:
    js = js.replace(snap_old, snap_new)

# Fix 5: Bind `data-jump` events
jump_js = """
      this.panel.addEventListener('click', (e) => {
        const jumpBtn = e.target.closest('button[data-jump]');
        if (jumpBtn) {
          e.preventDefault();
          e.stopPropagation();
          const target = jumpBtn.dataset.jump;
          let tab = 'extended'; // Mặc định mở tab extended
          
          if (target === 'history') { tab = 'history'; }
          else if (target === 'teflon') { tab = 'teflon'; }
          else if (target === 'storage') { tab = 'info'; }
          
          if (typeof this.switchTab === 'function') {
            this.switchTab(tab);
          }
          
          // Scroll specifically for extended groupings
          if (tab === 'extended') {
            setTimeout(() => {
              const activeBody = this.panel.querySelector('.dp-tab-pane.active');
              if (!activeBody) return;
              
              // We search for elements with text matching the category since we might not know the exact ID
              // e.g. "Thiết kế", "Khách hàng", "Sản phẩm"
              let keywords = [];
              if (target === 'design') keywords = ['thiết kế', 'kỹ thuật', 'kích thước'];
              if (target === 'customers') keywords = ['khách hàng', 'customer'];
              if (target === 'product') keywords = ['sản phẩm', 'tray', 'job'];
              
              if (keywords.length > 0) {
                 const headers = Array.from(activeBody.querySelectorAll('.grouped-title, .section-title, h3, h4, .ext-card-header'));
                 const found = headers.find(h => keywords.some(k => (h.textContent || '').toLowerCase().includes(k)));
                 if (found) {
                    found.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 } else {
                    // Fallback to top
                    const wrap = activeBody.querySelector('.dp-extended-wrapper');
                    if(wrap) wrap.scrollTop = 0;
                 }
              }
            }, 300);
          }
        }
      });
"""
if "jumpBtn = e.target.closest('button[data-jump]')" not in js:
    js = re.sub(r'(bindEvents\(\)\s*\{\s*if\s*\(!this\.panel\)\s*return;)', r'\1\n' + jump_js, js)

with codecs.open(js_path, 'w', 'utf-8-sig') as f:
    f.write(js)

print("Done fixing JS.")
