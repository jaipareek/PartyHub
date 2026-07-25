import { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { HiCreditCard, HiCheckCircle, HiClock, HiSparkles, HiChevronRight } from "react-icons/hi2";
import "./PayLockCard.css";

export default function PayLockCard({ paylock, squad, onUpdate }) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [paying, setPaying] = useState(false);

  if (!paylock) return null;

  const targetAmount = Number(paylock.total_target_amount || 0);
  const collectedAmount = Number(paylock.collected_amount || 0);
  const remainingAmount = Number(paylock.remaining_amount || (targetAmount - collectedAmount));
  const suggestedShare = Number(paylock.suggested_share || Math.ceil(targetAmount / (squad?.members?.length || 1)));

  const progressPercent = Math.min(100, Math.round((collectedAmount / targetAmount) * 100));
  const isCompleted = paylock.status === "completed" || remainingAmount <= 0;

  const handlePay = async (amountToPay) => {
    const val = Number(amountToPay);
    if (!val || val <= 0) {
      toast.error("Please enter a valid contribution amount");
      return;
    }

    try {
      setPaying(true);

      // 1. Create Razorpay order for squad contribution
      const orderRes = await api.post("/payment/create-order", {
        amount: val,
        receipt: `paylock_${paylock.id}_${Date.now()}`,
        notes: { squad_id: squad?.id, paylock_id: paylock.id }
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.error || "Could not create Razorpay order");
      }

      const orderData = orderRes.data.data;

      const submitPayShare = async (paymentId) => {
        const res = await api.post(`/paylock/${paylock.id}/pay-share`, {
          amount: val,
          squad_id: squad?.id,
          payment_id: paymentId,
        });

        if (res.data?.success) {
          toast.success(res.data.message || `Paid ₹${val.toLocaleString("en-IN")} towards PayLock via Razorpay! 🎉`);
          setShowCustomInput(false);
          setCustomAmount("");
          if (onUpdate) onUpdate();
        }
      };

      // 2. Open Razorpay SDK Popup Window
      if (window.Razorpay && orderData) {
        const options = {
          key: orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_THbll1AUnRwRMQ",
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "AfterDark Squad PayLock",
          description: `PayLock Share — ${paylock.item_title || "Squad Booking"}`,
          order_id: orderData.is_mock ? undefined : orderData.id,
          theme: { color: "#ff007f" },
          handler: async function (response) {
            try {
              const verifyRes = await api.post("/payment/verify", {
                razorpay_order_id: response.razorpay_order_id || orderData.id,
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpay_signature: response.razorpay_signature,
                is_mock: orderData.is_mock
              });
              if (verifyRes.data?.success) {
                await submitPayShare(verifyRes.data.payment_id || response.razorpay_payment_id);
              } else {
                toast.error("Razorpay payment verification failed");
              }
            } catch (vErr) {
              console.error("PayLock signature error:", vErr);
              toast.error("Payment verification failed");
            } finally {
              setPaying(false);
            }
          },
          modal: {
            ondismiss: function () {
              setPaying(false);
              toast("Payment window closed", { icon: "ℹ️" });
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback test mode verification
        const verifyRes = await api.post("/payment/verify", {
          razorpay_order_id: orderData.id,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: "test_signature",
          is_mock: true
        });

        if (verifyRes.data?.success) {
          await submitPayShare(verifyRes.data.payment_id);
        }
        setPaying(false);
      }

    } catch (err) {
      console.error("PayLock payment error:", err);
      toast.error(err.response?.data?.error || err.message || "Failed to submit payment share");
      setPaying(false);
    }
  };

  return (
    <div className={`paylock-card ${isCompleted ? "completed" : ""}`}>
      {/* Header Banner */}
      <div className="paylock-card__header">
        <div className="paylock-card__title-grp">
          <span className="paylock-badge">
            {isCompleted ? "🎉 PAYLOCK COMPLETE" : "💳 SQUAD PAYLOCK ACTIVE"}
          </span>
          <h4 className="paylock-item-title">{paylock.item_title || "Squad Booking"}</h4>
        </div>
        {!isCompleted && (
          <div className="paylock-timer">
            <HiClock /> 2h Window
          </div>
        )}
      </div>

      {/* Target & Remaining Amounts Row */}
      <div className="paylock-amounts-row">
        <div className="paylock-amount-box">
          <span className="paylock-lbl">TOTAL BILL</span>
          <span className="paylock-val">₹{targetAmount.toLocaleString("en-IN")}</span>
        </div>

        <div className="paylock-divider" />

        <div className="paylock-amount-box">
          <span className="paylock-lbl">{isCompleted ? "COLLECTED" : "REMAINING UNPAID"}</span>
          <span className={`paylock-val ${isCompleted ? "success" : "remaining"}`}>
            ₹{(isCompleted ? targetAmount : remainingAmount).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Dynamic Progress Bar */}
      <div className="paylock-progress-container">
        <div className="paylock-progress-bar">
          <div className="paylock-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="paylock-progress-meta">
          <span>₹{collectedAmount.toLocaleString("en-IN")} collected</span>
          <strong>{progressPercent}% Locked</strong>
        </div>
      </div>

      {/* Contributors Avatars List */}
      <div className="paylock-contributors">
        <span className="paylock-subhead">SQUAD CONTRIBUTIONS:</span>
        <div className="paylock-contributors-list">
          {(paylock.contributions || []).length === 0 ? (
            <span className="paylock-no-payments">No payments recorded yet. Be the first! ⚡</span>
          ) : (
            (paylock.contributions || []).map((c, idx) => (
              <div key={idx} className="paylock-chip">
                <span className="paylock-chip-icon"><HiCheckCircle /></span>
                <span className="paylock-chip-name">{c.full_name || "Member"}</span>
                <strong className="paylock-chip-amt">+₹{Number(c.amount).toLocaleString("en-IN")}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Interactive Action Buttons */}
      {!isCompleted && (
        <div className="paylock-actions">
          {!showCustomInput ? (
            <>
              <button 
                type="button" 
                className="paylock-btn paylock-btn--equal"
                onClick={() => handlePay(Math.min(suggestedShare, remainingAmount))}
                disabled={paying}
              >
                <HiSparkles style={{ flexShrink: 0 }} />
                <span>Pay Equal Share (₹{Math.min(suggestedShare, remainingAmount).toLocaleString("en-IN")})</span>
              </button>

              <button 
                type="button"
                className="paylock-btn paylock-btn--custom"
                onClick={() => setShowCustomInput(true)}
                disabled={paying}
              >
                <span>✏️ Pay Custom Amount</span>
              </button>
            </>
          ) : (
            <div className="paylock-custom-form">
              <div className="paylock-custom-input-grp">
                <span className="paylock-currency-symbol">₹</span>
                <input 
                  type="number"
                  placeholder={`Up to ₹${remainingAmount}`}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="paylock-input"
                  min="1"
                  max={remainingAmount}
                />
              </div>

              <div className="paylock-custom-btn-grp">
                <button 
                  type="button" 
                  className="paylock-btn paylock-btn--equal"
                  onClick={() => handlePay(customAmount)}
                  disabled={paying || !customAmount}
                >
                  Confirm ₹{Number(customAmount || 0).toLocaleString("en-IN")} Payment
                </button>
                <button 
                  type="button"
                  className="paylock-btn paylock-btn--cancel"
                  onClick={() => setShowCustomInput(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="paylock-complete-badge">
          <HiCheckCircle />
          <span>PayLock 100% Complete! Entry QR passes issued for Squad! 🎟️</span>
        </div>
      )}
    </div>
  );
}
