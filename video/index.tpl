<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Callback — ForgeHacks 2026</title>
    <link rel="stylesheet" href="assets/fonts/fonts.css" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 400; src: url('assets/fonts/IBMPlexMono-Regular.ttf') format('truetype'); }
      @font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 700; src: url('assets/fonts/IBMPlexMono-Bold.ttf') format('truetype'); }
      @font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: 400; src: url('assets/fonts/IBMPlexSans-Regular.ttf') format('truetype'); }
      @font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: 600; src: url('assets/fonts/IBMPlexSans-SemiBold.ttf') format('truetype'); }
      @font-face { font-family: 'Newsreader'; font-style: normal; font-weight: 400; src: url('assets/fonts/Newsreader-Regular.ttf') format('truetype'); }
      @font-face { font-family: 'Newsreader'; font-style: normal; font-weight: 600; src: url('assets/fonts/Newsreader-SemiBold.ttf') format('truetype'); }

      :root {
        --paper: #F3EEE4;
        --sheet: #FBF8F1;
        --ink: #1C1A17;
        --muted: #6B655A;
        --rule: #D9D1C1;
        --stamp: #C23B22;
        --pine: #1F6A4B;
        --ochre: #96640A;
        --graphite: #4A4A48;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
        background: var(--paper);
        color: var(--ink);
        font-family: 'IBM Plex Sans', sans-serif;
      }

      #root {
        width: 100%;
        height: 100%;
        position: relative;
        background: var(--paper);
        overflow: hidden;
      }

      .paper-bg {
        position: absolute;
        inset: 0;
        background-color: var(--paper);
        background-image: 
          linear-gradient(to right, rgba(217, 209, 193, 0.25) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(217, 209, 193, 0.25) 1px, transparent 1px);
        background-size: 40px 40px;
        pointer-events: none;
      }

      .top-banner {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 72px;
        border-bottom: 2px solid var(--ink);
        background: var(--sheet);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 48px;
        z-index: 100;
      }

      .brand-lockup {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .brand-lockup img {
        width: 32px;
        height: 32px;
      }

      .brand-title {
        font-family: 'Newsreader', serif;
        font-size: 28px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .brand-tag {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
        padding-left: 12px;
        border-left: 1px solid var(--rule);
      }

      .header-meta {
        display: flex;
        align-items: center;
        gap: 24px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
      }

      .time-chip {
        padding: 4px 12px;
        background: var(--paper);
        border: 1px solid var(--ink);
        font-weight: 600;
      }

      .progress-container {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 8px;
        background: var(--rule);
        z-index: 100;
      }

      .progress-bar {
        height: 100%;
        width: 0%;
        background: var(--stamp);
      }

      .captions-bar {
        position: absolute;
        bottom: 24px;
        left: 80px;
        right: 80px;
        min-height: 54px;
        background: var(--sheet);
        border: 1.5px solid var(--ink);
        box-shadow: 4px 4px 0 var(--ink);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px 32px;
        z-index: 95;
        text-align: center;
      }

      .caption-text {
        font-family: 'Newsreader', serif;
        font-size: 24px;
        line-height: 1.3;
        font-weight: 500;
        color: var(--ink);
      }

      .scene-slot {
        position: absolute;
        inset: 0;
      }

      #pip {
        position: absolute;
        right: 56px;
        bottom: 112px;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        border: 3px solid var(--ink);
        box-shadow: 5px 5px 0 var(--ink);
        background: var(--sheet);
        overflow: hidden;
        z-index: 90;
        opacity: 0;
        transform-origin: 100% 100%;
      }
      #pip video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      #pip .shape {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Newsreader', serif;
        font-size: 104px;
        font-weight: 600;
        color: var(--ink);
        background: var(--paper);
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-width="1920"
      data-height="1080"
      data-duration="@@TOTAL@@"
    >
      <div class="paper-bg"></div>

      <!-- Persistent Header -->
      <div id="top-bar" class="top-banner">
        <div class="brand-lockup">
          <img src="assets/icon.svg" alt="Callback Logo" />
          <span class="brand-title">Callback</span>
          <span class="brand-tag">ForgeHacks 2026 · Cybersecurity Track</span>
        </div>
        <div class="header-meta">
          <span id="time-display" class="time-chip">@@TIME0@@</span>
          <span>SOLO DEVELOPER: JOHN TEWOLDE</span>
        </div>
      </div>

      @@MEDIA@@

      @@SCENES@@

      <!-- Persistent Captions Bar -->
      <div id="captions-container" class="captions-bar">
        <div id="caption-label" class="caption-text">
          Callback: Ground-truth imposter scam verification.
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-container">
        <div id="main-progress-bar" class="progress-bar"></div>
      </div>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      tl.to("#main-progress-bar", { width: "100%", duration: @@TOTAL@@, ease: "none" }, 0);

      const captionLabel = document.getElementById("caption-label");
      const captionsData = @@CAPTIONS@@;

      captionsData.forEach(c => {
        tl.call(() => {
          if (captionLabel) captionLabel.textContent = c.text;
        }, null, c.start);
      });

      const timeDisplay = document.getElementById("time-display");
      const TOTAL = @@TOTAL@@;
      const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(Math.floor(s % 60)).padStart(2, "0");
      for (let t = 0; t <= Math.ceil(TOTAL); t++) {
        const label = fmt(t) + " / " + fmt(TOTAL);
        tl.call(() => { if (timeDisplay) timeDisplay.textContent = label; }, null, t);
      }
      @@PIPANIM@@

      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
