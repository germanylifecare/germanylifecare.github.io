// =========================================================================
// GLC Landing Page — order form logic
// =========================================================================

const DISTRICTS = [
  "Bagerhat","Bandarban","Barguna","Barishal","Bhola","Bogura","Brahmanbaria","Chandpur",
  "Chattogram","Chuadanga","Cox's Bazar","Cumilla","Dhaka","Dinajpur","Faridpur","Feni",
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
  document.getElementById("year").textContent = new Date().getFullYear();
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
    "qtyEcho","unitPriceEcho","productTotal","deliveryEcho","grandTotal",
    "advanceEcho","advanceEcho2","codEcho","bkashNumber","nagadNumber",
    "paymentMethod","senderNumber","trxId","submitBtn","formStatus",
    "regularPrice","discountPrice","savePercent",
    "qtyMinus","qtyPlus","qtyValue","mobileCta","mobileCtaPrice","mobileCtaOldPrice"
  ].forEach(id => (els[id] = document.getElementById(id)));
}

function populateDistricts() {
  DISTRICTS.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    els.district.appendChild(opt);
  });
}

function populatePricesFromConfig() {
  els.regularPrice.textContent = CONFIG.REGULAR_PRICE;
  els.discountPrice.textContent = CONFIG.DISCOUNT_PRICE;
  const pct = Math.round((1 - CONFIG.DISCOUNT_PRICE / CONFIG.REGULAR_PRICE) * 100);
  els.savePercent.textContent = `${pct}% ছাড়`;
  els.unitPriceEcho.textContent = CONFIG.DISCOUNT_PRICE;
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
  setQuantity(1);
  els.qtyMinus.addEventListener("click", () => setQuantity(currentQty() - 1));
  els.qtyPlus.addEventListener("click", () => setQuantity(currentQty() + 1));
}

function currentQty() {
  return parseInt(els.quantity.value || "1", 10);
}

function setQuantity(next) {
  const clamped = Math.min(CONFIG.MAX_QUANTITY, Math.max(1, next));
  els.quantity.value = clamped;
  els.qtyValue.textContent = clamped;
  els.qtyMinus.disabled = clamped <= 1;
  els.qtyPlus.disabled = clamped >= CONFIG.MAX_QUANTITY;
  recalcTotals();
}

function recalcTotals() {
  const qty = currentQty();
  const unit = CONFIG.DISCOUNT_PRICE;
  const productTotal = qty * unit;
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

  if (!data.district) { setError("district", "জেলা বাছাই করুন"); ok = false; }
  else setError("district", "");

  if (!PHONE_RE.test(data.senderNumber)) { setError("senderNumber", "সঠিক ১১ ডিজিটের নাম্বার দিন"); ok = false; }
  else setError("senderNumber", "");

  if (!data.trxId.trim() || data.trxId.trim().length < 4) { setError("trxId", "সঠিক Transaction ID দিন"); ok = false; }
  else setError("trxId", "");

  return ok;
}

// ---------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------
function wireForm() {
  els.orderForm.addEventListener("submit", onSubmit);
}

// ---------------------------------------------------------------------
// Abandoned lead capture — নাম + ফোন (ভ্যালিড) দুটোই থাকলে চুপচাপ
// আংশিক ডেটা সেভ করে রাখে, ভিজিটর ফর্ম সাবমিট করার আগেই
// ---------------------------------------------------------------------
let leadSaveTimer = null;

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

  const unitPrice = CONFIG.DISCOUNT_PRICE;
  const productTotal = unitPrice * data.quantity;
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
    sender_number: data.senderNumber,
    trx_id: data.trxId.trim(),
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

    els.orderForm.reset();
    setQuantity(1);
    window.location.href = "thank-you.html";
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