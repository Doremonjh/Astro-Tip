import React, { useState, useEffect } from "react";
import { Send, ArrowRight, AlertCircle, Gift, Info } from "lucide-react";
import { validateTransactionInput } from "../utils/validators";

/**
 * SendPayment Form Card.
 * Allows users to send direct XLM payments or tip the AstroTip smart contract.
 */
export default function SendPayment({
  publicKey,
  balanceData,
  onSubmit, // Standard direct payment (recipient, amount)
  onTipContract, // Smart contract deposit (amount)
  isProcessing,
  txSuccess, // To trigger input clearing
}) {
  const [activeTab, setActiveTab] = useState("direct"); // "direct" or "contract"
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const currentBalance = balanceData?.balance ? parseFloat(balanceData.balance) : 0;
  const contractId = "CCAGHZ6EE2O6TR6DKI6H6M5HE24LBPE435XQD4J6L4CM3HI7ZYO2ZDHS";

  // Clear input fields when a transaction succeeds
  useEffect(() => {
    if (txSuccess) {
      setRecipient("");
      setAmount("");
      setError("");
    }
  }, [txSuccess]);

  // Run live validation on inputs (only for direct payment)
  useEffect(() => {
    if (activeTab !== "direct") {
      setError("");
      return;
    }

    if (!recipient && !amount) {
      setError("");
      return;
    }

    const val = validateTransactionInput(recipient, amount || "0", currentBalance);
    if (!val.isValid && (recipient || amount)) {
      if (amount === "" && val.message.includes("Amount must be a positive number")) {
        setError("");
      } else {
        setError(val.message);
      }
    } else {
      setError("");
    }
  }, [recipient, amount, currentBalance, activeTab]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeTab === "direct") {
      const val = validateTransactionInput(recipient, amount, currentBalance);
      if (!val.isValid) {
        setError(val.message);
        return;
      }
      setError("");
      onSubmit(recipient.trim(), amount);
    } else {
      // Smart contract tip validation
      if (!amount || parseFloat(amount) <= 0) {
        setError("Amount must be a positive number greater than 0");
        return;
      }
      if (parseFloat(amount) > currentBalance) {
        setError("Insufficient balance to cover this tip.");
        return;
      }
      setError("");
      onTipContract(amount);
    }
  };

  const handleMaxClick = () => {
    // Keep 1.5 XLM buffer for gas fees and safety
    const maxAmount = Math.max(0, currentBalance - 1.5);
    setAmount(maxAmount.toFixed(4));
  };

  // Render disabled state if wallet not connected
  if (!publicKey) {
    return (
      <div className="w-full p-6 rounded-2xl bg-stellar-card/30 border border-white/5 backdrop-blur-md opacity-60">
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-slate-400">Send Payment / Tip</h3>
          <p className="text-sm text-slate-400">
            Connect your wallet above to send XLM payments or tip the smart contract on Testnet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 rounded-2xl bg-stellar-card border border-white/5 backdrop-blur-md relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute -left-20 -bottom-20 w-45 h-45 bg-stellar-accent/10 rounded-full blur-3xl transition-all duration-500 group-hover:bg-stellar-accent/15" />

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab("direct");
            setError("");
          }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "direct"
              ? "border-stellar-accent text-stellar-accent"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Direct Send</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("contract");
            setError("");
          }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "contract"
              ? "border-stellar-accent text-stellar-accent"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Tip Smart Contract</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === "direct" ? (
          /* Recipient Input for Direct Payment */
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Recipient Stellar Address
            </label>
            <input
              type="text"
              placeholder="e.g. GB...37GB"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-stellar-accent/50 focus:ring-1 focus:ring-stellar-accent/30 rounded-xl text-sm font-mono text-slate-200 placeholder-slate-500 outline-none transition-all disabled:opacity-50"
            />
          </div>
        ) : (
          /* Locked Recipient Badge for Contract Tipping */
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Target Smart Contract
            </label>
            <div className="p-3 bg-stellar-accent/5 border border-stellar-accent/10 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-stellar-accent font-bold">
                <span>AstroTip Jar Contract</span>
                <span className="text-[10px] bg-stellar-accent/20 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono break-all">{contractId}</p>
            </div>
            <div className="flex items-start gap-1.5 text-[11px] text-slate-400 p-2.5 bg-white/5 border border-white/5 rounded-xl">
              <Info className="w-3.5 h-3.5 text-stellar-secondary shrink-0 mt-0.5" />
              <span>
                Your tip will be authorized and registered directly in the smart contract's global state.
              </span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Amount (XLM)
            </label>
            <button
              type="button"
              onClick={handleMaxClick}
              disabled={isProcessing || currentBalance <= 1.5}
              className="text-xs font-bold text-stellar-accent hover:text-stellar-accent/80 transition-colors disabled:opacity-50"
            >
              Use Max (with buffer)
            </button>
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing}
              className="w-full pl-4 pr-16 py-3 bg-white/5 border border-white/10 focus:border-stellar-accent/50 focus:ring-1 focus:ring-stellar-accent/30 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none transition-all disabled:opacity-50"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
              XLM
            </div>
          </div>
        </div>

        {/* Live error warning box */}
        {error && (
          <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={isProcessing || (activeTab === "direct" && !recipient) || !amount || !!error}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-stellar-accent to-stellar-secondary hover:from-stellar-accent/90 hover:to-stellar-secondary/90 text-white font-bold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-stellar-accent/10"
        >
          {activeTab === "direct" ? (
            <>
              <span>{isProcessing ? "Processing Payment..." : "Send XLM"}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </>
          ) : (
            <>
              <Gift className="w-4 h-4" />
              <span>{isProcessing ? "Processing Tip..." : "Deposit Tip"}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
