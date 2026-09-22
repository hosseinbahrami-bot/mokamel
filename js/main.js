/* ============================================================
   VOLTEX — منطق اصلی سایت
   ============================================================ */
'use strict';

/* ---------- ابزارها ---------- */
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];
const faNum = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const money = n => faNum(Number(n).toLocaleString('en-US'));
const P = id => ALL_PRODUCTS.find(p => p.id === id);

const ICONS = {
  ok:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>',
  err:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6m0-6l6 6"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 000-7.8z"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
};
/* فهرست محصولات + اعمال تغییرات پنل مدیریت (localStorage: vt_padmin) */
function vtProductList(){
  let ov = {};
  try { ov = JSON.parse(localStorage.getItem('vt_padmin') || '{}') || {}; } catch(e) { ov = {}; }
  const deleted = ov.deleted || [], edited = ov.edited || {}, added = ov.added || [];
  const base = [...PRODUCTS, ...PRODUCTS_SOON]
    .filter(p => !deleted.includes(p.id))
    .map(p => edited[p.id] ? {...p, ...edited[p.id]} : p);
  return base.concat(added);
}
let ALL_PRODUCTS = vtProductList();

/* ---------- توست ---------- */function toast(msg, type='ok'){
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="tico">${ICONS[type] || ICONS.ok}</span><span>${msg}</span>`;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 3200);
}

/* ---------- لودر، ناوبار، اسکرول ---------- */
window.addEventListener('load', () => setTimeout(() => $('#loader').classList.add('hide'), 700));

const header = $('header');
window.addEventListener('scroll', () => {
  const y = scrollY;
  header.classList.toggle('scrolled', y > 30);
  const h = document.documentElement;
  $('#scrollbar').style.width = (y / (h.scrollHeight - h.clientHeight) * 100) + '%';
  $('#toTop').classList.toggle('show', y > 600);
}, {passive:true});

$('#toTop').addEventListener('click', () => scrollTo({top:0, behavior:'smooth'}));

/* ریویل با اسکرول */
const rvObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting){ e.target.classList.add('in'); rvObs.unobserve(e.target); }
}), {threshold:.12});
$$('.rv').forEach(el => rvObs.observe(el));

/* لینک فعال ناوبار */
const secObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting){
    $$('.nav-links a').forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }
}), {rootMargin:'-40% 0px -55% 0px'});
$$('section[id]').forEach(s => secObs.observe(s));

/* جستجوی ناوبار */
const searchWrap = $('#searchWrap'), searchInput = $('#searchInput');
$('#searchBtn').addEventListener('click', () => {
  searchWrap.classList.toggle('open');
  if (searchWrap.classList.contains('open')) searchInput.focus();
  else { searchInput.value = ''; renderProducts(); }
});
searchInput.addEventListener('input', () => {
  state.q = searchInput.value.trim();
  renderProducts();
  if (state.q) $('#shop').scrollIntoView({behavior:'smooth'});
});

/* ---------- شمارنده‌های هیرو ---------- */
function animCount(el){
  const target = +el.dataset.n, dur = 1600, t0 = performance.now();
  const step = t => {
    const p = Math.min((t - t0) / dur, 1), v = Math.round(target * (1 - Math.pow(1 - p, 3)));
    el.textContent = (el.dataset.suffix || '') + money(v);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const cntObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting){ animCount(e.target); cntObs.unobserve(e.target); }
}), {threshold:.5});
$$('[data-n]').forEach(el => cntObs.observe(el));

/* ---------- فروشگاه ---------- */
const state = { cat:'all', sort:'pop', q:'', price:'all', rate:0, favOnly:false };
const CATS = {
  all:'همه محصولات', protein:'پروتئین و گینر', creatine:'کراتین', amino:'آمینو و BCAA',
  preworkout:'پری‌ورکاوت', vitamin:'ویتامین و امگا۳', equipment:'تجهیزات ورزشی', accessory:'لوازم جانبی',
};

function starIco(){ return '<svg viewBox="0 0 24 24"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>'; }

function productCard(p, i){
  const off = p.old ? `<span class="p-off">٪${faNum(Math.round((1 - p.price/p.old) * 100))} تخفیف</span>` : '';
  const media = p.img
    ? `<img src="${p.img}" alt="${p.name}" loading="lazy">`
    : svgArt(p.svg);
  return `
  <article class="p-card rv" style="transition-delay:${(i % 4) * .08}s">
    <div class="p-media" data-qv="${p.id}">
      ${off}
      <button class="p-fav ${wish.has(p.id) ? 'on' : ''}" data-fav="${p.id}" title="علاقه‌مندی">${ICONS.heart}</button>
      ${media}
      <div class="p-quick"><button data-qv="${p.id}">${ICONS.eye} مشاهده سریع</button></div>
    </div>
    <div class="p-body">
      <span class="p-brand">${p.brand}</span>
      <h3 class="p-name">${p.name}</h3>
      <div class="p-rate">${starIco()} <span>${faNum(p.rate)}</span> · <span>${faNum(p.sold)} فروش</span></div>
      <div class="p-foot">
        <div class="p-price">
          ${p.old ? `<s>${money(p.old)}</s>` : ''}
          <b>${money(p.price)} <span class="toman">تومان</span></b>
        </div>
        <button class="add-btn" data-add="${p.id}" title="افزودن به سبد">
          <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>
  </article>`;
}

/* آیکون SVG برای محصولات بدون تصویر AI */
function svgArt(kind){
  const arts = {
    bands:`<svg viewBox="0 0 120 120"><g fill="none" stroke-width="9" stroke-linecap="round"><path d="M25 85 A 35 35 0 0 1 95 85" stroke="#22c55e"/><path d="M32 72 A 30 30 0 0 1 88 72" stroke="#f97316"/><path d="M40 60 A 24 24 0 0 1 80 60" stroke="#e5e7eb"/></g><rect x="14" y="84" width="20" height="12" rx="6" fill="#111"/><rect x="86" y="84" width="20" height="12" rx="6" fill="#111"/></svg>`,
    gloves:`<svg viewBox="0 0 120 120"><path d="M38 30 q0-14 22-14 q22 0 22 14 v34 q0 10-10 12 l-2 14 h-20 l-2-14 q-10-2-10-12 z" fill="#151a15" stroke="#22c55e" stroke-width="3"/><path d="M46 46 h28 M46 56 h28" stroke="#f97316" stroke-width="4" stroke-linecap="round"/><rect x="52" y="88" width="16" height="14" rx="5" fill="#22c55e"/></svg>`,
    shaker:`<svg viewBox="0 0 120 120"><rect x="40" y="26" width="40" height="78" rx="12" fill="#12160f" stroke="#2a352a" stroke-width="2"/><rect x="44" y="10" width="32" height="18" rx="7" fill="#22c55e"/><rect x="46" y="52" width="28" height="6" rx="3" fill="#f97316"/><rect x="46" y="66" width="28" height="6" rx="3" fill="#fdba74" opacity=".7"/><circle cx="60" cy="88" r="8" fill="none" stroke="#22c55e" stroke-width="3"/></svg>`,
    belt:`<svg viewBox="0 0 120 120"><path d="M20 50 a 40 22 0 0 1 80 0 v 20 a 40 22 0 0 1 -80 0 z" fill="#141814" stroke="#2c3a2c" stroke-width="3"/><rect x="50" y="66" width="20" height="26" rx="5" fill="none" stroke="#e5e7eb" stroke-width="4"/><path d="M24 56 a 36 18 0 0 0 72 0" fill="none" stroke="#22c55e" stroke-width="3" stroke-dasharray="2 5"/><circle cx="60" cy="88" r="3" fill="#f97316"/></svg>`,
  };
  return `<div class="p-svg">${arts[kind] || arts.shaker}</div>`;
}

function renderProducts(){
  const inPrice = p =>
    state.price === 'all' ? true :
    state.price === 'u1' ? p.price < 1000000 :
    state.price === '1-2' ? (p.price >= 1000000 && p.price <= 2000000) :
    state.price === '2-5' ? (p.price > 2000000 && p.price <= 5000000) :
    p.price > 5000000;
  let list = ALL_PRODUCTS.filter(p =>
    (state.cat === 'all' || p.cat === state.cat) &&
    (!state.q || p.name.includes(state.q) || p.brand.toLowerCase().includes(state.q.toLowerCase()) || p.desc.includes(state.q)) &&
    inPrice(p) &&
    p.rate >= state.rate &&
    (!state.favOnly || wish.has(p.id))
  );
  if (state.sort === 'cheap')  list.sort((a,b) => a.price - b.price);
  if (state.sort === 'exp')    list.sort((a,b) => b.price - a.price);
  if (state.sort === 'pop')    list.sort((a,b) => b.sold - a.sold);
  if (state.sort === 'off')    list.sort((a,b) => (b.old ? 1 - b.price/b.old : 0) - (a.old ? 1 - a.price/a.old : 0));

  const grid = $('#productsGrid');
  grid.innerHTML = list.length
    ? list.map(productCard).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">محصولی با این مشخصات پیدا نشد 🔍</div>`;
  $$('.rv', grid).forEach(el => rvObs.observe(el));
  $('#resCount').textContent = list.length ? `نمایش ${faNum(list.length)} محصول` : '';
  const filtered = state.price !== 'all' || state.rate > 0 || state.favOnly || state.cat !== 'all' || state.q;
  $('#clearFilters').style.display = filtered ? '' : 'none';
}

/* فیلتر دسته از کارت‌های دسته‌بندی */
function filterCat(cat){
  state.cat = cat;
  $$('.chips .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
  renderProducts();
  document.getElementById('shop').scrollIntoView({behavior:'smooth'});
}
window.filterCat = filterCat;
window.closeCart = closeCart;
window.addToCart = addToCart;

/* فیلتر و مرتب‌سازی */
$$('.chips .chip').forEach(ch => ch.addEventListener('click', () => {
  $$('.chips .chip').forEach(c => c.classList.remove('active'));
  ch.classList.add('active');
  state.cat = ch.dataset.cat;
  renderProducts();
}));
$('#sortSel').addEventListener('change', e => { state.sort = e.target.value; renderProducts(); });
$('#priceSel').addEventListener('change', e => { state.price = e.target.value; renderProducts(); });
$('#rateSel').addEventListener('change', e => { state.rate = +e.target.value; renderProducts(); });
$('#favOnly').addEventListener('click', () => {
  state.favOnly = !state.favOnly;
  $('#favOnly').classList.toggle('on', state.favOnly);
  renderProducts();
});
$('#clearFilters').addEventListener('click', () => {
  state.cat = 'all'; state.price = 'all'; state.rate = 0; state.favOnly = false; state.q = ''; state.sort = 'pop';
  searchInput.value = ''; searchWrap.classList.remove('open');
  $('#priceSel').value = 'all'; $('#rateSel').value = '0'; $('#sortSel').value = 'pop';
  $('#favOnly').classList.remove('on');
  $$('.chips .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === 'all'));
  renderProducts();
});

/* کلیک‌های سراسری: افزودن، علاقه‌مندی، مشاهده سریع */
document.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  const fav = e.target.closest('[data-fav]');
  const qv  = e.target.closest('[data-qv]');
  if (add){ addToCart(add.dataset.add); }
  if (fav){ toggleFav(fav.dataset.fav, fav); }
  if (qv){ openQuickView(qv.dataset.qv); }
});

/* ---------- علاقه‌مندی ---------- */
const wish = new Set(JSON.parse(localStorage.getItem('vt_wish') || '[]'));
function toggleFav(id, btn){
  if (wish.has(id)){ wish.delete(id); btn?.classList.remove('on'); toast('از علاقه‌مندی‌ها حذف شد'); }
  else { wish.add(id); btn?.classList.add('on'); toast('به علاقه‌مندی‌ها اضافه شد ❤️'); }
  localStorage.setItem('vt_wish', JSON.stringify([...wish]));
}

/* ---------- سبد خرید ---------- */
let cart = JSON.parse(localStorage.getItem('vt_cart') || '{}');   // {id: {qty, opts}}
let coupon = null;

const cartDrawer = $('#cartDrawer'), cartOverlay = $('#overlay');
function openCart(){ renderCart(); cartDrawer.classList.add('show'); cartOverlay.classList.add('show'); }
function closeCart(){ cartDrawer.classList.remove('show'); cartOverlay.classList.remove('show'); }
$('#cartBtn').addEventListener('click', openCart);
$('#cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function cartCount(){ return Object.values(cart).reduce((s,i) => s + i.qty, 0); }
function cartTotal(){ return Object.entries(cart).reduce((s,[id,i]) => { const p = P(id.split('|')[0]); return p ? s + p.price * i.qty : s; }, 0); }

function addToCart(id, opts=''){
  const key = id + '|' + opts;
  cart[key] = cart[key] || {qty:0, opts};
  cart[key].qty++;
  persistCart();
  toast(`«${P(id).name}» به سبد اضافه شد 🛒`);
  $('#cartBtn').classList.add('bump');
  setTimeout(() => $('#cartBtn').classList.remove('bump'), 400);
  if (cartDrawer.classList.contains('show')) renderCart();
}
function persistCart(){
  localStorage.setItem('vt_cart', JSON.stringify(cart));
  const n = cartCount();
  $('#cartCount').textContent = faNum(n);
  $('#cartCount').style.display = n ? 'grid' : 'none';
}
function renderCart(){
  const box = $('#cartItems');
  const entries = Object.entries(cart);
  if (!entries.length){
    box.innerHTML = `<div class="cart-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.4"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 002 1.58h9.78a2 2 0 002-1.58l1.49-6.92H5.12"/></svg>
      <b>سبد خرید شما خالی است</b><span>از میان بیش از ${faNum(ALL_PRODUCTS.length)} محصول پرمیوم انتخاب کنید</span>
      <button class="btn btn-green btn-sm" onclick="closeCart();document.getElementById('shop').scrollIntoView({behavior:'smooth'})">رفتن به فروشگاه</button>
    </div>`;
  } else {
    box.innerHTML = entries.filter(([key]) => P(key.split('|')[0])).map(([key, it]) => {
      const p = P(key.split('|')[0]);
      return `<div class="ci">
        ${p.img ? `<img class="ci-img" src="${p.img}" alt="">` : `<div class="ci-img p-svg">${svgArt(p.svg)}</div>`}
        <div class="ci-info">
          <b>${p.name}</b>
          ${it.opts ? `<span style="font-size:.72rem;color:var(--muted)">${it.opts}</span>` : ''}
          <span class="ci-price">${money(p.price * it.qty)} تومان</span>
          <div class="ci-row">
            <div class="qty">
              <button data-cq="-1" data-key="${key}">−</button>
              <b>${faNum(it.qty)}</b>
              <button data-cq="1" data-key="${key}">+</button>
            </div>
            <button class="ci-del" data-cdel="${key}">${ICONS.trash}</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  const sub = cartTotal();
  const disc = coupon ? Math.round(sub * coupon.pct / 100) : 0;
  const ship = sub - disc >= 5000000 || sub === 0 ? 0 : 89000;
  $('#cSub').textContent = money(sub) + ' تومان';
  $('#cDiscRow').style.display = disc ? 'flex' : 'none';
  $('#cDisc').textContent = '−' + money(disc) + ' تومان';
  $('#cShip').textContent = ship === 0 ? 'رایگان 🎉' : money(ship) + ' تومان';
  $('#cGrand').textContent = money(sub - disc + ship) + ' تومان';
}
document.addEventListener('click', e => {
  const q = e.target.closest('[data-cq]'), d = e.target.closest('[data-cdel]');
  if (q){
    const it = cart[q.dataset.key];
    it.qty += +q.dataset.cq;
    if (it.qty <= 0) delete cart[q.dataset.key];
    persistCart(); renderCart();
  }
  if (d){
    delete cart[d.dataset.cdel];
    persistCart(); renderCart();
    toast('محصول از سبد حذف شد', 'warn');
  }
});
/* کدهای تخفیف = کدهای داخلی + کدهای ساخته‌شده توسط مدیر */
function vtFindCoupon(code){
  if (COUPONS[code]) return COUPONS[code];
  try {
    const admin = JSON.parse(localStorage.getItem('vt_coupons_admin') || '{}');
    if (admin[code]) return admin[code];
  } catch(e) {}
  return null;
}
$('#couponBtn').addEventListener('click', () => {
  const code = $('#couponInput').value.trim().toUpperCase();
  const found = vtFindCoupon(code);
  if (found){ coupon = found; toast(`کد تخفیف اعمال شد: ${coupon.label} 🎁`); }
  else { coupon = null; toast('کد تخفیف نامعتبر است', 'err'); }
  renderCart();
});

/* ---------- تسویه حساب ---------- */
$('#checkoutBtn').addEventListener('click', () => {
  if (!cartCount()) return toast('سبد خرید خالی است!', 'warn');
  closeCart();
  const u = curUser();
  if (u){ $('#coName').value = u.name; $('#coPhone').value = session || ''; }
  $('#checkoutModal').classList.add('show');
  document.body.style.overflow = 'hidden';
});
function closeCheckout(){
  $('#checkoutModal').classList.remove('show');
  document.body.style.overflow = '';
}
$$('#checkoutModal [data-close]').forEach(b => b.addEventListener('click', closeCheckout));

$('#placeOrder').addEventListener('click', () => {
  const name = $('#coName').value.trim(), phone = $('#coPhone').value.trim(), addr = $('#coAddr').value.trim();
  if (name.length < 3) return toast('نام و نام خانوادگی را کامل وارد کنید', 'err');
  if (!/^09\d{9}$/.test(phone)) return toast('شماره موبایل معتبر وارد کنید (مثل ۰۹۱۲...)', 'err');
  if (addr.length < 10) return toast('آدرس را کامل‌تر وارد کنید', 'err');

  const code = 'VT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  /* ثبت کامل سفارش برای پنل مدیریت */
  try {
    const sub = cartTotal();
    const disc = coupon ? Math.round(sub * coupon.pct / 100) : 0;
    const ship = sub - disc >= 5000000 || sub === 0 ? 0 : 89000;
    const orders = JSON.parse(localStorage.getItem('vt_order_list') || '[]');
    orders.push({
      code, name, phone, addr,
      items: Object.entries(cart)
        .map(([k, it]) => ({p: P(k.split('|')[0]), q: it.qty, o: it.opts}))
        .filter(x => x.p)
        .map(x => ({id: x.p.id, name: x.p.name, qty: x.q, opts: x.o || '', price: x.p.price})),
      subtotal: sub, discount: disc, ship, total: sub - disc + ship,
      date: Date.now()
    });
    localStorage.setItem('vt_order_list', JSON.stringify(orders));
  } catch(e) {}
  $('#orderCode').textContent = code;
  $('#checkoutForm').style.display = 'none';
  $('#checkoutSuccess').style.display = 'flex';
  cart = {}; coupon = null; persistCart();
  orderCount++; localStorage.setItem('vt_orders', orderCount);
  toast('سفارش با موفقیت ثبت شد 🎉');
});
$$('[data-back-shop]').forEach(b => b.addEventListener('click', () => {
  closeCheckout();
  $('#checkoutForm').style.display = 'grid';
  $('#checkoutSuccess').style.display = 'none';
  $('#shop').scrollIntoView({behavior:'smooth'});
}));

/* ---------- مشاهده سریع ---------- */
let qvState = {id:null, opts:{}, qty:1, star:5};
function openQuickView(id){
  const p = P(id);
  qvState = {id, opts:{}, qty:1, star:5};
  $('#qvMedia').innerHTML = p.img ? `<img src="${p.img}" alt="${p.name}">` : svgArt(p.svg);
  $('#qvInfo').innerHTML = `
    <span class="p-brand">${p.brand}</span>
    <h3>${p.name}</h3>
    <div class="p-rate">${starIco()} <span>${faNum(p.rate)}</span> · <span>${faNum(p.sold)} فروش موفق</span></div>
    <p class="qv-desc">${p.desc}</p>
    <ul class="qv-feats">${p.feats.map(f => `<li>${f}</li>`).join('')}</ul>
    ${p.opts.map((o, i) => `
      <div class="opt-row">
        <span class="lbl">${o.k}:</span>
        <div class="opt-chips" data-oi="${i}">
          ${o.v.map((v, j) => `<button class="opt-chip ${j === 0 ? 'active' : ''}" data-v="${v}">${v}</button>`).join('')}
        </div>
      </div>`).join('')}
    <div class="qv-price">${p.old ? `<s>${money(p.old)}</s>` : ''}<div><b id="qvPrice">${money(p.price)}</b> <span class="toman">تومان</span></div></div>
    <div style="display:flex;gap:12px;align-items:center">
      <div class="qty" style="height:48px">
        <button style="width:42px;height:100%" data-qvq="-1">−</button>
        <b id="qvQty" style="min-width:40px;font-size:1rem">${faNum(1)}</b>
        <button style="width:42px;height:100%" data-qvq="1">+</button>
      </div>
      <button class="btn btn-orange" id="qvAdd" style="flex:1">افزودن به سبد خرید</button>
    </div>
    ${reviewHTML(p)}`;
  $('#qvModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeQV(){ $('#qvModal').classList.remove('show'); document.body.style.overflow = ''; }
$('#qvClose').addEventListener('click', closeQV);
$('#qvModal').addEventListener('click', e => { if (e.target.id === 'qvModal') closeQV(); });
$('#qvInfo').addEventListener('click', e => {
  const chip = e.target.closest('.opt-chip');
  if (chip){
    $$('.opt-chip', chip.parentElement).forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    qvState.opts[chip.closest('[data-oi]').dataset.oi] = chip.dataset.v;
  }
  const q = e.target.closest('[data-qvq]');
  if (q){
    qvState.qty = Math.max(1, qvState.qty + +q.dataset.qvq);
    $('#qvQty').textContent = faNum(qvState.qty);
  }
  if (e.target.closest('#qvAdd')){
    const p = P(qvState.id);
    const opts = p.opts.map((o, i) => `${o.k}: ${qvState.opts[i] || o.v[0]}`).join(' | ');
    addToCart(p.id, opts);
    closeQV();
  }
  const star = e.target.closest('[data-star]');
  if (star){
    qvState.star = +star.dataset.star;
    $$('.star-in button').forEach((b, i) => b.classList.toggle('on', i < qvState.star));
  }
  if (e.target.closest('#rvSubmit')){
    submitReview();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ closeQV(); closeCart(); closeCheckout(); closePost(); closeAuth(); }
});

/* ---------- آناتومی ---------- */
function buildAnatomy(){
  $$('.hotspot').forEach(h => h.addEventListener('click', () => {
    $$('.hotspot').forEach(m => m.classList.remove('sel'));
    $$(`.hotspot[data-m="${h.dataset.m}"]`).forEach(m => m.classList.add('sel'));
    showMuscle(h.dataset.m);
  }));
  $$('.anat-toggle button').forEach(b => b.addEventListener('click', () => {
    $$('.anat-toggle button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $$('.anat-body').forEach(v => v.classList.remove('show'));
    $(b.dataset.view).classList.add('show');
    $$('.hotspot').forEach(m => m.classList.remove('sel'));
    $('.ap-empty').style.display = 'flex';
    $('#apContent').style.display = 'none';
  }));
}
function showMuscle(id){
  const m = MUSCLES[id];
  if (!m) return;
  $('.ap-empty').style.display = 'none';
  const c = $('#apContent');
  c.style.display = 'flex';
  c.innerHTML = `
    <div class="ap-title">
      <span class="ap-flag">${m.icon}</span>
      <div><h3>${m.fa}</h3><small>${m.en}</small></div>
    </div>
    <p class="ap-desc">${m.desc}</p>
    <div class="ap-sec">
      <h5>تمرین‌های پیشنهادی</h5>
      <div class="ex-list">
        ${m.ex.map(e => `<div class="ex-item"><b>${e.n}</b><span>${e.s} ست × تکرار</span></div>`).join('')}
      </div>
    </div>
    <div class="ap-sec">
      <h5>تجهیزات مناسب این عضله</h5>
      <div class="eq-chips">
        ${m.eq.map(id => { const p = P(id); return `
          <button class="eq-chip" data-qv="${p.id}">
            ${p.img ? `<img src="${p.img}" alt="">` : '<span style="font-size:1.1rem">🏋️</span>'}
            ${p.name} <span class="go">←</span>
          </button>`; }).join('')}
      </div>
    </div>
    <div class="ap-sec">
      <h5>مکمل‌های هم‌راه</h5>
      <div class="eq-chips">
        ${m.sup.map(id => { const p = P(id); return `
          <button class="eq-chip" data-qv="${p.id}">
            ${p.img ? `<img src="${p.img}" alt="">` : '<span style="font-size:1.1rem">💊</span>'}
            ${p.name} <span class="go">←</span>
          </button>`; }).join('')}
      </div>
    </div>`;
}
buildAnatomy();

/* ---------- ماشین‌حساب‌ها ---------- */
const ACT = {1.2:'کم‌تحرک (کار پشت میز)', 1.375:'فعالیت سبک (۱-۳ روز)', 1.55:'متوسط (۳-۵ روز)', 1.725:'سنگین (۶-۷ روز)', 1.9:'خیلی سنگین (ورزشکار حرفه‌ای)'};
$('#actSel').innerHTML = Object.entries(ACT).map(([k,v]) => `<option value="${k}">${v}</option>`).join('');

/* BMI */
function calcBMI(){
  const h = +$('#bmiH').value / 100, w = +$('#bmiW').value;
  if (!h || !w) return;
  const bmi = w / (h*h);
  $('#bmiVal').textContent = faNum(bmi.toFixed(1));
  let cat, cls, pct;
  if (bmi < 18.5){ cat='کمبود وزن'; cls='b-orange'; pct=bmi/40*100; }
  else if (bmi < 25){ cat='وزن نرمال و ایده‌آل'; cls='b-green'; pct=bmi/40*100; }
  else if (bmi < 30){ cat='اضافه وزن'; cls='b-orange'; pct=bmi/40*100; }
  else { cat='چاقی — برنامه کاهش وزن لازم است'; cls='b-red'; pct=100; }
  $('#bmiCat').textContent = cat;
  $('#bmiCat').className = 'cr-badge ' + cls;
  $('#bmiFill').style.width = Math.min(pct, 100) + '%';
  $('#bmiIdeal').textContent = `${money(Math.round(18.5*h*h))} تا ${money(Math.round(24.9*h*h))} کیلوگرم`;
}
/* کالری */
function calcTDEE(){
  const w=+$('#calW').value, h=+$('#calH').value, a=+$('#calA').value;
  if (!w || !h || !a) return;
  const male = $('#calMale').classList.contains('active');
  const bmr = 10*w + 6.25*h - 5*a + (male ? 5 : -161);
  const tdee = bmr * +$('#actSel').value;
  $('#bmrVal').textContent = money(Math.round(bmr));
  $('#tdeeVal').textContent = money(Math.round(tdee));
  $('#cutFill').style.width = '80%';  $('#cutKcal').textContent = money(Math.round(tdee*.8)) + ' کالری';
  $('#keepFill').style.width = '100%'; $('#keepKcal').textContent = money(Math.round(tdee)) + ' کالری';
  $('#bulkFill').style.width = '115%'; $('#bulkKcal').textContent = money(Math.round(tdee*1.15)) + ' کالری';
}
/* وزن ایده‌آل */
function calcIdeal(){
  const h=+$('#iwH').value;
  if (!h) return;
  const male = $('#iwMale').classList.contains('active');
  const inches = Math.max(h/2.54 - 60, 0);
  const devine = (male ? 50 : 45.5) + 2.3*inches;
  $('#iwVal').textContent = money(Math.round(devine));
  $('#iwRange').textContent = `${money(Math.round(18.5*(h/100)**2))} تا ${money(Math.round(24.9*(h/100)**2))} کیلوگرم`;
}
/* چربی بدن (US Navy) */
function calcFat(){
  const h=+$('#bfH').value, neck=+$('#bfNeck').value, waist=+$('#bfWaist').value, hip=+$('#bfHip').value;
  if (!h || !neck || !waist || ($('#bfFemale').classList.contains('active') && !hip)) return;
  const male = $('#bfMale').classList.contains('active');
  let bf;
  if (male) bf = 495/(1.0324 - .19077*Math.log10(waist-neck) + .15456*Math.log10(h)) - 450;
  else bf = 495/(1.29579 - .35004*Math.log10(waist+hip-neck) + .221*Math.log10(h)) - 450;
  if (!isFinite(bf) || bf <= 0){ $('#bfCat').textContent='ورودی‌ها را بررسی کنید'; return; }
  $('#bfVal').textContent = faNum(bf.toFixed(1)) + '٪';
  let cat, cls;
  if (male){
    if (bf<6){cat='چربی ضروری';cls='b-orange'}
    else if (bf<14){cat='سطح ورزشکاران 🏆';cls='b-green'}
    else if (bf<18){cat='تناسب اندام خوب';cls='b-green'}
    else if (bf<25){cat='متوسط';cls='b-orange'}
    else {cat='بالا — نیاز به کات';cls='b-red'}
  } else {
    if (bf<14){cat='چربی ضروری';cls='b-orange'}
    else if (bf<21){cat='سطح ورزشکاران 🏆';cls='b-green'}
    else if (bf<25){cat='تناسب اندام خوب';cls='b-green'}
    else if (bf<32){cat='متوسط';cls='b-orange'}
    else {cat='بالا — نیاز به کات';cls='b-red'}
  }
  $('#bfCat').textContent = cat;
  $('#bfCat').className = 'cr-badge ' + cls;
}
/* آب */
function calcWater(){
  const w=+$('#waW').value, hours=+$('#waEx').value || 0;
  if (!w) return;
  const lit = (w*35 + hours*500)/1000;
  $('#waVal').textContent = faNum(lit.toFixed(1));
  $('#waGlasses').textContent = faNum(Math.round(lit*1000/250));
}
/* 1RM */
function calcRM(){
  const w=+$('#rmW').value, r=+$('#rmR').value;
  if (!w || !r) return;
  const rm = w * (1 + r/30);
  $('#rmVal').textContent = money(Math.round(rm)) + ' کیلوگرم';
  const rows = [[100,'۱ تکرار (رکورد)'],[95,'۲ تکرار'],[90,'۴ تکرار'],[85,'۶ تکرار'],[80,'۸ تکرار'],[75,'۱۰ تکرار'],[70,'۱۲ تکرار'],[60,'۱۵ تکرار (حجم)']];
  $('#rmTable').innerHTML = `<tr><th>شدت</th><th>وزنه پیشنهادی</th><th>هدف</th></tr>` +
    rows.map(([pct,goal]) => `<tr><td>٪${faNum(pct)}</td><td><b>${money(Math.round(rm*pct/100))} kg</b></td><td>${goal}</td></tr>`).join('');
}
/* ورودی‌های زنده */
$$('.calc-pane input, .calc-pane select').forEach(el => el.addEventListener('input', () => {
  calcBMI(); calcTDEE(); calcIdeal(); calcFat(); calcWater(); calcRM();
}));
$$('.seg button').forEach(b => b.addEventListener('click', () => {
  $$(`.seg [data-group="${b.dataset.group}"]`).forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  calcTDEE(); calcIdeal(); calcFat();
}));
$$('.calc-tab').forEach(t => t.addEventListener('click', () => {
  $$('.calc-tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  $$('.calc-pane').forEach(p => p.classList.remove('show'));
  $(t.dataset.pane).classList.add('show');
}));

/* ---------- برنامه‌ساز تمرینی ---------- */
const GOALS = {
  muscle:{fa:'حجم و عضله‌سازی', stack:['whey-iso','creatine','multivit'], note:'خواب ۷-۸ ساعته و مازاد کالری ۳۰۰+ برای رشد عضلانی حیاتی است.'},
  fat:{fa:'چربی‌سوزی و کات', stack:['bcaa','multivit','omega3'], note:'کسری کالری ۵۰۰- با پروتئین بالا تا ۲ گرم بر کیلو وزن، عضلات را حفظ می‌کند.'},
  strength:{fa:'قدرت و رکوردزنی', stack:['creatine','omega3','whey-iso'], note:'بین ست‌های سنگین استراحت کامل ۲-۳ دقیقه رعایت کنید؛ تکنیک قبل از وزنه.'},
  fitness:{fa:'تناسب اندام عمومی', stack:['multivit','bcaa'], note:'استمرار ۳ تا ۵ جلسه در هفته + پیاده‌روی روزانه ۸ هزار قدم.'},
};
const LEVELS = {
  beginner:{fa:'مبتدی', note:'۲ هفته اول وزنه‌ها را سبک نگه دارید و تکنیک را با مربی چک کنید.'},
  inter:{fa:'متوسط', note:'هر هفته ۲.۵٪ به وزنه حرکات اصلی اضافه کنید (اضافه‌بار تدریجی).'},
  adv:{fa:'پیشرفته', note:'ست آخر هر حرکت: دراپ‌ست یا تا ناتوانی فنی برای تحریک حداکثری.'},
};
const HOME_FIX = [['هالتر','دمبل'],['سیم‌کش','کش مقاومتی'],['بارفیکس','کش زیربغل'],['پارالل','دیپ روی صندلی'],['پرس پا','اسکوات بلغاری'],['دستگاه','دمبل']];

/* انتخاب رادیوباتن‌های برنامه‌ساز */
$$('.pf-opt input').forEach(r => r.addEventListener('change', () => {
  $$(`.pf-opt input[name="${r.name}"]`).forEach(x =>
    x.closest('.pf-opt').classList.toggle('active', x.checked));
}));

$('#genPlan').addEventListener('click', () => {
  const _sel = n => { const r = document.querySelector(`input[name="${n}"]:checked`); return r ? r.value : null; };
  const goal = _sel('goal') || 'muscle', level = _sel('level') || 'beginner', days = +(_sel('days') || 4), place = _sel('place') || 'gym';
  const G = GOALS[goal], L = LEVELS[level];
  const dayMap = SPLITS[days];
  const heroData = {
    name: (document.getElementById('pfName') ? document.getElementById('pfName').value.trim() : ''),
    goal: G.fa, goalKey: goal, level: L.fa, days,
    place: place === 'home' ? 'خانه (دمبل و کش)' : 'باشگاه',
    dayNames: dayMap.m.map(k => EXBANK[k].fa),
    muscleKeys: [...new Set(dayMap.m.flatMap(k => ((window.DAY_MUSCLES || {})[k]) || []))],
    stack: G.stack.map(id => { const p = P(id); return p ? p.name : ''; }).filter(Boolean),
    stackItems: G.stack.map(id => { const p = P(id); return p ? {id, name: p.name, img: p.img || null} : null; }).filter(Boolean),
  };

  const adjEx = key => {
    let ex = EXBANK[key].ex.map(r => [...r]);
    if (place === 'home') ex = ex.map(r => {
      let n = r[0];
      HOME_FIX.forEach(([a,b]) => n = n.replaceAll(a,b));
      return [n, r[1], r[2]];
    });
    if (goal === 'strength') ex = ex.map(r => [r[0], '۵ × ۳-۵', '۲-۳ دقیقه']);
    if (goal === 'fat') ex = ex.map(r => [r[0], r[1].replace(/[۰-۹]+-[۰-۹]+$/, '۱۲-۱۵'), r[2]]);
    if (level === 'beginner') ex = ex.map(r => [r[0], r[1].replace(/^[۰-۹]+/, m => faNum(Math.max(2, +m.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) - 1))), r[2]]);
    return ex;
  };
  const planHTML = dayMap.m.map((key, di) => {
    const ex = adjEx(key);
    const open = di === 0 ? 'open' : '';
    return `
    <div class="pp-day ${open}">
      <div class="pp-day-head" data-day>
        <span class="dnum">${faNum(di+1)}</span>
        <div class="dt"><b>${EXBANK[key].fa}</b><span>${faNum(ex.length)} حرکت · حدود ${faNum(45 + ex.length*8)} دقیقه</span></div>
        <span class="arr">▾</span>
      </div>
      <div class="pp-day-body" style="max-height:${open ? '600px' : '0'}">
        ${ex.map(r => `<div class="pp-ex"><b>${r[0]}</b><span class="sets">${r[1]}</span><span class="rest">استراحت ${r[2]}</span></div>`).join('')}
        ${di === 0 ? `<div class="pp-note">${ICONS.warn} ${dayMap.cardio} — گرم کردن ۱۰ دقیقه قبل از شروع فراموش نشود</div>` : ''}
      </div>
    </div>`;
  }).join('');

  $('#progPlan').innerHTML = `
    <div class="pp-head">
      <div>
        <div class="pp-title">برنامه ${G.fa} — ${L.fa} · ${faNum(days)} روز در هفته</div>
        <div class="pp-sub">${place === 'home' ? 'تمرین در خانه با دمبل و کش' : 'تمرین کامل باشگاهی'} · طراحی هوشمند ولتکس</div>
      </div>
      <div style="display:flex;gap:9px">
        <button class="btn btn-ghost btn-sm" id="posterBtn">🖼 پوستر قهرمان</button>
        <button class="btn btn-ghost btn-sm" id="copyPlan">کپی برنامه</button>
        <button class="btn btn-green btn-sm" onclick="window.print()">چاپ / PDF</button>
      </div>
    </div>
    <div class="pp-days">${planHTML}</div>
    <div class="pp-stack">
      <h4>پشته مکملی پیشنهادی برای هدف «${G.fa}»</h4>
      <div class="eq-chips">
        ${G.stack.map(id => { const p = P(id); return `
          <button class="eq-chip" data-qv="${p.id}">
            ${p.img ? `<img src="${p.img}" alt="">` : '<span style="font-size:1.1rem">💊</span>'}
            ${p.name} <span class="go">←</span>
          </button>`; }).join('')}
      </div>
      <p style="font-size:.83rem;color:var(--muted);margin-top:14px">${G.note}</p>
    </div>`;
  $('#progPlan').classList.add('show');
  $('#progEmpty').style.display = 'none';

  $$('#progPlan [data-day]').forEach(h => h.addEventListener('click', () => {
    const day = h.parentElement, body = $('.pp-day-body', day);
    const open = day.classList.toggle('open');
    body.style.maxHeight = open ? body.scrollHeight + 80 + 'px' : '0';
  }));

  {
    const _pb = $('#posterBtn');
    if (_pb) _pb.addEventListener('click', () => window.openHeroPoster(heroData));
  }
  $('#copyPlan').addEventListener('click', () => {
    let txt = `برنامه ${G.fa} — ${L.fa} (${faNum(days)} روز)\n\n`;
    dayMap.m.forEach((key, di) => {
      txt += `روز ${faNum(di+1)}: ${EXBANK[key].fa}\n`;
      EXBANK[key].ex.forEach(r => txt += `  • ${r[0]} — ${r[1]}\n`);
      txt += '\n';
    });
    navigator.clipboard.writeText(txt).then(() => toast('برنامه در کلیپ‌بورد کپی شد 📋'));
  });
  heroData.dayDetails = dayMap.m.map(k => ({fa: EXBANK[k].fa, ex: adjEx(k)}));
  $('#progPlan').scrollIntoView({behavior:'smooth', block:'start'});
  toast('برنامه اختصاصی شما آماده شد! 💪');
  setTimeout(() => window.openHeroPoster(heroData), 400);
});

/* ---------- شمارش معکوس پیشنهاد ویژه ---------- */
function tickCountdown(){
  const now = new Date(), end = new Date(now); end.setHours(23,59,59,999);
  let diff = Math.max(0, end - now);
  const h = Math.floor(diff/3.6e6), m = Math.floor(diff%3.6e6/6e4), s = Math.floor(diff%6e4/1e3);
  $('#cdH').textContent = faNum(String(h).padStart(2,'0'));
  $('#cdM').textContent = faNum(String(m).padStart(2,'0'));
  $('#cdS').textContent = faNum(String(s).padStart(2,'0'));
}
setInterval(tickCountdown, 1000); tickCountdown();

/* ---------- سوالات متداول ---------- */
$$('.faq-q').forEach(q => q.addEventListener('click', () => {
  const item = q.parentElement, a = $('.faq-a', item), was = item.classList.contains('open');
  $$('.faq').forEach(f => { f.classList.remove('open'); $('.faq-a', f).style.maxHeight = null; });
  if (!was){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
}));

/* ---------- خبرنامه ---------- */
$('#nlForm').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('#nlInput').value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return toast('ایمیل معتبر وارد کنید', 'err');
  $('#nlInput').value = '';
  toast('عضویت شما در خبرنامه ثبت شد 🎁 کد تخفیف خوش‌آمدگویی: WELCOME10');
});

/* ---------- نظرات کاربران ---------- */
let userReviews = JSON.parse(localStorage.getItem('vt_reviews') || '{}');
function getReviews(id){
  return [...(REVIEWS[id] || []), ...(userReviews[id] || [])];
}
function starsRow(r){
  let s = '';
  for (let i = 1; i <= 5; i++)
    s += `<svg viewBox="0 0 24 24" class="${i <= Math.round(r) ? '' : 'off'}"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>`;
  return `<span class="stars">${s}</span>`;
}
function reviewHTML(p){
  const list = getReviews(p.id);
  const avg = list.length ? (list.reduce((s, r) => s + r.r, 0) / list.length) : p.rate;
  return `
  <div class="review-sec">
    <h5>نظرات کاربران <span style="color:var(--muted-2);font-weight:400">(${faNum(list.length)} نظر)</span></h5>
    <div class="review-avg">${starsRow(avg)}<b class="num">${faNum(avg.toFixed(1))}</b><span>از ۵ · تجربه خریداران واقعی</span></div>
    <div id="rvList">
      ${list.length ? list.map(r => `
        <div class="review-item">
          <div class="rh"><b>${r.n}</b>${starsRow(r.r)}</div>
          <p>${r.t}</p>
          <span class="rd">${r.d}</span>
        </div>`).join('') : '<p style="color:var(--muted-2);font-size:.85rem">هنوز نظری ثبت نشده — اولین نفر باش! 🌟</p>'}
    </div>
    <div class="review-form">
      <h6>✍️ نظرت رو بنویس</h6>
      <div class="star-in">${[1,2,3,4,5].map(i => `<button data-star="${i}" class="on"><svg viewBox="0 0 24 24"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg></button>`).join('')}</div>
      <input type="text" id="rvName" placeholder="نامت (مثلاً علی محمدی)">
      <textarea id="rvText" rows="3" placeholder="تجربه‌ات از این محصول..."></textarea>
      <button class="btn btn-green btn-sm" id="rvSubmit" style="width:100%">ثبت نظر</button>
    </div>
  </div>`;
}
function submitReview(){
  const name = $('#rvName').value.trim(), text = $('#rvText').value.trim();
  if (name.length < 2) return toast('نامت رو وارد کن', 'err');
  if (text.length < 5) return toast('نظرت رو کامل‌تر بنویس', 'err');
  const id = qvState.id;
  userReviews[id] = userReviews[id] || [];
  userReviews[id].push({n:name.replace(/</g,'&lt;'), r:qvState.star, t:text.replace(/</g,'&lt;'), d:'لحظاتی پیش'});
  localStorage.setItem('vt_reviews', JSON.stringify(userReviews));
  openQuickView(id);
  toast('نظرت با موفقیت ثبت شد 🌟');
}

/* ---------- بلاگ ---------- */
function renderPosts(){
  $('#blogGrid').innerHTML = POSTS.map((p, i) => `
    <article class="post-card rv" style="transition-delay:${(i % 4) * .08}s" data-post="${p.id}">
      <div class="post-cover" style="background:${p.grad}">
        ${p.img ? `<img src="${p.img}" alt="${p.title}" loading="lazy">` : `<span class="emoji">${p.emoji}</span>`}
        <span class="post-tag">${p.tag}</span>
      </div>
      <div class="post-body">
        <div class="post-meta"><span>${p.date}</span><span>⏱ ${p.read}</span></div>
        <h3>${p.title}</h3>
        <p>${p.ex}</p>
        <span class="post-link">خواندن مقاله ←</span>
      </div>
    </article>`).join('');
  $$('#blogGrid .rv').forEach(el => rvObs.observe(el));
  $$('#blogGrid [data-post]').forEach(c => c.addEventListener('click', () => openPost(c.dataset.post)));
}
function openPost(id){
  const p = POSTS.find(x => x.id === id);
  if (!p) return;
  $('#postFull').innerHTML = `
    <div class="post-hero" style="background:${p.grad}">
      ${p.img ? `<img src="${p.img}" alt="${p.title}">` : `<span class="emoji">${p.emoji}</span>`}
      <span class="post-tag">${p.tag}</span>
    </div>
    <div class="post-article">
      <h2>${p.title}</h2>
      <div class="post-meta"><span>✍️ تحریریه ولتکس</span><span>${p.date}</span><span>⏱ ${p.read}</span></div>
      ${p.body.map((t, i) => `<p class="${i === 0 ? 'lead' : ''}">${t}</p>`).join('')}
    </div>`;
  $('#postModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closePost(){ $('#postModal').classList.remove('show'); document.body.style.overflow = ''; }
$$('#postModal [data-pclose]').forEach(b => b.addEventListener('click', closePost));
$('#postModal').addEventListener('click', e => { if (e.target.id === 'postModal') closePost(); });

/* ---------- حساب کاربری ---------- */
let users = JSON.parse(localStorage.getItem('vt_users') || '{}');
let session = localStorage.getItem('vt_session') || null;
let orderCount = +(localStorage.getItem('vt_orders') || 0);
let authTab = 'login';
const curUser = () => session ? users[session] : null;

function openAuth(){
  renderAuth();
  $('#authModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeAuth(){ $('#authModal').classList.remove('show'); document.body.style.overflow = ''; }
function renderAuth(){
  const u = curUser();
  $('#authTabs').style.display = u ? 'none' : 'flex';
  $('#profileBox').style.display = u ? 'block' : 'none';
  $('#loginForm').style.display = (!u && authTab === 'login') ? 'block' : 'none';
  $('#signupForm').style.display = (!u && authTab === 'signup') ? 'block' : 'none';
  if (u){
    $('#profileName').textContent = u.name;
    $('#profilePhone').textContent = session;
    $('#profileAvatar').textContent = u.name.trim()[0];
    $('#profileOrders').textContent = faNum(orderCount);
    $('#profileFav').textContent = faNum(wish.size);
  }
}
function updateUserUI(){
  const u = curUser();
  $('#userBtn').classList.toggle('logged', !!u);
  $('#userInit').style.display = u ? 'grid' : 'none';
  if (u) $('#userInit').textContent = u.name.trim()[0];
}
$('#userBtn').addEventListener('click', openAuth);
$$('#authModal [data-aclose]').forEach(b => b.addEventListener('click', closeAuth));
$('#authModal').addEventListener('click', e => { if (e.target.id === 'authModal') closeAuth(); });
$$('#authTabs [data-atab]').forEach(t => t.addEventListener('click', () => {
  authTab = t.dataset.atab;
  $$('#authTabs [data-atab]').forEach(x => x.classList.toggle('active', x === t));
  renderAuth();
}));
$('#loginBtn').addEventListener('click', () => {
  const phone = $('#liPhone').value.trim(), pass = $('#liPass').value;
  if (!users[phone]) return toast('حسابی با این شماره پیدا نشد؛ اول ثبت‌نام کن', 'err');
  if (users[phone].pass !== pass) return toast('رمز عبور اشتباهه', 'err');
  session = phone;
  localStorage.setItem('vt_session', session);
  updateUserUI(); renderAuth();
  toast(`خوش برگشتی ${users[phone].name}! 💪`);
});
$('#signupBtn').addEventListener('click', () => {
  const name = $('#suName').value.trim(), phone = $('#suPhone').value.trim(), pass = $('#suPass').value;
  if (name.length < 2) return toast('نامت رو کامل وارد کن', 'err');
  if (!/^09\d{9}$/.test(phone)) return toast('شماره موبایل معتبر وارد کن', 'err');
  if (pass.length < 4) return toast('رمز عبور حداقل ۴ کاراکتر باشه', 'err');
  if (users[phone]) return toast('این شماره قبلاً ثبت شده؛ وارد شو', 'warn');
  users[phone] = {name, pass, date: Date.now()};
  localStorage.setItem('vt_users', JSON.stringify(users));
  session = phone;
  localStorage.setItem('vt_session', session);
  updateUserUI(); renderAuth();
  toast('حسابت ساخته شد! 🎉 کد تخفیفت: WELCOME10');
});
$('#logoutBtn').addEventListener('click', () => {
  session = null;
  localStorage.removeItem('vt_session');
  updateUserUI(); renderAuth();
  toast('از حسابت خارج شدی 👋');
});

/* ---------- شروع ---------- */
const BRANDS = ['VOLTEX NUTRITION','OPTIMUM NUTRITION','MYPROTEIN','BIOTECH USA','SCITEC NUTRITION','MUSCLETECH','DYMATIZE','CELLUCOR'];
$('#brandMarquee').innerHTML = [...BRANDS, ...BRANDS].map(b => `<span>${b}</span>`).join('');
renderProducts();
renderPosts();
persistCart();
updateUserUI();


/* ============================================================
   پیشنهاد شگفت‌انگیز — کاغذ رنگی، تیلت سه‌بعدی، شمارش زنده
   ============================================================ */
(() => {
  const cvEl = document.getElementById('confettiCv');
  const ctx = cvEl ? cvEl.getContext('2d') : null;
  let parts = [], raf = null;
  function resizeCv(){ if (cvEl){ cvEl.width = innerWidth; cvEl.height = innerHeight; } }
  addEventListener('resize', resizeCv); resizeCv();
  const COLORS = ['#22c55e','#16a34a','#4ade80','#f97316','#fdba74','#e2c46a','#ffffff','#0ea5e9'];
  function burst(x, y, n = 100){
    if (!ctx) return;
    for (let i = 0; i < n; i++){
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 10;
      parts.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 7,
        w: 5 + Math.random() * 7, h: 8 + Math.random() * 9,
        r: Math.random() * Math.PI, vr: (Math.random() - .5) * .35,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1, dk: .007 + Math.random() * .009,
        circ: Math.random() < .28
      });
    }
    if (!raf) loop();
  }
  function loop(){
    raf = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, cvEl.width, cvEl.height);
    parts = parts.filter(p => p.life > 0 && p.y < cvEl.height + 50);
    if (!parts.length){ cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, cvEl.width, cvEl.height); return; }
    for (const p of parts){
      p.vy += .28; p.vx *= .992; p.vy *= .997;
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= p.dk;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c;
      if (p.circ){ ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 7); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
  }
  window.confettiBurst = burst;

  /* خرید فوری → انفجار کاغذ رنگی */
  const buyBtn = document.getElementById('dealBuy');
  if (buyBtn){
    buyBtn.addEventListener('click', () => {
      addToCart('creatine');
      const r = buyBtn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 120);
      setTimeout(() => burst(innerWidth * .22, innerHeight * .16, 70), 170);
      setTimeout(() => burst(innerWidth * .78, innerHeight * .16, 70), 300);
    });
  }

  /* تیلت سه‌بعدی محصول */
  const dealBox = document.querySelector('#deal .ticket');
  const pop = document.getElementById('dealPop');
  if (dealBox && pop && matchMedia('(pointer:fine)').matches){
    dealBox.addEventListener('mousemove', e => {
      const r = dealBox.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      pop.style.transform = `rotateY(${(-px * 13).toFixed(2)}deg) rotateX(${(py * 11).toFixed(2)}deg)`;
    });
    dealBox.addEventListener('mouseleave', () => { pop.style.transform = ''; });
  }

  /* شمارش زنده بازدیدکنندگان */
  const liveN = document.getElementById('dealLiveN');
  if (liveN) setInterval(() => { liveN.textContent = faNum(5 + Math.floor(Math.random() * 8)); }, 4500);
})();


/* ============================================================
   پوستر قهرمان — تولید عکس گرافیکی برنامه با Canvas
   ============================================================ */
(() => {
  /* نقشه عضلات روی بدن: سمت ۰ = جلو، ۱ = پشت + مختصات درصدی */
  const DAY_MUSCLES = {
    push: ['chest','delts','triceps'],
    pull: ['lats','traps','biceps'],
    legs: ['quads','hamstrings','calves','glutes'],
    upper:['chest','delts','lats','biceps'],
    lower:['quads','hamstrings','calves','abs'],
    full: ['chest','lats','delts','quads'],
    arms: ['biceps','triceps','delts','forearms'],
  };
  window.DAY_MUSCLES = DAY_MUSCLES;
  const MUSCLE_POS = {
    chest:    [[0,.50,.265]],
    delts:    [[0,.28,.215],[0,.72,.215]],
    triceps:  [[1,.165,.32],[1,.835,.32]],
    lats:     [[1,.42,.295],[1,.58,.295]],
    traps:    [[1,.50,.185]],
    biceps:   [[0,.19,.305],[0,.81,.305]],
    forearms: [[0,.16,.43],[0,.84,.43]],
    abs:      [[0,.50,.355]],
    quads:    [[0,.415,.62],[0,.585,.62]],
    hamstrings:[[1,.41,.63],[1,.59,.63]],
    calves:   [[0,.395,.80],[0,.605,.80]],
    glutes:   [[1,.50,.49]],
  };
  const MUSCLE_FA = {chest:'سینه',delts:'سرشانه',triceps:'پشت‌بازو',lats:'زیربغل و پشت',traps:'کول',biceps:'جلوبازو',forearms:'ساعد',abs:'شکم',quads:'چهارسر ران',hamstrings:'پشت‌ران',calves:'ساق پا',glutes:'باسن'};
  const DOSAGE = {
    'whey-iso':'۱ اسکوپ · بعد از تمرین', 'creatine':'۵ گرم · هر روز',
    'preworkout':'۱ اسکوپ · ۲۰ دقیقه قبل تمرین', 'bcaa':'۱ اسکوپ · حین تمرین',
    'multivit':'۱ قرص · همراه صبحانه', 'omega3':'۲ کپسول · با غذا', 'gainer':'۱ سروینگ · بین وعده‌ها',
  };

function heroPoster(d){ // eslint-disable-line
  // v3 — پوستر افقی ۱۶:۱۰
  const W = 1920, H = 1200, P = 56;
  const rows = (d.dayDetails || []).slice(0, 6);
  const supp = (d.stackItems || []).slice(0, 3);

  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.direction = 'rtl';
  const gold = '#e2c46a', grn = '#22c55e';
  const F = (s, w = 400) => `${w} ${s}px YekanBakh, Tahoma, sans-serif`;
  const rr = (X, Y, w, h, r) => {
    x.beginPath(); x.moveTo(X + r, Y);
    x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
    x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
  };
  const fitText = (t, maxW, size, w = 400) => {
    let s = t;
    x.font = F(size, w);
    if (x.measureText(s).width > maxW){
      while (s.length > 4 && x.measureText(s + '…').width > maxW) s = s.slice(0, -1);
      return s + '…';
    }
    return s;
  };
  const orb = (cx, cy, r, rgb, a) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  };
  const secTitle = (t, y, cx, ext = 110) => {
    x.textAlign = 'center'; x.fillStyle = gold; x.font = F(27, 900);
    x.fillText(t, cx, y);
    const tw = x.measureText(t).width;
    x.strokeStyle = 'rgba(226,196,106,.32)'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(cx - tw/2 - ext, y); x.lineTo(cx - tw/2 - 36, y); x.stroke();
    x.beginPath(); x.moveTo(cx + tw/2 + 36, y); x.lineTo(cx + tw/2 + ext, y); x.stroke();
    x.fillStyle = 'rgba(226,196,106,.78)'; x.font = F(15, 400);
    x.fillText('◆', cx - tw/2 - 21, y + 1);
    x.fillText('◆', cx + tw/2 + 21, y + 1);
  };

  /* ---------- پس‌زمینه ---------- */
  x.fillStyle = '#070b07'; x.fillRect(0, 0, W, H);
  orb(150, 140, 660, '34,197,94', .20);
  orb(W - 130, H - 130, 640, '249,115,22', .18);
  orb(W * .45, H * .35, 520, '226,196,106', .07);
  x.fillStyle = 'rgba(226,196,106,.055)';
  for (let yy = 40; yy < H; yy += 40) for (let xx = 40; xx < W; xx += 40){ x.beginPath(); x.arc(xx, yy, 1.5, 0, 7); x.fill(); }
  x.save(); x.translate(W/2, H/2); x.rotate(-.26); x.translate(-W/2, -H/2);
  for (let i = -2; i < 4; i++){
    const g = x.createLinearGradient(0, i*470, 0, i*470+180);
    g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.5,'rgba(255,255,255,.045)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(-400, i*470+150, W+800, 180);
  }
  x.restore();

  /* قاب */
  const fg = x.createLinearGradient(28, 28, W-28, H-28);
  fg.addColorStop(0,'rgba(226,196,106,.95)'); fg.addColorStop(.5,'rgba(34,197,94,.75)'); fg.addColorStop(1,'rgba(226,196,106,.95)');
  x.strokeStyle = fg; x.lineWidth = 3; rr(28, 28, W-56, H-56, 40); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 1.5; rr(44, 44, W-88, H-88, 30); x.stroke();
  /* واترمارک */
  x.font = F(160, 900); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(226,196,106,.045)'; x.fillText('⚡', 185, 280);

  /* ---------- سربرگ ---------- */
  /* راست: لوگو + برند */
  x.save(); x.translate(W - P - 62, 62);
  const lg = x.createLinearGradient(0, 0, 62, 62); lg.addColorStop(0,'#22c55e'); lg.addColorStop(1,'#14532d');
  rr(0, 0, 62, 62, 18); x.fillStyle = lg; x.fill();
  x.strokeStyle = '#04140a'; x.lineWidth = 6.5; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(15.5, 33.5); x.lineTo(25.5, 43.5); x.lineTo(49, 16); x.stroke();
  x.restore();
  x.textAlign = 'right'; x.textBaseline = 'middle';
  const vg = x.createLinearGradient(W - P - 230, 0, W - P, 0);
  vg.addColorStop(0,'#4ade80'); vg.addColorStop(.6,'#e2c46a'); vg.addColorStop(1,'#f97316');
  x.fillStyle = vg; x.font = F(46, 900); x.fillText('VOLTEX', W - P, 172);
  x.fillStyle = 'rgba(230,222,196,.78)'; x.font = F(18, 500);
  x.fillText('سوخت قهرمانان واقعی • VOLTEX.FIT', W - P, 208);

  /* چپ: روبان */
  x.textAlign = 'center'; x.font = F(22, 700);
  const rb = '👑 برنامه اختصاصی پریمیوم ولتکس';
  const rbw = x.measureText(rb).width + 62;
  const rcx = P + rbw/2 + 40;
  rr(rcx - rbw/2, 148, rbw, 56, 28);
  x.fillStyle = 'rgba(226,196,106,.12)'; x.fill();
  x.strokeStyle = 'rgba(226,196,106,.55)'; x.lineWidth = 2; x.stroke();
  x.fillStyle = gold; x.fillText(rb, rcx, 178);

  /* وسط: پلاک نام قهرمان */
  if (d.name){
    x.fillStyle = 'rgba(226,196,106,.9)'; x.font = F(16, 700);
    x.fillText('—  معرفی قهرمان ولتکس  —', W/2, 110);
    const nm = d.name;
    x.font = F(42, 900);
    const nw = Math.min(x.measureText(nm).width, 560);
    const bw = nw + 130, bx = W/2 - bw/2, by = 130, bh = 68;
    const pg = x.createLinearGradient(bx, by, bx + bw, by + bh);
    pg.addColorStop(0,'rgba(226,196,106,.16)'); pg.addColorStop(.5,'rgba(255,255,255,.05)'); pg.addColorStop(1,'rgba(34,197,94,.12)');
    rr(bx, by, bw, bh, 34); x.fillStyle = pg; x.fill();
    const bg2 = x.createLinearGradient(bx, 0, bx + bw, 0);
    bg2.addColorStop(0,'#8a6d2f'); bg2.addColorStop(.5,'#ffe9a8'); bg2.addColorStop(1,'#8a6d2f');
    x.strokeStyle = bg2; x.lineWidth = 2.6; x.stroke();
    const ng = x.createLinearGradient(bx, 0, bx + bw, 0);
    ng.addColorStop(0,'#fdf3cf'); ng.addColorStop(.5,'#e2c46a'); ng.addColorStop(1,'#fdf3cf');
    x.fillStyle = ng;
    x.shadowColor = 'rgba(226,196,106,.5)'; x.shadowBlur = 16;
    x.fillText(fitText(nm, bw - 110, 42, 900), W/2, by + bh/2 + 2);
    x.shadowBlur = 0;
    x.fillStyle = gold; x.font = F(19, 400);
    x.fillText('✦', bx + 40, by + bh/2 + 2);
    x.fillText('✦', bx + bw - 40, by + bh/2 + 2);
  }

  /* عنوان هدف */
  const tg = x.createLinearGradient(W/2-300, 0, W/2+300, 0);
  tg.addColorStop(0,'#ffffff'); tg.addColorStop(.55,'#b9f6cd'); tg.addColorStop(1,'#f2dfae');
  x.textAlign = 'center'; x.fillStyle = tg; x.font = F(68, 900);
  x.fillText(fitText(d.goal, 1000, 68, 900), W/2, 286);

  /* چیپ‌ها */
  const chips = [d.level, faNum(d.days) + ' روز در هفته', d.place];
  x.font = F(21, 700);
  const cgap = 16, cpad = 26, cy0 = 330;
  const cws = chips.map(c => x.measureText(c).width + cpad*2);
  let ccx = W/2 - (cws.reduce((a,b)=>a+b,0) + cgap*(chips.length-1)) / 2;
  chips.forEach((c, i) => {
    rr(ccx, cy0, cws[i], 50, 25);
    x.fillStyle = 'rgba(255,255,255,.05)'; x.fill();
    x.strokeStyle = 'rgba(74,222,128,.42)'; x.lineWidth = 1.6; x.stroke();
    x.fillStyle = '#d2ead2'; x.fillText(c, ccx + cws[i]/2, cy0 + 27);
    ccx += cws[i] + cgap;
  });

  /* ---------- ستون چپ: پنل آناتومی ---------- */
  const AP = {x: P, y: 388, w: 560, h: 748};
  rr(AP.x, AP.y, AP.w, AP.h, 28);
  x.fillStyle = 'rgba(13,21,13,.94)'; x.fill();
  x.strokeStyle = 'rgba(226,196,106,.38)'; x.lineWidth = 2; x.stroke();
  secTitle('💪 عضلات هدف برنامه', AP.y + 42, AP.x + AP.w/2, 100);

  const figW = 254, figH = Math.round(figW * 1376 / 768);
  const figsY = AP.y + 112;
  const FR = {dx: AP.x + 16, dy: figsY, fw: figW, fh: figH};
  const BK = {dx: AP.x + AP.w - 16 - figW, dy: figsY, fw: figW, fh: figH};
  const frontImg = d._imgMap && d._imgMap.front, backImg = d._imgMap && d._imgMap.back;
  x.textAlign = 'center';
  [FR, BK].forEach((R, i) => {
    const im = i === 0 ? frontImg : backImg;
    rr(R.dx - 3, R.dy - 3, R.fw + 6, R.fh + 6, 21);
    x.fillStyle = 'rgba(0,0,0,.45)'; x.fill();
    x.save(); rr(R.dx, R.dy, R.fw, R.fh, 18); x.clip();
    if (im) x.drawImage(im, 0, 0, im.width, im.height, R.dx, R.dy, R.fw, R.fh);
    else { x.fillStyle = '#0b120b'; x.fillRect(R.dx, R.dy, R.fw, R.fh); x.fillStyle = 'rgba(34,197,94,.3)'; x.font = F(46, 700); x.fillText('🏃', R.dx + R.fw/2, R.dy + R.fh/2); }
    x.restore();
    x.strokeStyle = 'rgba(226,196,106,.55)'; x.lineWidth = 2; rr(R.dx, R.dy, R.fw, R.fh, 18); x.stroke();
    x.fillStyle = 'rgba(200,215,200,.8)'; x.font = F(18, 500);
    x.fillText(i === 0 ? 'نمای جلو' : 'نمای پشت', R.dx + R.fw/2, R.dy + R.fh + 26);
  });
  const dotAt = (px, py) => {
    const g = x.createRadialGradient(px, py, 0, px, py, 11);
    g.addColorStop(0, 'rgba(74,222,128,.75)'); g.addColorStop(1, 'rgba(74,222,128,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, 11, 0, 7); x.fill();
    x.beginPath(); x.arc(px, py, 4, 0, 7); x.fillStyle = '#ffd977'; x.fill();
    x.lineWidth = 1.4; x.strokeStyle = '#ffffff'; x.stroke();
  };
  (d.muscleKeys || []).forEach(mk => (MUSCLE_POS[mk] || []).forEach(sp => {
    const R = sp[0] === 0 ? FR : BK;
    dotAt(R.dx + sp[1] * R.fw, R.dy + sp[2] * R.fh);
  }));
  /* راهنمای عضلات */
  const wrap = (items, cx, y, maxW, font, bh) => {
    x.font = font; const gap = 10, padH = 18; x.textAlign = 'center';
    let row = [], rowW = 0; const out = [];
    items.forEach(t => {
      const w = x.measureText(t).width + padH * 2;
      if (rowW + w + (row.length ? gap : 0) > maxW && row.length){ out.push(row); row = []; rowW = 0; }
      row.push({t, w}); rowW += w + (row.length > 1 ? gap : 0);
    });
    if (row.length) out.push(row);
    out.forEach((r, ri) => {
      const wsum = r.reduce((a,c)=>a+c.w,0) + gap*(r.length-1);
      let px = cx - wsum/2;
      r.forEach(c => {
        rr(px, y + ri*(bh+gap), c.w, bh, bh/2);
        x.fillStyle = 'rgba(34,197,94,.10)'; x.fill(); x.strokeStyle = 'rgba(74,222,128,.4)'; x.lineWidth = 1.5; x.stroke();
        x.fillStyle = '#c9eccc'; x.fillText(c.t, px + c.w/2, y + ri*(bh+gap) + bh/2 + 1);
        px += c.w + gap;
      });
    });
  };
  const legend = (d.muscleKeys || []).map(mk => MUSCLE_FA[mk]).filter(Boolean).slice(0, 10);
  if (legend.length) wrap(legend, AP.x + AP.w/2, AP.y + AP.h - 110, AP.w - 36, F(17, 700), 34);

  /* ---------- ستون راست: برنامه هفتگی ---------- */
  const RX = P + AP.w + 32, RW = W - P - RX, RC = RX + RW/2;
  secTitle('📋 برنامه هفتگی — حرکات و ست ×‌ تکرار', AP.y + 42, RC);
  const cardW = (RW - 16) / 2, cardH = 128, cardsY = AP.y + 74;
  rows.forEach((day, i) => {
    const cxi = i % 2, cyi = Math.floor(i / 2);
    const dx = RX + cxi * (cardW + 16), dy = cardsY + cyi * (cardH + 14);
    rr(dx, dy, cardW, cardH, 20);
    x.fillStyle = 'rgba(13,21,13,.95)'; x.fill();
    x.strokeStyle = 'rgba(226,196,106,.32)'; x.lineWidth = 1.6; x.stroke();
    /* سربرگ کارت */
    x.beginPath(); x.arc(dx + cardW - 37, dy + 27, 19, 0, 7);
    x.fillStyle = 'rgba(226,196,106,.15)'; x.fill(); x.strokeStyle = gold; x.lineWidth = 2; x.stroke();
    x.fillStyle = gold; x.font = F(18, 900); x.textAlign = 'center';
    x.fillText('روز ' + faNum(i+1), dx + cardW - 37, dy + 28);
    x.textAlign = 'right'; x.fillStyle = '#f2f7f2'; x.font = F(21, 700);
    x.fillText(fitText(day.fa, cardW - 118, 21, 700), dx + cardW - 70, dy + 27);
    x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(dx + 18, dy + 48); x.lineTo(dx + cardW - 18, dy + 48); x.stroke();
    /* ردیف حرکت‌ها */
    day.ex.slice(0, 3).forEach((r, ri) => {
      const ry = dy + 56 + ri * 21;
      rr(dx + 14, ry, cardW - 28, 18, 9);
      x.fillStyle = 'rgba(255,255,255,.045)'; x.fill();
      x.font = F(14, 700);
      const sw = x.measureText(r[1]).width + 18;
      rr(dx + 19, ry + 1, sw, 16, 8);
      x.fillStyle = 'rgba(226,196,106,.15)'; x.fill();
      x.strokeStyle = 'rgba(226,196,106,.4)'; x.lineWidth = 1; x.stroke();
      x.fillStyle = gold; x.textAlign = 'center';
      x.fillText(r[1], dx + 19 + sw / 2, ry + 9.5);
      x.fillStyle = 'rgba(205,222,205,.96)'; x.textAlign = 'right'; x.font = F(16, 400);
      x.fillText(fitText(r[0], cardW - 42 - sw, 16), dx + cardW - 23, ry + 9.5);
    });
    if (day.ex.length > 3){
      x.fillStyle = 'rgba(226,196,106,.85)'; x.textAlign = 'right'; x.font = F(14, 500);
      x.fillText('+ ' + faNum(day.ex.length - 3) + ' حرکت دیگر', dx + cardW - 23, dy + 56 + 3 * 21 + 9);
    }
    x.textAlign = 'center';
  });
  const weekRows = Math.max(1, Math.ceil(rows.length / 2));
  const cardsEnd = cardsY + weekRows * cardH + (weekRows - 1) * 14;

  /* ---------- پشته مکملی ---------- */
  const suppTitleY = cardsEnd + 38;
  if (supp.length){
    secTitle('💊 پشته مکملی + دوز مصرف', suppTitleY, RC);
    const suppCardsY = suppTitleY + 38;
    const w3 = (RW - 2*16) / 3;
    let pi = 0;
    supp.forEach((s, i) => {
      const dx = RX + i * (w3 + 16), dy = suppCardsY;
      rr(dx, dy, w3, 172, 20);
      x.fillStyle = 'rgba(13,21,13,.95)'; x.fill();
      x.strokeStyle = 'rgba(226,196,106,.32)'; x.lineWidth = 1.6; x.stroke();
      const ccx2 = dx + w3/2, ccy = dy + 52, cr = 40;
      x.beginPath(); x.arc(ccx2, ccy, cr, 0, 7);
      x.fillStyle = '#0a100a'; x.fill(); x.strokeStyle = gold; x.lineWidth = 2.4; x.stroke();
      const im = s.img && d._imgMap ? (d._imgMap.products[pi++] || null) : null;
      if (im){
        x.save(); x.beginPath(); x.arc(ccx2, ccy, cr - 3, 0, 7); x.clip();
        x.drawImage(im, ccx2 - (cr-3), ccy - (cr-3), (cr-3)*2, (cr-3)*2);
        x.restore();
      } else {
        x.fillStyle = grn; x.font = F(30, 700); x.textAlign = 'center'; x.fillText('💊', ccx2, ccy + 2);
      }
      x.fillStyle = '#eef6ee'; x.font = F(18, 700); x.textAlign = 'center';
      x.fillText(fitText(s.name, w3 - 24, 18, 700), ccx2, dy + 122);
      x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(dx + 22, dy + 138); x.lineTo(dx + w3 - 22, dy + 138); x.stroke();
      x.fillStyle = '#fdba74'; x.font = F(15, 500);
      x.fillText(fitText(DOSAGE[s.id] || 'طبق دستور روی بسته', w3 - 24, 15), ccx2, dy + 154);
    });
  }

  /* ---------- فوتر ---------- */
  const QUOTES = {
    muscle:  'نیرو در روزهای سخت ساخته می‌شود، نه روزهای آسان',
    fat:     'بدنت می‌تواند؛ ذهنت را متقاعد کن',
    strength:'رکوردها برای شکسته شدن‌اند',
    fitness: 'هر تکرار، یک سنگ‌بنای شاهکار توست',
  };
  x.fillStyle = 'rgba(255,255,255,.9)'; x.font = F(21, 700); x.textAlign = 'center';
  x.fillText('«' + (QUOTES[d.goalKey] || QUOTES.fitness) + '»', W/2, 1154);
  x.fillStyle = gold; x.font = F(17, 900); x.textAlign = 'left';
  x.fillText('⚡ VOLTEX.FIT', P + 20, 1154);
  x.fillStyle = 'rgba(154,167,154,.85)'; x.font = F(15, 500); x.textAlign = 'right';
  let ds = ''; try { ds = new Intl.DateTimeFormat('fa-IR', {dateStyle:'long'}).format(new Date()); } catch(e){}
  x.fillText('شناسه برنامه: VT-' + faNum(Math.floor(Date.now()/1000) % 100000) + (ds ? ' · ' + ds : ''), W - P - 20, 1154);

  return cv.toDataURL('image/png');
}

  function loadImgs(urls){
    return Promise.all(urls.map(u => new Promise(res => {
      let done = false;
      const fin = v => { if (!done){ done = true; res(v); } };
      const tm = setTimeout(() => fin(null), 1600);
      try {
        const im = new Image();
        im.onload = () => { clearTimeout(tm); fin(im); };
        im.onerror = () => { clearTimeout(tm); fin(null); };
        im.src = u;
      } catch(e){ clearTimeout(tm); fin(null); }
    })));
  }
  function openHeroPoster(data){
    const prodUrls = (data.stackItems || []).map(s => s.img).filter(Boolean);
    const urls = ['assets/img/anat-front.jpg', 'assets/img/anat-back.jpg', ...prodUrls];
    const apply = imgs => {
      data._imgMap = {front: imgs[0], back: imgs[1], products: imgs.slice(2)};
      let url = '';
      try { url = heroPoster(data); } catch(e){ console.warn(e); }
      if (!url) return;
      $('#posterImg').src = url;
      $('#posterDl').href = url;
      $('#posterModal').classList.add('show');
      document.body.style.overflow = 'hidden';
      if (window.confettiBurst){
        confettiBurst(innerWidth*.5, innerHeight*.28, 100);
        setTimeout(() => confettiBurst(innerWidth*.16, innerHeight*.18, 65), 220);
        setTimeout(() => confettiBurst(innerWidth*.84, innerHeight*.18, 65), 380);
      }
    };
    const go = () => loadImgs(urls).then(apply);
    if (document.fonts && document.fonts.load){
      Promise.all([
        document.fonts.load('900 76px YekanBakh'),
        document.fonts.load('700 27px YekanBakh'),
        document.fonts.load('400 17px YekanBakh'),
      ]).then(go).catch(go);
    } else go();
  }
  window.openHeroPoster = openHeroPoster;

  function closePoster(){ $('#posterModal').classList.remove('show'); document.body.style.overflow = ''; }
  $('#posterClose').addEventListener('click', closePoster);
  $('#posterModal').addEventListener('click', e => { if (e.target.id === 'posterModal') closePoster(); });
  $('#posterAgain').addEventListener('click', () => {
    closePoster();
    const pl = document.getElementById('progPlan');
    if (pl) pl.scrollIntoView({behavior:'smooth'});
  });
})();
