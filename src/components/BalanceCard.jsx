import React, { useState } from "react";
import { RefreshCw, Coins, HelpCircle, Sparkles, Copy, Check, ExternalLink, Flame } from "lucide-react";
import { BalanceSkeleton } from "./Loader";
import { fundAccountWithFriendbot } from "../services/stellar";
import { toast } from "react-toastify";

/**
 * Balance Card.
 * Displays current XLM balance and the AstroTip smart contract jar total.
 * Handles manual reloading and Friendbot funding.
 */
export default function BalanceCard({
  publicKey,
  balanceData, // { balance: string, isFunded: boolean }
  isLoading,
  onRefresh,
  tipJarTotal = "0.0000",
  isTipJarLoading = false,
}) {
  const [isFunding, setIsFunding] = useState(false);
  const [contractCopied, setContractCopied] = useState(false);
  const contractId = "CCAGHZ6EE2O6TR6DKI6H6M5HE24LBPE435XQD4J6L4CM3HI7ZYO2ZDHS";

  const handleFundAccount = async () => {
    if (!publicKey) return;
    setIsFunding(true);
    const toastId = toast.loading("Requesting 10,000 XLM from Stellar Friendbot...");
    try {
      const success = await fundAccountWithFriendbot(publicKey);
      if (success) {
        toast.update(toastId, {
          render: "Account funded successfully with 10,000 XLM!",
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });
        onRefresh();
      }
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "Failed to fund account.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsFunding(false);
    }
  };

  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText(contractId);
      setContractCopied(true);
      setTimeout(() => setContractCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy contract ID:", err);
    }
  };

  return (
    <div className="w-full p-6 rounded-2xl bg-stellar-card border border-white/5 backdrop-blur-md relative overflow-hidden group space-y-6">
      {/* Background glow */}
      <div className="absolute -right-20 -top-20 w-45 h-45 bg-stellar-secondary/10 rounded-full blur-3xl transition-all duration-500 group-hover:bg-stellar-secondary/15" />

      {/* SECTION 1: Personal Wallet Balance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-slate-200">Your Wallet Balance</h3>
          {publicKey && (
            <button
              onClick={onRefresh}
              disabled={isLoading || isFunding || isTipJarLoading}
              className={`p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all duration-300 disabled:opacity-50 ${
                isLoading || isTipJarLoading ? "animate-spin" : "hover:rotate-180"
              }`}
              title="Refresh Balance & Contract"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {!publicKey ? (
          <div className="space-y-2">
            <div className="py-1">
              <span className="text-3xl font-extrabold text-slate-500">-- XLM</span>
            </div>
            <p className="text-xs text-slate-400">Connect Freighter wallet to view your personal balance.</p>
          </div>
        ) : isLoading ? (
          <BalanceSkeleton />
        ) : (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {balanceData?.balance || "0.0000"}
              </span>
              <span className="text-lg font-bold text-stellar-secondary">XLM</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Stellar Native Asset</span>
          </div>
        )}

        {/* Funding helper */}
        {publicKey && !isLoading && balanceData && !balanceData.isFunded && (
          <div className="pt-2 border-t border-white/5 space-y-3">
            <div className="flex items-start gap-2 p-3 bg-gold/10 border border-gold/20 rounded-xl text-xs text-gold">
              <HelpCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Account Unfunded</span>
                This public key has not been registered on Testnet yet. Fund it with Friendbot to proceed.
              </div>
            </div>
            <button
              onClick={handleFundAccount}
              disabled={isFunding}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-gold to-yellow-600 hover:from-gold hover:to-yellow-500 text-slate-900 font-bold text-xs transition-all duration-200 shadow-md shadow-gold/10"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isFunding ? "Funding Account..." : "Fund with Friendbot (10k XLM)"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Separator line */}
      <div className="h-px bg-white/5" />

      {/* SECTION 2: Smart Contract Jar Balance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-slate-200 flex items-center gap-1.5">
            <Flame className="w-4.5 h-4.5 text-stellar-accent animate-pulse" />
            <span>AstroTip Smart Contract Jar</span>
          </h3>
          {!publicKey && (
            <button
              onClick={onRefresh}
              disabled={isLoading || isTipJarLoading}
              className={`p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all duration-300 disabled:opacity-50 ${
                isTipJarLoading ? "animate-spin" : "hover:rotate-180"
              }`}
              title="Refresh Contract State"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {isTipJarLoading ? (
          <BalanceSkeleton />
        ) : (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-stellar-accent via-white to-stellar-secondary bg-clip-text text-transparent">
                {tipJarTotal}
              </span>
              <span className="text-lg font-bold text-stellar-accent">XLM</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Total tips recorded on-chain</span>
          </div>
        )}

        {/* Contract Info / Copy */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              Deployed Contract ID
            </span>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-stellar-accent hover:text-stellar-accent/80 transition-colors flex items-center gap-0.5"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-xl">
            <span className="font-mono text-[10px] text-slate-400 break-all select-all flex-1">
              {contractId}
            </span>
            <button
              onClick={handleCopyContract}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all"
              title="Copy Contract ID"
            >
              {contractCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
