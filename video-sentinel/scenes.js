// Deterministic scene renderer. seek(i, t) draws scene i at time t (seconds). No wall-clock anywhere.
const WW = 1216, WH = 684;
const $ = (s, el = document) => el.querySelector(s);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const seg = (t, a, b) => ease(clamp((t - a) / Math.max(1e-6, b - a)));
const lerp = (a, b, k) => a + (b - a) * k;
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const RED = "#c23b22", PINE = "#1f6a4b", OCHRE = "#b07a12", INK = "#1c1a17", STEEL = "#6b655a";
const backOut = (p) => 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2);          // ease-out with a small overshoot

let CFG = null;              // {scenes:[{id,D,cues:{}, text, label}], facts:{}, placeholder:true|false}
const FULL = [0, 0, 1500, 844];
const BX = typeof BOXES !== "undefined" ? BOXES : {};      // measured from the live page (capture-shots.cjs), screenshot pixels
const _p = (r, p) => (r ? [r[0] - p, r[1] - p, r[2] + 2 * p, r[3] + 2 * p] : [0, 0, 8, 8]);
const Bx = (s, k, i, p = 6) => _p(i == null ? (BX[s] || {})[k] : ((BX[s] || {})[k] || [])[i], p);
const Bt = (s, i) => { const l = BX[s].trace[i], t = BX[s].traceTitle[i]; return [l[0] - 6, l[1] - 2, l[2] + 12, t[1] + t[3] - l[1] + 8]; };           // a trace row's first line
const Bd = (s, i) => { const l = BX[s].trace[i], d = BX[s].traceDetail[i]; return [l[0] - 6, d[1] - 4, l[2] + 12, d[3] + 8]; };                          // its detail text
const Bd2 = (s, i) => { const l = BX[s].trace[i], d = BX[s].traceDetail[i]; return [l[0] - 6, d[1] + d[3] / 2 - 2, l[2] + 12, d[3] / 2 + 6]; };            // the second line of the detail
const Bu = (s, a, b) => { const A = BX[s].trace[a], B = BX[s].trace[b]; return [A[0] - 6, A[1] - 4, A[2] + 12, B[1] + B[3] - A[1] + 8]; };                // rows a to b together


// ------------------------------------------------------------------ scene definitions
// Shot scenes show a real full-page screenshot of the live app (shots/*.png, 1500 px wide). Rects are [x, y, w, h] in that image.
const DEFS = {
  hook: { custom: "hook", caps: [
    { at: "start", k: "Incoming text", t: "A fee, a link, a deadline", s: "The usual shape of a delivery scam" },
    { at: "stat", k: "FTC, 2025", t: "Nearly 1 in 3 fraud reports", s: "Were imposter scams" },
    { at: "loss", k: "Reported losses", t: "$3.5 billion", s: "Source: FTC press release, June 2026" },
    { at: "how", k: "The question", t: "How do you check it?", s: "" }] },
  problem: { custom: "problem", caps: [
    { at: "start", k: "The standard advice", t: "Contact the company yourself", s: "" },
    { at: "bot", k: "The shortcut", t: "Ask a chatbot", s: "An illustration of a general chatbot" },
    { at: "nothing", k: "What you get", t: "A verdict with nothing to check", s: "No source, no evidence" },
    { at: "grammar", k: "Scammers use AI too", t: "Good grammar proves nothing", s: "" },
    { at: "meet", k: "Meet", t: "Callback", s: "It finds the real number and shows its work" }] },
  mismatch: {
    layers: [{ src: "scam.png", in: "start" }],
    cam: [{ at: "start", r: FULL }, { at: "paste", r: [640, 100, 720, 405] }, { at: "who", r: [290, 830, 860, 484] },
          { at: "compare", r: [290, 960, 860, 484] }, { at: "verdict", r: [350, 1330, 820, 461] }],
    boxes: [{ in: "paste", out: "click", l: 0, r: Bx("scam", "msg", null, 8), label: "the pasted message" },
            { in: "click", out: "who", l: 0, r: Bx("scam", "btn", null, 6), label: "Check it" },
            { in: "who", out: "list", l: 0, r: Bt("scam", 2), label: "claimed sender: USPS" },
            { in: "list", out: "compare", l: 0, r: Bd("scam", 2), label: "from a curated list, not the message" },
            { in: "compare", out: "official", l: 0, r: Bx("scam", "trace", 4, 6), label: "the link vs usps.com" },
            { in: "official", out: "unreg", l: 0, r: Bx("scam", "trace", 4, 6), label: "NOT an official USPS address", flip: true },
            { in: "unreg", out: "verdict", l: 0, r: Bd2("scam", 4), label: "domain not registered (RDAP)", flip: true },
            { in: "verdict", l: 0, r: Bx("scam", "stamp", null, 8), label: "RULE 3: STRONG MISMATCH" }],
    thud: "verdict",
    caps: [{ at: "start", k: "Live check", t: "Paste it. Check it.", s: "A saved example from the live app" },
           { at: "who", k: "Step 1", t: "Who does it claim to be?", s: "Read from the message" },
           { at: "list", k: "Step 2", t: "Official channels come from a curated list", s: "Never from the message itself" },
           { at: "compare", k: "Step 3", t: "Compare the link with usps.com", s: "" },
           { at: "official", k: "Evidence E1", t: "Not an official USPS address", s: "It contains the brand name, and the domain is unregistered" },
           { at: "verdict", k: "Verdict", t: "Doesn't match the real USPS", s: "Rule 3: strong mismatch" }] },
  genuine: {
    layers: [{ src: "genuine.png", in: "start" }],
    cam: [{ at: "start", r: FULL }, { at: "real", r: [640, 100, 720, 405] }, { at: "link", r: [290, 900, 860, 484] },
          { at: "phone", r: [290, 950, 860, 484] }, { at: "verdict", r: [350, 1270, 820, 461] }, { at: "matters", r: [380, 1380, 760, 428] }],
    boxes: [{ in: "real", out: "link", l: 0, r: Bx("genuine", "msg", null, 8), label: "a real Wells Fargo alert" },
            { in: "link", out: "phone", l: 0, r: Bx("genuine", "trace", 4, 6), label: "link is on wellsfargo.com" },
            { in: "phone", out: "verdict", l: 0, r: Bx("genuine", "trace", 5, 6), label: "phone matches the bank's own page" },
            { in: "verdict", out: "matters", l: 0, r: Bx("genuine", "stamp", null, 8), label: "RULE 5: ALL OFFICIAL" },
            { in: "matters", l: 0, r: Bx("genuine", "h2", null, 8), label: "" }],
    thud: "verdict",
    caps: [{ at: "start", k: "A real alert", t: "Callback doesn't cry scam on everything", s: "Saved example: a genuine Wells Fargo fraud alert" },
           { at: "link", k: "Check 1", t: "The link is on wellsfargo.com", s: "An official Wells Fargo domain" },
           { at: "phone", k: "Check 2", t: "The phone matches the bank's own page", s: "1-800-869-3557, from its contact page" },
           { at: "verdict", k: "Verdict", t: "Matches the real Wells Fargo", s: "Rule 5: every contact point checks out" },
           { at: "matters", k: "Why it matters", t: "False alarms teach people to ignore real warnings", s: "Zero false alarms on the 15 legitimate test messages" }] },
  screenshot: {
    layers: [{ src: "image.png", in: "start" }],
    cam: [{ at: "start", r: FULL }, { at: "drop", r: [660, 230, 640, 360] }, { at: "vision", r: [290, 880, 860, 484] }],
    boxes: [{ in: "drop", out: "vision", l: 0, r: Bx("image", "thumb", null, 8), label: "screenshot attached" },
            { in: "vision", out: "guard", l: 0, r: Bx("image", "trace", 1, 6), label: "Gemini reads the image" },
            { in: "guard", out: "invented", l: 0, r: Bu("image", 0, 2), label: "guard re-checks every contact point" },
            { in: "invented", l: 0, r: Bu("image", 0, 2), label: "anything not in the image is dropped", flip: true }],
    caps: [{ at: "start", k: "Screenshots", t: "Drop in an image of the text", s: "PNG, JPG or WebP" },
           { at: "vision", k: "Gemini vision", t: "Reads the message out of the image", s: "" },
           { at: "guard", k: "The guard", t: "Re-checks what the AI extracted", s: "Every phone, link and email must appear in the text" },
           { at: "invented", k: "Anti-invention", t: "Anything the AI made up is dropped", s: "" }] },
  incident: {
    layers: [{ src: "incident.png", in: "start", out: "evidence" }, { src: "report.png", in: "evidence" }],
    cam: [{ at: "start", r: [300, 0, 900, 506] }, { at: "panel", r: [420, 440, 700, 394] }, { at: "evidence", r: [250, 420, 1000, 562], jump: true }, { at: "ftc", r: [640, 0, 860, 484] }],
    boxes: [{ in: "panel", out: "checklist", l: 0, r: [470, 462, 430, 50], label: "incident panel" },
            { in: "checklist", out: "paid", l: 0, r: [470, 574, 455, 98], label: "what to do next" },
            { in: "paid", out: "summary", l: 0, r: [470, 527, 390, 34], label: "by how they paid" },
            { in: "summary", out: "evidence", l: 0, r: [470, 686, 275, 78], label: "downloadable summary" },
            { in: "evidence", out: "ftc", l: 1, r: [292, 495, 916, 166], label: "verdict, rule and evidence" },
            { in: "ftc", l: 1, r: [1018, 64, 192, 46], label: "print or save as PDF", flip: true }],
    caps: [{ at: "start", k: "Already clicked or replied?", t: "Panic makes people freeze", s: "" },
           { at: "panel", k: "Incident panel", t: "A checklist for what to do next", s: "" },
           { at: "paid", k: "Tailored", t: "Based on how they paid", s: "Card, gift card, bank transfer or crypto" },
           { at: "summary", k: "Download", t: "An incident summary with the evidence", s: "Timestamps, contact points and receipts" },
           { at: "ftc", k: "Ready to file", t: "Paste it into a report for the FTC", s: "ReportFraud.ftc.gov or ic3.gov" }] },
  rules: { custom: "rules", caps: [
    { at: "start", k: "How it decides", t: "What makes Callback different", s: "" },
    { at: "never", k: "The design rule", t: "The AI never decides the verdict", s: "" },
    { at: "reads", k: "What Gemini does", t: "Reads messy text, writes the explanation", s: "" },
    { at: "cite", k: "Every sentence cites evidence", t: "No numbered check, no sentence", s: "Uncited sentences are dropped" },
    { at: "seven", k: "Who decides", t: "Seven fixed rules", s: "The first one that applies sets the verdict" }] },
  eval: { custom: "eval", caps: [
    { at: "start", k: "The test", t: "35 messages we made up", s: "20 scams and 15 legitimate. Synthetic, so a check on our own examples." },
    { at: "gem", k: "Gemini alone", t: "Flagged all 20 scams", s: "" },
    { at: "receipt", k: "But", t: "It called a real receipt a scam", s: "And showed no evidence" },
    { at: "caught", k: "Callback", t: "Caught 15 of the 20 scams", s: "" },
    { at: "zero", k: "False alarms", t: "Zero", s: "0 of 15 legitimate messages flagged" },
    { at: "backed", k: "Evidence", t: "74 of 80 sentences cite a check", s: "" },
    { at: "abst", k: "Abstained", t: "10 of 35 messages: \"can't verify\"", s: "Instead of guessing" }] },
  limits: { custom: "limits", caps: [
    { at: "start", k: "Honest scope", t: "What works and what doesn't", s: "A half-working project is okay. Overstating it isn't." },
    { at: "us", k: "Coverage", t: "US numbers, 27 hand-checked organizations", s: "" },
    { at: "phone", k: "Phone numbers", t: "Confirmed only where it is published", s: "" },
    { at: "unlisted", k: "Not on the list, or the site blocks checks", t: "Callback can't confirm", s: "" },
    { at: "cant", k: "When it can't", t: "It says \"can't verify\"", s: "Instead of guessing" }] },
  close: { custom: "close", caps: [
    { at: "start", k: "Callback", t: "Try it live", s: "callback-lac.vercel.app" }] },
};

// header chapters: 1 the problem, 2 live checks, 3 screenshots, 4 respond, 5 proof, 6 limits and close
const CHAPTER = { hook: 0, problem: 0, mismatch: 1, genuine: 1, screenshot: 2, incident: 3, rules: 4, eval: 4, limits: 5, close: 5 };

// ------------------------------------------------------------------ helpers
const logoStack = (id, size) => `<div id="${id}" style="position:relative;width:${size}px;height:${size}px;flex:none">
  <img class="lt" src="logo_tile.png" style="position:absolute;inset:0;width:100%;height:100%;opacity:0"><img class="la" src="logo_arrow.png" style="position:absolute;inset:0;width:100%;height:100%;opacity:0"></div>`;
function logoUpdate(root, id, t0, t) {
  const el = $("#" + id, root), size = el.offsetWidth || 150, tile = $(".lt", el), arr = $(".la", el);
  const kg = seg(t, t0, t0 + 0.6);
  tile.style.opacity = clamp(kg * 2.5); tile.style.transform = `translate(${lerp(-size * 0.45, 0, kg)}px,${lerp(size * 0.4, 0, kg)}px) scale(${lerp(0.85, 1, kg)})`;
  const kr = clamp((t - t0 - 0.55) / 0.65), off = (1 - backOut(kr)) * size * 0.95;
  arr.style.opacity = clamp((t - t0 - 0.55) / 0.12); arr.style.transform = `translate(${-off}px,${off}px)`;
}
const T = (v, S) => (typeof v === "number" ? v : v === "start" ? 0 : v === "end" ? S.D : S.cues[v] ?? S.D);
const fade = (el, k, dy = 0) => { el.style.opacity = k; el.style.transform = `translateY(${lerp(dy, 0, k)}px)`; };
const typed = (txt, k) => txt.slice(0, Math.floor(clamp(k) * txt.length));

// ------------------------------------------------------------------ custom scenes
const CUSTOM = {
  hook: {
    html: () => `<div class="grid"></div>
      <div class="card" id="hk-sms" style="left:40px;top:40px;width:620px;height:330px;padding:24px 28px">
        <div class="mono" style="font:600 15px var(--mono);letter-spacing:.12em;color:${STEEL}">TEXT MESSAGE &middot; CLAIMED SENDER: USPS</div>
        <div id="hk-msg" style="margin-top:16px;font:500 24px/1.42 var(--mono);border-left:4px solid ${RED};padding-left:16px;height:230px"></div>
      </div>
      <div class="stamp" id="hk-fee" style="left:90px;top:300px;font-size:24px;transform-origin:left center">$1.99 REDELIVERY FEE</div>
      <div class="abs" id="hk-real" style="left:44px;top:420px;width:620px;font:italic 600 128px/1 var(--cond);color:${RED}">Is it real?</div>
      <div class="abs" id="hk-how" style="left:44px;top:420px;width:620px;font:600 72px/1.05 var(--cond);color:${INK}">How do you check it?</div>
      <div class="card" id="hk-st" style="left:700px;top:40px;width:476px;height:276px;padding:24px 28px">
        <div class="mono" style="font:600 15px var(--mono);letter-spacing:.12em;color:${STEEL}">FTC &middot; 2025 FRAUD REPORTS</div>
        <div style="font:600 150px/1 var(--cond);color:${RED};margin-top:6px">1 in 3</div>
        <div style="font:400 24px/1.3 var(--sans);color:${INK}">were imposter scams</div></div>
      <div class="card" id="hk-loss" style="left:700px;top:344px;width:476px;height:296px;padding:24px 28px">
        <div class="mono" style="font:600 15px var(--mono);letter-spacing:.12em;color:${STEEL}">REPORTED LOSSES TO IMPOSTER SCAMS</div>
        <div id="hk-num" style="display:flex;align-items:baseline;gap:14px;font:600 124px/1 var(--cond);color:${INK};margin-top:22px;white-space:nowrap"></div>
        <div style="font:400 22px/1.3 var(--sans);color:${STEEL};margin-top:10px">Source: FTC press release, June 2026</div></div>`,
    update(S, t) {
      const c = S.cues, msg = "USPS: Your package #US9402283 could not be delivered due to an incorrect address. Pay $1.99 redelivery fee within 24 hours at usps-redelivery-notice.xyz to avoid return.";
      const k0 = seg(t, Math.max(0, c.sms - 0.3), c.sms + 0.3); fade($("#hk-sms", S.el), k0, 30);
      $("#hk-msg", S.el).textContent = typed(msg, (t - c.sms) / Math.max(2, c.fee - c.sms + 2.2));
      const kf = clamp((t - c.fee) / 0.3), f = $("#hk-fee", S.el);
      f.style.opacity = kf; f.style.transform = `rotate(${-2 * kf}deg) scale(${lerp(1.6, 1, ease(kf))})`;
      const kr = seg(t, c.real, c.real + 0.35), kh = seg(t, c.how, c.how + 0.35);
      const r = $("#hk-real", S.el); r.style.opacity = kr * (1 - kh); r.style.transform = `scale(${lerp(0.8, 1, kr)})`; r.style.transformOrigin = "left center";
      fade($("#hk-how", S.el), kh, 24);
      fade($("#hk-st", S.el), seg(t, c.stat - 0.3, c.stat + 0.3), 30);
      const kl = seg(t, c.loss - 0.5, c.loss + 0.2); fade($("#hk-loss", S.el), kl, 30);
      const kn = seg(t, c.loss - 0.5, c.loss + 0.9);
      $("#hk-num", S.el).innerHTML = "<span>$" + (3.5 * kn).toFixed(1) + '</span><span style="font-size:52px;letter-spacing:0">billion</span>';
    },
  },
  problem: {
    html: () => `<div class="grid"></div>
      <div class="card" id="pr-adv" style="left:40px;top:40px;width:420px;height:270px;padding:24px 26px">
        <div class="mono" style="font:600 15px var(--mono);letter-spacing:.12em;color:${STEEL}">THE STANDARD ADVICE</div>
        <div style="font:600 46px/1.08 var(--cond);margin-top:14px">Contact the company yourself.</div>
        <div class="mono" style="margin-top:14px;font:500 18px var(--mono);color:${PINE}">&#10003; slow, but it works</div></div>
      <div class="card" id="pr-chat" style="left:500px;top:40px;width:676px;height:400px;padding:22px 26px">
        <div class="mono" style="font:600 15px var(--mono);letter-spacing:.12em;color:${STEEL};border-bottom:1px dashed ${STEEL};padding-bottom:8px">A GENERAL AI CHATBOT (ILLUSTRATION)</div>
        <div id="pr-u" style="margin:16px 0 0 90px;background:${INK};color:#fff;padding:14px 18px;font:400 20px/1.35 var(--sans)">Is this a scam? &ldquo;USPS: Your package could not be delivered. Pay $1.99 at usps-redelivery-notice.xyz&rdquo;</div>
        <div id="pr-b" style="margin:16px 90px 0 0;background:#ece6d8;padding:14px 18px;font:400 22px/1.35 var(--sans)">This looks like a scam. Be careful and don&rsquo;t click anything.</div>
        <div id="pr-n" class="mono" style="margin-top:20px;font:600 22px var(--mono);color:${RED}">sources: none &nbsp; evidence: none</div></div>
      <div class="stamp" id="pr-st1" style="left:640px;top:470px;font-size:30px">NOTHING YOU CAN CHECK</div>
      <div class="card" id="pr-gr" style="left:40px;top:340px;width:420px;height:290px;padding:24px 26px">
        <div class="mono" style="font:600 15px var(--mono);letter-spacing:.12em;color:${STEEL}">A POLISHED SCAM TEXT</div>
        <div style="font:400 24px/1.4 var(--sans);margin-top:14px">Dear customer, your delivery is on hold. Please confirm your address using the secure link below.</div>
        <div class="mono" style="margin-top:14px;font:500 18px var(--mono);color:${PINE}">&#10003; grammar &nbsp;&#10003; spelling &nbsp;&#10003; tone</div></div>
      <div class="stamp" id="pr-st2" style="left:150px;top:585px;font-size:30px">PROVES NOTHING</div>
      <div class="abs" id="pr-meet" style="left:0;top:0;width:${WW}px;height:${WH}px;background:#fbf8f1;display:flex;align-items:center;justify-content:center;gap:34px">
        ${logoStack("pr-logo", 150)}<div style="font:600 140px/1 var(--cond);letter-spacing:-.02em">Callback</div></div>`,
    update(S, t) {
      const c = S.cues;
      fade($("#pr-adv", S.el), seg(t, 0.15, 0.6), 24);
      const kc = seg(t, c.bot - 0.3, c.bot + 0.3); fade($("#pr-chat", S.el), kc, 30);
      fade($("#pr-u", S.el), seg(t, c.bot, c.bot + 0.4), 14);
      fade($("#pr-b", S.el), seg(t, c.bot + 0.8, c.bot + 1.3), 14);
      fade($("#pr-n", S.el), seg(t, c.nothing - 0.2, c.nothing + 0.3), 10);
      const k1 = clamp((t - c.nothing - 0.25) / 0.28), s1 = $("#pr-st1", S.el);
      s1.style.opacity = k1; s1.style.transform = `rotate(${-3 * k1}deg) scale(${lerp(1.6, 1, ease(k1))})`;
      fade($("#pr-gr", S.el), seg(t, c.scam - 0.3, c.scam + 0.3), 30);
      const k2 = clamp((t - c.grammar) / 0.28), s2 = $("#pr-st2", S.el);
      s2.style.opacity = k2; s2.style.transform = `rotate(${-3 * k2}deg) scale(${lerp(1.6, 1, ease(k2))})`;
      const km = seg(t, c.meet - 0.1, c.meet + 0.45), m = $("#pr-meet", S.el);
      m.style.opacity = km; logoUpdate(S.el, "pr-logo", c.meet, t);
    },
  },
  rules: {
    html: () => {
      const rules = [["1", "No organization resolved", "CAN'T VERIFY", STEEL], ["2", "Personal impersonation", "NO ORGANIZATION CLAIMED", OCHRE], ["3", "Strong mismatch", "DOESN'T MATCH", RED],
        ["4", "Phone mismatch", "DOESN'T MATCH", RED], ["5", "Everything matches", "MATCHES", PINE], ["6", "Nothing to check", "CAN'T VERIFY", STEEL], ["7", "Inconclusive", "CAN'T VERIFY", STEEL]];
      return `<div class="grid"></div>
      <div class="card" id="rl-1" style="left:40px;top:40px;width:360px;height:150px;padding:18px 22px"><div class="mono" style="font:600 14px var(--mono);letter-spacing:.12em;color:${STEEL}">1 &middot; GEMINI</div><div style="font:600 36px/1.1 var(--cond);margin-top:8px">Reads the messy text</div></div>
      <div class="card" id="rl-2" style="left:428px;top:40px;width:360px;height:150px;padding:18px 22px"><div class="mono" style="font:600 14px var(--mono);letter-spacing:.12em;color:${RED}">2 &middot; SEVEN FIXED RULES</div><div style="font:600 36px/1.1 var(--cond);margin-top:8px">Decide the verdict</div></div>
      <div class="card" id="rl-3" style="left:816px;top:40px;width:360px;height:150px;padding:18px 22px"><div class="mono" style="font:600 14px var(--mono);letter-spacing:.12em;color:${STEEL}">3 &middot; GEMINI</div><div style="font:600 36px/1.1 var(--cond);margin-top:8px">Explains, citing [E#]</div></div>
      <div class="stamp" id="rl-no" style="left:300px;top:240px;font-size:44px">THE AI NEVER DECIDES</div>
      <div class="card" id="rl-ex" style="left:140px;top:340px;width:936px;height:230px;padding:22px 30px">
        <div class="mono" style="font:600 14px var(--mono);letter-spacing:.12em;color:${STEEL}">EVERY SENTENCE MUST CITE A NUMBERED CHECK</div>
        <div style="font:400 28px/1.4 var(--sans);margin-top:14px">The link provided in the message is not an official USPS address <span id="rl-e1" style="font:600 28px var(--mono);color:${RED}">[E1]</span>.</div>
        <div style="font:400 28px/1.4 var(--sans);margin-top:10px;color:${STEEL};text-decoration:line-through">It is probably fine to ignore this one.</div>
        <div class="mono" style="margin-top:8px;font:600 16px var(--mono);color:${RED}">uncited: dropped</div></div>
      <div class="card" id="rl-tb" style="left:40px;top:210px;width:1136px;height:430px;padding:14px 24px;overflow:hidden">
        <div class="mono" style="font:600 14px var(--mono);letter-spacing:.12em;color:${STEEL};border-bottom:1px solid ${INK};padding-bottom:8px">CHECKED IN ORDER &middot; THE FIRST RULE THAT APPLIES DECIDES</div>
        ${rules.map((r, i) => `<div class="rl-r" style="display:flex;gap:18px;align-items:baseline;padding:10px 0;border-bottom:1px solid #d9d1c1;font:400 24px var(--sans)">
          <span class="mono" style="width:26px;color:${STEEL}">${r[0]}</span><span style="width:360px;font-weight:500">${r[1]}</span><span class="mono" style="font:700 20px var(--mono);color:${r[3]}">${r[2]}</span></div>`).join("")}</div>`;
    },
    update(S, t) {
      const c = S.cues;
      fade($("#rl-1", S.el), seg(t, 0.2, 0.6), 20); fade($("#rl-2", S.el), seg(t, 0.35, 0.75), 20); fade($("#rl-3", S.el), seg(t, 0.5, 0.9), 20);
      const kn = clamp((t - c.never) / 0.28), n = $("#rl-no", S.el), kgone = seg(t, c.reads - 0.1, c.reads + 0.25);
      n.style.opacity = kn * (1 - kgone); n.style.transform = `rotate(${-2 * kn}deg) scale(${lerp(1.6, 1, ease(kn))})`;
      const lit = (id, on, col) => { const e = $(id, S.el); e.style.boxShadow = on ? `0 0 0 5px ${col}` : "none"; };
      const kr = t > c.reads && t < c.cite - 0.2; lit("#rl-1", kr, "rgba(31,106,75,.45)"); lit("#rl-3", t > c.reads + 1.2 && t < c.seven - 0.1, "rgba(31,106,75,.45)");
      const kx = seg(t, c.cite - 0.2, c.cite + 0.3) * (1 - seg(t, c.seven - 0.4, c.seven)); fade($("#rl-ex", S.el), kx, 24);
      $("#rl-e1", S.el).style.background = t > c.e1 && t < c.e1 + 1.6 ? "rgba(194,59,34,.18)" : "transparent";
      const kt = seg(t, c.seven - 0.3, c.seven + 0.3); fade($("#rl-tb", S.el), kt, 30);
      lit("#rl-2", t > c.seven, "rgba(194,59,34,.4)");
      S.el.querySelectorAll(".rl-r").forEach((r, i) => fade(r, seg(t, c.seven + 0.2 + i * 0.28, c.seven + 0.55 + i * 0.28), 10));
    },
  },
  eval: {
    html: () => {
      const card = (id, x, title, sub) => `<div class="card" id="${id}" style="left:${x}px;top:104px;width:260px;height:532px;padding:16px 18px">
        <div class="mono" style="font:600 13px/1.3 var(--mono);letter-spacing:.08em;color:${STEEL};height:48px">${title}</div>
        <div style="position:absolute;left:18px;right:18px;top:78px;height:330px;border-bottom:2px solid ${INK}">
          <div id="${id}-a" style="position:absolute;left:24px;bottom:0;width:80px;height:0;background:#8a8478"></div>
          <div id="${id}-b" style="position:absolute;right:24px;bottom:0;width:80px;height:0;background:${PINE}"></div>
          <div id="${id}-al" class="mono" style="position:absolute;left:4px;width:100px;text-align:center;font:700 26px var(--mono);bottom:0"></div>
          <div id="${id}-bl" class="mono" style="position:absolute;right:4px;width:100px;text-align:center;font:700 26px var(--mono);bottom:0"></div></div>
        <div class="mono" style="position:absolute;left:18px;right:18px;top:420px;display:flex;justify-content:space-around;font:600 13px var(--mono);color:${STEEL}"><span>GEMINI ALONE</span><span style="color:${PINE}">CALLBACK</span></div>
        <div style="position:absolute;left:18px;right:18px;top:454px;font:400 17px/1.3 var(--sans);color:${STEEL}" id="${id}-s">${sub}</div></div>`;
      return `<div class="grid"></div>
        <div class="mono abs" id="ev-h" style="left:40px;top:36px;font:600 18px var(--mono);letter-spacing:.1em;color:${INK}">35 SYNTHETIC TEST MESSAGES &middot; 20 SCAMS &middot; 15 LEGITIMATE</div>
        <div class="abs" style="left:40px;top:62px;width:1136px;height:1px;background:${INK}"></div>
        ${card("ev1", 40, "SCAMS CAUGHT<br>OUT OF 20", "")}${card("ev2", 332, "FALSE ALARMS<br>OUT OF 15 LEGITIMATE", "")}
        ${card("ev3", 624, "SENTENCES BACKED BY<br>EVIDENCE (OF 80)", "")}${card("ev4", 916, "ABSTAINED<br>OUT OF 35", "")}`;
    },
    update(S, t) {
      const c = S.cues, bar = (id, which, val, max, k, label, grey) => {
        const e = $(`#${id}-${which}`, S.el), l = $(`#${id}-${which}l`, S.el), h = 300 * (val / max) * k;
        e.style.height = h + "px"; l.style.bottom = h + 6 + "px"; l.textContent = k > 0.05 ? label : ""; l.style.opacity = clamp(k * 2);
      };
      fade($("#ev-h", S.el), seg(t, 0.1, 0.5), 10);
      ["ev1", "ev2", "ev3", "ev4"].forEach((id, i) => fade($("#" + id, S.el), seg(t, c.synth - 0.3 + i * 0.12, c.synth + 0.25 + i * 0.12), 24));
      const kg = seg(t, c.gem, c.gem + 0.8);
      bar("ev1", "a", 20, 20, kg, "20"); bar("ev2", "a", 1, 15, seg(t, c.receipt - 0.6, c.receipt + 0.1), "1");
      bar("ev3", "a", 0, 80, seg(t, c.noev - 0.2, c.noev + 0.3), "0"); bar("ev4", "a", 0, 35, seg(t, c.noev - 0.2, c.noev + 0.3), "0");
      bar("ev1", "b", 15, 20, seg(t, c.caught, c.caught + 0.9), "15");
      bar("ev2", "b", 0, 15, seg(t, c.zero, c.zero + 0.5), "0");
      bar("ev3", "b", 74, 80, seg(t, c.backed, c.backed + 0.9), "74");
      bar("ev4", "b", 10, 35, seg(t, c.abst, c.abst + 0.9), "10");
      const note = (id, txt, on) => { const e = $(`#${id}-s`, S.el); e.textContent = on ? txt : ""; };
      note("ev2", "Gemini called a real payment receipt a scam", t > c.receipt - 0.3);
      note("ev3", "Gemini showed no evidence at all", t > c.noev - 0.2);
      note("ev4", "Callback says \"can't verify\" instead of guessing", t > c.abst);
      note("ev1", "The other 5 scams: it abstained, none called real", t > c.caught + 1.2);
    },
  },
  limits: {
    html: () => {
      const L = ["US phone numbers (+1) and English messages", "27 hand-checked US organizations (banks, delivery, carriers, agencies)", "Phone numbers read from official contact-page snapshots", "Lookalike domains, RDAP domain age, shortened links followed with HEAD only", "Keyless fallback: the rules still run if Gemini's free tier runs out"];
      const R = ["A phone number the organization doesn't publish", "An organization that isn't on the list", "A site that blocks automated checks", "Telegram and WhatsApp handles, QR codes"];
      const col = (id, x, head, color, items) => `<div class="card" id="${id}" style="left:${x}px;top:40px;width:560px;height:456px;padding:22px 26px;border-top:8px solid ${color}">
        <div class="mono" style="font:700 16px var(--mono);letter-spacing:.1em;color:${color}">${head}</div>
        ${items.map((s2, i) => `<div class="${id}-i" style="margin-top:16px;font:400 24px/1.3 var(--sans)"><span style="color:${color};font-weight:700">${color === PINE ? "&#10003;" : "&bull;"}</span> ${s2}</div>`).join("")}</div>`;
      return `<div class="grid"></div>${col("lm-w", 40, "WHAT IT COVERS (TESTED LOCALLY)", PINE, L)}${col("lm-d", 616, "WHAT IT CAN'T CONFIRM, YET", OCHRE, R)}
        <div class="stamp" id="lm-st" style="left:360px;top:540px;font-size:44px;border-color:${STEEL};color:${STEEL}">THEN: CAN'T VERIFY</div>`;
    },
    update(S, t) {
      const c = S.cues;
      fade($("#lm-w", S.el), seg(t, c.honest - 0.2, c.honest + 0.4), 24); fade($("#lm-d", S.el), seg(t, c.honest + 0.1, c.honest + 0.7), 24);
      const w = [...S.el.querySelectorAll(".lm-w-i")], d = [...S.el.querySelectorAll(".lm-d-i")];
      const wt = [c.us - 0.2, c.orgs - 0.3, c.orgs + 1.2, c.orgs + 2.4, c.orgs + 3.6], dt = [c.phone - 0.2, c.unlisted - 0.2, c.blocks - 0.2, c.cant - 0.9];
      w.forEach((e, i) => fade(e, seg(t, wt[i], wt[i] + 0.4), 10));
      d.forEach((e, i) => fade(e, seg(t, dt[i], dt[i] + 0.4), 10));
      const k = clamp((t - c.cant) / 0.28), st = $("#lm-st", S.el);
      st.style.opacity = k; st.style.transform = `rotate(${-2 * k}deg) scale(${lerp(1.6, 1, ease(k))})`;
    },
  },
  close: {
    html: () => `<div class="grid"></div>
      <div class="abs" style="right:56px;top:60px;width:210px;height:210px">${logoStack("cl-lg", 210)}</div>
      <div class="abs" style="left:56px;top:70px;width:900px">
        <div id="cl-1" style="font:600 72px/1.04 var(--cond);letter-spacing:-.015em">Don&rsquo;t trust the number in the message.</div>
        <div id="cl-2" style="font:italic 600 72px/1.04 var(--cond);color:${RED};margin-top:6px">Callback finds the real one.</div>
        <div id="cl-3" class="mono" style="margin-top:44px;font:500 27px/1.9 var(--mono)"></div></div>
      <div class="mono abs" id="cl-ai" style="left:56px;bottom:30px;width:1100px;font:400 16px/1.5 var(--mono);color:${STEEL}">AI DISCLOSURE: built for ForgeHacks 2026 by solo student John Tewolde with AI coding assistants. Gemini 3.5 Flash Lite reads and explains; fixed rules decide.</div>`,
    update(S, t) {
      const c = S.cues;
      fade($("#cl-1", S.el), seg(t, 0.2, 0.7), 30); fade($("#cl-2", S.el), seg(t, c.real - 0.6, c.real - 0.1), 30);
      logoUpdate(S.el, "cl-lg", 0.3, t);
      const lines = [`demo   ${CFG.facts.demo}`, `code   ${CFG.facts.repo}`];
      const n = Math.floor(clamp((t - c.live) / 1.4) * lines.length);
      $("#cl-3", S.el).innerHTML = lines.slice(0, Math.max(0, n)).map(esc).join("<br>");
      fade($("#cl-ai", S.el), seg(t, c.live + 1, c.live + 1.6), 8);
    },
  },
};

// ------------------------------------------------------------------ shot scenes
function camRect(S, def, t) {
  const ks = def.cam.map((c) => ({ t: T(c.at, S), r: c.r, jump: c.jump }));
  let cur = ks[0].r, from = ks[0].r;
  for (let i = 1; i < ks.length; i++) {
    if (t >= ks[i].t) { from = ks[i - 1].r; cur = ks[i].r; if (ks[i].jump) { from = cur; } const k = seg(t, ks[i].t, ks[i].t + 0.9); cur = cur.map((v, j) => lerp(from[j], v, k)); if (k >= 1) from = ks[i].r; }
  }
  return cur;
}
function applyCam(S, def, t) {
  const r = camRect(S, def, t), sc = Math.min(WW / r[2], WH / r[3]) * (1 + 0.03 * clamp(t / Math.max(1, S.D)));
  const tx = (WW - r[2] * sc) / 2 - r[0] * sc, ty = (WH - r[3] * sc) / 2 - r[1] * sc;
  S.el.querySelectorAll(".shot").forEach((sh) => { sh.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`; sh.style.setProperty("--s", sc); });
  return sc;
}
function updateShots(S, def, t, pending) {
  const sc = applyCam(S, def, t);
  if (def.thud) {
    const dt = t - T(def.thud, S), sh = dt > 0 && dt < 0.4 ? 1 - dt / 0.4 : 0;
    $("#win").style.transform = sh ? `translate(${Math.sin(dt * 95) * 9 * sh}px,${Math.cos(dt * 80) * 6 * sh}px)` : "none";
  }
  (def.layers || []).forEach((l, i) => {
    if (l.seq) {
      const n = (CFG.seq || {})[l.seq] || 0, img = S.el.querySelector(`.shot[data-l="${i}"] img`);
      if (n && t >= T(l.in, S)) {
        const k = Math.min(n, Math.max(1, Math.floor((t - T(l.in, S)) * 30) + 1));
        const url = `screencasts/frames/${l.seq}/${String(k).padStart(5, "0")}.jpg`;
        if (img.getAttribute("src") !== url) { img.setAttribute("src", url); pending.push(img.decode().catch(() => 0)); }
      }
    }
    const a = T(l.in, S), b = l.out ? T(l.out, S) : 1e9;
    const fadeIn = i === 0 && a === 0 ? 1 : seg(t, a, a + 0.35), fadeOut = l.out ? 1 - seg(t, b - 0.05, b + 0.3) : 1;
    S.el.querySelector(`.shot[data-l="${i}"]`).style.opacity = clamp(fadeIn * fadeOut);
  });
  (def.boxes || []).forEach((bx, k) => {
    const el = S.el.querySelector(`.hl[data-b="${k}"]`); if (!el) return;
    const a = T(bx.in, S), b = bx.out ? T(bx.out, S) : 1e9;
    const on = seg(t, a, a + 0.3) * (1 - seg(t, b, b + 0.25));
    el.style.left = bx.r[0] + "px"; el.style.top = bx.r[1] + "px"; el.style.width = bx.r[2] + "px"; el.style.height = bx.r[3] + "px";
    el.style.borderWidth = 4 / sc + "px"; el.style.opacity = on;
    const pop = seg(t, a, a + 0.35), over = 1 + 0.06 * (1 - pop) - 0.012 * Math.sin(pop * Math.PI);
    el.style.transform = `scale(${over})`; el.style.transformOrigin = "50% 50%";
    el.style.boxShadow = on > 0.5 ? `0 0 ${(10 + 8 * Math.sin(t * 4.2)) / sc}px rgba(194,59,34,${0.35 + 0.15 * Math.sin(t * 4.2)})` : "none";
    const lab = el.firstChild; lab.style.fontSize = 20 / sc + "px"; lab.style.padding = `${4 / sc}px ${10 / sc}px`;
    if (bx.flip) { lab.style.top = "auto"; lab.style.bottom = -(38 / sc) + "px"; } else lab.style.top = -(38 / sc) + "px";
    lab.style.left = -(4 / sc) + "px";
  });
}

// ------------------------------------------------------------------ public API
function setCaption(S, def, t) {
  const caps = def.caps || []; let cur = null, ci = -1;
  caps.forEach((c, i) => { if (t >= T(c.at, S) - 0.02) { cur = c; ci = i; } });
  const cap = $("#cap"); if (!cur) { cap.style.opacity = 0; return; }
  const t0 = T(cur.at, S), key = S.id + ":" + ci;
  if (cap.dataset.key !== key) {
    cap.dataset.key = key;
    $(".k", cap).textContent = cur.k;
    $(".t", cap).innerHTML = cur.t.split(" ").map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
    $(".s", cap).textContent = cur.s || "";
  }
  cap.style.opacity = 1; cap.style.transform = "none";
  const k = $(".k", cap), kk = seg(t, t0, t0 + 0.35);
  k.style.opacity = kk; k.style.transform = `translateX(${lerp(-24, 0, kk)}px)`;
  cap.querySelectorAll(".w").forEach((w, i) => {
    const a = seg(t, t0 + 0.08 + i * 0.055, t0 + 0.08 + i * 0.055 + 0.34);
    w.style.opacity = a; w.style.transform = `translateY(${lerp(26, 0, a)}px)`;
  });
  const s = $(".s", cap), ks = seg(t, t0 + 0.4, t0 + 0.85);
  s.style.opacity = ks; s.style.transform = `translateY(${lerp(10, 0, ks)}px)`;
}

function panelFor(S, idx) {
  $("#pn").textContent = `CLIP ${idx + 1} OF ${CFG.scenes.length}: ${S.label.toUpperCase()}`;
  $("#pb").textContent = String(idx + 1).padStart(2, "0");
  let txt = esc(S.text);
  Object.values(S.rawCues || {}).forEach((p) => { txt = txt.replace(esc(p), `<mark>${esc(p)}</mark>`); });
  $("#pt").innerHTML = txt;
  $("#panel").style.display = CFG.placeholder ? "block" : "block";
}

window.setup = (cfg) => {
  CFG = cfg;
  const win = $("#win");
  win.innerHTML = "";
  cfg.scenes.forEach((S, i) => {
    const def = DEFS[S.id];
    const el = document.createElement("div");
    el.className = "scene"; el.dataset.i = i;
    if (def.custom) el.innerHTML = CUSTOM[def.custom].html(S);
    else {
      el.innerHTML = (def.layers || []).map((l, k) => l.seq && (CFG.seq || {})[l.seq]
        ? `<div class="shot" data-l="${k}"><img data-seq="${l.seq}" src="screencasts/frames/${l.seq}/00001.jpg"></div>`
        : `<div class="shot" data-l="${k}"><img src="shots/${l.src || l.fallback}"></div>`).join("");
      const host = document.createElement("div");
      // boxes are drawn in image space, so give each layer's container a copy; only the layer showing is visible anyway
      (def.boxes || []).forEach((b, k) => {
        const sh = el.querySelector(`.shot[data-l="${b.l ?? 0}"]`);
        const h = document.createElement("div");
        h.className = "hl" + (b.flip ? " flip" : ""); h.dataset.b = k; h.dataset.l = b.l ?? 0; h.innerHTML = `<b>${esc(b.label)}</b>`; sh.appendChild(h);
      });
    }
    win.appendChild(el);
    S.el = el;
  });
  $("#track").innerHTML = ["1", "2", "3", "4", "5", "6"].map((n) => `<div class="tk" data-n="${n}">${n}</div>`).join("");
  return document.fonts.ready.then(() => Promise.all([...document.images].map((im) => (im.complete ? 1 : new Promise((r) => (im.onload = im.onerror = r))))));
};

window.seek = async (i, t) => {
  const pending = [];
  const S = CFG.scenes[i], def = DEFS[S.id];
  CFG.scenes.forEach((x) => (x.el.style.display = x === S ? "block" : "none"));
  $("#label").textContent = `${String(i + 1).padStart(2, "0")}  ${S.label}`;
  // chapters 1-6 cover the whole video; the current square fills as its scenes play
  const chOf = (id) => CHAPTER[id] ?? 0, cur = chOf(S.id), mates = CFG.scenes.filter((x) => chOf(x.id) === cur);
  const prog = (mates.indexOf(S) + clamp(t / Math.max(1, S.D))) / mates.length;
  document.querySelectorAll(".tk").forEach((el, n) => {
    el.className = "tk" + (n === cur ? " on" : n < cur ? " done" : "");
    el.style.background = n === cur ? `linear-gradient(to top, var(--red) ${prog * 100}%, var(--paper) ${prog * 100}%)` : "";
    el.style.color = n === cur && prog > 0.55 ? "#fff" : "";
  });
  panelFor(S, i);
  $("#win").style.opacity = 1; $("#win").style.transform = "none";
  document.querySelectorAll(".grid").forEach((g) => { g.style.backgroundPosition = `${(t * 9) % 76}px ${(t * 5) % 76}px`; });
  if (def.custom) CUSTOM[def.custom].update(S, t);
  else updateShots(S, def, t, pending);
  setCaption(S, def, t);
  // shots: boxes belong to a specific layer; show them only when that layer is visible
  S.el.querySelectorAll(".hl").forEach((h) => {
    const layer = S.el.querySelector(`.shot[data-l="${h.dataset.l}"]`);
    if (layer && parseFloat(layer.style.opacity || 1) < 0.5) h.style.opacity = 0;
  });
  wipe(S, i, t);
  await Promise.all(pending);
};

// scene transitions: a slanted ink bar with a red leading edge sweeps in at the end of a scene and out at the start of the next
function wipe(S, i, t) {
  const w = $("#wipe"), inn = i > 0 ? 1 - seg(t, 0.02, 0.5) : 0, out = i < CFG.scenes.length - 1 ? seg(t, S.D - 0.42, S.D - 0.02) : 0;
  if (inn <= 0.001 && out <= 0.001) { w.style.display = "none"; return; }
  w.style.display = "block";
  const W = 1312, slant = 150, poly = (a, b) => `polygon(${a}px 0, ${b}px 0, ${b - slant}px 1080px, ${a - slant}px 1080px)`;
  if (out > 0.001) {                               // the cover grows in from the left
    const edge = out * (W + slant);
    $("#wipe .ink").style.clipPath = poly(-slant, edge); $("#wipe .red").style.clipPath = poly(edge - 26, edge);
  } else {                                         // the cover leaves to the right
    const edge = (1 - inn) * (W + slant);
    $("#wipe .ink").style.clipPath = poly(edge, W + slant * 2); $("#wipe .red").style.clipPath = poly(edge, edge + 26);
  }
}
