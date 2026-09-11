// =========================================================================
// GLC Landing Page — order form logic
// =========================================================================

const DISTRICTS = [
  "Bagerhat","Bandarban","Barguna","Barishal","Bhola","Bogura","Brahmanbaria","Chandpur",
  "Chapainawabganj","Chattogram","Chuadanga","Cox's Bazar","Cumilla","Dhaka","Dinajpur","Faridpur","Feni",
  "Gaibandha","Gazipur","Gopalganj","Habiganj","Jamalpur","Jashore","Jhalokati","Jhenaidah",
  "Joypurhat","Khagrachhari","Khulna","Kishoreganj","Kurigram","Kushtia","Lakshmipur",
  "Lalmonirhat","Madaripur","Magura","Manikganj","Meherpur","Moulvibazar","Munshiganj",
  "Mymensingh","Naogaon","Narail","Narayanganj","Narsingdi","Natore","Netrokona","Nilphamari",
  "Noakhali","Pabna","Panchagarh","Patuakhali","Pirojpur","Rajbari","Rajshahi","Rangamati",
  "Rangpur","Satkhira","Shariatpur","Sherpur","Sirajganj","Sunamganj","Sylhet","Tangail",
  "Thakurgaon"
];

const els = {};
let supabaseClient;
document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheEls();
  supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  populateDistricts();
  wireQuantityStepper();
  populatePricesFromConfig();
  wireForm();
  wireLeadCapture();
  wireScrollReveal();
  wireCopyButtons();
  wireMobileCta();
  trackViewContent();
  document.getElementById("year").textContent = new Date().getFullYear();
}

// Meta Pixel ViewContent — landing page load হওয়ার সাথে সাথেই fire হবে
function trackViewContent() {
  if (typeof fbq !== "function") return;
  fbq('track', 'ViewContent', {
    content_name: CONFIG.PRODUCT_NAME,
    content_type: 'product',
    value: parseFloat((CONFIG.DISCOUNT_PRICE / CONFIG.USD_CONVERSION_RATE).toFixed(2)),
    currency: 'USD',
  });
}

// ---------------------------------------------------------------------
// Scroll-reveal — fade+rise sections into view as the visitor scrolls
// ---------------------------------------------------------------------
function wireScrollReveal() {
  const targets = document.querySelectorAll(
    ".product-show__grid, .why__card, .how__step, .order-card, .faq__item"
  );
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach(el => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(i % 4) * 60}ms`;
    observer.observe(el);
  });
}

function cacheEls() {
  [
    "orderForm","website","customerName","phone","address","district","quantity",
    "qtyEcho","productTotal","deliveryEcho","grandTotal",
    "advanceEcho","advanceEcho2","codEcho","bkashNumber","nagadNumber",
    "paymentMethod","senderNumber","trxId","submitBtn","formStatus",
    "regularPrice","discountPrice","savePercent",
    "mobileCta","mobileCtaPrice","mobileCtaOldPrice"
  ].forEach(id => (els[id] = document.getElementById(id)));
}

function populateDistricts() {
  const input = els.district;
  const list = document.getElementById("districtSuggestions");

  function renderSuggestions(query) {
    const q = query.trim().toLowerCase();
    const matches = q ? DISTRICTS.filter(name => name.toLowerCase().includes(q)) : DISTRICTS;

    list.innerHTML = "";
    if (matches.length === 0) {
      list.innerHTML = `<div class="autocomplete-empty">কোনো জেলা পাওয়া যায়নি</div>`;
    } else {
      matches.forEach(name => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.setAttribute("role", "option");
        item.textContent = name;
        item.addEventListener("mousedown", (e) => {
          e.preventDefault();
          input.value = name;
          list.hidden = true;
        });
        list.appendChild(item);
      });
    }
    list.hidden = false;
  }

  input.addEventListener("focus", () => renderSuggestions(input.value));
  input.addEventListener("input", () => renderSuggestions(input.value));
  input.addEventListener("blur", () => {
    setTimeout(() => { list.hidden = true; }, 120);
  });
}

function populatePricesFromConfig() {
  els.regularPrice.textContent = CONFIG.REGULAR_PRICE;
  els.discountPrice.textContent = CONFIG.DISCOUNT_PRICE;
  const pct = Math.round((1 - CONFIG.DISCOUNT_PRICE / CONFIG.REGULAR_PRICE) * 100);
  els.savePercent.textContent = `${pct}% ছাড়`;
  els.deliveryEcho.textContent = CONFIG.DELIVERY_CHARGE;
  els.advanceEcho.textContent = CONFIG.DELIVERY_CHARGE;
  els.advanceEcho2.textContent = CONFIG.DELIVERY_CHARGE;
  els.bkashNumber.textContent = CONFIG.PAYMENT_NUMBERS.bkash;
  els.nagadNumber.textContent = CONFIG.PAYMENT_NUMBERS.nagad;
  if (els.mobileCtaPrice) els.mobileCtaPrice.textContent = CONFIG.DISCOUNT_PRICE;
  if (els.mobileCtaOldPrice) els.mobileCtaOldPrice.textContent = CONFIG.REGULAR_PRICE;
  recalcTotals();
}

// ---------------------------------------------------------------------
// Quantity stepper (+ / − buttons, hidden input holds the real value)
// ---------------------------------------------------------------------
function wireQuantityStepper() {
  const options = document.querySelectorAll("#bundleSelector .bundle-option");
  options.forEach(opt => {
    const input = opt.querySelector('input[type="radio"]');
    if (!input) return;
    input.addEventListener("change", () => selectBundle(parseInt(opt.dataset.qty, 10)));
  });
  selectBundle(CONFIG.DEFAULT_BUNDLE_QTY);
}

function currentQty() {
  return parseInt(els.quantity.value || String(CONFIG.DEFAULT_BUNDLE_QTY), 10);
}

function bundlePrice(qty) {
  const match = CONFIG.BUNDLES.find(b => b.qty === qty);
  return match ? match.price : CONFIG.DISCOUNT_PRICE * qty;
}

function setQuantity(qty) {
  selectBundle(qty);
}

function selectBundle(qty) {
  els.quantity.value = qty;
  document.querySelectorAll("#bundleSelector .bundle-option").forEach(opt => {
    const isSelected = parseInt(opt.dataset.qty, 10) === qty;
    opt.classList.toggle("is-selected", isSelected);
    const input = opt.querySelector('input[type="radio"]');
    if (input) input.checked = isSelected;
  });
  recalcTotals();
}

function recalcTotals() {
  const qty = currentQty();
  const productTotal = bundlePrice(qty);
  const delivery = CONFIG.DELIVERY_CHARGE;
  const grand = productTotal + delivery;
  const cod = grand - delivery; // amount to pay on delivery (product total)

  els.qtyEcho.textContent = qty;
  els.productTotal.textContent = productTotal;
  els.grandTotal.textContent = grand;
  els.codEcho.textContent = cod;
}

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------
const PHONE_RE = /^01[0-9]{9}$/;

function setError(fieldId, message) {
  const el = document.querySelector(`.form-error[data-for="${fieldId}"]`);
  const input = document.getElementById(fieldId);
  if (el) el.textContent = message || "";
  if (input) input.classList.toggle("invalid", !!message);
}

function validateForm(data) {
  let ok = true;

  if (!data.customerName.trim()) { setError("customerName", "নাম দিন"); ok = false; }
  else setError("customerName", "");

  if (!PHONE_RE.test(data.phone)) { setError("phone", "সঠিক ১১ ডিজিটের নাম্বার দিন (01XXXXXXXXX)"); ok = false; }
  else setError("phone", "");

  if (!data.address.trim() || data.address.trim().length < 8) { setError("address", "সম্পূর্ণ ঠিকানা লিখুন"); ok = false; }
  else setError("address", "");

  if (!data.district || !DISTRICTS.includes(data.district)) { setError("district", "লিস্ট থেকে সঠিক জেলা বাছাই করুন"); ok = false; }
  else setError("district", "");

  if (data.senderNumber && !PHONE_RE.test(data.senderNumber)) { setError("senderNumber", "সঠিক ১১ ডিজিটের নাম্বার দিন"); ok = false; }
  else setError("senderNumber", "");

  if (data.trxId.trim() && data.trxId.trim().length < 4) { setError("trxId", "সঠিক Transaction ID দিন"); ok = false; }
  else setError("trxId", "");

  return ok;
}

// ---------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------
function wireForm() {
  els.orderForm.addEventListener("submit", onSubmit);
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : undefined;
}

// ---------------------------------------------------------------------
// Abandoned lead capture — নাম + ফোন (ভ্যালিড) দুটোই থাকলে চুপচাপ
// আংশিক ডেটা সেভ করে রাখে, ভিজিটর ফর্ম সাবমিট করার আগেই
// ---------------------------------------------------------------------
let leadSaveTimer = null;
let leadEventFired = false;

function wireLeadCapture() {
  ["customerName", "phone", "address"].forEach(id => {
    els[id].addEventListener("input", scheduleLeadSave);
  });
  els.district.addEventListener("change", scheduleLeadSave);
}

function scheduleLeadSave() {
  clearTimeout(leadSaveTimer);
  leadSaveTimer = setTimeout(saveLead, 1500);
}

async function saveLead() {
  const name = els.customerName.value.trim();
  const phone = els.phone.value.trim();

  if (!name || !PHONE_RE.test(phone)) return;

  const leadPayload = {
    customer_name: name,
    phone: phone,
    district: els.district.value || null,
    address: els.address.value.trim() || null,
    quantity: currentQty(),
  };

  try {
    await supabaseClient.from("leads").upsert(leadPayload, { onConflict: "phone" });

    // Meta Pixel Lead — প্রথমবার ভ্যালিড নাম+ফোন দেওয়ার পর একবারই fire,
    // যাতে drop-off/abandoned form-ও signal হিসেবে কাজে লাগে
    if (!leadEventFired && typeof fbq === "function") {
      fbq('track', 'Lead', { content_name: CONFIG.PRODUCT_NAME });
      leadEventFired = true;
    }
  } catch (err) {
    console.error("lead save failed", err);
  }
}

async function onSubmit(e) {
  e.preventDefault();

  // honeypot — if a bot filled this hidden field, silently drop the submit
  if (els.website.value.trim() !== "") return;

  const data = {
    customerName: els.customerName.value,
    phone: els.phone.value.trim(),
    address: els.address.value,
    district: els.district.value,
    quantity: parseInt(els.quantity.value || "1", 10),
    paymentMethod: els.paymentMethod.value,
    senderNumber: els.senderNumber.value.trim(),
    trxId: els.trxId.value,
  };

  if (!validateForm(data)) {
    showStatus("সব ঘর সঠিকভাবে পূরণ করুন।", "error");
    return;
  }

  const productTotal = bundlePrice(data.quantity);
  const unitPrice = Math.round(productTotal / data.quantity);

  // Meta Pixel InitiateCheckout — ভ্যালিড ফর্ম সাবমিট করার মুহূর্তে fire হবে
  if (typeof fbq === "function") {
    fbq('track', 'InitiateCheckout', {
      content_name: CONFIG.PRODUCT_NAME,
      num_items: data.quantity,
      value: parseFloat((productTotal / CONFIG.USD_CONVERSION_RATE).toFixed(2)),
      currency: 'USD',
    });
  }

  const deliveryCharge = CONFIG.DELIVERY_CHARGE;
  const grandTotal = productTotal + deliveryCharge;

  const payload = {
    customer_name: data.customerName.trim(),
    phone: data.phone,
    address: data.address.trim(),
    district: data.district,
    quantity: data.quantity,
    unit_price: unitPrice,
    product_total: productTotal,
    delivery_charge: deliveryCharge,
    grand_total: grandTotal,
    payment_method: data.paymentMethod,
    sender_number: data.senderNumber || null,
    trx_id: data.trxId.trim() || null,
  };

  setSubmitting(true);
  showStatus("অর্ডার সাবমিট হচ্ছে…", "");

  try {
    const { error } = await supabaseClient.from("orders").insert(payload);

    if (error) {
      console.error(error);
      showStatus("দুঃখিত, অর্ডার সাবমিট হয়নি। একটু পর আবার চেষ্টা করুন অথবা কল করুন: " + CONFIG.SUPPORT_PHONE, "error");
      setSubmitting(false);
      return;
    }

    // অর্ডার প্লেস হয়ে গেছে — এই lead টা আর "abandoned" না
    await supabaseClient.from("leads").update({ status: "converted" }).eq("phone", data.phone);

    // Meta Pixel Purchase value — শুধু প্রোডাক্ট মূল্য (ডেলিভারি চার্জ বাদে), USD এ কনভার্ট
    const purchaseValueUsd = (productTotal / CONFIG.USD_CONVERSION_RATE).toFixed(2);

    // --- Meta CAPI: server-side Purchase event ---
    // একই event_id thank-you.html-এর browser pixel-এও পাঠানো হবে, যাতে Meta
    // দুটোকে deduplicate করে ডাবল-কাউন্ট না করে।
    const capiEventId = crypto.randomUUID();
    try {
      fetch("https://mdbhsfquzxoxtrdpgjlk.supabase.co/functions/v1/meta-capi-purchase", {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + CONFIG.SUPABASE_ANON_KEY,
          "apikey": CONFIG.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          event_id: capiEventId,
          value: parseFloat(purchaseValueUsd),
          currency: "USD",
          phone: data.phone,
          customer_name: data.customerName.trim(),
          district: data.district,
          user_agent: navigator.userAgent,
          event_source_url: window.location.href,
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc"),
        }),
      });
    } catch (err) {
      console.error("CAPI send failed (non-blocking)", err);
    }

    els.orderForm.reset();
    setQuantity(CONFIG.DEFAULT_BUNDLE_QTY);
    window.location.href = "thank-you.html?value=" + purchaseValueUsd + "&eid=" + capiEventId;
    return;
  } catch (err) {
    console.error(err);
    showStatus("নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।", "error");
  } finally {
    setSubmitting(false);
  }
}

function setSubmitting(isSubmitting) {
  els.submitBtn.disabled = isSubmitting;
  els.submitBtn.textContent = isSubmitting ? "সাবমিট হচ্ছে…" : "অর্ডার কনফার্ম করুন";
}

function showStatus(message, type) {
  els.formStatus.textContent = message;
  els.formStatus.className = "form-status" + (type ? ` ${type}` : "");
}

// ---------------------------------------------------------------------
// Copy-to-clipboard (bKash / Nagad numbers)
// ---------------------------------------------------------------------
function wireCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.copyTarget;
      const target = document.getElementById(targetId);
      if (!target) return;
      const text = target.textContent.trim();
      copyText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = "কপি হয়েছে ✓";
        btn.classList.add("is-copied");
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove("is-copied");
        }, 1500);
      });
    });
  });
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) { /* no-op */ }
  document.body.removeChild(ta);
}

// ---------------------------------------------------------------------
// Sticky mobile order bar — shows once the hero is scrolled past,
// hides again once the real order form is in view
// ---------------------------------------------------------------------
function wireMobileCta() {
  const bar = els.mobileCta;
  const hero = document.querySelector(".hero");
  const orderSection = document.getElementById("order");
  if (!bar || !hero || !orderSection || !("IntersectionObserver" in window)) return;

  let heroVisible = true;
  let orderVisible = false;

  function refresh() {
    bar.classList.toggle("is-visible", !heroVisible && !orderVisible);
  }

  new IntersectionObserver(entries => {
    entries.forEach(entry => { heroVisible = entry.isIntersecting; });
    refresh();
  }, { threshold: 0 }).observe(hero);

  new IntersectionObserver(entries => {
    entries.forEach(entry => { orderVisible = entry.isIntersecting; });
    refresh();
  }, { threshold: 0.15 }).observe(orderSection);
}