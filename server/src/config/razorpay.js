// ============================================
// 💳 Razorpay SDK Configuration
// ============================================
import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_test";

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || keyId;
