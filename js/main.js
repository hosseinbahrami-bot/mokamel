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
const ALL_PRODUCTS = [...PRODUCTS, ...PRODUCTS_SOON];

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
const state = { cat:'all', sort:'pop', q:'' };
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
          <b>${money(p.price)} <span class="toman">تومان</span></b>
          ${p.old ? `<s>${money(p.old)}</s>` : ''}
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
  let list = ALL_PRODUCTS.filter(p =>
    (state.cat === 'all' || p.cat === state.cat) &&
    (!state.q || p.name.includes(state.q) || p.brand.toLowerCase().includes(state.q.toLowerCase()) || p.desc.includes(state.q))
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
function cartTotal(){ return Object.entries(cart).reduce((s,[id,i]) => s + P(id).price * i.qty, 0); }

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
    box.innerHTML = entries.map(([key, it]) => {
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
$('#couponBtn').addEventListener('click', () => {
  const code = $('#couponInput').value.trim().toUpperCase();
  if (COUPONS[code]){ coupon = COUPONS[code]; toast(`کد تخفیف اعمال شد: ${coupon.label} 🎁`); }
  else { coupon = null; toast('کد تخفیف نامعتبر است', 'err'); }
  renderCart();
});

/* ---------- تسویه حساب ---------- */
$('#checkoutBtn').addEventListener('click', () => {
  if (!cartCount()) return toast('سبد خرید خالی است!', 'warn');
  closeCart();
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
  const total = $('#cGrand')?.textContent || '';
  $('#orderCode').textContent = code;
  $('#checkoutForm').style.display = 'none';
  $('#checkoutSuccess').style.display = 'flex';
  cart = {}; coupon = null; persistCart();
  toast('سفارش با موفقیت ثبت شد 🎉');
});
$$('[data-back-shop]').forEach(b => b.addEventListener('click', () => {
  closeCheckout();
  $('#checkoutForm').style.display = 'grid';
  $('#checkoutSuccess').style.display = 'none';
  $('#shop').scrollIntoView({behavior:'smooth'});
}));

/* ---------- مشاهده سریع ---------- */
let qvState = {id:null, opts:{}, qty:1};
function openQuickView(id){
  const p = P(id);
  qvState = {id, opts:{}, qty:1};
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
    <div class="qv-price"><b id="qvPrice">${money(p.price)}</b> <span class="toman">تومان</span> ${p.old ? `<s>${money(p.old)}</s>` : ''}</div>
    <div style="display:flex;gap:12px;align-items:center">
      <div class="qty" style="height:48px">
        <button style="width:42px;height:100%" data-qvq="-1">−</button>
        <b id="qvQty" style="min-width:40px;font-size:1rem">${faNum(1)}</b>
        <button style="width:42px;height:100%" data-qvq="1">+</button>
      </div>
      <button class="btn btn-orange" id="qvAdd" style="flex:1">افزودن به سبد خرید</button>
    </div>`;
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
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ closeQV(); closeCart(); closeCheckout(); }
});

/* ---------- آناتومی ---------- */
function buildAnatomy(){
  $$('.mgrp').forEach(g => g.addEventListener('click', () => {
    $$('.mgrp').forEach(m => m.classList.remove('sel'));
    g.classList.add('sel');
    showMuscle(g.dataset.m);
  }));
  $$('.anat-toggle button').forEach(b => b.addEventListener('click', () => {
    $$('.anat-toggle button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $$('.anat-body').forEach(v => v.classList.remove('show'));
    $(b.dataset.view).classList.add('show');
    $$('.mgrp').forEach(m => m.classList.remove('sel'));
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
  const goal = $('#goalSel').value, level = $('#levelSel').value, days = +$('#daysSel').value, place = $('#placeSel').value;
  const G = GOALS[goal], L = LEVELS[level];
  const dayMap = SPLITS[days];

  const planHTML = dayMap.m.map((key, di) => {
    let ex = EXBANK[key].ex.map(r => [...r]);
    if (place === 'home') ex = ex.map(r => {
      let n = r[0];
      HOME_FIX.forEach(([a,b]) => n = n.replaceAll(a,b));
      return [n, r[1], r[2]];
    });
    if (goal === 'strength') ex = ex.map(r => [r[0], '۵ × ۳-۵', '۲-۳ دقیقه']);
    if (goal === 'fat') ex = ex.map(r => [r[0], r[1].replace(/[۰-۹]+-[۰-۹]+$/, '۱۲-۱۵'), r[2]]);
    if (level === 'beginner') ex = ex.map(r => [r[0], r[1].replace(/^[۰-۹]+/, m => faNum(Math.max(2, +m.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) - 1))), r[2]]);
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

  $('#copyPlan').addEventListener('click', () => {
    let txt = `برنامه ${G.fa} — ${L.fa} (${faNum(days)} روز)\n\n`;
    dayMap.m.forEach((key, di) => {
      txt += `روز ${faNum(di+1)}: ${EXBANK[key].fa}\n`;
      EXBANK[key].ex.forEach(r => txt += `  • ${r[0]} — ${r[1]}\n`);
      txt += '\n';
    });
    navigator.clipboard.writeText(txt).then(() => toast('برنامه در کلیپ‌بورد کپی شد 📋'));
  });
  $('#progPlan').scrollIntoView({behavior:'smooth', block:'start'});
  toast('برنامه اختصاصی شما آماده شد! 💪');
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

/* ---------- شروع ---------- */
const BRANDS = ['VOLTEX NUTRITION','OPTIMUM NUTRITION','MYPROTEIN','BIOTECH USA','SCITEC NUTRITION','MUSCLETECH','DYMATIZE','CELLUCOR'];
$('#brandMarquee').innerHTML = [...BRANDS, ...BRANDS].map(b => `<span>${b}</span>`).join('');
renderProducts();
persistCart();
