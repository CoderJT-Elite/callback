"""Captions for the demo video: the script's words, timed to what John actually says.

build.py calls align() per scene with the Whisper word times, then write_ass() / write_srt() on the whole timeline.
The words shown are the script's (so 'XGBoost' isn't 'XG Boost'), the timing is the speech's.
"""
import difflib
import re

MAX_CHARS = 46          # per caption, two lines in the panel
BREAK_AFTER = re.compile(r"[.?!]$")
SOFT_BREAK = re.compile(r"[,;:]$")


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


def align(text, ws, shift):
    """Script tokens with start/end seconds. ws: Whisper words [{'w': normalised, 's', 'e'}]. shift: seconds added to every time."""
    toks = [t for t in text.split() if norm(t)]
    sn, wn = [norm(t) for t in toks], [w["w"] for w in ws]
    times = [None] * len(toks)
    for a, b, size in difflib.SequenceMatcher(None, sn, wn, autojunk=False).get_matching_blocks():
        for k in range(size):
            times[a + k] = (ws[b + k]["s"], ws[b + k]["e"])
    # words Whisper heard differently: spread them evenly between the nearest matched neighbours
    first, last = ws[0]["s"], ws[-1]["e"]
    i = 0
    while i < len(toks):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(toks) and times[j] is None:
            j += 1
        t0 = times[i - 1][1] if i > 0 else first
        t1 = times[j][0] if j < len(toks) else last
        t1 = max(t1, t0 + 0.08 * (j - i))
        step = (t1 - t0) / (j - i)
        for k in range(i, j):
            times[k] = (t0 + (k - i) * step, t0 + (k - i + 1) * step)
        i = j
    return [{"t": t, "s": s + shift, "e": e + shift} for t, (s, e) in zip(toks, times)]


def chunk(words):
    """Split a scene's words into captions: at sentence ends, at a comma once there's enough text, and before any word that wouldn't fit."""
    out, cur = [], []
    text = lambda ws: " ".join(x["t"] for x in ws)
    for w in words:
        if cur and len(text(cur + [w])) > MAX_CHARS:
            out.append(cur)
            cur = []
        cur.append(w)
        if BREAK_AFTER.search(w["t"]) or (SOFT_BREAK.search(w["t"]) and len(text(cur)) >= 26):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    merged = []                                       # a caption shorter than 12 characters joins its neighbour when the pair still fits two lines
    for c in out:
        if merged and len(text(c)) < 12 and len(text(merged[-1] + c)) <= MAX_CHARS + 8:
            merged[-1] += c
        else:
            merged.append(c)
    return merged


def _ts(t, sep):
    ms = int(round(max(0.0, t) * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


def _ass_ts(t):
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def build(scenes):
    """scenes: [(offset_seconds, words)] -> list of captions [{'s','e','words':[...]}] on the final timeline."""
    caps = []
    for off, words in scenes:
        ch = chunk(words)
        for k, c in enumerate(ch):
            s = off + c[0]["s"]
            e = off + c[-1]["e"] + 0.25
            if k + 1 < len(ch):
                e = min(e, off + ch[k + 1][0]["s"])            # never overlap the next caption
            caps.append({"s": s, "e": e, "words": [{"t": w["t"], "s": off + w["s"], "e": off + w["e"]} for w in c]})
    return caps


def write_srt(caps, path):
    lines = []
    for i, c in enumerate(caps, 1):
        lines.append(f"{i}\n{_ts(c['s'], ',')} --> {_ts(c['e'], ',')}\n{' '.join(w['t'] for w in c['words'])}\n")
    open(path, "w", encoding="utf-8", newline="\n").write("\n".join(lines))


def write_ass(caps, path, panel_left=1312, font="IBM Plex Sans"):
    """One event per spoken word: the word being said is red, words still to come are dimmer, words already said are white."""
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{font},42,&H00FFFFFF,&H00FFFFFF,&H00171A1C,&H00000000,-1,0,0,0,100,100,0,0,3,15,0,2,{panel_left + 36},36,44,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for c in caps:
        ws = c["words"]
        for k, w in enumerate(ws):
            s = w["s"] if k else c["s"]
            e = ws[k + 1]["s"] if k + 1 < len(ws) else c["e"]
            if e <= s:
                continue
            parts = []
            for j, x in enumerate(ws):
                col = "&H00FFFFFF&" if j < k else ("&H005D74E8&" if j == k else "&H00D0CCC8&")
                parts.append("{\\1c" + col + "}" + x["t"].replace("{", "(").replace("}", ")"))
            ev.append(f"Dialogue: 0,{_ass_ts(s)},{_ass_ts(e)},Cap,,0,0,0,,{' '.join(parts)}")
    open(path, "w", encoding="utf-8", newline="\n").write(head + "\n".join(ev) + "\n")
