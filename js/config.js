// =========================================================================
// GLC Landing Page — CONFIG
// এই ফাইলের ভ্যালুগুলো বদলালেই সাইট আপডেট হয়ে যাবে — কোনো কোড ছোঁয়া লাগবে না।
// =========================================================================

const CONFIG = {
  // ---- Supabase ----------------------------------------------------------
  // Supabase Dashboard → Project Settings → API → Project URL / anon public key
  SUPABASE_URL: "https://YOUR-PROJECT-REF.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-PUBLIC-KEY",

  // ---- Product ------------------------------------------------------------
  PRODUCT_NAME: "Sealpack Germany Homeopathy",
  REGULAR_PRICE: 1680, // official germanylifecarepharmacy.com price — ৳1680 → ৳1280 (24% off)
  DISCOUNT_PRICE: 1280,
  MAX_QUANTITY: 5,

  // ---- Delivery -----------------------------------------------------------
  DELIVERY_CHARGE: 70, // সারা বাংলাদেশে একই রেট

  // ---- Advance payment (delivery charge collection) ------------------------
  // এখানে যে bKash/Nagad নাম্বারটা বসাবে, সেটাই কাস্টমার Send Money করবে।
  PAYMENT_NUMBERS: {
    bkash: "01941374217",
    nagad: "01410353910",
  },

  // ---- Contact / trust ------------------------------------------------------
  SUPPORT_PHONE: "01XXXXXXXXX", // <-- বসাও: অর্ডার সংক্রান্ত হেল্পলাইন নাম্বার
  BRAND_NAME: "Germany Life Care",
};