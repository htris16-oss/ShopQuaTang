// ═══════════════════════════════════════════════════════
//  config.js – Dùng chung cho tất cả các trang
//  ⚠️  HƯỚNG DẪN BẢO MẬT:
//  1. Đổi SUPABASE_KEY thành Anon Key (publishable) từ Supabase Dashboard
//  2. TUYỆT ĐỐI không để ADMIN_EMAIL / ADMIN_PWD ở đây nữa
//  3. Xác thực admin qua bảng `admins` trong Supabase (xem hướng dẫn bên dưới)
// ═══════════════════════════════════════════════════════

const SUPABASE_URL = 'https://xjbbyqqgnafavjykjowl.supabase.co';

// ✅ Anon key (public) - OK để để ở client
// Vào Supabase > Settings > API > "anon public" key
const SUPABASE_KEY = 'THAY_BANG_ANON_KEY_TU_SUPABASE_DASHBOARD';

// ❌ ĐÃ XÓA: ADMIN_EMAIL và ADMIN_PWD không còn hardcode ở đây nữa
// Admin đăng nhập qua doAdminLogin() - xác thực với bảng `admins` trong DB

function initSupabase() {
  if (!window.supabase) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function loadSupabaseLib(callback) {
  if (window.supabase) { callback(initSupabase()); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  s.onload  = () => callback(initSupabase());
  s.onerror = () => showToast('❌ Lỗi tải thư viện. Kiểm tra internet!');
  document.head.appendChild(s);
}

// ── FORMAT ────────────────────────────────────────────────
function fmt(n) { return Number(n || 0).toLocaleString('vi-VN') + '₫'; }

function showToast(msg, duration = 3000) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(80px);background:#2A1A1F;color:#fff;padding:.7rem 1.4rem;border-radius:50px;font-size:.84rem;font-weight:500;z-index:9999;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap;max-width:90vw;text-align:center;font-family:"Be Vietnam Pro",sans-serif';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(80px)';
  }, duration);
}

// ── SESSION KHÁCH HÀNG ────────────────────────────────────
function getCustomer() { return JSON.parse(sessionStorage.getItem('customer_session') || 'null'); }
function setCustomer(d) { sessionStorage.setItem('customer_session', JSON.stringify(d)); }
function logoutCustomer() { sessionStorage.removeItem('customer_session'); }

// ── SESSION SHOP ──────────────────────────────────────────
function getShop() { return JSON.parse(sessionStorage.getItem('shop_session') || 'null'); }
function setShop(d) { sessionStorage.setItem('shop_session', JSON.stringify(d)); }
function logoutShop() { sessionStorage.removeItem('shop_session'); }

// ── SESSION ADMIN ─────────────────────────────────────────
function getAdmin() { return JSON.parse(sessionStorage.getItem('admin_session') || 'null'); }
function setAdmin(d) { sessionStorage.setItem('admin_session', JSON.stringify(d)); }
function logoutAdmin() { sessionStorage.removeItem('admin_session'); }

// ── ADMIN LOGIN (xác thực qua DB thay vì hardcode) ────────
// Trong Supabase tạo bảng `admins`: id, email, password_hash
// Chạy SQL này để tạo tài khoản admin lần đầu:
//
//   INSERT INTO admins (email, password_hash)
//   VALUES ('your@email.com', encode(digest('yourpassword' || 'quatang_salt_2025', 'sha256'), 'hex'));
//
async function doAdminLogin(email, pwd) {
  const db = initSupabase();
  if (!db) throw new Error('Không kết nối được DB!');
  const hash = await hashPwd(pwd);
  const { data, error } = await db
    .from('admins')
    .select('id, email')
    .eq('email', email)
    .eq('password_hash', hash)
    .single();
  if (error || !data) throw new Error('Sai email hoặc mật khẩu admin!');
  setAdmin({ id: data.id, email: data.email });
  return data;
}

// ── HASH PASSWORD ─────────────────────────────────────────
async function hashPwd(pwd) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(pwd + 'quatang_salt_2025'));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ── GUARD FUNCTIONS (dùng ở đầu mỗi trang bảo vệ) ────────
function requireCustomer() {
  if (!getCustomer()) { window.location.href = 'customer-login.html'; return false; }
  return true;
}
function requireShop() {
  if (!getShop()) { window.location.href = 'shop-login.html'; return false; }
  return true;
}
function requireAdmin() {
  if (!getAdmin()) { window.location.href = 'admin.html'; return false; }
  return true;
}

// ── LABEL HELPERS ─────────────────────────────────────────
function pLabel(k) { return {'ban-than':'Bạn thân','nguoi-yeu':'Người yêu','ba-me':'Ba mẹ','thay-co':'Thầy cô','dong-nghiep':'Đồng nghiệp'}[k]||k; }
function oLabel(k) { return {'sinh-nhat':'🎂 Sinh nhật','valentine':'💝 Valentine','tet':'🧧 Tết','8-3':'🌸 8/3','20-11':'📚 20/11','giang-sinh':'🎄 Giáng sinh','ky-niem':'💫 Kỷ niệm','khac':'📌 Khác'}[k]||k; }

// ── NGÀY QUAN TRỌNG ───────────────────────────────────────
function daysUntil(ddmm) {
  const [d, m] = ddmm.split('/').map(Number);
  if (!d || !m) return 999;
  const today = new Date(); today.setHours(0,0,0,0);
  let ev = new Date(today.getFullYear(), m-1, d);
  if (ev < today) ev.setFullYear(ev.getFullYear() + 1);
  return Math.round((ev - today) / 86400000);
}

// ── ZALO NOTIFY ───────────────────────────────────────────
async function sendZaloNotify(phone, message) {
  console.log('[Zalo Notify]', phone, message);
  return true;
}
