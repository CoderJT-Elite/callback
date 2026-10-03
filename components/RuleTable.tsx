"use client";

import React, { useState } from "react";
import { ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

export function RuleTable() {
  const [isOpen, setIsOpen] = useState(false);

  const rules = [
    {
      num: 1,
      rule: "No Organization Resolved",
      condition: "Sender is not a known organization or agency, and kind != person.",
      verdict: "CAN'T VERIFY",
      action: "Flags that sender identity cannot be grounded in public records.",
      color: "text-slate-500 bg-slate-100 dark:bg-slate-800",
    },
    {
      num: 2,
      rule: "Personal Impersonation Path",
      condition: "Sender claims to be a family member, friend, or coworker (kind = person).",
      verdict: "NO ORGANIZATION CLAIMED",
      action: "Flags urgency & payment; advises calling known saved contact number.",
      color: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950",
    },
    {
      num: 3,
      rule: "Strong Mismatch",
      condition: "Link is not official, email is freemail impersonation, lookalike >= 0.7, or gift card/crypto demand.",
      verdict: "DOESN'T MATCH {Org}",
      action: "Hard mismatch. Highlights unofficial lookalike channels.",
      color: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950",
    },
    {
      num: 4,
      rule: "Phone Mismatch",
      condition: "Phone is not listed on official contact pages (when pages list at least one phone).",
      verdict: "DOESN'T MATCH {Org}",
      action: "Mismatched number. Shows real official support phone number.",
      color: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950",
    },
    {
      num: 5,
      rule: "All Channels Match",
      condition: "All contact points match official domains and directories with no strong flags.",
      verdict: "MATCHES {Org}",
      action: "Legitimate verification with advice to enter credentials only on official site.",
      color: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950",
    },
    {
      num: 6,
      rule: "No Contact Points",
      condition: "Message has no links, phone numbers, or emails to check.",
      verdict: "CAN'T VERIFY",
      action: "Advises user to look up the organization independently.",
      color: "text-slate-500 bg-slate-100 dark:bg-slate-800",
    },
    {
      num: 7,
      rule: "Inconclusive / Other",
      condition: "Evidence is partial or official pages do not publish phone directories.",
      verdict: "CAN'T VERIFY",
      action: "Explains specifically what was checked and what was missing.",
      color: "text-slate-500 bg-slate-100 dark:bg-slate-800",
    },
  ];

  return (
    <div className="w-full mt-4 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left font-medium text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          How Callback decided (Deterministic Rule Engine)
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
          <p className="text-slate-500 dark:text-slate-400 mb-3 text-xs leading-relaxed">
            Callback uses deterministic rules evaluated in strict numerical order. The AI reads and explains, but the verdict is always governed by verified facts:
          </p>
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 px-2 w-8">#</th>
                <th className="py-2 px-2 font-semibold">Rule</th>
                <th className="py-2 px-2 font-semibold">Condition</th>
                <th className="py-2 px-2 font-semibold">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {rules.map((r) => (
                <tr key={r.num} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-2 font-mono text-slate-400">{r.num}</td>
                  <td className="py-2.5 px-2 font-medium text-slate-800 dark:text-slate-200">{r.rule}</td>
                  <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">{r.condition}</td>
                  <td className="py-2.5 px-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${r.color}`}>
                      {r.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
