// Builds scenes.json from the single script source (../video/script.json) plus the cue phrases below.
// A cue is a phrase John says; the scene animation for that beat fires on that word (found in the transcript of his clip).
const fs = require("fs");
const path = require("path");
const script = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "video", "script.json"), "utf8"));

const EXTRA = {
  1: { id: "hook", label: "The text", cues: { sms: "This text claims", fee: "asking", real: "Is it real", stat: "nearly one in three", loss: "billion", how: "how do you check" } },
  2: { id: "problem", label: "The problem", cues: { advice: "The standard advice", bot: "AI chatbot", nothing: "nothing you can", scam: "Scammers use", grammar: "grammar", meet: "Meet Callback" } },
  3: { id: "mismatch", label: "Live check", cues: { paste: "We paste the message", click: "click Check it", who: "works out who", list: "official organizations", never: "never from the message", compare: "compares", official: "link isn't official", brand: "brand name", unreg: "isn't registered", verdict: "doesn't match" } },
  4: { id: "genuine", label: "A real alert", cues: { real: "real fraud alert", link: "confirms the link", phone: "checks the phone number", verdict: "The verdict", matters: "That matters", alarms: "false alarms" } },
  5: { id: "screenshot", label: "Screenshots", cues: { reads: "reads screenshots", drop: "Drop in an image", vision: "Gemini vision", guard: "a guard", invented: "drops anything" } },
  6: { id: "incident", label: "Already clicked?", cues: { clicked: "clicked", freeze: "freeze", panel: "panel", checklist: "checklist", paid: "how they paid", evidence: "with the evidence", summary: "an incident summary", ftc: "FTC" } },
  7: { id: "rules", label: "How it decides", cues: { diff: "makes Callback different", never: "never decides", reads: "Gemini only reads", cite: "every sentence", e1: "E1", seven: "Seven fixed rules" } },
  8: { id: "eval", label: "The test", cues: { tested: "We tested this", synth: "synthetic", gem: "Gemini alone", receipt: "payment receipt", noev: "no evidence", caught: "Callback caught", zero: "zero false alarms", backed: "backed", abst: "abstained" } },
  9: { id: "limits", label: "Honest limits", cues: { honest: "honest about its limits", us: "US numbers", orgs: "organizations", phone: "A phone number", unlisted: "isn't listed", blocks: "blocks automated checks", cant: "can't verify", guess: "instead of guessing" } },
  10: { id: "close", label: "Try it", cues: { name: "I'm John", live: "live", tag: "Don't trust", real: "Callback finds" } },
};

const scenes = script.scenes.map((s, i) => {
  const e = EXTRA[i + 1];
  return { id: e.id, label: e.label, node: null, text: s.chunks.join(" "), cues: e.cues };
});
fs.writeFileSync(path.join(__dirname, "scenes.json"), JSON.stringify({ fps: 30, wpm: 150, scenes }, null, 2) + "\n");
console.log("scenes.json:", scenes.length, "scenes,", scenes.reduce((n, s) => n + s.text.split(/\s+/).length, 0), "words");
