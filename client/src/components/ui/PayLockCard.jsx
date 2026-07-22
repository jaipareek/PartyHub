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
      const res = await api.post(`/paylock/${paylock.id}/pay-share`, {
        amount: val,
        squad_id: squad?.id,
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Paid ₹${val.toLocaleString("en-IN")} towards PayLock! 🎉`);
        setShowCustomInput(false);
        setCustomAmount("");
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error("PayLock payment error:", err);
      toast.error(err.response?.data?.error || "Failed to submit payment share");
    } finally {
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
                <HiSparkles /> Pay Equal Share (₹{Math.min(suggestedShare, remainingAmount).toLocaleString("en-IN")})
              </button>

              <button 
                type="button"
                className="paylock-btn paylock-btn--custom"
                onClick={() => setShowCustomInput(true)}
                disabled={paying}
              >
                ✏️ Pay Custom Amount
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
