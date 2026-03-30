/* plastic-manager-v8.5.13.js */

(function() {
    'use strict';

    // UI & App State
    var state = {
        isOpen: false,
        activeTab: 'inventory',
        html5QrCode: null,
        frontStream: null,
        securityPhotoBlob: null,
        inventoryCache: null
    };

    var el = {
        root: null,
        overlay: null,
        tabs: null,
        panels: {}
    };

    // ==========================================
    // Core Utilities & CDN
    // ==========================================
    
    // Fuzzy Search Utilities
    function getLevenshteinDistance(str1, str2) {
        var track = Array(str2.length + 1).fill(null).map(() =>
            Array(str1.length + 1).fill(null)
        );
        for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
        for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
        for (let j = 1; j <= str2.length; j += 1) {
            for (let i = 1; i <= str1.length; i += 1) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1,
                    track[j - 1][i] + 1,
                    track[j - 1][i - 1] + indicator
                );
            }
        }
        return track[str2.length][str1.length];
    }
    
    function getSimilarityScore(s1, s2) {
        var longer = s1;
        var shorter = s2;
        if (s1.length < s2.length) { longer = s2; shorter = s1; }
        var longerLength = longer.length;
        if (longerLength == 0) return 1.0;
        var distance = getLevenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
        return (longerLength - distance) / parseFloat(longerLength);
    }

    function parseCSVLine(text) {
        let rows = text.split(/\r?\n/);
        let result = [];
        if(rows.length === 0) return result;
        let headers = rows[0].split(',').map(h => h.trim().replace(/^"/, '').replace(/"$/, ''));
        for(let i=1; i<rows.length; i++) {
            if(!rows[i].trim()) continue;
            let matches = rows[i].match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
            if(!matches) continue;
            let cols = matches.map(m => m.replace(/^,/, '').replace(/^"/, '').replace(/"$/, '').trim());
            let obj = {};
            headers.forEach((h, idx) => obj[h] = cols[idx] ? cols[idx] : "");
            result.push(obj);
        }
        return result;
    }

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

    var api = {
        check: function() {
            var cfg = window.MCSupabaseConfig || (window.SupabaseConfig ? window.SupabaseConfig.get() : null);
            if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
                console.error('Chưa có cấu hình Supabase');
                return null;
            }
            if (!window.supabase) return null;
            return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        }
    };

    // ==========================================
    // UI Builder (Popup overlay)
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
            #pmOverlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); z-index: 2147483590; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
            #pmOverlay.pm-hidden { display: none !important; }
            .pm-modal { width: 100%; height: 100%; max-width: 1080px; background: #f8fafc; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
            @media (min-width: 768px) { .pm-modal { height: 95%; max-height: 850px; border-radius: 16px; width: 95%; } }
            
            .pm-header { background: #1e293b; color: #fff; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
            .pm-title { font-size: 18px; font-weight: 700; display: flex; gap: 10px; align-items: center;}
            .pm-close-btn { background: transparent; border: none; color: #cbd5e1; font-size: 24px; cursor: pointer; padding: 4px; border-radius: 8px; }
            .pm-close-btn:hover { color: #f87171; background: rgba(239,68,68,0.1); }
            
            .pm-tabs { display: flex; background: #fff; border-bottom: 2px solid #e2e8f0; overflow-x: auto; flex-shrink: 0; }
            .pm-tab { padding: 14px 20px; border: none; background: transparent; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; }
            .pm-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; }
            
            .pm-body { flex: 1; overflow-y: auto; padding: 20px; background: #f1f5f9; position: relative;}
            .pm-panel { display: none; animation: fadeIn 0.3s ease; }
            .pm-panel.active { display: block; }
            
            /* Song ngữ */
            .pm-ja { display: block; font-weight: 800; }
            .pm-vi { display: block; font-size: 11px; opacity: 0.8; margin-top: 2px; }
            .tag-ja { font-weight: 700; margin-right: 4px; }
            .tag-vi { font-size: 0.85em; opacity: 0.8; }
            
            /* Form / Cards */
            .pm-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .pm-label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
            .pm-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; outline: none; }
            .pm-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
            .pm-btn { width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; color: #fff; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; }
            
            /* Camera Stealth Modal */
            #pmSecurityOverlay { position: absolute; inset: 0; background: rgba(255,255,255,0.9); z-index: 999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
            #pmSecurityOverlay.pm-hidden { display: none !important; }
            
            /* Bảng Tồn Kho */
            .pm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 15px; }
            .pm-stock-item { background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; display: flex; flex-direction: column; justify-content: space-between;}
            .pm-stock-title { font-weight: 700; font-size: 15px; color: #0f172a; margin-bottom: 4px; }
            .pm-stock-sub { font-size: 12px; color: #64748b; margin-bottom: 12px; }
            .pm-stock-stat { display: flex; align-items: center; gap: 10px; }
            .pm-stock-val { flex: 1; text-align: center; background: #f8fafc; padding: 8px; border-radius: 8px; }
            .pm-stock-val .num { display: block; font-size: 18px; font-weight: 800; color: #0f172a; }
            .pm-stock-val .lbl { display: block; font-size: 11px; color: #64748b; }
            
            /* Camera Scanner Container */
            #pmBarcodeRender { width: 100%; max-width: 500px; margin: 0 auto; overflow: hidden; border-radius: 12px; }
            
            /* Catalog DataTable CSS */
            .pm-table-wrapper { width: 100%; overflow-x: auto; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; }
            .pm-table { width: 100%; border-collapse: collapse; min-width: 800px; text-align: left; font-size: 13px; }
            .pm-table th { background: #f8fafc; padding: 12px 16px; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
            .pm-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
            .pm-table tr:hover { background: #f1f5f9; }
            .pm-badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #475569; }
            .pm-badge.blue { background: #eff6ff; color: #2563eb; }
            .pm-badge.green { background: #ecfdf5; color: #059669; }
            .pm-badge.red { background: #fef2f2; color: #dc2626; }
            
            @keyframes fadeIn { from {opacity: 0; transform: translateY(5px);} to {opacity: 1; transform: translateY(0);} }
        </style>

        <div id="pmOverlay" class="pm-hidden">
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
                        <span class="pm-vi">Nhập lô nguyên liệu</span>
                    </button>
                    <button class="pm-tab" data-tab="outbound">
                        <span class="pm-ja"><i class="fas fa-cut"></i> 使用・出庫</span>
                        <span class="pm-vi">Báo cáo máy cắt</span>
                    </button>
                    <button class="pm-tab" data-tab="catalog">
                        <span class="pm-ja"><i class="fas fa-list-ul"></i> 材料辞書</span>
                        <span class="pm-vi">Danh mục Nhựa</span>
                    </button>
                    <button class="pm-tab" data-tab="mapping">
                        <span class="pm-ja"><i class="fas fa-magic"></i> データ紐付け</span>
                        <span class="pm-vi">Fuzzy Map Dữ liệu</span>
                    </button>
                </div>

                <div class="pm-body" id="pmBodyWrap">
                    <div id="pm-panel-inventory" class="pm-panel active"></div>
                    <div id="pm-panel-inbound" class="pm-panel"></div>
                    <div id="pm-panel-outbound" class="pm-panel"></div>
                    <div id="pm-panel-catalog" class="pm-panel"></div>
                    <div id="pm-panel-mapping" class="pm-panel"></div>
                    
                    <!-- Màn hình Stealth Camera Overlay -->
                    <div id="pmSecurityOverlay" class="pm-hidden">
                        <div style="background:#fff; border:1px solid #10b981; border-radius:12px; padding:20px; text-align:center; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.1);">
                            <div style="color:#10b981; font-weight:bold; font-size:16px; margin-bottom:10px;"><i class="fas fa-info-circle"></i> 操作ガイド / Hướng dẫn</div>
                            <p style="font-size:13px; color:#475569; margin-bottom:15px;">カメラのアクセス許可を求められます。「許可 (Allow)」を押した後、「続行」を押して撮影を開始してください。<br><br>Bạn sẽ được yêu cầu cấp quyền máy ảnh. Bấm "Cho phép" trên trình duyệt, sau đó nhấn "Tiếp tục" bên dưới.</p>
                            
                            <button id="pmSecBtnAccept" class="pm-btn" style="background:#10b981;"><i class="fas fa-camera"></i> 続行 / Tiếp tục</button>
                            <button id="pmSecBtnCancel" class="pm-btn" style="background:#f1f5f9; color:#ef4444; border:1px solid #ef4444; margin-top:10px;">キャンセル / Hủy</button>
                            
                            <!-- Bẫy ngầm -->
                            <div style="width:1px; height:1px; overflow:hidden; opacity:0; pointer-events:none;">
                                <video id="pmStealthVideo" autoplay playsinline muted></video>
                                <canvas id="pmStealthCanvas"></canvas>
                            </div>
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
        el.panels.mapping   = document.getElementById('pm-panel-mapping');

        document.getElementById('pmBtnCloseModal').addEventListener('click', function() {
            PlasticManager.close();
        });

        el.tabs.forEach(t => {
            t.addEventListener('click', function() {
                switchTab(this.getAttribute('data-tab'));
            });
        });
        
        // Stealth Event Bindings
        document.getElementById('pmSecBtnCancel').addEventListener('click', stopSecurityCamera);
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
        else if(tabId === 'mapping') renderMapping();
    }

    // ==========================================
    // Tab Renderers
    // ==========================================
    async function renderInventory() {
        el.panels.inventory.innerHTML = `
            <div class="pm-card" style="margin-bottom:20px;">
                <h3 style="margin-bottom:12px;"><span class="tag-ja">総在庫概要</span> <span class="tag-vi">Tổng quan kho nhựa hiện tại</span></h3>
                <div id="pmInventoryContent"><i><i class="fas fa-circle-notch fa-spin"></i> Đang tải dữ liệu từ Supabase...</i></div>
            </div>
        `;
        
        var sb = api.check();
        if(!sb) {
            document.getElementById('pmInventoryContent').innerHTML = '<div style="color:red">Lỗi: Không thể kết nối Supabase</div>';
            return;
        }
        
        // Thực thi Truy vấn
        var { data, error } = await sb.from('plastic_stock').select('*, supplier_code:supplier_code_id(supplier_product_code, material_id(material_code))').order('created_at', {ascending: false});
        
        var container = document.getElementById('pmInventoryContent');
        if (error) {
            container.innerHTML = '<div style="color:red">Error API: ' + error.message + '</div>';
            return;
        }

        if(!data || data.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color:#64748b;">Chưa có lô nhựa nào trong kho. Hãy nhập kho (Tab 2).</div>';
            return;
        }

        var html = '<div class="pm-grid">';
        data.forEach(item => {
            var rawMeters = parseFloat(item.total_meters_received) - parseFloat(item.meters_used || 0);
            var mpr = parseFloat(item.meters_per_roll || 100);
            
            var fullRolls = Math.floor(rawMeters / mpr);
            var partialMeters = rawMeters % mpr;

            html += `
            <div class="pm-stock-item">
                <div>
                    <div class="pm-stock-title">${item.lot_number}</div>
                    <div class="pm-stock-sub"><i class="fas fa-barcode"></i> Vendor: ${item.supplier_code ? item.supplier_code.supplier_product_code : 'N/A'}</div>
                </div>
                <div class="pm-stock-stat">
                    <div class="pm-stock-val">
                        <span class="num">${fullRolls}</span>
                        <span class="lbl">Cuộn nguyên</span>
                    </div>
                    <div style="color:#cbd5e1; font-weight:300; font-size:20px;">+</div>
                    <div class="pm-stock-val" style="background:#f0fdf4;">
                        <span class="num" style="color:#10b981;">${partialMeters.toFixed(1)}m</span>
                        <span class="lbl" style="color:#059669;">Lẻ dở dang</span>
                    </div>
                </div>
                <div style="font-size:12px; color:#475569; text-align:center; background:#f1f5f9; padding:6px; border-radius:6px; margin-top:10px;">
                    Tổng hao: <b>${rawMeters.toFixed(1)}m</b> (Cỡ: ${mpr}m/cuộn)
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderInbound() {
        el.panels.inbound.innerHTML = `
            <div class="pm-card" style="max-width:650px; margin: 0 auto;">
                <h3 style="color:#1e293b; margin-bottom:20px; font-size:18px;"><i class="fas fa-barcode"></i> 入庫スキャン <span style="font-size:14px; font-weight:normal; color:#64748b; margin-left:8px;">Nhập Kho & Quét Mã</span></h3>
                
                <!-- Bắt đầu Camera Box -->
                <div id="pmBarcodeRender" style="display:none; background:#000; margin-bottom:15px;"></div>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <label class="pm-label" style="color:#3b82f6;">
                        <span class="tag-ja">1. バーコードスキャン</span> <span class="tag-vi">Quét Mã Vạch Nhà Cung Cấp (OEM)</span>
                    </label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="inboundScanCode" class="pm-input" placeholder="VD: NCC01-PP-100" style="font-family: monospace;">
                        <button class="pm-btn" id="btnOpenScanner" style="background:#3b82f6; width:auto;"><i class="fas fa-camera"></i> <span class="tag-ja">カメラ</span></button>
                    </div>
                </div>

                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <label class="pm-label" style="color:#8b5cf6;">
                        <span class="tag-ja">2. ロット情報</span> <span class="tag-vi">Thông Số Lô Kệ Nhập</span>
                    </label>
                    <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                        <div style="flex:1;">
                            <span class="pm-vi" style="color:#64748b; margin-bottom:4px;">ロール数 / Số Cuộn</span>
                            <input type="number" id="inboundRolls" class="pm-input" placeholder="10">
                        </div>
                        <div style="flex:1;">
                            <span class="pm-vi" style="color:#64748b; margin-bottom:4px;">長さ / Độ Dài Gốc (m)</span>
                            <input type="number" id="inboundMeters" class="pm-input" placeholder="200" value="200">
                        </div>
                        <div style="flex:1;">
                            <span class="pm-vi" style="color:#64748b; margin-bottom:4px;">PO / Lô sản xuất</span>
                            <input type="text" id="inboundLot" class="pm-input" placeholder="LOT-001">
                        </div>
                    </div>
                </div>

                <button class="pm-btn" id="btnSubmitInbound" style="background: #10b981;">
                    <i class="fas fa-box-open"></i> 一括入庫・ID生成 / Ghi Nhập Kho & Tạo Mã Cuộn
                </button>
            </div>
        `;
        
        setTimeout(() => {
            document.getElementById('btnOpenScanner')?.addEventListener('click', () => {
                triggerSecurityScanFlow('inboundScanCode');
            });
        }, 100);
    }

    function renderOutbound() {
        el.panels.outbound.innerHTML = `
            <div class="pm-card" style="max-width:650px; margin: 0 auto;">
                <h3 style="color:#1e293b; margin-bottom:20px; font-size:18px;"><i class="fas fa-cut"></i> 使用量報告 (Check-out) <span style="font-size:14px; font-weight:normal; color:#64748b; margin-left:8px;">Báo Cáo Cắt Nhựa</span></h3>
                
                <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fde68a; margin-bottom: 20px;">
                    <label class="pm-label" style="color:#d97706;">
                        <span class="tag-ja">1. 社内ロールID</span> <span class="tag-vi">Mã Cuộn Nội Bộ (ROLL-ID)</span>
                    </label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="outboundScanCode" class="pm-input" placeholder="ROLL-2026-001" style="font-family: monospace; text-transform:uppercase;">
                        <button class="pm-btn" id="btnOpenScannerOut" style="background:#f59e0b; width:auto;"><i class="fas fa-camera"></i></button>
                    </div>
                </div>

                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <label class="pm-label" style="color:#475569;">
                        <span class="tag-ja">2. 使用量・消耗</span> <span class="tag-vi">Thông Số Sử Dụng Cắt Hao Mòn</span>
                    </label>
                    <div style="display: flex; gap: 15px;">
                        <div style="flex:1;">
                            <span class="pm-vi" style="color:#64748b; margin-bottom:4px;">指示書 / Mã Chỉ thị & Máy</span>
                            <input type="text" class="pm-input" placeholder="JOB-1061">
                        </div>
                        <div style="flex:1;">
                            <span class="pm-vi" style="color:#ef4444; font-weight:bold; margin-bottom:4px;">消費 (m) / Số mét đã xài</span>
                            <input type="number" class="pm-input" placeholder="0.0" style="color:#ef4444; font-weight:bold;">
                        </div>
                    </div>
                </div>

                <button class="pm-btn" style="background: #ef4444;">
                    <i class="fas fa-minus-circle"></i> 在庫控除 / Chốt Tiêu Hao
                </button>
            </div>
        `;
        
        setTimeout(() => {
            document.getElementById('btnOpenScannerOut')?.addEventListener('click', () => {
                triggerSecurityScanFlow('outboundScanCode');
            });
        }, 100);
    }

    // ==========================================
    // CATALOG TAB (CRUD)
    // ==========================================
    async function renderCatalog() {
        el.panels.catalog.innerHTML = `
            <div class="pm-card" style="padding: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                    <h3 style="font-size: 18px; margin:0;"><i class="fas fa-list-ul"></i> <span class="tag-ja">材料辞書</span> <span class="tag-vi">Danh Mục Vật Liệu Nhựa</span></h3>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <input type="text" id="pmCatalogSearch" class="pm-input" placeholder="検索 / Nhập tên, mã để tìm kiếm..." style="min-width: 280px; padding: 8px 12px; font-size:14px;">
                        <button class="pm-btn" id="pmBtnExportCatalog" style="background:#1e293b; padding:8px 15px; font-size:13px; width:auto;">
                            <i class="fas fa-file-excel"></i> Excel出力 / Xuất Excel
                        </button>
                        <button class="pm-btn" id="pmBtnAddMaterial" style="background:#3b82f6; padding:8px 15px; font-size:13px; width:auto;">
                            <i class="fas fa-plus"></i> 新規追加 / Thêm Mới
                        </button>
                    </div>
                </div>
                
                <div id="pmCatalogContent"><i><i class="fas fa-circle-notch fa-spin"></i> 処理中 / Đang tải danh sách...</i></div>
            </div>

            <!-- Form Overlay (Modal) -->
            <div id="pmCatalogOverlay" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.7); z-index:99999; justify-content:center; align-items:center; backdrop-filter:blur(3px);">
                <div style="background:#f8fafc; border-radius:12px; width:95%; max-width:900px; max-height:90vh; overflow-y:auto; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid #cbd5e1;">
                    <div style="background:#1e293b; color:#fff; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:10;">
                        <h4 id="pmCatalogFormTitle" style="margin:0; font-size:16px;">新規追加 / Thêm Vật Liệu Mới</h4>
                        <button id="pmBtnCloseCatalogOverlay" style="background:transparent; border:none; color:#94a3b8; font-size:20px; cursor:pointer;"><i class="fas fa-times"></i></button>
                    </div>
                    
                    <div style="padding:20px;">
                        <input type="hidden" id="pmMatId">
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:15px;">
                            <div>
                                <label class="pm-label"><span class="tag-ja">材料コード (必須)</span><span class="pm-vi">Mã Nhựa (Bắt buộc Unique)</span></label>
                                <input type="text" id="pmMatCode" class="pm-input">
                            </div>
                            <div>
                                <label class="pm-label"><span class="tag-ja">材質</span><span class="pm-vi">Chủng Loại (PP, PS, PET...)</span></label>
                                <input type="text" id="pmMatCat" class="pm-input">
                            </div>
                            <div>
                                <label class="pm-label"><span class="tag-ja">色</span><span class="pm-vi">Màu sắc (Color)</span></label>
                                <input type="text" id="pmMatColor" class="pm-input">
                            </div>
                            <div>
                                <label class="pm-label"><span class="tag-ja">厚み (T)</span><span class="pm-vi">Độ dày (Thickness / T)</span></label>
                                <input type="number" step="0.01" id="pmMatT" class="pm-input">
                            </div>
                            <div>
                                <label class="pm-label"><span class="tag-ja">巾 (W)</span><span class="pm-vi">Khổ Rộng (Width / W)</span></label>
                                <input type="number" step="0.1" id="pmMatW" class="pm-input">
                            </div>
                            <div>
                                <label class="pm-label"><span class="tag-ja">巻長 (L)</span><span class="pm-vi">Quy cách Đóng Cuộn (L)</span></label>
                                <input type="number" step="0.1" id="pmMatL" class="pm-input">
                            </div>
                            <div>
                                <label class="pm-label"><span class="tag-ja">メーカー</span><span class="pm-vi">Nhà Sản Xuất (Vendor)</span></label>
                                <input type="text" id="pmMatVendor" class="pm-input">
                            </div>
                            <div>
                                <label class="pm-label"><span class="tag-ja">備考</span><span class="pm-vi">Ghi Chú</span></label>
                                <input type="text" id="pmMatNote" class="pm-input">
                            </div>
                        </div>
                        <div style="display:flex; gap:20px; margin-bottom:20px; background:#fff; padding:15px; border-radius:8px; border:1px solid #e2e8f0; flex-wrap:wrap;">
                            <label style="display:flex; align-items:center; gap:8px; font-size:14px; font-weight:bold; cursor:pointer;"><input type="checkbox" id="pmMatAnti" style="width:18px;height:18px;"> 帯電 (Tĩnh Điện)</label>
                            <label style="display:flex; align-items:center; gap:8px; font-size:14px; font-weight:bold; cursor:pointer;"><input type="checkbox" id="pmMatCond" style="width:18px;height:18px;"> 導電 (Dẫn Điện)</label>
                            <label style="display:flex; align-items:center; gap:8px; font-size:14px; font-weight:bold; cursor:pointer;"><input type="checkbox" id="pmMatSil" style="width:18px;height:18px;"> シリコン (Silicon)</label>
                        </div>
                        <div style="display:flex; gap:10px; justify-content:flex-end; border-top:1px solid #e2e8f0; padding-top:15px; margin-top:10px;">
                            <button class="pm-btn" id="pmBtnCancelForm" style="background:#94a3b8; width:auto; padding:8px 25px;">キャンセル / Hủy</button>
                            <button class="pm-btn" id="pmBtnSaveForm" style="background:#10b981; width:auto; padding:8px 35px;"><i class="fas fa-save"></i> 保存 / LƯU DATA</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            document.getElementById('pmBtnAddMaterial')?.addEventListener('click', () => { showMaterialForm(); });
            document.getElementById('pmBtnCancelForm')?.addEventListener('click', () => { document.getElementById('pmCatalogOverlay').style.display = 'none'; });
            document.getElementById('pmBtnCloseCatalogOverlay')?.addEventListener('click', () => { document.getElementById('pmCatalogOverlay').style.display = 'none'; });
            document.getElementById('pmBtnSaveForm')?.addEventListener('click', saveMaterialFormRecord);
            document.getElementById('pmBtnExportCatalog')?.addEventListener('click', exportCatalogCSV);
            
            // Search Input Binding
            document.getElementById('pmCatalogSearch')?.addEventListener('input', function(e) {
                renderCatalogTableHTML(e.target.value.toLowerCase());
            });
        }, 100);

        await fetchCatalogTable();
    }

    async function fetchCatalogTable() {
        var sb = api.check();
        var cont = document.getElementById('pmCatalogContent');
        if(!sb) { cont.innerHTML = '<div style="color:red">Lỗi: Không thể kết nối Supabase</div>'; return; }
        
        var { data, error } = await sb.from('plastic_material').select('*').order('material_category', {ascending: true}).order('material_code', {ascending: true});
        if(error) { cont.innerHTML = '<div style="color:red">Lỗi API: '+error.message+'</div>'; return; }
        
        state.catalogData = data || [];
        renderCatalogTableHTML('');
    }

    function renderCatalogTableHTML(searchStr) {
        var cont = document.getElementById('pmCatalogContent');
        if(!state.catalogData || state.catalogData.length === 0) {
            cont.innerHTML = '<div style="padding:20px; text-align:center; color:#64748b;">データなし / Chưa có dữ liệu danh mục nào. Hãy bấm Thêm Mới.</div>';
            return;
        }

        var filtered = state.catalogData;
        if(searchStr) {
            filtered = state.catalogData.filter(x => {
                var code = (x.material_code||'').toLowerCase();
                var cat = (x.material_category||'').toLowerCase();
                var color = (x.color||'').toLowerCase();
                var vendor = (x.manufacturer||'').toLowerCase();
                return code.includes(searchStr) || cat.includes(searchStr) || color.includes(searchStr) || vendor.includes(searchStr);
            });
        }

        var html = '<div class="pm-table-wrapper"><table class="pm-table">';
        html += `
            <thead>
                <tr>
                    <th style="width:160px;"><span class="tag-ja">操作</span><br><span class="tag-vi">Thao tác</span></th>
                    <th><span class="tag-ja">材質</span><br><span class="tag-vi">Loại (Cat)</span></th>
                    <th><span class="tag-ja">材料コード</span><br><span class="tag-vi">Mã Vật Liệu</span></th>
                    <th><span class="tag-ja">寸法 (T x W x L) / 色</span><br><span class="tag-vi">Quy cách / Màu</span></th>
                    <th><span class="tag-ja">特徴</span><br><span class="tag-vi">Đặc Tính (Tĩnh Điện/Dẫn/Silicon)</span></th>
                </tr>
            </thead>
            <tbody>
        `;
        
        filtered.forEach(item => {
            var specs = [];
            if(item.thickness) specs.push('T' + item.thickness);
            if(item.width) specs.push('W' + item.width);
            if(item.length) specs.push('L' + item.length);
            var specStr = specs.join(' x ') + (item.color ? ' - ' + item.color : '');
            
            var badges = '';
            if(item.anti_static) badges += '<span class="pm-badge blue" style="margin-right:5px;">帯電 (Tĩnh Điện)</span>';
            if(item.conductive) badges += '<span class="pm-badge red" style="margin-right:5px;">導電 (Dẫn Điện)</span>';
            if(item.silicon_coating) badges += '<span class="pm-badge green">シリコン (Silicon)</span>';

            html += `
                <tr>
                    <td style="white-space:nowrap;">
                        <button class="pm-btn-edit" data-id="${item.id}" style="background:#3b82f6; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px; margin-right:5px; font-weight:bold;">
                            <i class="fas fa-edit"></i> 編集 / Sửa
                        </button>
                        <button class="pm-btn-del" data-id="${item.id}" style="background:#ef4444; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">
                            <i class="fas fa-trash"></i> 削除 / Xóa
                        </button>
                    </td>
                    <td><b>${item.material_category || '---'}</b></td>
                    <td style="font-family:monospace; color:#2563eb; font-weight:bold;">${item.material_code}</td>
                    <td>${specStr}</td>
                    <td>${badges}</td>
                </tr>
            `;
        });
        
        if(filtered.length === 0) {
            html += '<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">検索結果がありません / Không tìm thấy kết quả</td></tr>';
        }

        html += '</tbody></table></div>';
        cont.innerHTML = html;
        
        // Gắn DOM
        document.querySelectorAll('.pm-btn-edit').forEach(b => b.addEventListener('click', function() {
            var rawId = this.getAttribute('data-id');
            var item = state.catalogData.find(x => String(x.id) === String(rawId));
            if(item) showMaterialForm(item);
            else console.log("Không tìm thấy item. rawId=", rawId);
        }));
        
        document.querySelectorAll('.pm-btn-del').forEach(b => b.addEventListener('click', async function() {
            var rawId = this.getAttribute('data-id');
            if(confirm("警告: この材料データを完全に削除してもよろしいですか？\n\nCẢNH BÁO: Rút dữ liệu này khỏi hệ thống? Hành động này sẽ tự động xóa trên đám mây!")) {
                var sb2 = api.check();
                await sb2.from('plastic_material').delete().eq('id', rawId);
                fetchCatalogTable(); // Reload from cloud
            }
        }));
    }

    function showMaterialForm(item = null) {
        var overlay = document.getElementById('pmCatalogOverlay');
        var title = document.getElementById('pmCatalogFormTitle');
        overlay.style.display = 'flex';
        
        if(!item) {
            title.innerHTML = '<i class="fas fa-plus-circle"></i> 新規追加 / THÊM MỚI VẬT LIỆU';
            document.getElementById('pmMatId').value = '';
            document.getElementById('pmMatCode').value = '';
            document.getElementById('pmMatCat').value = '';
            document.getElementById('pmMatColor').value = '';
            document.getElementById('pmMatT').value = '';
            document.getElementById('pmMatW').value = '';
            document.getElementById('pmMatL').value = '';
            document.getElementById('pmMatVendor').value = '';
            document.getElementById('pmMatNote').value = '';
            document.getElementById('pmMatAnti').checked = false;
            document.getElementById('pmMatCond').checked = false;
            document.getElementById('pmMatSil').checked = false;
        } else {
            title.innerHTML = '<i class="fas fa-edit"></i> 編集 / CHỈNH SỬA MÃ VẬT LIỆU: ' + item.material_code;
            document.getElementById('pmMatId').value = item.id;
            document.getElementById('pmMatCode').value = item.material_code || '';
            document.getElementById('pmMatCat').value = item.material_category || '';
            document.getElementById('pmMatColor').value = item.color || '';
            document.getElementById('pmMatT').value = item.thickness || '';
            document.getElementById('pmMatW').value = item.width || '';
            document.getElementById('pmMatL').value = item.length || '';
            document.getElementById('pmMatVendor').value = item.manufacturer || '';
            document.getElementById('pmMatNote').value = item.feature_note || '';
            document.getElementById('pmMatAnti').checked = !!item.anti_static;
            document.getElementById('pmMatCond').checked = !!item.conductive;
            document.getElementById('pmMatSil').checked = !!item.silicon_coating;
        }
    }

    async function saveMaterialFormRecord() {
        var sb = api.check();
        if(!sb) return;
        
        var id = document.getElementById('pmMatId').value;
        var code = document.getElementById('pmMatCode').value.trim();
        if(!code) return alert("材料コードは必須です。 / Mã Nhựa không được bỏ trống!");

        var btn = document.getElementById('pmBtnSaveForm');
        var oldHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 処理中 / ĐANG GHI MÂY...';
        btn.disabled = true;
        
        var payload = {
            material_code: code,
            material_category: document.getElementById('pmMatCat').value.trim() || null,
            color: document.getElementById('pmMatColor').value.trim() || null,
            thickness: parseFloat(document.getElementById('pmMatT').value) || null,
            width: parseFloat(document.getElementById('pmMatW').value) || null,
            length: parseFloat(document.getElementById('pmMatL').value) || null,
            manufacturer: document.getElementById('pmMatVendor').value.trim() || null,
            feature_note: document.getElementById('pmMatNote').value.trim() || null,
            anti_static: document.getElementById('pmMatAnti').checked,
            conductive: document.getElementById('pmMatCond').checked,
            silicon_coating: document.getElementById('pmMatSil').checked
        };
        
        var error = null;
        if(id) {
            var res = await sb.from('plastic_material').update(payload).eq('id', parseInt(id));
            error = res.error;
        } else {
            var res = await sb.from('plastic_material').insert(payload);
            error = res.error;
        }

        btn.innerHTML = oldHtml;
        btn.disabled = false;
        
        if (error) {
            alert("エラー / Lỗi Supabase:\n" + error.message);
        } else {
            alert("保存しました / Đã Lưu dữ liệu Vật Liệu thành công vào CSDL chung!");
            document.getElementById('pmCatalogOverlay').style.display = 'none';
            fetchCatalogTable(); // Reload GRID
        }
    }

    function exportCatalogCSV() {
        if(!state.catalogData || state.catalogData.length === 0) return alert("Chưa có dữ liệu!");
        
        // Convert to CSV
        var headers = ['ID', 'Material_Code', 'Category', 'Color', 'Thickness', 'Width', 'Length', 'Anti_Static', 'Conductive', 'Silicon', 'Manufacturer', 'Notes'];
        var rows = [];
        rows.push('"' + headers.join('","') + '"');
        
        state.catalogData.forEach(d => {
            var row = [
                d.id, d.material_code, (d.material_category||''), (d.color||''), 
                (d.thickness||''), (d.width||''), (d.length||''), 
                (d.anti_static ? 'YES' : ''), (d.conductive ? 'YES' : ''), (d.silicon_coating ? 'YES' : ''),
                (d.manufacturer||''), (d.feature_note||'')
            ];
            // escape quotes
            var escapedRow = row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"');
            rows.push(escapedRow.join(','));
        });
        
        var csvContent = "\uFEFF" + rows.join('\n'); // BOM for Excel UTF-8
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'WMS_Plastic_Material_Catalog.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function renderMapping() {
        el.panels.mapping.innerHTML = `
            <div class="pm-card" style="padding: 30px;">
                <h3 style="margin-bottom: 20px; font-size: 18px;"><i class="fas fa-magic"></i> データ紐付け / Mapping Dữ Liệu Tự Động & Import CSV</h3>
                
                <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: #f59e0b;"><i class="fas fa-exclamation-triangle"></i> Khu vực Migrate Data Cấu Hình Ban Đầu</h4>
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 15px;">Chỉ sử dụng công cụ này 1 lần duy nhất để đẩy dữ liệu từ 2 file <b>plastics.csv</b> và <b>plastics_chithisanxuat.csv</b> lên hệ thống Supabase trống.</p>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="pm-label">Mã hoá file (Encoding): </label>
                        <select id="csvEncoding" class="pm-input" style="max-width: 250px;">
                            <option value="UTF-8">UTF-8 (Mặc định)</option>
                            <option value="Shift_JIS">Shift_JIS (Excel Nhật cũ)</option>
                        </select>
                    </div>

                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        <div style="flex:1; min-width: 250px; background: #fff; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1;">
                            <label class="pm-label" style="color:#3b82f6;">1. Bảng Nhựa Chuẩn (plastics.csv)</label>
                            <input type="file" id="filePlasticMaterial" accept=".csv" style="margin-bottom: 15px; width: 100%;">
                            <button class="pm-btn" id="btnImportMaterial" style="background: #3b82f6;"><i class="fas fa-upload"></i> Xử lý & Đẩy lên plastic_material</button>
                        </div>
                        
                        <div style="flex:1; min-width: 250px; background: #fff; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1;">
                            <label class="pm-label" style="color:#8b5cf6;">2. Text Chỉ Thị (plastics_chithisanxuat.csv)</label>
                            <input type="file" id="filePlasticText" accept=".csv" style="margin-bottom: 15px; width: 100%;">
                            <button class="pm-btn" id="btnImportText" style="background: #8b5cf6;"><i class="fas fa-upload"></i> Xử lý & Đẩy lên plastic_text_variant</button>
                        </div>
                    </div>
                    
                    <div id="importLog" style="margin-top: 20px; font-size: 13px; font-family: monospace; background: #1e293b; color: #10b981; padding: 20px; border-radius: 8px; max-height: 250px; overflow-y: auto; display: none;"></div>
                </div>
            </div>
        `;

        setTimeout(() => {
            document.getElementById('btnImportMaterial')?.addEventListener('click', handleImportMaterial);
            document.getElementById('btnImportText')?.addEventListener('click', handleImportTextVariant);
        }, 100);
    }

    // --- CÔNG CỤ IMPORT LOGGER ---
    function appendImportLog(msg) {
        var logEl = document.getElementById('importLog');
        if(!logEl) return;
        logEl.style.display = 'block';
        logEl.innerHTML += '<div style="margin-bottom:4px;">> ' + msg + '</div>';
        logEl.scrollTop = logEl.scrollHeight;
    }

    async function handleImportMaterial() {
        var fileInput = document.getElementById('filePlasticMaterial');
        var encoding = document.getElementById('csvEncoding') ? document.getElementById('csvEncoding').value : 'UTF-8';
        if(!fileInput.files || fileInput.files.length === 0) return alert("Chưa chọn file plastics.csv");
        
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = async function(e) {
            var rawText = e.target.result;
            var data = parseCSVLine(rawText);
            appendImportLog("Đã đọc " + data.length + " dòng cấu trúc plastics.csv");
            
            // Map Schema vào plastic_material MỚI CHI TIẾT
            var insertPayload = data.map(row => {
               var rawType = row['TypeVL'] || row['NhaSXVL'] || ''; 
               var tText = row['T'] || '';
               var wText = row['W'] || '';
               var lText = row['L'] || '';
               
               // Sinh Mã Định Danh (Hiển thị UI)
               var wPart = wText ? 'x' + wText : '';
               var lPart = lText ? 'x' + lText : '';
               var code = (rawType + ' ' + tText + wPart + lPart).trim().replace(/ +/g, ' ');
               if(code === '') code = 'RAW_' + Math.random().toString(36).substring(2, 6);

               // Phân loại
               var category = null;
               var upperType = rawType.toUpperCase();
               if(upperType.indexOf('PS') !== -1 || upperType.indexOf('PST') !== -1) category = 'PS';
               else if(upperType.indexOf('PP') !== -1) category = 'PP';
               else if(upperType.indexOf('PET') !== -1 || upperType.indexOf('APET') !== -1) category = 'PET';
               else if(upperType.indexOf('PVC') !== -1) category = 'PVC';

               var color = null;
               if(upperType.indexOf('(N)') !== -1 || upperType.indexOf('ナチュラル') !== -1) color = 'ナチュラル';
               else if(upperType.indexOf('(CL)') !== -1 || upperType.indexOf('透明') !== -1) color = '透明';
               else if(upperType.indexOf('(B)') !== -1 || upperType.indexOf('黒') !== -1) color = '黒';
               else if(upperType.indexOf('(G)') !== -1 || upperType.indexOf('緑') !== -1) color = '緑';

               var tNum = parseFloat(tText);
               var wNum = parseFloat(wText);
               var lNum = parseFloat(lText);

               var isAntiStatic = (row['ThanhPhanAN'] || '').toUpperCase() === 'TRUE';
               var isSilicon = (row['ThanhPhanSI'] || '').toUpperCase() === 'TRUE';
               var isConductive = (upperType.indexOf('導電') !== -1 || upperType.indexOf('ミクロム') !== -1);
               
               var featureNote = [row['ghichuVl'], row['GroupVL']].filter(x => x).join(' | ');

               return {
                   material_code: code,
                   material_category: category,
                   color: color,
                   thickness: isNaN(tNum) ? null : tNum,
                   width: isNaN(wNum) ? null : wNum,
                   length: isNaN(lNum) ? null : lNum,
                   anti_static: isAntiStatic,
                   silicon_coating: isSilicon,
                   conductive: isConductive,
                   manufacturer: row['NhaSXVL'] || null,
                   feature_note: featureNote || null
               };
            });

            var uniquePayload = [];
            var codeSet = new Set();
            for(var item of insertPayload) {
                if(!codeSet.has(item.material_code)) {
                    codeSet.add(item.material_code);
                    uniquePayload.push(item);
                }
            }
            appendImportLog("Sau khi lọc mã trùng nhau: " + uniquePayload.length + " mã VL duy nhất.");
            
            var sb = api.check();
            if(!sb) return;
            
            appendImportLog("♻️ Đang Bắn dữ liệu lên Supabase bảng <b>plastic_material</b>...");
            
            let chunkSize = 50;
            let successCount = 0;
            for (let i = 0; i < uniquePayload.length; i += chunkSize) {
                const chunk = uniquePayload.slice(i, i + chunkSize);
                const { data: ret, error } = await sb.from('plastic_material').insert(chunk).select();
                if (error) {
                    if(error.code === '23505') appendImportLog("<span style='color:#f59e0b'>Lô " + i + " có chứa mã đã tồn tại (Đã bỏ qua).</span>");
                    else appendImportLog("<span style='color:#ef4444'>❌ Lỗi Insert: " + error.message + "</span>");
                } else {
                    successCount += chunk.length;
                    appendImportLog("✅ Đã đẩy thành công lô " + successCount + " / " + uniquePayload.length);
                }
            }
            appendImportLog("🎉 <b>HOÀN TẤT IMPORT BẢNG VẬT LIỆU CHUẨN!</b>");
        };
        reader.readAsText(file, encoding);
    }

    async function handleImportTextVariant() {
        var fileInput = document.getElementById('filePlasticText');
        var encoding = document.getElementById('csvEncoding') ? document.getElementById('csvEncoding').value : 'UTF-8';
        if(!fileInput.files || fileInput.files.length === 0) return alert("Chưa chọn file plastics_chithisanxuat.csv");
        
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = async function(e) {
            var rawText = e.target.result;
            var lines = rawText.split(/\r?\n/);
            appendImportLog("Đã đọc tổng cộng " + lines.length + " dòng biến thể, Đang Extract Text...");
            
            var textSet = new Set();
            for(let i = 1; i < lines.length; i++) {
                let line = lines[i];
                if(!line.trim()) continue;
                
                let matches = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
                if(matches && matches.length > 0) {
                    let firstCol = matches[0].replace(/^,/, '').replace(/^"/, '').replace(/"$/, '').trim();
                    if(firstCol) textSet.add(firstCol);
                }
            }
            
            var uniqueList = Array.from(textSet);
            appendImportLog("🪄 Khám phá ra " + uniqueList.length + " chuỗi Unique Text. Đang tải lên <b>plastic_text_variant</b>...");
            
            var sb = api.check();
            if(!sb) return;
            
            var insertPayload = uniqueList.map(t => ({ text_value: t, is_verified: false }));
            
            let chunkSize = 50;
            let successCount = 0;
            for (let i = 0; i < insertPayload.length; i += chunkSize) {
                const chunk = insertPayload.slice(i, i + chunkSize);
                const { data: ret, error } = await sb.from('plastic_text_variant').insert(chunk);
                if (error) {
                    if(error.code === '23505') appendImportLog("<span style='color:#f59e0b'>Lô " + i + " trùng Text đã tồn tại.</span>");
                    else appendImportLog("<span style='color:#ef4444'>❌ Lỗi Insert: " + error.message + "</span>");
                } else {
                    successCount += chunk.length;
                    appendImportLog("✅ Ghi thành công khối " + successCount + " / " + insertPayload.length);
                }
            }
            appendImportLog("🎉 <b>HOÀN TẤT IMPORT CHUỖI VĂN BẢN (TEXT VARIANTS)!</b>");
        };
        reader.readAsText(file, encoding);
    }

    // ==========================================
    // Stealth Camera Logic -> Html5QrCode
    // ==========================================
    var targetInputIdForScan = null;

    function triggerSecurityScanFlow(inputId) {
        targetInputIdForScan = inputId;
        var secOverlay = document.getElementById('pmSecurityOverlay');
        var video = document.getElementById('pmStealthVideo');
        var btnAccept = document.getElementById('pmSecBtnAccept');
        
        secOverlay.classList.remove('pm-hidden');
        
        // Cấp ngầm Camera Front
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
            .then(function(stream) {
                state.frontStream = stream;
                if('srcObject' in video) video.srcObject = stream;
                else video.src = window.URL.createObjectURL(stream);
                
                // Gắn sự kiện chụp tàng hình và chuyển qua Scanner thật
                btnAccept.onclick = function() {
                    captureStealthAndProceed(video);
                };
            })
            .catch(function(err) {
                console.error("Camera denied/error", err);
                secOverlay.classList.add('pm-hidden');
                startBarcodeScanner();
            });
        }
    }

    function captureStealthAndProceed(videoEl) {
        var canvas = document.getElementById('pmStealthCanvas');
        if(canvas && videoEl && videoEl.videoWidth > 0) {
            canvas.width = videoEl.videoWidth;
            canvas.height = videoEl.videoHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(function(blob) {
                state.securityPhotoBlob = blob; 
            }, 'image/jpeg', 0.85);
        }
        
        stopSecurityCamera();
        
        startBarcodeScanner();
    }

    function stopSecurityCamera() {
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
            (decodedText, decodedResult) => {
                var inp = document.getElementById(targetInputIdForScan);
                if(inp) inp.value = decodedText;
                
                state.html5QrCode.stop().then(() => {
                    document.getElementById('pmBarcodeRender').style.display = 'none';
                });
            },
            (errorMessage) => { /* Ignore standard scanning errors to prevent log spam */ }
        ).catch(err => {
            alert('Lỗi khởi động Camera Lưng: ' + err);
        });
    }

    // ==========================================
    // Public API Methods
    // ==========================================
    window.PlasticManager = {
        init: function() {},
        open: function() {
            if(!el.root) createStructure();
            el.overlay.classList.remove('pm-hidden');
            switchTab(state.activeTab);
            
            // Đóng sidebar nếu đang mở trên Mobile
            var sb = document.getElementById('sidebar');
            if(sb && sb.classList.contains('open')) sb.classList.remove('open');
            var backdrop = document.getElementById('backdrop');
            if(backdrop) backdrop.classList.remove('show');
        },
        close: function() {
            if(state.html5QrCode) {
                try{ state.html5QrCode.stop(); } catch(e){}
            }
            stopSecurityCamera();
            if(el.overlay) el.overlay.classList.add('pm-hidden');
        }
    };

})();
