"use client";

import React, { useState } from "react";

const rules = [
  { num: 1, rule: "No organization resolved", condition: "The sender is a named organization we can't find, and isn't a person.", verdict: "CAN'T VERIFY", tone: "text-graphite" },
  { num: 2, rule: "Personal impersonation", condition: "The sender claims to be a family member, friend or coworker.", verdict: "NO ORGANIZATION CLAIMED", tone: "text-ochre" },
  { num: 3, rule: "Strong mismatch", condition: "A link or email isn't official, a domain closely imitates the real one, or the ask is gift cards or crypto.", verdict: "DOESN'T MATCH", tone: "text-stamp" },
  { num: 4, rule: "Phone mismatch", condition: "The number isn't on the official contact pages, and those pages do list phone numbers.", verdict: "DOESN'T MATCH", tone: "text-stamp" },
  { num: 5, rule: "Everything matches", condition: "Every contact point checks out and nothing is flagged.", verdict: "MATCHES", tone: "text-pine" },
  { num: 6, rule: "Nothing to check", condition: "The message has no links, phone numbers or emails.", verdict: "CAN'T VERIFY", tone: "text-graphite" },
  { num: 7, rule: "Inconclusive", condition: "Evidence is partial, or the official pages don't publish phone numbers.", verdict: "CAN'T VERIFY", tone: "text-graphite" },
];

export function RuleTable() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="border-t border-ink">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full py-3 text-left flex items-center justify-between font-display text-xl"
      >
        <span>How Callback decided</span>
        <span className="font-mono text-sm" aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && (
        <div className="pb-2 text-[13px]">
          <p className="text-muted mb-4 max-w-xl">
            Seven fixed rules, checked in order. The first one that applies decides the verdict. The AI reads and explains;
            it doesn&apos;t decide.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[520px]">
              <thead>
                <tr className="border-y border-ink font-mono text-[11px] uppercase tracking-widest text-muted">
                  <th className="py-2 pr-3 w-8 font-normal">#</th>
                  <th className="py-2 pr-3 font-normal">Rule</th>
                  <th className="py-2 pr-3 font-normal">When</th>
                  <th className="py-2 font-normal">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {rules.map((r) => (
                  <tr key={r.num} className="align-top">
                    <td className="py-2.5 pr-3 font-mono text-muted">{r.num}</td>
                    <td className="py-2.5 pr-3 font-medium">{r.rule}</td>
                    <td className="py-2.5 pr-3 text-muted">{r.condition}</td>
                    <td className={`py-2.5 font-mono text-[12px] font-bold ${r.tone}`}>{r.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
