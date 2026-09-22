/* ============================================================
   VOLTEX ADMIN — منطق پنل مدیریت (ذخیره‌سازی: localStorage)
   ============================================================ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const CATS = {
  all:'همه محصولات', protein:'پروتئین و گینر', creatine:'کراتین', amino:'آمینو و BCAA',
  preworkout:'پری‌ورکاوت', vitamin:'ویتامین و امگا۳', equipment:'تجهیزات ورزشی', accessory:'لوازم جانبی',
};

/* ---------- کمکی‌ها ---------- */
const faNum  = n => (+n).toLocaleString('fa-IR');
const money  = n => faNum(Math.round(+n || 0));
const esc    = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const faDate = t => { try { return new Intl.DateTimeFormat('fa-IR', {dateStyle:'medium', timeStyle:'short'}).format(new Date(t)); } catch(e){ return '—'; } };

function getJSON(k, fb){ try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; } catch(e){ return fb; } }
const getOv     = () => { const ov = getJSON('vt_padmin', {}); return {edited: ov.edited || {}, added: ov.added || [], deleted: ov.deleted || []}; };
const setOv     = ov => localStorage.setItem('vt_padmin', JSON.stringify(ov));
const getUsers  = () => getJSON('vt_users', {});
const setUsers  = u  => localStorage.setItem('vt_users', JSON.stringify(u));
const getOrders = () => getJSON('vt_order_list', []);
const setOrders = o  => localStorage.setItem('vt_order_list', JSON.stringify(o));
const getPlog   = () => getJSON('vt_price_log', []);
const setPlog   = l  => localStorage.setItem('vt_price_log', JSON.stringify(l));

function productList(){
  const ov = getOv();
  return [...PRODUCTS, ...PRODUCTS_SOON]
    .filter(p => !ov.deleted.includes(p.id))
    .map(p => ov.edited[p.id] ? {...p, ...ov.edited[p.id]} : p)
    .concat(ov.added);
}
const isBase = id => PRODUCTS.some(p => p.id === id) || PRODUCTS_SOON.some(p => p.id === id);

function aToast(msg, type='ok'){
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.4s'; setTimeout(() => t.remove(), 400); }, 3000);
}

function svgArt(kind){
  const arts = {
    bands:`<svg viewBox="0 0 120 120"><g fill="none" stroke-width="9" stroke-linecap="round"><path d="M25 85 A 35 35 0 0 1 95 85" stroke="#22c55e"/><path d="M32 72 A 30 30 0 0 1 88 72" stroke="#f97316"/><path d="M40 60 A 24 24 0 0 1 80 60" stroke="#e5e7eb"/></g><rect x="14" y="84" width="20" height="12" rx="6" fill="#111"/><rect x="86" y="84" width="20" height="12" rx="6" fill="#111"/></svg>`,
    gloves:`<svg viewBox="0 0 120 120"><path d="M38 30 q0-14 22-14 q22 0 22 14 v34 q0 10-10 12 l-2 14 h-20 l-2-14 q-10-2-10-12 z" fill="#151a15" stroke="#22c55e" stroke-width="3"/><path d="M46 46 h28 M46 56 h28" stroke="#f97316" stroke-width="4" stroke-linecap="round"/><rect x="52" y="88" width="16" height="14" rx="5" fill="#22c55e"/></svg>`,
    shaker:`<svg viewBox="0 0 120 120"><rect x="40" y="26" width="40" height="78" rx="12" fill="#12160f" stroke="#2a352a" stroke-width="2"/><rect x="44" y="10" width="32" height="18" rx="7" fill="#22c55e"/><rect x="46" y="52" width="28" height="6" rx="3" fill="#f97316"/><rect x="46" y="66" width="28" height="6" rx="3" fill="#fdba74" opacity=".7"/><circle cx="60" cy="88" r="8" fill="none" stroke="#22c55e" stroke-width="3"/></svg>`,
    belt:`<svg viewBox="0 0 120 120"><path d="M20 50 a 40 22 0 0 1 80 0 v 20 a 40 22 0 0 1 -80 0 z" fill="#141814" stroke="#2c3a2c" stroke-width="3"/><rect x="50" y="66" width="20" height="26" rx="5" fill="none" stroke="#e5e7eb" stroke-width="4"/><path d="M24 56 a 36 18 0 0 0 72 0" fill="none" stroke="#22c55e" stroke-width="3" stroke-dasharray="2 5"/><circle cx="60" cy="88" r="3" fill="#f97316"/></svg>`,
  };
  return arts[kind] || arts.shaker;
}
const thumbOf = p => p.img ? `<img src="${esc(p.img)}" alt="" onerror="this.remove()">` : svgArt(p.svg);

/* ---------- دروازه ورود ---------- */
const adminPass   = () => localStorage.getItem('vt_admin_pass') || 'admin1234';
const isLoggedIn  = () => sessionStorage.getItem('vt_admin_sess') === '1';

function enterApp(){
  $('#gate').style.display = 'none';
  $('#app').classList.add('on');
  renderAll();
}
$('#gateForm').addEventListener('submit', e => {
  e.preventDefault();
  if ($('#gatePass').value === adminPass()){
    sessionStorage.setItem('vt_admin_sess', '1');
    enterApp();
  } else {
    $('#gateErr').textContent = 'رمز عبور اشتباه است';
    $('#gateCard').classList.remove('shake'); void $('#gateCard').offsetWidth;
    $('#gateCard').classList.add('shake');
    $('#gatePass').select();
  }
});
$('#adminLogout').addEventListener('click', () => {
  sessionStorage.removeItem('vt_admin_sess');
  location.reload();
});
if (isLoggedIn()) enterApp();

/* ---------- تب‌ها ---------- */
$$('.a-nav[data-view]').forEach(b => b.addEventListener('click', () => {
  $$('.a-nav[data-view]').forEach(x => x.classList.toggle('on', x === b));
  $$('.a-view').forEach(v => v.classList.toggle('on', v.id === 'v-' + b.dataset.view));
  renderAll();
}));

/* ---------- رندر اصلی ---------- */
function renderAll(){
  renderDashboard();
  renderOrders(); renderUsers(); renderProducts(); renderPlog(); renderCoupons();
  const n = getOrders().length;
  $('#navOrdersN').style.display = n ? 'inline-block' : 'none';
  $('#navOrdersN').textContent = faNum(n);
}

/* ---------- داشبورد ---------- */
const ICON = {
  users:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"/></svg>',
  orders:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l4 6v13a1 1 0 01-1 1H3a1 1 0 01-1-1V8l4-6z"/><path d="M2 8h20M9 12a3 3 0 006 0"/></svg>',
  money:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4L13.4 20.6a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8z"/><circle cx="7" cy="7" r="1.5"/></svg>',
};
function statCard(ic, cls, num, label){
  return `<div class="a-stat"><span class="ic ${cls}">${ic}</span><div><b>${num}</b><span>${label}</span></div></div>`;
}
function renderDashboard(){
  const users = getUsers(), orders = getOrders(), list = productList(), ov = getOv();
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  $('#dashStats').innerHTML =
    statCard(ICON.money, 'g', money(revenue), 'درآمد کل (تومان)') +
    statCard(ICON.orders, 'o', faNum(orders.length), 'سفارش ثبت‌شده') +
    statCard(ICON.users, 'b', faNum(Object.keys(users).length), 'کاربر ثبت‌نامی') +
    statCard(ICON.box, 'gold', faNum(list.length), 'محصول فعال') +
    statCard(ICON.box, 'o', faNum(ov.added.length), 'محصول اضافه‌شده توسط مدیر');
  $('#dashOrders').innerHTML = ordersTable(orders.slice(-5).reverse(), false);
  $('#dashUsers').innerHTML  = usersTable(Object.entries(users).slice(-5).reverse(), false);
}

/* ---------- سفارش‌ها ---------- */
function ordersTable(orders, withActions = true){
  if (!orders.length)
    return `<div class="a-empty"><b>هنوز سفارشی ثبت نشده</b>وقتی مشتری از فروشگاه خرید کند، اینجا نمایش داده می‌شود.</div>`;
  return `<table class="a-tbl"><thead><tr>
      <th>کد سفارش</th><th>مشتری</th><th>اقلام</th><th>ارسال</th><th>مبلغ نهایی</th><th>تاریخ</th>${withActions ? '<th></th>' : ''}
    </tr></thead><tbody>` +
    orders.map(o => `<tr>
      <td><span class="a-badge">${esc(o.code)}</span></td>
      <td><b>${esc(o.name)}</b><br><span style="color:var(--mut2);font-size:.76rem" dir="ltr">${esc(o.phone)}</span><br><span style="color:var(--mut2);font-size:.72rem" title="${esc(o.addr)}">${esc((o.addr || '').slice(0, 30))}${(o.addr || '').length > 30 ? '…' : ''}</span></td>
      <td style="max-width:240px">${(o.items || []).map(i => `<div style="font-size:.79rem;line-height:1.9">▸ ${esc(i.name)} <span style="color:var(--mut2)">× ${faNum(i.qty)}${i.opts ? ` · ${esc(i.opts)}` : ''}</span></div>`).join('')}</td>
      <td class="num" style="font-size:.8rem">${(o.discount ? `<span style="color:var(--org)">−${money(o.discount)}</span><br>` : '')}حمل: ${o.ship ? money(o.ship) : 'رایگان'}</td>
      <td class="num"><b style="color:var(--grn)">${money(o.total)}</b> <span style="color:var(--mut2);font-size:.72rem">تومان</span></td>
      <td style="white-space:nowrap;font-size:.76rem;color:var(--mut)">${faDate(o.date)}</td>
      ${withActions ? `<td><button class="a-icb red" data-delorder="${esc(o.code)}" title="حذف سفارش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></td>` : ''}
    </tr>`).join('') + '</tbody></table>';
}
function renderOrders(){
  $('#ordersTable').innerHTML = ordersTable([...getOrders()].reverse());
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-delorder]');
  if (b){
    if (!confirm('سفارش ' + b.dataset.delorder + ' حذف شود؟')) return;
    setOrders(getOrders().filter(o => o.code !== b.dataset.delorder));
    renderAll(); aToast('سفارش حذف شد', 'warn');
  }
});

/* ---------- کاربران ---------- */
function usersTable(entries, withActions = true){
  if (!entries.length)
    return `<div class="a-empty"><b>هنوز کاربری ثبت‌نام نکرده</b>اولین ثبت‌نام فروشگاه اینجا دیده می‌شود.</div>`;
  return `<table class="a-tbl"><thead><tr>
      <th>نام</th><th>موبایل</th><th>تاریخ ثبت‌نام</th>${withActions ? '<th></th>' : ''}
    </tr></thead><tbody>` +
    entries.map(([phone, u]) => `<tr>
      <td><b>${esc(u.name)}</b></td>
      <td dir="ltr" class="num">${esc(phone)}</td>
      <td style="font-size:.78rem;color:var(--mut)">${u.date ? faDate(u.date) : '—'}</td>
      ${withActions ? `<td><button class="a-icb red" data-deluser="${esc(phone)}" title="حذف کاربر"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></td>` : ''}
    </tr>`).join('') + '</tbody></table>';
}
function renderUsers(){
  const entries = Object.entries(getUsers()).sort((a, b) => (b[1].date || 0) - (a[1].date || 0));
  $('#usersTable').innerHTML = usersTable(entries);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-deluser]');
  if (b){
    if (!confirm('حساب کاربر «' + b.dataset.deluser + '» حذف شود؟')) return;
    const u = getUsers(); delete u[b.dataset.deluser]; setUsers(u);
    renderAll(); aToast('کاربر حذف شد', 'warn');
  }
});

/* ---------- محصولات ---------- */
function renderProducts(){
  const list = productList();
  $('#productsTable').innerHTML = `<table class="a-tbl"><thead><tr>
      <th></th><th>محصول</th><th>دسته</th><th>قیمت (تومان)</th><th>قیمت قبلی</th><th>عملیات</th>
    </tr></thead><tbody>` +
    list.map(p => `<tr>
      <td><span class="p-thumb">${thumbOf(p)}</span></td>
      <td style="max-width:230px"><b>${esc(p.name)}</b> ${isBase(p.id) ? '' : '<span class="a-tag-new">✦ جدید</span>'}<br><span style="color:var(--mut2);font-size:.74rem">${esc(p.brand || '')}</span></td>
      <td><span class="a-badge gray">${esc(CATS[p.cat] || p.cat)}</span></td>
      <td><input class="price-in" type="number" min="1000" step="1000" dir="ltr" value="${p.price}" data-pin="${esc(p.id)}"></td>
      <td><input class="price-in" type="number" min="0" step="1000" dir="ltr" value="${p.old || ''}" placeholder="—" data-pold="${esc(p.id)}"></td>
      <td style="white-space:nowrap;display:flex;gap:7px">
        <button class="a-btn sm" data-psave="${esc(p.id)}" title="ذخیره قیمت">ذخیره</button>
        <button class="a-icb" data-pedit="${esc(p.id)}" title="ویرایش مشخصات"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg></button>
        <button class="a-icb red" data-pdel="${esc(p.id)}" title="حذف محصول"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
      </td>
    </tr>`).join('') + '</tbody></table>';
}

function updateProduct(id, changes, logPrice = true){
  const ov = getOv();
  const cur = productList().find(p => p.id === id);
  if (!cur) return;
  if (isBase(id)){
    ov.edited[id] = {...(ov.edited[id] || {}), ...changes};
  } else {
    ov.added = ov.added.map(p => p.id === id ? {...p, ...changes} : p);
  }
  setOv(ov);
  if (logPrice && changes.price !== undefined && +changes.price !== +cur.price){
    const log = getPlog();
    log.push({id, name: cur.name, from: cur.price, to: +changes.price, date: Date.now()});
    setPlog(log);
  }
  return cur;
}

document.addEventListener('click', e => {
  /* ذخیره قیمت سریع */
  const sv = e.target.closest('[data-psave]');
  if (sv){
    const id = sv.dataset.psave;
    const price = +document.querySelector(`[data-pin="${CSS.escape(id)}"]`).value;
    const oldV  = document.querySelector(`[data-pold="${CSS.escape(id)}"]`).value;
    if (!price || price < 1000) return aToast('قیمت معتبر وارد کنید', 'err');
    updateProduct(id, {price, old: oldV ? +oldV : null});
    renderAll(); aToast('قیمت ذخیره و روی فروشگاه اعمال شد ✅');
  }
  /* حذف محصول */
  const dl = e.target.closest('[data-pdel]');
  if (dl){
    const id = dl.dataset.pdel;
    const p = productList().find(x => x.id === id);
    if (!p) return;
    if (!confirm(`محصول «${p.name}» از فروشگاه حذف شود؟`)) return;
    const ov = getOv();
    if (isBase(id)) ov.deleted.push(id);
    else ov.added = ov.added.filter(x => x.id !== id);
    setOv(ov);
    renderAll(); aToast('محصول حذف شد', 'warn');
  }
  /* ویرایش مشخصات */
  const ed = e.target.closest('[data-pedit]');
  if (ed){
    const p = productList().find(x => x.id === ed.dataset.pedit);
    if (!p) return;
    $('#eId').value = p.id;
    $('#eName').value = p.name;
    $('#eBrand').value = p.brand || '';
    $('#eCat').innerHTML = catOptions(p.cat);
    $('#ePrice').value = p.price;
    $('#eOld').value = p.old || '';
    $('#eDesc').value = p.desc || '';
    $('#eSvg').value = p.svg || 'shaker';
    setEditImg(p.img || null);
    $('#pModal').classList.add('show');
  }
  if (e.target.closest('[data-mclose]')) $('#pModal').classList.remove('show');
});
$('#pModal').addEventListener('click', e => { if (e.target.id === 'pModal') $('#pModal').classList.remove('show'); });

$('#pEditForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('#eId').value;
  const price = +$('#ePrice').value;
  if (!price || price < 1000) return aToast('قیمت معتبر وارد کنید', 'err');
  try {
    updateProduct(id, {
      name: $('#eName').value.trim() || undefined,
      brand: $('#eBrand').value.trim(),
      cat: $('#eCat').value,
      price,
      old: $('#eOld').value ? +$('#eOld').value : null,
      desc: $('#eDesc').value.trim(),
      img: pendingEditImg || null,
      svg: pendingEditImg ? undefined : $('#eSvg').value,
    });
  } catch(err){ return aToast('حافظه مرورگر پر است؛ عکس کوچک‌تری انتخاب کنید', 'err'); }
  $('#pModal').classList.remove('show');
  renderAll(); aToast('مشخصات محصول به‌روز شد ✅');
});

/* افزودن محصول */
function catOptions(sel){
  return Object.entries(CATS).filter(([k]) => k !== 'all')
    .map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${v}</option>`).join('');
}
$('#pCat').innerHTML = catOptions();

/* ---------- بارگذاری عکس محصول (از گالری/ویندوز) ---------- */
let pendingImg = null;
function fileToDataURL(file, maxSize = 900){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        try { resolve(cv.toDataURL('image/webp', .85)); }
        catch(e){ resolve(cv.toDataURL('image/jpeg', .85)); }
      };
      img.onerror = reject;
      img.src = fr.result;
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
function clearPendingImg(){
  pendingImg = null;
  $('#pImgFile').value = '';
  $('#pImgPrev').removeAttribute('src');
  $('#pImgPrev').style.display = 'none';
  $('#pImgClear').style.display = 'none';
  $('#upTxt').style.display = '';
  $('#upIco').style.display = '';
  $('#upBox').classList.remove('has');
}
$('#pImgFile').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return clearPendingImg();
  if (!f.type.startsWith('image/')){ clearPendingImg(); return aToast('فقط فایل تصویری انتخاب کنید', 'err'); }
  try {
    pendingImg = await fileToDataURL(f);
    if (pendingImg.length > 700000) aToast('عکس حجیم است؛ اگر موقع ثبت خطا داد، عکس کوچک‌تری انتخاب کنید', 'warn');
    $('#pImgPrev').src = pendingImg;
    $('#pImgPrev').style.display = 'block';
    $('#pImgClear').style.display = 'grid';
    $('#upTxt').style.display = 'none';
    $('#upIco').style.display = 'none';
    $('#upBox').classList.add('has');
  } catch(err){ clearPendingImg(); aToast('خواندن عکس ممکن نشد', 'err'); }
});
$('#pImgClear').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); clearPendingImg(); });

/* ---------- بارگذاری عکس در ویرایش محصول ---------- */
let pendingEditImg = null;
function setEditImg(dataUrl){
  pendingEditImg = dataUrl || null;
  if (dataUrl){
    $('#eImgPrev').src = dataUrl;
    $('#eImgPrev').style.display = 'block';
    $('#eImgClear').style.display = 'grid';
    $('#eUpTxt').style.display = 'none';
    $('#eUpIco').style.display = 'none';
    $('#eUpBox').classList.add('has');
  } else {
    $('#eImgPrev').removeAttribute('src');
    $('#eImgPrev').style.display = 'none';
    $('#eImgClear').style.display = 'none';
    $('#eUpTxt').style.display = '';
    $('#eUpIco').style.display = '';
    $('#eUpBox').classList.remove('has');
    $('#eImgFile').value = '';
  }
}
$('#eImgFile').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (!f.type.startsWith('image/')) return aToast('فقط فایل تصویری انتخاب کنید', 'err');
  try { setEditImg(await fileToDataURL(f)); }
  catch(err){ aToast('خواندن عکس ممکن نشد', 'err'); }
});
$('#eImgClear').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); setEditImg(null); });

$('#pAddForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#pName').value.trim();
  const price = +$('#pPrice').value;
  const desc = $('#pDesc').value.trim();
  if (name.length < 2) return aToast('نام محصول کوتاه است', 'err');
  if (!price || price < 1000) return aToast('قیمت معتبر وارد کنید', 'err');
  if (!desc) return aToast('توضیح محصول را بنویسید', 'err');
  const ov = getOv();
  ov.added.push({
    id: 'custom-' + Date.now().toString(36),
    cat: $('#pCat').value,
    name,
    brand: $('#pBrand').value.trim() || 'VOLTEX',
    img: pendingImg || null,
    svg: pendingImg ? undefined : $('#pSvg').value,
    price,
    old: $('#pOld').value ? +$('#pOld').value : null,
    rate: +$('#pRate').value,
    sold: 0,
    desc,
    feats: $('#pFeats').value.split('\n').map(x => x.trim()).filter(Boolean),
    opts: [],
  });
  try { setOv(ov); }
  catch(err){ ov.added.pop(); return aToast('حافظه مرورگر پر است؛ عکس کوچک‌تری انتخاب کنید', 'err'); }
  e.target.reset();
  clearPendingImg();
  $('#addBox').removeAttribute('open');
  renderAll(); aToast('محصول جدید به فروشگاه اضافه شد 🎉');
});

/* بازنشانی */
$('#resetProducts').addEventListener('click', () => {
  if (!confirm('همه تغییرات محصولات (ویرایش قیمت‌ها، محصولات اضافه و حذفشده) به حالت اول برگردد؟')) return;
  localStorage.removeItem('vt_padmin');
  renderAll(); aToast('محصولات به حالت اولیه برگشتند 🔄', 'warn');
});

/* ---------- گزارش قیمت ---------- */
function renderPlog(){
  const log = [...getPlog()].reverse();
  $('#plogList').innerHTML = log.length
    ? log.map(l => `<div class="plog-item">
        <span class="nm">${esc(l.name)}</span>
        <span class="prices"><s>${money(l.from)}</s>
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
          <b>${money(l.to)} تومان</b></span>
        <span class="a-badge ${l.to < l.from ? '' : 'o'}">${l.to < l.from ? 'کاهش قیمت' : 'افزایش قیمت'}</span>
        <time>${faDate(l.date)}</time>
      </div>`).join('')
    : `<div class="a-empty"><b>هنوز تغییر قیمتی ثبت نشده</b>هر بار که قیمتی را در بخش محصولات عوض کنید، اینجا ثبت می‌شود.</div>`;
}
$('#clearPlog').addEventListener('click', () => {
  if (!confirm('تاریخچه تغییر قیمت‌ها پاک شود؟')) return;
  localStorage.removeItem('vt_price_log');
  renderPlog(); aToast('تاریخچه پاک شد', 'warn');
});

/* ---------- کدهای تخفیف ---------- */
const getCoupons = () => getJSON('vt_coupons_admin', {});
const setCoupons = c  => localStorage.setItem('vt_coupons_admin', JSON.stringify(c));

function couponRow(code, c, mine){
  return `<tr>
    <td><span class="a-badge gold" dir="ltr" style="letter-spacing:.12em;font-size:.86rem">${esc(code)}</span></td>
    <td><b style="color:var(--grn);font-size:1rem">٪${faNum(c.pct)}</b></td>
    <td style="color:var(--mut);font-size:.82rem">${esc(c.label || '—')}</td>
    <td style="font-size:.76rem;color:var(--mut)">${mine && c.date ? faDate(c.date) : '<span class="a-badge gray">کد داخلی سایت</span>'}</td>
    <td>${mine ? '<button class="a-icb red" data-delcoupon="' + esc(code) + '" title="حذف کد"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>' : ''}</td>
  </tr>`;
}
function renderCoupons(){
  const admin = getCoupons();
  const adminRows = Object.entries(admin).sort((a, b) => (b[1].date || 0) - (a[1].date || 0)).map(([code, c]) => couponRow(code, c, true));
  const builtinRows = Object.entries(COUPONS).map(([code, c]) => couponRow(code, c, false));
  const rows = adminRows.concat(builtinRows);
  $('#couponsTable').innerHTML = rows.length
    ? `<table class="a-tbl"><thead><tr><th>کد</th><th>تخفیف</th><th>متن نمایشی</th><th>تاریخ ساخت</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>`
    : `<div class="a-empty"><b>هنوز کد تخفیفی نساخته‌ای</b>با فرم بالا اولین کدت را بساز.</div>`;
}
$('#couponForm').addEventListener('submit', e => {
  e.preventDefault();
  const code  = $('#cCode').value.trim().toUpperCase();
  const pct   = +$('#cPct').value;
  const label = $('#cLabel').value.trim();
  if (!/^[A-Z0-9]{3,16}$/.test(code)) return aToast('کد فقط حروف و عدد انگلیسی، ۳ تا ۱۶ کاراکتر', 'err');
  if (!pct || pct < 1 || pct > 90) return aToast('درصد باید بین ۱ تا ۹۰ باشد', 'err');
  if (COUPONS[code]) return aToast('این کد، کد داخلی سایت است؛ کد دیگری انتخاب کن', 'err');
  const all = getCoupons();
  all[code] = {pct, label: label || `٪${faNum(pct)} تخفیف با کد ${code}`, date: Date.now()};
  try { setCoupons(all); } catch(err){ return aToast('ذخیره ممکن نشد', 'err'); }
  e.target.reset();
  renderCoupons();
  aToast(`کد ${code} با ٪${faNum(pct)} تخفیف فعال شد 🎉`);
});
document.addEventListener('click', e => {
  const dc = e.target.closest('[data-delcoupon]');
  if (dc){
    if (!confirm('کد تخفیف «' + dc.dataset.delcoupon + '» حذف و غیرفعال شود؟')) return;
    const all = getCoupons(); delete all[dc.dataset.delcoupon]; setCoupons(all);
    renderCoupons(); aToast('کد تخفیف حذف شد', 'warn');
  }
});

/* ---------- تنظیمات ---------- */
$('#passForm').addEventListener('submit', e => {
  e.preventDefault();
  const a = $('#np1').value, b = $('#np2').value;
  if (a !== b) return aToast('تکرار رمز با یکدیگر نمی‌خوانند', 'err');
  if (a.length < 4) return aToast('رمز حداقل ۴ کاراکتر باشد', 'err');
  localStorage.setItem('vt_admin_pass', a);
  e.target.reset();
  aToast('رمز مدیر تغییر کرد ✅');
});
