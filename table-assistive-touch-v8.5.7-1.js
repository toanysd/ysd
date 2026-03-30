(function() {
  'use strict';
  
  const STORAGE_KEY = 'table_assistive_touch_v8_5_7_1_enabled';
  
  function isEnabled() {
      const val = localStorage.getItem(STORAGE_KEY);
      if (val === null) return true; // Default bật trên Mobile
      return val === 'true';
  }
  
  function isMobile() {
      return window.innerWidth <= 768; // Breakpoint chuẩn
  }
  
  function initContainer() {
      if (document.getElementById('tableAssistiveTouchContainer')) return;
      
      const container = document.createElement('div');
      container.id = 'tableAssistiveTouchContainer';
      
      // Khởi tạo Nút Nổi
      const btn = document.createElement('div');
      btn.id = 'tableAssistiveBtn';
      btn.innerHTML = '<i class="fas fa-bolt"></i>';
      
      // Khởi tạo Popup Lưới 2 Cột x 3 Hàng (Kế thừa từ DetailPanel)
      const menu = document.createElement('div');
      menu.id = 'tableAssistiveMenu';
      menu.innerHTML = `
        <div class="tam-title">クイックアクション | Action nhanh</div>
        <div class="tam-grid">
            <button class="tam-btn" data-action="inout">
                <i class="fas fa-map-marker-alt" style="color:#e65100;background:#fff0b3;"></i>
                <div class="tam-lbl"><span class="jp">入出庫・位置変更</span><span class="vi">Nhập Xuất, Đổi vị trí</span></div>
            </button>
            <button class="tam-btn" data-action="move">
                <i class="fas fa-map-signs" style="color:#e65100;background:#fff0b3;"></i>
                <div class="tam-lbl"><span class="jp">移動</span><span class="vi">Di chuyển</span></div>
            </button>
            <button class="tam-btn" data-action="inventory">
                <i class="fas fa-clipboard-check" style="color:#00695c;background:#b2ebf2;"></i>
                <div class="tam-lbl"><span class="jp">棚卸</span><span class="vi">Kiểm kê</span></div>
            </button>
            <button class="tam-btn" data-action="qr">
                <i class="fas fa-qrcode" style="color:#1d4ed8;background:#dbeafe;"></i>
                <div class="tam-lbl"><span class="jp">QR</span><span class="vi">Mã QR</span></div>
            </button>
            <button class="tam-btn" data-action="photo">
                <i class="fas fa-camera" style="color:#075985;background:#bae6fd;"></i>
                <div class="tam-lbl"><span class="jp">写真</span><span class="vi">Ảnh</span></div>
            </button>
            <button class="tam-btn" data-action="print">
                <i class="fas fa-print" style="color:#334155;background:#e2e8f0;"></i>
                <div class="tam-lbl"><span class="jp">印刷</span><span class="vi">In</span></div>
            </button>
        </div>
      `;
      
      container.appendChild(btn);
      container.appendChild(menu);
      document.body.appendChild(container);
      
      bindEvents(btn, menu);
  }
  
  function showMenu(menu, btn) {
      if (!window.CurrentFocusedRecord) {
          showToast('Vui lòng chạm vào danh sách để chọn 1 mặt hàng trước!');
          return;
      }
      
      // Cân chỉnh Tọa độ theo Icon
      const btnRect = btn.getBoundingClientRect();
      const menuW = 340;
      const menuH = 260; // Ước tính
      
      let left = (window.innerWidth - menuW) / 2;
      let top = btnRect.top - menuH - 20; 
      
      if (top < 10) top = 10;
      
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
      menu.style.display = 'block';
  }
  
  function hideMenu(menu) {
      menu.style.display = 'none';
  }
  
  function showToast(msg) {
      let t = document.getElementById('tamToast');
      if (!t) {
          t = document.createElement('div');
          t.id = 'tamToast';
          t.innerHTML = '<i class="fas fa-info-circle" style="font-size:24px; color:#60a5fa; margin-bottom:10px; display:block;"></i><span id="tamToastMsg"></span>';
          document.body.appendChild(t);
      }
      document.getElementById('tamToastMsg').textContent = msg;
      t.className = 'tam-toast show';
      setTimeout(() => { t.className = 'tam-toast'; }, 3000);
  }
  
  function bindEvents(btn, menu) {
      btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (menu.style.display === 'block') hideMenu(menu);
          else showMenu(menu, btn);
      });
      
      document.addEventListener('click', (e) => {
          if (!menu.contains(e.target) && !btn.contains(e.target)) {
              hideMenu(menu);
          }
      });
      
      menu.querySelectorAll('.tam-btn').forEach(b => {
          b.addEventListener('click', (e) => {
              e.stopPropagation();
              const act = b.dataset.action;
              hideMenu(menu);
              
              if (window.CurrentFocusedRecord) {
                  // Gắn tín hiệu gửi sang Core của UI (App / Render / Root Actions)
                  document.dispatchEvent(new CustomEvent('contextaction', {
                      detail: { action: act, data: window.CurrentFocusedRecord, event: e }
                  }));
              }
          });
      });
      
      document.addEventListener('TableRowFocused', () => {
          btn.classList.add('pulse');
          setTimeout(() => btn.classList.remove('pulse'), 1500);
      });
  }
  
  function checkVisibility() {
      const container = document.getElementById('tableAssistiveTouchContainer');
      if (!container) return;
      
      const btnCard = document.getElementById('btnViewCard');
      const isCardActive = btnCard && btnCard.classList.contains('active');
                          
      if (isMobile() && !isCardActive && isEnabled()) {
          container.style.display = 'block';
      } else {
          container.style.display = 'none';
          const menu = document.getElementById('tableAssistiveMenu');
          if (menu) hideMenu(menu);
      }
      
      // Đồng bộ Switch Checkbox nếu có
      const chk = document.getElementById('toggleTableAssistiveTouch');
      if (chk) chk.checked = isEnabled();
  }
  
  window.ToggleTableAssistiveTouch = function(forceVal) {
      if (typeof forceVal === 'boolean') {
          localStorage.setItem(STORAGE_KEY, forceVal);
      } else {
          const current = isEnabled();
          localStorage.setItem(STORAGE_KEY, !current);
      }
      checkVisibility();
  };
  
  document.addEventListener('DOMContentLoaded', () => {
      initContainer();
      checkVisibility();
      
      window.addEventListener('resize', checkVisibility);
      
      document.addEventListener('click', (e) => {
          if (e.target.closest('#btnViewTable') || e.target.closest('#btnViewCard')) {
              setTimeout(checkVisibility, 50);
          }
          // Chạm vào Toggle Checkbox ở Sidebar
          if (e.target.id === 'toggleTableAssistiveTouch') {
              window.ToggleTableAssistiveTouch(e.target.checked);
          }
      });
  });
  
})();
