(function() {
    console.log('[PullToRefresh] Initializing for v8.5.7-1...');
    let startY = 0;
    let isPulling = false;
    const threshold = 100; // Cần vuốt lực kha khá để tránh nhầm lẫn (100px)

    // Create popup HTML (Kính mờ, chữ to, icon động)
    const popupHtml = `
        <div id="ptr-popup" style="display:none; position:fixed; top:40%; left:50%; transform:translate(-50%, -50%); background:rgba(15,23,42,0.85); color:#fff; padding:18px 24px; border-radius:16px; z-index:10000; font-size:15px; font-weight:600; box-shadow:0 12px 30px rgba(0,0,0,0.3); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); flex-direction:column; align-items:center; gap:12px; cursor:pointer; text-align:center; min-width:80vw;">
            <i class="fas fa-hand-pointer" style="font-size:28px; color:#60a5fa; animation: ptr-bounce 1s infinite;"></i>
            <span>Hãy chạm vào đây để Tìm kiếm</span>
            <style>@keyframes ptr-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }</style>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHtml);
    const popup = document.getElementById('ptr-popup');
    let popupTimeout;

    // Lắng nghe sự kiện Bấm vào Màn Đệm Bóng Bay popup -> auto focus search
    popup.addEventListener('click', () => {
        popup.style.display = 'none';
        const searchInput = document.getElementById('searchInput');
        if(searchInput) {
            searchInput.focus();
        }
    });

    const bindTouchEvents = () => {
        const container = document.querySelector('.results-container');
        if(!container) {
            setTimeout(bindTouchEvents, 500);
            return;
        }

        container.addEventListener('touchstart', (e) => {
            if (container.scrollTop <= 0) { // Đang ở trên đỉnh list
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, {passive: true});

        container.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            if (diff > threshold) {
                isPulling = false; // Đã chốt vuốt xong
                console.log('[PullToRefresh] Kích hoạt Refresh!');
                
                // 1. Dọn trống ô text
                const searchInput = document.getElementById('searchInput');
                if(searchInput) searchInput.value = '';
                
                // 2. Ép Trigger Reset Text để xóa List
                const clearBtn = document.querySelector('.clear-btn');
                if(clearBtn) clearBtn.click();
                
                // 3. Hiện Popup gọi Bàn phím
                if (window.innerWidth <= 768) {
                    popup.style.display = 'flex';
                    if(popupTimeout) clearTimeout(popupTimeout);
                    popupTimeout = setTimeout(() => {
                        popup.style.display = 'none';
                    }, 2500); // Rút popup sau 2.5s nếu user làm lơ
                }
            }
        }, {passive: true});

        container.addEventListener('touchend', () => {
            isPulling = false;
        });
    };

    // Bắt đầu chờ DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindTouchEvents);
    } else {
        bindTouchEvents();
    }
})();
