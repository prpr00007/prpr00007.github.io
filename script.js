(() => {
  'use strict';

  const SITE = window.SITE || { name: 'iPod', menu: [] };
  const ROWS = 9;                    // visible menu rows (each row is 10cqh)
  const STEP = Math.PI / 10;         // wheel rotation per tick (18°)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = t => { t = Math.max(0, Math.floor(t)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
  const parseDur = s => { const [m, sec] = String(s || '3:00').split(':').map(Number); return (m || 0) * 60 + (sec || 0); };

  const ipod = $('#ipod'), screen = $('#screen'), viewsEl = $('#views'), artEl = $('#art');
  const titleEl = $('#title'), playInd = $('#playInd'), wheel = $('#wheel'), center = $('#center');

  document.title = SITE.name || 'iPod';

  /* ── Settings (persisted per browser) ───────────────── */

  const store = {
    get(k, d) { try { const v = localStorage.getItem('ipod:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ipod:' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const settings = { case: store.get('case', 'silver'), clicker: store.get('clicker', true) };
  const applyCase = () => { ipod.dataset.case = settings.case; };
  applyCase();

  /* ── Clicker sound ──────────────────────────────────── */

  let actx;
  function unlockAudio() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch { /* no audio */ }
  }
  function clickSound() {
    if (!settings.clicker || !actx) return;
    const t = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'square';
    o.frequency.value = 2000;
    g.gain.setValueAtTime(0.035, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + 0.02);
  }

  /* ── Artwork ────────────────────────────────────────── */

  const svgURI = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  function monogram(letter) {
    return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f6ff86"/><stop offset=".5" stop-color="#cdee1f"/><stop offset="1" stop-color="#5daa10"/>
        </linearGradient>
        <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="4" dy="6" stdDeviation="3" flood-color="#000a3a" flood-opacity=".6"/>
        </filter>
      </defs>
      <g filter="url(#s)" transform="rotate(-9 100 100)">
        <path d="M30 58 L64 40" stroke="#e8ff8a" stroke-width="7" stroke-linecap="round"/>
        <path d="M128 168 L172 150" stroke="#cfd3d8" stroke-width="5" stroke-linecap="round"/>
        <text x="104" y="150" text-anchor="middle" font-family="Arial Black, Impact, Helvetica, sans-serif"
              font-weight="900" font-style="italic" font-size="160" fill="url(#g)"
              stroke="#16400a" stroke-width="6" paint-order="stroke" stroke-linejoin="round">${esc(letter)}</text>
        <circle cx="40" cy="146" r="8" fill="#d6d9dd" stroke="#2b2f33" stroke-width="2.5"/>
        <circle cx="58" cy="164" r="5" fill="#d6d9dd" stroke="#2b2f33" stroke-width="2"/>
        <circle cx="150" cy="58" r="6" fill="#d6d9dd" stroke="#2b2f33" stroke-width="2"/>
      </g>
    </svg>`);
  }

  function hue(str) { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }

  function songArt(song) {
    if (song.art) return song.art;
    const h = hue(song.title + song.artist);
    return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${h} 75% 62%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360} 70% 30%)"/>
      </linearGradient></defs>
      <rect width="200" height="200" fill="url(#a)"/>
      <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
      <circle cx="100" cy="100" r="46" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="2"/>
      <path d="M88 62v58a16 14 0 1 1-8-12V70l44-10v48a16 14 0 1 1-8-12V54z" fill="rgba(255,255,255,.88)"/>
    </svg>`);
  }

  const defaultArt = { src: SITE.logo || monogram((SITE.name || '?').trim()[0] || '?'), cover: false };

  let artKey = null;
  function setArt(a) {
    if (!a || a.src === artKey) return;
    artKey = a.src;
    const layer = el('div', 'art-layer' + (a.cover ? ' cover' : ''));
    const img = new Image();
    img.alt = '';
    img.src = a.src;
    layer.appendChild(img);
    artEl.appendChild(layer);
    const done = () => { while (artEl.children.length > 1) artEl.firstChild.remove(); };
    if (reduceMotion) done();
    else layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' }).onfinish = done;
  }

  /* ── Player (simulated, or real if a song has `audio`) ─ */

  const player = {
    list: [], i: 0, t: 0, playing: false, volume: 0.7, audio: null,
    song() { return this.list[this.i]; },
    dur() {
      const s = this.song();
      if (!s) return 0;
      if (this.audio && isFinite(this.audio.duration)) return this.audio.duration;
      return parseDur(s.duration);
    },
    load(list, i) { this.list = list; this.i = i; this.start(); },
    start() {
      this.stopAudio();
      this.t = 0;
      const s = this.song();
      if (s && s.audio) {
        this.audio = new Audio(s.audio);
        this.audio.volume = this.volume;
        this.audio.onended = () => this.next();
        this.audio.play().catch(() => {});
      }
      this.playing = true;
      playerChanged();
    },
    stopAudio() { if (this.audio) { this.audio.onended = null; this.audio.pause(); this.audio = null; } },
    toggle() {
      if (!this.song()) return;
      this.playing = !this.playing;
      if (this.audio) this.playing ? this.audio.play().catch(() => {}) : this.audio.pause();
      playerChanged();
    },
    next() { if (!this.song()) return; this.i = (this.i + 1) % this.list.length; this.start(); },
    prev() {
      if (!this.song()) return;
      if (this.t > 3) { this.t = 0; if (this.audio) this.audio.currentTime = 0; playerChanged(); return; }
      this.i = (this.i - 1 + this.list.length) % this.list.length;
      this.start();
    },
    setVolume(v) { this.volume = clamp(v, 0, 1); if (this.audio) this.audio.volume = this.volume; },
  };

  setInterval(() => {
    if (!player.playing || !player.song()) return;
    if (player.audio) player.t = player.audio.currentTime;
    else if ((player.t += 0.25) >= player.dur()) player.next();
  }, 250);

  const ICON_PLAY = '<svg viewBox="0 0 10 12"><path d="M0 0v12l10-6z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 10 12"><rect width="3.5" height="12"/><rect x="6.5" width="3.5" height="12"/></svg>';

  function playerChanged() {
    playInd.innerHTML = !player.song() ? '' : player.playing ? ICON_PLAY : ICON_PAUSE;
    const c = current();
    if (c && c.update) c.update();
  }

  function findMusic(items) {
    for (const it of items || []) {
      if (it.music && it.music.length) return it.music;
      const inner = findMusic(it.items);
      if (inner) return inner;
    }
    return null;
  }

  /* ── View stack & transitions ───────────────────────── */

  const stack = [];
  const current = () => stack[stack.length - 1];

  function push(view, animate = true) {
    if (!view) return;
    const old = current();
    stack.push(view);
    show(view, old, animate ? 1 : 0);
  }

  function pop() {
    if (stack.length <= 1) return;
    const old = stack.pop();
    show(current(), old, -1);
  }

  function show(view, old, dir) {
    if (!view.el) view.el = view.mount();
    viewsEl.appendChild(view.el);
    if (old && old.leave) old.leave();
    titleEl.textContent = view.title;
    screen.classList.toggle('full', !view.split);
    if (view.update) view.update();
    if (view.enter) view.enter();
    refreshArt();

    if (!old) return;
    if (!dir || reduceMotion) { old.el.remove(); return; }
    const opts = { duration: 240, easing: 'cubic-bezier(.25,.75,.3,1)' };
    view.el.animate([{ transform: `translateX(${dir * 100}%)` }, { transform: 'none' }], opts);
    old.el.animate([{ transform: 'none' }, { transform: `translateX(${-dir * 100}%)` }], opts)
      .onfinish = () => { if (current() !== old) old.el.remove(); };
  }

  function refreshArt() {
    const c = current();
    if (c && c.split) setArt(c.artFor ? c.artFor() : defaultArt);
  }

  function openLink(href) {
    if (/^mailto:|^tel:/i.test(href)) location.href = href;
    else window.open(href, '_blank', 'noopener');
  }

  function activate(it) {
    if (it.items) push(MenuView(it.label, it.items, { split: it.split !== false, art: it.art && { src: it.art, cover: true } }));
    else if (it.music) push(MusicView(it));
    else if (it.text != null) push(TextView(it.label, it.text));
    else if (it.href) openLink(it.href);
    else if (it.game) push(GAMES[it.game] && GAMES[it.game]());
    else if (it.settings) push(SettingsView());
    else if (it.nowPlaying) push(NowPlayingView());
    else if (it.song != null) {
      if (player.list !== it.list || player.i !== it.song) player.load(it.list, it.song);
      push(NowPlayingView());
    } else if (it.action) it.action();
  }

  /* ── Menu view ──────────────────────────────────────── */

  const CHEV = '<svg class="chev" viewBox="0 0 8 14"><path d="M1.5 1.5 6.5 7l-5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function MenuView(title, source, opts = {}) {
    const v = { title, split: opts.split !== false, sel: 0, top: 0 };
    v.items = () => (typeof source === 'function' ? source() : source);

    v.mount = () => {
      const e = el('div', 'v v-menu', '<ul class="list"></ul><div class="sbar"><i></i></div>');
      e.firstChild.addEventListener('click', ev => {
        const li = ev.target.closest('li');
        if (!li) return;
        unlockAudio();
        v.sel = +li.dataset.i;
        v.update();
        v.select();
      });
      return e;
    };

    v.update = () => {
      const items = v.items();
      v.sel = clamp(v.sel, 0, Math.max(0, items.length - 1));
      if (v.sel < v.top) v.top = v.sel;
      if (v.sel >= v.top + ROWS) v.top = v.sel - ROWS + 1;
      v.top = clamp(v.top, 0, Math.max(0, items.length - ROWS));

      const ul = v.el.firstChild;
      ul.innerHTML = items.map((it, i) => {
        const sel = i === v.sel;
        const right = it.value ? `<span class="val">${esc(it.value())}</span>` : sel && !it.action ? CHEV : '';
        return `<li class="row${sel ? ' sel' : ''}" data-i="${i}"><span class="lbl">${esc(it.label)}</span>${right}</li>`;
      }).join('');
      ul.style.setProperty('--top', v.top);

      const over = items.length > ROWS;
      v.el.classList.toggle('has-sbar', over);
      if (over) {
        const thumb = v.el.querySelector('.sbar i');
        thumb.style.height = (ROWS / items.length) * 100 + '%';
        thumb.style.top = (v.top / items.length) * 100 + '%';
      }
      if (current() === v) refreshArt();
    };

    v.tick = d => {
      const s = clamp(v.sel + d, 0, v.items().length - 1);
      if (s === v.sel) return false;
      v.sel = s;
      v.update();
      return true;
    };

    v.select = () => { const it = v.items()[v.sel]; if (it) activate(it); };

    v.artFor = () => {
      const it = v.items()[v.sel];
      if (it && it.art) return { src: it.art, cover: true };
      return opts.art || defaultArt;
    };
    return v;
  }

  function MusicView(it) {
    const songs = it.music;
    const items = [
      {
        label: 'Shuffle Songs',
        action() {
          const list = [...songs];
          for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
          player.load(list, 0);
          push(NowPlayingView());
        },
      },
      ...songs.map((s, i) => ({ label: s.title, art: songArt(s), song: i, list: songs })),
    ];
    return MenuView(it.label, items);
  }

  function SettingsView() {
    const songs = findMusic(SITE.menu) || [];
    const projects = (SITE.menu.find(m => /project/i.test(m.label)) || {}).items || [];
    return MenuView('Settings', [
      {
        label: 'About',
        text: `<h2>${esc(SITE.name)}'s iPod</h2><dl>
          <dt>Songs</dt><dd>${songs.length}</dd>
          <dt>Projects</dt><dd>${projects.length}</dd>
          <dt>Capacity</dt><dd>∞ GB</dd>
          <dt>Case</dt><dd>${settings.case === 'silver' ? 'Silver' : 'Black'}</dd>
          <dt>Version</dt><dd>1.0</dd></dl>`,
      },
      {
        label: 'Case',
        value: () => (settings.case === 'silver' ? 'Silver' : 'Black'),
        action() {
          settings.case = settings.case === 'silver' ? 'black' : 'silver';
          store.set('case', settings.case);
          applyCase();
          current().update();
        },
      },
      {
        label: 'Clicker',
        value: () => (settings.clicker ? 'On' : 'Off'),
        action() {
          settings.clicker = !settings.clicker;
          store.set('clicker', settings.clicker);
          current().update();
        },
      },
      {
        label: 'Reset Settings',
        action() {
          settings.case = 'silver';
          settings.clicker = true;
          store.set('case', settings.case);
          store.set('clicker', settings.clicker);
          applyCase();
          current().update();
        },
      },
    ], { split: false });
  }

  /* ── Text view ──────────────────────────────────────── */

  function TextView(title, html) {
    const v = { title, split: false };
    v.mount = () => {
      const e = el('div', 'v v-text', `<div class="txt">${html}</div><div class="sbar"><i></i></div>`);
      const t = e.firstChild;
      t.addEventListener('scroll', () => v.update());
      t.querySelectorAll('img').forEach(img => img.addEventListener('load', () => v.update()));
      return e;
    };
    v.update = () => {
      const t = v.el.firstChild;
      const over = t.scrollHeight > t.clientHeight + 1;
      v.el.classList.toggle('has-sbar', over);
      if (over) {
        const thumb = v.el.querySelector('.sbar i');
        thumb.style.height = (t.clientHeight / t.scrollHeight) * 100 + '%';
        thumb.style.top = (t.scrollTop / t.scrollHeight) * 100 + '%';
      }
    };
    v.tick = d => {
      const t = v.el.firstChild, before = t.scrollTop;
      t.scrollTop += d * Math.max(16, t.clientHeight * 0.12);
      v.update();
      return t.scrollTop !== before;
    };
    return v;
  }

  /* ── Now Playing ────────────────────────────────────── */

  const SPK_LO = '<svg viewBox="0 0 12 12"><path d="M0 4h3l4-3v10L3 8H0z"/></svg>';
  const SPK_HI = '<svg viewBox="0 0 16 12"><path d="M0 4h3l4-3v10L3 8H0z"/><path d="M9.5 3.2a4 4 0 0 1 0 5.6M11.8 1.2a7 7 0 0 1 0 9.6" fill="none" stroke="#444" stroke-width="1.4" stroke-linecap="round"/></svg>';

  function NowPlayingView() {
    const v = { title: 'Now Playing', split: false };
    let shownSong = null, volUntil = 0, iv = 0;

    v.mount = () => el('div', 'v v-np', `
      <div class="np-count"></div>
      <div class="np-main">
        <div class="np-art"></div>
        <div class="np-meta"><b class="np-title"></b><span class="np-artist"></span><span class="np-album"></span></div>
      </div>
      <div class="np-prog">
        <div class="np-bar"><i></i></div>
        <div class="np-times"><span class="np-el"></span><span class="np-rem"></span></div>
      </div>
      <div class="np-volrow">${SPK_LO}<div class="np-bar np-vol"><i></i></div>${SPK_HI}</div>`);

    v.update = () => {
      const s = player.song();
      if (!s) return;
      const q = sel => v.el.querySelector(sel);
      q('.np-count').textContent = `${player.i + 1} of ${player.list.length}`;
      if (s !== shownSong) {
        shownSong = s;
        q('.np-art').style.backgroundImage = `url("${songArt(s)}")`;
        q('.np-title').textContent = s.title;
        q('.np-artist').textContent = s.artist || '';
        q('.np-album').textContent = s.album || '';
      }
      const dur = player.dur();
      q('.np-prog i').style.width = (dur ? (player.t / dur) * 100 : 0) + '%';
      q('.np-el').textContent = fmt(player.t);
      q('.np-rem').textContent = '-' + fmt(dur - player.t);
      q('.np-vol i').style.width = player.volume * 100 + '%';
      v.el.classList.toggle('show-vol', performance.now() < volUntil);
    };

    v.tick = d => {
      player.setVolume(player.volume + d * 0.05);
      volUntil = performance.now() + 1500;
      v.update();
      return true;
    };

    v.enter = () => { iv = setInterval(v.update, 250); };
    v.leave = () => clearInterval(iv);
    return v;
  }

  /* ── Brick game ─────────────────────────────────────── */

  const GAMES = { brick: BrickGame };

  function BrickGame() {
    const v = { title: 'Brick', split: false };
    const LW = 320;
    const COLORS = ['#ff4f5e', '#ff9d1f', '#ffe04a', '#5bd64b', '#3fa8ff'];
    const keys = { l: false, r: false };
    let cv, ctx, LH = 220, raf = 0, last = 0, s = null;

    v.mount = () => {
      const e = el('div', 'v v-game');
      cv = el('canvas');
      ctx = cv.getContext('2d');
      e.appendChild(cv);
      new ResizeObserver(resize).observe(cv);
      cv.addEventListener('click', () => v.onButton('center'));
      return e;
    };

    function resize() {
      const r = cv.getBoundingClientRect();
      if (!r.width) return;
      const dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      LH = (LW * r.height) / r.width;
      const k = cv.width / LW;
      ctx.setTransform(k, 0, 0, k, 0, 0);
    }

    function buildBricks() {
      const cols = 8, gap = 3, bw = (LW - gap * (cols + 1)) / cols, bh = 9;
      s.bricks = [];
      COLORS.forEach((color, r) => {
        for (let c = 0; c < cols; c++) s.bricks.push({ x: gap + c * (bw + gap), y: 22 + r * (bh + gap), w: bw, h: bh, color, alive: true });
      });
    }
    function resetBall() {
      s.ball = { x: s.px, y: 0, vx: 0, vy: 0, r: 3.5, stuck: true, speed: 165 + 20 * (s.level - 1) };
    }
    function newGame() {
      s = { score: 0, lives: 3, level: 1, paused: false, over: false, px: LW / 2, pw: 54 };
      buildBricks();
      resetBall();
    }
    const clampPaddle = () => { s.px = clamp(s.px, s.pw / 2, LW - s.pw / 2); };

    function step(dt) {
      const py = LH - 12, b = s.ball;
      if (keys.l) s.px -= 250 * dt;
      if (keys.r) s.px += 250 * dt;
      clampPaddle();
      if (b.stuck) { b.x = s.px; b.y = py - b.r - 1; return; }

      const n = Math.ceil((b.speed * dt) / 2), h = dt / n;
      for (let k = 0; k < n; k++) {
        b.x += b.vx * h;
        b.y += b.vy * h;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
        if (b.x > LW - b.r) { b.x = LW - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y < 14 + b.r) { b.y = 14 + b.r; b.vy = Math.abs(b.vy); }

        if (b.vy > 0 && b.y + b.r >= py && b.y + b.r <= py + 7 &&
            b.x >= s.px - s.pw / 2 - b.r && b.x <= s.px + s.pw / 2 + b.r) {
          const ang = clamp((b.x - s.px) / (s.pw / 2), -1, 1) * 1.05;
          b.vx = b.speed * Math.sin(ang);
          b.vy = -b.speed * Math.cos(ang);
          b.y = py - b.r;
          clickSound();
        }

        for (const br of s.bricks) {
          if (!br.alive) continue;
          if (b.x + b.r > br.x && b.x - b.r < br.x + br.w && b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
            br.alive = false;
            s.score += 10;
            const ox = Math.min(b.x + b.r - br.x, br.x + br.w - (b.x - b.r));
            const oy = Math.min(b.y + b.r - br.y, br.y + br.h - (b.y - b.r));
            if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
            clickSound();
            break;
          }
        }

        if (b.y - b.r > LH) {
          if (--s.lives <= 0) s.over = true;
          resetBall();
          break;
        }
      }
      if (s.bricks.every(x => !x.alive)) { s.level++; buildBricks(); resetBall(); }
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, LH);
      g.addColorStop(0, '#0d1424');
      g.addColorStop(1, '#03050b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, LW, LH);

      ctx.font = '600 9px -apple-system, Helvetica, Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#c9d2df';
      ctx.textAlign = 'left';
      ctx.fillText(`Score ${s.score}`, 6, 8);
      ctx.textAlign = 'center';
      ctx.fillText(`Level ${s.level}`, LW / 2, 8);
      for (let i = 0; i < s.lives; i++) {
        ctx.beginPath();
        ctx.arc(LW - 8 - i * 9, 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const br of s.bricks) {
        if (!br.alive) continue;
        ctx.fillStyle = br.color;
        ctx.fillRect(br.x, br.y, br.w, br.h);
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.fillRect(br.x, br.y, br.w, 2);
      }

      const py = LH - 12;
      const pg = ctx.createLinearGradient(0, py, 0, py + 5);
      pg.addColorStop(0, '#ffffff');
      pg.addColorStop(1, '#9aa3ad');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(s.px - s.pw / 2, py, s.pw, 5, 2.5) : ctx.rect(s.px - s.pw / 2, py, s.pw, 5);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
      ctx.fill();

      const msg = s.over ? ['Game Over', `Score ${s.score} · press center to play again`]
        : s.paused ? ['Paused', 'Press ▶❚❚ to resume']
        : s.ball.stuck ? ['', 'Spin the wheel to move · center to launch'] : null;
      if (msg) {
        ctx.textAlign = 'center';
        if (msg[0]) {
          ctx.fillStyle = 'rgba(0,0,0,.55)';
          ctx.fillRect(0, LH / 2 - 22, LW, 40);
          ctx.fillStyle = '#fff';
          ctx.font = '700 15px -apple-system, Helvetica, Arial, sans-serif';
          ctx.fillText(msg[0], LW / 2, LH / 2 - 8);
        }
        ctx.fillStyle = '#c9d2df';
        ctx.font = '500 9px -apple-system, Helvetica, Arial, sans-serif';
        ctx.fillText(msg[1], LW / 2, msg[0] ? LH / 2 + 9 : LH / 2 + 30);
      }
    }

    function loop(t) {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(0.033, (t - last) / 1000) : 0;
      last = t;
      if (!s.paused && !s.over) step(dt);
      draw();
    }

    v.enter = () => { resize(); if (!s) newGame(); last = 0; raf = requestAnimationFrame(loop); };
    v.leave = () => { cancelAnimationFrame(raf); keys.l = keys.r = false; };

    v.tick = d => { s.px += d * 18; clampPaddle(); return true; };

    v.onButton = name => {
      if (name === 'center') {
        if (s.over) newGame();
        else if (s.paused) s.paused = false;
        else if (s.ball.stuck) {
          const ang = Math.random() * 0.8 - 0.4;
          Object.assign(s.ball, { stuck: false, vx: s.ball.speed * Math.sin(ang), vy: -s.ball.speed * Math.cos(ang) });
        }
        return true;
      }
      if (name === 'play') { if (!s.over) s.paused = !s.paused; return true; }
      if (name === 'prev' || name === 'next') { v.tick(name === 'next' ? 2 : -2); return true; }
      return false;
    };

    v.key = (e, down) => {
      if (e.key === 'ArrowLeft') { keys.l = down; return true; }
      if (e.key === 'ArrowRight') { keys.r = down; return true; }
      return false;
    };
    return v;
  }

  /* ── Input ──────────────────────────────────────────── */

  function tick(d) {
    const c = current();
    if (c && c.tick && c.tick(d) !== false) clickSound();
  }

  function flash(name) {
    const node = name === 'center' ? center : wheel.querySelector(`.wl[data-btn="${name}"]`);
    if (!node) return;
    node.classList.add('hit');
    setTimeout(() => node.classList.remove('hit'), 140);
  }

  function press(name) {
    unlockAudio();
    flash(name);
    const c = current();
    if (c.onButton && c.onButton(name)) return;
    switch (name) {
      case 'menu': pop(); break;
      case 'center': if (c.select) c.select(); break;
      case 'play':
        if (player.song()) player.toggle();
        else { const songs = findMusic(SITE.menu); if (songs) player.load(songs, 0); }
        break;
      case 'next': player.next(); break;
      case 'prev': player.prev(); break;
    }
  }

  // Click wheel: drag in a circle to scroll, tap a quadrant to press it.
  let drag = null;
  wheel.addEventListener('pointerdown', e => {
    if (e.target === center) return;
    e.preventDefault();
    unlockAudio();
    wheel.setPointerCapture(e.pointerId);
    const r = wheel.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    drag = {
      id: e.pointerId, cx, cy, rad: r.width / 2,
      x0: e.clientX, y0: e.clientY,
      last: Math.atan2(e.clientY - cy, e.clientX - cx),
      acc: 0, moved: false,
    };
  });

  wheel.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.cx, dy = e.clientY - drag.cy;
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true;
    if (Math.hypot(dx, dy) < drag.rad * 0.15) return;   // too close to the middle; angle is noisy
    const a = Math.atan2(dy, dx);
    let d = a - drag.last;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    drag.last = a;
    drag.acc += d;
    while (drag.acc >= STEP) { drag.acc -= STEP; tick(1); }
    while (drag.acc <= -STEP) { drag.acc += STEP; tick(-1); }
  });

  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (e.type === 'pointerup' && !drag.moved) {
      const deg = (Math.atan2(drag.y0 - drag.cy, drag.x0 - drag.cx) * 180) / Math.PI;
      press(deg > -135 && deg <= -45 ? 'menu' : deg > -45 && deg <= 45 ? 'next' : deg > 45 && deg <= 135 ? 'play' : 'prev');
    }
    drag = null;
  };
  wheel.addEventListener('pointerup', endDrag);
  wheel.addEventListener('pointercancel', endDrag);

  center.addEventListener('pointerdown', e => e.preventDefault());   // keep focus where it is
  center.addEventListener('click', () => press('center'));

  // Mouse wheel / trackpad scrolling anywhere on the page.
  let wheelAcc = 0;
  addEventListener('wheel', e => {
    e.preventDefault();
    wheelAcc += e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
    while (wheelAcc >= 40) { wheelAcc -= 40; tick(1); }
    while (wheelAcc <= -40) { wheelAcc += 40; tick(-1); }
  }, { passive: false });

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const c = current();
    if (c.key && c.key(e, true)) { e.preventDefault(); return; }
    const map = {
      ArrowUp: () => tick(-1), ArrowDown: () => tick(1),
      ArrowRight: () => press('center'), Enter: () => press('center'),
      ArrowLeft: () => press('menu'), Escape: () => press('menu'), Backspace: () => press('menu'),
      ' ': () => press('play'),
    };
    if (map[e.key]) { e.preventDefault(); unlockAudio(); map[e.key](); }
  });
  addEventListener('keyup', e => { const c = current(); if (c.key) c.key(e, false); });

  /* ── Fit to window (desktop) ────────────────────────── */

  function fit() {
    const s = matchMedia('(max-width: 520px)').matches ? 1 : Math.min(1, (innerHeight - 56) / 620, (innerWidth - 32) / 370);
    document.documentElement.style.setProperty('--s', s);
  }
  addEventListener('resize', fit);
  fit();

  /* ── Boot ───────────────────────────────────────────── */

  const rootItems = () => (player.song() ? [...SITE.menu, { label: 'Now Playing', nowPlaying: true }] : SITE.menu);
  push(MenuView(SITE.name, rootItems), false);
})();
