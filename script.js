// ------------------- Traductions -------------------
const I18N = {
  fr: {
    brandTitle: 'Pharmacie Lamine', brandTag: 'Santé & Bien-être',
    navProducts: 'Produits', navCart: 'Panier', navContact: 'Contact',
    heroTitle: 'Votre santé, notre priorité', heroSubtitle: 'Catalogue de parapharmacie. Réservez vos produits et retirez en pharmacie.', heroCta: 'Voir le catalogue', heroCart: 'Voir mon panier',
    productsTitle: 'Produits', catalogHint: 'Astuce : cliquez sur “Ajouter au panier” pour réserver.',
    addToCart: 'Ajouter au panier', inCart: 'Dans le panier',
    cartTitle: 'Panier de réservation', cartEmpty: 'Votre panier est vide.',
    thProduct: 'Produit', thPrice: 'Prix', thQty: 'Qté', thSubtotal: 'Sous-total', totalLabel: 'Total estimatif',
    reserveTitle: 'Valider la réservation', reserveBtn: 'Envoyer la demande de réservation', reserveNote: 'Aucun paiement en ligne. Nous vous recontactons pour confirmer la disponibilité.',
    formNameLabel: 'Nom complet', formPhoneLabel: 'Téléphone', formEmailLabel: 'E-mail', formMsgLabel: 'Message / Remarques',
    contactTitle: 'Contact', contactSubtitle: 'Écrivez-nous — nous vous répondons rapidement.', rights: 'Tous droits réservés.'
  },
  ar: {
    brandTitle: 'صيدلية لمين', brandTag: 'الصحة والعافية',
    navProducts: 'المنتجات', navCart: 'السلة', navContact: 'اتصل بنا',
    heroTitle: 'صحتكم أولويتنا', heroSubtitle: 'كتالوج بارافارمسي. احجزوا منتجاتكم واستلموها من الصيدلية.', heroCta: 'عرض الكتالوج', heroCart: 'عرض السلة',
    productsTitle: 'المنتجات', catalogHint: 'نصيحة: اضغط «أضف إلى السلة» للحجز.',
    addToCart: 'أضف إلى السلة', inCart: 'في السلة',
    cartTitle: 'سلة الحجز', cartEmpty: 'سلتك فارغة.',
    thProduct: 'المنتج', thPrice: 'السعر', thQty: 'الكمية', thSubtotal: 'الإجمالي الفرعي', totalLabel: 'الإجمالي التقديري',
    reserveTitle: 'تأكيد الحجز', reserveBtn: 'إرسال طلب الحجز', reserveNote: 'لا يوجد دفع عبر الإنترنت. سنتواصل معك لتأكيد التوفر.',
    formNameLabel: 'الاسم الكامل', formPhoneLabel: 'الهاتف', formEmailLabel: 'البريد الإلكتروني', formMsgLabel: 'ملاحظات',
    contactTitle: 'الاتصال', contactSubtitle: 'راسلونا — سنجيبكم سريعًا.', rights: 'جميع الحقوق محفوظة.'
  }
};

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const CART_KEY = 'lamine_cart_v1';

// catalogue en mémoire
let ALL_PRODUCTS = [];
let FILTERED_PRODUCTS = [];

// ------------------- Gestion langue -------------------
function applyLang(lang) {
  const dict = I18N[lang] || I18N.fr;
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

  for (const k in dict) {
    document.querySelectorAll(`[data-i18n="${k}"]`).forEach(el => el.textContent = dict[k]);
  }

  localStorage.setItem('lang', lang);
  $('#btn-fr').classList.toggle('active', lang === 'fr');
  $('#btn-ar').classList.toggle('active', lang === 'ar');

  renderCart();
  renderGrid(); 
}

// ------------------- Gestion panier -------------------
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch (e) { return []; }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartCount();
}

function updateCartCount() {
  const count = getCart().reduce((a, i) => a + i.qty, 0);
  $('#cart-count').textContent = count;
}

function addToCart(prod) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === prod.id);
  if (idx > -1) {
    cart[idx].qty++;
  } else {
    cart.push({ id: prod.id, name: prod.name, brand: prod.brand, price: prod.price, qty: 1 });
  }
  saveCart(cart);
  renderCart();
  renderGrid();
}

function setQty(id, qty) {
  const cart = getCart();
  const it = cart.find(i => i.id === id);
  if (!it) return;
  it.qty = Math.max(1, qty | 0);
  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  saveCart(getCart().filter(i => i.id !== id));
  renderCart();
  renderGrid();
}

function clearCart() {
  saveCart([]);
  renderCart();
  renderGrid();
}

function formatPrice(p) {
  return new Intl.NumberFormat(
    document.documentElement.lang === 'ar' ? 'ar-DZ' : 'fr-DZ',
    { style: 'currency', currency: 'DZD' }
  ).format(p);
}

function renderCart() {
  const items = getCart();
  $('#cart-empty').style.display = items.length ? 'none' : 'block';
  $('#cart-area').style.display = items.length ? 'block' : 'none';

  const tbody = $('#cart-items');
  let total = 0;

  tbody.innerHTML = items.map(it => {
    const sub = (it.price || 0) * it.qty;
    total += sub;
    return `<tr>
      <td>${it.name}<div class="muted">${it.brand || ''}</div></td>
      <td>${formatPrice(it.price || 0)}</td>
      <td><input type="number" min="1" value="${it.qty}" style="width:70px" onchange="setQty('${it.id}', this.value)"></td>
      <td>${formatPrice(sub)}</td>
      <td><button class="btn btn-ghost" onclick="removeItem('${it.id}')">✕</button></td>
    </tr>`;
  }).join('');

  $('#cart-total').textContent = formatPrice(total);
  updateCartCount();
}

function buildMailto(name, phone, email, note) {
  const items = getCart();
  const lines = items.map(i => `- ${i.name} (${i.brand || ''}) x${i.qty} → ${formatPrice((i.price || 0) * i.qty)}`);
  const total = items.reduce((a, i) => a + (i.price || 0) * i.qty, 0);

  const subject = encodeURIComponent(`[Réservation] ${name} – Panier Pharmacie Lamine`);
  const body = encodeURIComponent(
`Coordonnées
Nom: ${name}
Téléphone: ${phone}
Email: ${email}

Produits:
${lines.join('\n')}

Total estimatif: ${formatPrice(total)}

Remarques:
${note || ''}`
  );

  return `mailto:pharmacie.lamine31@gmail.com?subject=${subject}&body=${body}`;
}

// ------------------- Catalogue: Google Sheet + fallback JSON -------------------
const sheetURL = "https://script.google.com/macros/s/AKfycbylv4wbO6rbxswAFdx77ywdM479gkdzXqn_qQR5FE6OB9DcLzRxkgInwsvGttY8QGFQ/exec";



// normalisation données Google Sheet
async function fetchFromSheet() {
  const res = await fetch(sheetURL);
  if (!res.ok) throw new Error('Réponse Sheet non OK');
  const raw = await res.json();

  // Normalisation des catégories (Google Sheet → catégories officielles)
  const normalizeCategory = (cat = "") => {
    cat = cat.trim().toLowerCase();

    if (cat.includes("appareil")) return "Appareils & Accessoires";
    if (cat.includes("cheveu")) return "Capillaire";
    if (cat.includes("complement") || cat.includes("complément")) return "Compléments alimentaires";
    if (cat.includes("bébé") || cat.includes("bebe") || cat.includes("maman")) return "Maman & Bébé";
    if (cat.includes("visage")) return "Visage & Beauté";
    if (cat.includes("hygiene") || cat.includes("hygiène")) return "Hygiène & Soins";
    if (cat.includes("nutrition") || cat.includes("minceur")) return "Nutrition";
    if (cat.includes("dermo")) return "Dermocosmétique";

    return cat || "Divers";
  };

  return raw.map((row, idx) => {
    let imgCell = row['Image (nom du fichier ou lien)'] || row.image || '';

    // Ajouter automatiquement .jpg si aucune extension trouvée
    if (imgCell && !imgCell.includes('.') && !imgCell.startsWith("http")) {
      imgCell = imgCell + ".jpg";
    }

    return {
      id: row.ID || row.id || `S${idx + 1}`,
      name: row.Produit || row['Produit'] || row.Name || '',
      cat: normalizeCategory(row.categorie || row['Catégorie'] || row['categorie'] || ''),
      brand: row.Marque || row['Marque'] || row.brand || '',
      price: Number(row['Prix Vente'] || row.prix || row.Price || 0) || 0,
      image: imgCell
        ? (imgCell.startsWith('http') ? imgCell : `assets/${imgCell}`)
        : 'assets/placeholder.png'
    };
  }).filter(p => p.name);
}

// normalisation données PRODUITS.json
async function fetchFromJson() {
  const res = await fetch('PRODUITS.json');
  if (!res.ok) throw new Error('PRODUITS.json introuvable');
  const raw = await res.json();

  return raw.map((row, idx) => ({
    id: row.id || `J${idx + 1}`,
    name: row.name,
    cat: row.cat || '',
    brand: row.brand || '',
    price: Number(row.price || 0) || 0,
    image: row.image && row.image !== 'nan'
      ? (row.image.startsWith('http') ? row.image : `assets/${row.image}`)
      : 'assets/placeholder.png'
  })).filter(p => p.name);
}

async function chargerCatalogue() {
  try {
    ALL_PRODUCTS = await fetchFromSheet();
    console.log('Catalogue chargé depuis Google Sheet');
  } catch (e) {
    console.error('Erreur Sheet, bascule sur PRODUITS.json :', e);
    try {
      ALL_PRODUCTS = await fetchFromJson();
      console.log('Catalogue chargé depuis PRODUITS.json');
    } catch (e2) {
      console.error('Erreur PRODUITS.json, aucun produit disponible :', e2);
      ALL_PRODUCTS = [];
    }
  }

  initFilters();
  applyFilters();
}

// ------------------- Filtres & rendu catalogue -------------------
function initFilters() {
  const catSelect = $('#cat');
  const brandSelect = $('#brand');

  const cats = Array.from(new Set(ALL_PRODUCTS.map(p => p.cat).filter(Boolean))).sort();
  const brands = Array.from(new Set(ALL_PRODUCTS.map(p => p.brand).filter(Boolean))).sort();

  catSelect.innerHTML = `<option value="">Toutes catégories</option>` +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');

  brandSelect.innerHTML = `<option value="">Toutes marques</option>` +
    brands.map(b => `<option value="${b}">${b}</option>`).join('');
}

function applyFilters() {
  const q = ($('#q').value || '').toLowerCase().trim();
  const cat = $('#cat').value;
  const brand = $('#brand').value;

  FILTERED_PRODUCTS = ALL_PRODUCTS.filter(p => {
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.cat && p.cat.toLowerCase().includes(q));

    const matchCat = !cat || p.cat === cat;
    const matchBrand = !brand || p.brand === brand;

    return matchQ && matchCat && matchBrand;
  });

  renderGrid();
}

function renderGrid() {
  const grid = $('#grid');
  if (!grid) return;

  const lang = document.documentElement.lang || 'fr';
  const t = I18N[lang] || I18N.fr;
  const cart = getCart();

  if (!FILTERED_PRODUCTS.length) {
    grid.innerHTML = `<p class="muted">Aucun produit trouvé.</p>`;
    return;
  }

  grid.innerHTML = FILTERED_PRODUCTS.map(p => {
    const inCart = cart.some(i => i.id === p.id);
    const btnLabel = inCart ? t.inCart : t.addToCart;
    const btnDisabled = inCart ? 'disabled' : '';

    const safeImage = p.image || 'assets/placeholder.png';

    return `
      <div class="card">
<div class="img-wrap">
  <img src="${safeImage}" alt="${p.name}">
</div>

        
        <h4>${p.name}</h4>
        <div class="muted">${p.brand || ''}</div>
        <div class="muted">${p.cat || ''}</div>
        <div class="price" style="margin-top:6px">${formatPrice(p.price || 0)}</div>
        <div class="spacer"></div>
        <button class="btn" ${btnDisabled} onclick="addToCart(${JSON.stringify({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: p.price
        }).replace(/"/g, '&quot;')})">
          ${btnLabel}
        </button>
      </div>
    `;
  }).join('');
}

// ------------------- Initialisation -------------------
document.addEventListener('DOMContentLoaded', async () => {
  $('#year').textContent = new Date().getFullYear();

  $('#btn-fr').addEventListener('click', () => applyLang('fr'));
  $('#btn-ar').addEventListener('click', () => applyLang('ar'));
  applyLang(localStorage.getItem('lang') || 'fr');

  if ($('#q')) $('#q').addEventListener('input', applyFilters);
  if ($('#cat')) $('#cat').addEventListener('change', applyFilters);
  if ($('#brand')) $('#brand').addEventListener('change', applyFilters);

  await chargerCatalogue();

  $('#reserve-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const href = buildMailto(fd.get('name'), fd.get('phone'), fd.get('email'), fd.get('note'));
    window.location.href = href;
  });

  $('#clear-cart').addEventListener('click', clearCart);

  renderCart();
});
