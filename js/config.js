// =========================================================================
// GLC Landing Page — CONFIG
// এই ফাইলের ভ্যালুগুলো বদলালেই সাইট আপডেট হয়ে যাবে — কোনো কোড ছোঁয়া লাগবে না।
// =========================================================================

const CONFIG = {
  // ---- Supabase ----------------------------------------------------------
  // Supabase Dashboard → Project Settings → API → Project URL / anon public key
  SUPABASE_URL: "https://mdbhsfquzxoxtrdpgjlk.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_QgBu3JjvZ9caIRCjyuKc7g_cMjV8OM_",

  // ---- Product ------------------------------------------------------------
  PRODUCT_NAME: "Sealpack Germany Homeopathy",
  REGULAR_PRICE: 1680, // official germanylifecarepharmacy.com price — ৳1680 → ৳1280 (24% off)
  DISCOUNT_PRICE: 1280,
  MAX_QUANTITY: 5,

  // ---- Delivery -----------------------------------------------------------
  DELIVERY_CHARGE: 70, // সারা বাংলাদেশে একই রেট

  // ---- Meta Pixel tracking --------------------------------------------------
  // Purchase event value = শুধু প্রোডাক্ট মূল্য (ডেলিভারি চার্জ বাদে, ওটা courier-কে
  // pass-through, company-র revenue না)। USD_CONVERSION_RATE ম্যানুয়াল রেট —
  // প্রতি ২-৩ সপ্তাহে xe.com/google চেক করে আপডেট করে নিও।
  USD_CONVERSION_RATE: 124, // 1 USD = ৳ (Sep 2026 rate)

  // ---- Advance payment (delivery charge collection) ------------------------
  // এখানে যে bKash/Nagad নাম্বারটা বসাবে, সেটাই কাস্টমার Send Money করবে।
  PAYMENT_NUMBERS: {
    bkash: "01303886699",
    nagad: "01410353910",
  },

  // ---- Contact / trust ------------------------------------------------------
  SUPPORT_PHONE: "09617996611",
  BRAND_NAME: "Germany Life Care",
};