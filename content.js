/*
 * ─────────────────────────────────────────────────────────────
 *  EDIT THIS FILE to make the site yours.
 * ─────────────────────────────────────────────────────────────
 *
 *  Menu item types:
 *    { label, items: [...] }          → submenu
 *    { label, text: `<p>html</p>` }   → scrollable text page
 *    { label, href: "https://..." }   → opens a link (new tab)
 *    { label, music: [songs] }        → song list + Now Playing screen
 *    { label, game: "brick" }         → Brick game
 *    { label, settings: true }        → Settings menu (case color, clicker)
 *
 *  Any item can also have  art: "img/whatever.jpg"  — it shows in the
 *  right-hand panel while that item is highlighted.
 *
 *  Songs: { title, artist, album, duration: "3:24", art?, audio? }
 *    - audio is optional (path to an mp3). Without it, playback is simulated.
 */

window.SITE = {
  name: "Prabu",          // title bar + browser tab
  logo: null,             // e.g. "img/logo.png" — null uses an auto-generated monogram

  menu: [
    {
      label: "About",
      text: `
        <h2>Hi, I'm Prabu 👋</h2>
        <p>I study <b>Computer Science and Business Administration</b> (Finance concentration) at <b>Northeastern University</b> in Boston, in the John Martinson Honors Program. Class of 2029.</p>
        <p>I like building things end to end, from computer vision pipelines and LLM-powered tools to full-stack web apps and the occasional trading bot.</p>
        <p>I also founded <b>Loom&amp;Sand</b>, a lifestyle brand making towels, totes and cushions with artisans in Tamil Nadu, India.</p>
        <p>Outside of code: EDM music production, rock climbing, hiking, tennis and vintage fashion.</p>
        <p>Scroll with the wheel to read more. Press <b>MENU</b> to go back.</p>
      `,
    },
    {
      label: "Projects",
      items: [
        {
          label: "Scriptiq",
          text: `
            <h2>Scriptiq</h2>
            <p>An end-to-end localization pipeline for manga, manhwa and manhua. It detects speech bubbles, extracts and translates the text, and re-renders the translation back into the original artwork, with manual review at every step.</p>
            <p>Text extraction combines manga-ocr, EasyOCR and OpenCV; translation runs on Llama 4 Scout via the Groq API. Tested with two scanlation teams.</p>
            <p><b>Stack:</b> Python, FastAPI, React, Vite, Fabric.js, OpenCV</p>
            <p><a href="https://github.com/prpr00007/Scriptiq" target="_blank" rel="noopener">View on GitHub →</a></p>
          `,
        },
        {
          label: "Tello",
          text: `
            <h2>Tello</h2>
            <p>An iOS app built for the Apple Swift Student Challenge. Point the camera at a real-world object and Tello writes a personalised AI story about it for kids aged 5–10.</p>
            <p>Every word is tappable, spoken aloud and visual. It's designed for dyslexia, ADHD and ESL learners.</p>
            <p><b>Stack:</b> Swift, SwiftUI, Vision, AVFoundation</p>
            <p><a href="https://github.com/prpr00007/Tello" target="_blank" rel="noopener">View on GitHub →</a></p>
          `,
        },
        {
          label: "VaultOS",
          text: `
            <h2>VaultOS</h2>
            <p>A retro-futuristic financial command center built at <b>BostonHacks 2025</b> with a two-person team. It flags phishing links, automates saving and explains transactions in plain language.</p>
            <p>I built Guard Mode, a link analyzer that checks URLs against 15+ red-flag signals and gives a 1–10 risk score without ever loading the page, and wired in Google Gemini for the explanations.</p>
            <p><b>Stack:</b> Python, FastAPI, React, Gemini API, Capital One Nessie API</p>
            <p><a href="https://github.com/garvnn/vault-os" target="_blank" rel="noopener">View on GitHub →</a></p>
          `,
        },
        {
          label: "Market Bot",
          text: `
            <h2>Prediction Market Bot</h2>
            <p>An automated trading bot for prediction markets like Polymarket. It looks for moments when a prediction market's price drifts away from what deeper traditional markets imply.</p>
            <p><b>Stack:</b> Python, pandas, Jupyter, FRED data, Docker</p>
            <p><a href="https://github.com/prpr00007/Prediction-Market-Model-Based-Bot" target="_blank" rel="noopener">View on GitHub →</a></p>
          `,
        },
        {
          label: "AI Merge Foreman",
          text: `
            <h2>AI Merge Foreman</h2>
            <p>A system for preventing and resolving merge conflicts when several AI agents and AI-assisted developers edit the same codebase at once.</p>
            <p>Every change, whether from an autonomous agent or a pasted ChatGPT suggestion, goes through one "foreman" layer that coordinates edits before they collide.</p>
            <p><a href="https://github.com/prpr00007/git-architecture-merge-conflicts" target="_blank" rel="noopener">View on GitHub →</a></p>
          `,
        },
      ],
    },
    {
      label: "Experience",
      items: [
        {
          label: "Loom&Sand",
          text: `
            <h2>Loom&amp;Sand LLC</h2>
            <p><b>Founder</b> · 2023 – Present</p>
            <p>Founded and registered a lifestyle brand, sourcing $20K of beach towels, tote bags and throw cushions made in Tamil Nadu, India.</p>
            <p>I run operations end to end, from manufacturing to international shipping, and work with local artists on original designs.</p>
          `,
        },
        {
          label: "CATA",
          text: `
            <h2>Capital Area Tennis Association</h2>
            <p><b>Tournament Site Director</b> · Austin, TX · 2023 – 2025</p>
            <p>Ran tournament-day operations for 200+ 16U/18U players and their families, keeping events on schedule and resolving conflicts under time pressure.</p>
          `,
        },
        {
          label: "Tamil Academy",
          text: `
            <h2>Central Texas Tamil Academy</h2>
            <p><b>Assistant to the Academy Director</b> · Austin, TX · 2023 – 2025</p>
            <p>Supported day-to-day operations for a nonprofit academy serving 500+ students and staff, and helped train instructors on student engagement.</p>
          `,
        },
        {
          label: "Leadership",
          text: `
            <h2>Leadership</h2>
            <p>Co-Founder &amp; CEO, FIRST Robotics Team</p>
            <p>Co-Founder &amp; VP, Engineering Club</p>
            <p>Founder &amp; President, Asian Student Alliance</p>
            <p>Team Captain, Stony Point High School Tennis</p>
            <p>Director of Social Outreach, DECA</p>
            <p>Founder, Vintage Resale Shop</p>
            <p>Volunteer Mentor, Title I tutoring</p>
          `,
        },
      ],
    },
    {
      label: "Music",
      music: [
        { title: "andy warhol", artist: "Kai Angel",    album: "Shh...",         duration: "2:56" },
        { title: "BKK",         artist: "SEBii & kimj", album: "BKK",            duration: "3:00" },
        { title: "everything",  artist: "Joey Cash",    album: "poser",          duration: "2:03" },
        { title: "Pyramids",    artist: "Frank Ocean",  album: "channel ORANGE", duration: "9:53" },
      ],
    },
    { label: "GitHub",    href: "https://github.com/prpr00007" },
    { label: "Mail",      href: "mailto:ramanababu.p@northeastern.edu" },
    { label: "Games",     items: [{ label: "Brick", game: "brick" }] },
    { label: "Settings",  settings: true },
  ],
};
