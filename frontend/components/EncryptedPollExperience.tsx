"use client";

import { useMemo, useState } from "react";
import { ethers } from "ethers";
import clsx from "clsx";

import { useEncryptedPredictionPoll } from "@/hooks/useEncryptedPredictionPoll";

function formatTimestamp(value: number | undefined) {
  if (!value) {
    return "—";
  }
  return new Date(value * 1000).toLocaleString();
}

function timeUntil(endTime: number | undefined) {
  if (!endTime) {
    return "N/A";
  }
  const delta = endTime * 1000 - Date.now();
  if (delta <= 0) {
    return "Closed";
  }
  const hours = Math.floor(delta / (1000 * 60 * 60));
  const minutes = Math.floor((delta / (1000 * 60)) % 60);
  return `${hours}h ${minutes}m remaining`;
}

export function EncryptedPollExperience() {
  const poll = useEncryptedPredictionPoll();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const statusBadges = useMemo(() => {
    const badges: Array<{ label: string; tone: "default" | "warning" | "success" | "info" }> = [];
    if (poll.metadata?.finalized) {
      badges.push({ label: "Finalized", tone: "success" });
    } else if (poll.metadata?.decryptionPending) {
      badges.push({ label: "Decryption Pending", tone: "warning" });
    } else {
      badges.push({ label: "Active", tone: "info" });
    }
    switch (poll.fheStatus) {
      case "ready":
        badges.push({ label: "FHE Ready", tone: "success" });
        break;
      case "loading":
        badges.push({ label: "FHE Loading", tone: "info" });
        break;
      case "error":
        badges.push({ label: "FHE Error", tone: "warning" });
        break;
      default:
        badges.push({ label: "FHE Idle", tone: "default" });
    }
    badges.push({
      label: poll.walletConnected ? "Wallet Connected" : "Wallet Disconnected",
      tone: poll.walletConnected ? "success" : "warning",
    });
    return badges;
  }, [poll.metadata, poll.fheStatus, poll.walletConnected]);

  const resultTallies = poll.metadata?.finalized ? poll.finalizedTallies : poll.decryptedTallies;

  const canVote =
    poll.walletConnected &&
    poll.metadata &&
    !poll.metadata.finalized &&
    !poll.metadata.decryptionPending;

  const votingStatusCopy = poll.metadata
    ? poll.metadata.finalized
      ? "The oracle provided a cleartext tally. Results are immutable."
      : poll.metadata.decryptionPending
        ? "Oracle decryption request in progress. Results will unlock once the callback finalizes."
        : "Casting an encrypted vote keeps your preference private while contributing to the collective forecast."
    : "Deploy the EncryptedPredictionPoll contract on this chain to begin.";

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur">
        <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-4 text-slate-900">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-600">Encrypted Polling Predictions</p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              {poll.metadata?.headline ?? "Loading encrypted prediction room..."}
            </h1>
            <p className="max-w-2xl text-base text-slate-700">
              {poll.metadata?.description ??
                "Bootstrapping an encrypted forecasting loop. Connect your wallet to vote privately and decrypt aggregated trends on demand."}
            </p>
            <div className="flex flex-wrap gap-2">
              {statusBadges.map((badge, index) => (
                <span
                  key={`${badge.label}-${index}`}
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
                    badge.tone === "success" && "bg-emerald-100 text-emerald-700",
                    badge.tone === "warning" && "bg-amber-100 text-amber-700",
                    badge.tone === "info" && "bg-indigo-100 text-indigo-700",
                    badge.tone === "default" && "bg-slate-200 text-slate-600",
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
          <div className="grid w-full gap-4 rounded-3xl border border-white/30 bg-white/60 p-5 text-sm text-slate-800 shadow-sm md:w-80">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-slate-500">Voting window</span>
              <span className="font-medium">{formatTimestamp(poll.metadata?.startTime)}</span>
              <span className="font-medium">{formatTimestamp(poll.metadata?.endTime)}</span>
              <span className="text-xs text-slate-500">{timeUntil(poll.metadata?.endTime)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-slate-500">Voters</span>
              <span className="text-2xl font-semibold">{poll.metadata?.voterCount ?? 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-slate-500">Contract</span>
              <span className="break-all text-xs font-mono text-slate-600">
                {poll.contractAddress ?? "Not deployed on this chain"}
              </span>
            </div>
          </div>
        </header>
        <p className="mt-6 text-sm text-slate-600">{votingStatusCopy}</p>
      </section>

      <section className="grid gap-6 rounded-3xl border border-white/20 bg-white/70 p-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-slate-900">Select your encrypted prediction</h2>
          <p className="text-sm text-slate-600">
            Your choice never leaves your browser in cleartext. The client encrypts the selected index using the FHE
            runtime before submitting.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {poll.options.map((option) => {
            const isSelected = selectedOption === option.index;
            const tally =
              poll.metadata?.finalized
                ? poll.finalizedTallies[option.index]
                : poll.decryptedTallies[option.index];

            return (
              <button
                key={option.index}
                onClick={() => setSelectedOption(option.index)}
                className={clsx(
                  "flex h-full flex-col justify-between rounded-2xl border p-5 text-left transition-all",
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-200"
                    : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md",
                )}
              >
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                    Option {option.index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">{option.label}</h3>
                  <p className="text-sm text-slate-600">{option.description}</p>
                </div>
                <div className="mt-4 space-y-1 text-xs">
                  <p className="font-mono text-[11px] text-slate-500">
                    {option.encryptedTally === ethers.ZeroHash
                      ? "Ciphertext pending"
                      : `Ciphertext: ${option.encryptedTally.slice(0, 8)}…${option.encryptedTally.slice(-6)}`}
                  </p>
                  {typeof tally === "number" && !Number.isNaN(tally) && (
                    <p className="text-sm font-semibold text-indigo-600">
                      {poll.metadata?.finalized ? "Final tally" : "Locally decrypted"}: {tally}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={
              !canVote || selectedOption === null || poll.isSubmitting || poll.isLoading || poll.fheStatus !== "ready"
            }
            onClick={() => selectedOption !== null && poll.castVote(selectedOption)}
            className={clsx(
              "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors",
              canVote && selectedOption !== null && !poll.isSubmitting && poll.fheStatus === "ready"
                ? "bg-indigo-600 hover:bg-indigo-500"
                : "cursor-not-allowed bg-slate-400",
            )}
          >
            {poll.isSubmitting ? "Submitting…" : "Submit Encrypted Vote"}
          </button>
          <button
            disabled={poll.isLoading}
            onClick={poll.refresh}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-600"
          >
            Refresh Poll State
          </button>
          <button
            disabled={poll.isDecrypting || poll.metadata?.finalized}
            onClick={poll.decryptTallies}
            className={clsx(
              "inline-flex items-center justify-center rounded-full border border-indigo-100 px-5 py-3 text-sm font-medium transition-colors",
              poll.isDecrypting || poll.metadata?.finalized
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
            )}
          >
            {poll.metadata?.finalized ? "Results finalized" : poll.isDecrypting ? "Decrypting…" : "Decrypt Tallies Locally"}
          </button>
          <button
            disabled={
              !poll.walletConnected ||
              poll.metadata?.finalized ||
              poll.metadata?.decryptionPending ||
              poll.isSubmitting
            }
            onClick={poll.requestOracleDecryption}
            className={clsx(
              "inline-flex items-center justify-center rounded-full border border-emerald-200 px-5 py-3 text-sm font-medium transition-colors",
              poll.metadata?.finalized || poll.metadata?.decryptionPending
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
            )}
          >
            Request Oracle Finalization
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/30 bg-white/85 p-8">
        <h2 className="text-2xl font-semibold text-slate-900">Prediction dashboard</h2>
        <p className="mt-2 text-sm text-slate-600">
          Track the encrypted vote stream and surface insights once you decrypt or when the oracle finalizes the round.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100/80 text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Option</th>
                <th className="px-4 py-3 text-left font-semibold">Encrypted handle</th>
                <th className="px-4 py-3 text-left font-semibold">
                  {poll.metadata?.finalized ? "Final tallies" : "Local decrypt"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {poll.options.map((option) => {
                const tally = resultTallies[option.index];
                return (
                  <tr key={option.index} className="text-slate-700">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{option.label}</div>
                      <div className="text-xs text-slate-500">{option.description}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {option.encryptedTally === ethers.ZeroHash
                        ? "0x00"
                        : `${option.encryptedTally.slice(0, 10)}…${option.encryptedTally.slice(-8)}`}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-indigo-700">
                      {typeof tally === "number" && !Number.isNaN(tally) ? tally : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-white/30 bg-[linear-gradient(135deg,_#eef2ff,_#f9fafb)] p-8">
        <h2 className="text-xl font-semibold text-slate-900">Activity log</h2>
        <div className="mt-4 rounded-2xl border border-indigo-100 bg-white p-5 text-sm text-slate-700 shadow-inner">
          {poll.message ? poll.message : "Interact with the poll to see runtime diagnostics here."}
        </div>
        {poll.fheError && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {poll.fheError.message}
          </p>
        )}
      </section>
    </div>
  );
}

