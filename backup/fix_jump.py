import codecs
import re

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
          else if (target === 'storage') { 
              // Storage usually in related or extended. We will map to extended
              tab = 'extended'; 
          }
          
          if (typeof this.switchTab === 'function') {
            this.switchTab(tab);
          }
          
          // Scroll specifically for extended groupings
          if (tab === 'extended') {
            setTimeout(() => {
              const activeBody = this.panel.querySelector('.dp-tab-pane.active');
              if (!activeBody) return;
              
              let keywords = [];
              if (target === 'design') keywords = ['thiết kế', 'kỹ thuật', 'kích thước'];
              if (target === 'customers') keywords = ['khách hàng', 'customer', 'liên hệ'];
              if (target === 'product') keywords = ['sản phẩm', 'tray', 'job'];
              if (target === 'storage') keywords = ['vị trí', 'lưu trữ', 'kho', 'kệ'];
              if (target === 'transfer') keywords = ['vận chuyển', 'giao hàng', 'vận tải'];
              
              if (keywords.length > 0) {
                 const headers = Array.from(activeBody.querySelectorAll('.grouped-title, .section-title, h3, h4, .ext-card-header, .dp-section-title'));
                 const found = headers.find(h => keywords.some(k => (h.textContent || '').toLowerCase().includes(k)));
                 if (found) {
                    found.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 } else {
                    const wrap = activeBody.querySelector('.dp-extended-wrapper');
                    if(wrap) wrap.scrollTop = 0;
                 }
              }
            }, 300);
          }
        }
      });
"""

js_path = 'g:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.6.js'
with codecs.open(js_path, 'r', 'utf-8') as f:
    js = f.read()

if "jumpBtn = e.target.closest('button[data-jump]')" not in js:
    js = js.replace("bindEvents() {", "bindEvents() {\n" + jump_js)
    with codecs.open(js_path, 'w', 'utf-8-sig') as f:
        f.write(js)
    print("Injected jump_js")
else:
    print("Already injected")
