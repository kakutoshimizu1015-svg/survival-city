// src/components/common/mission/MissionTab.jsx

import { useState, useRef, useEffect, useCallback, forwardRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// 1. 定数・ユーティリティ (ご提示のコードと同様)
// ─────────────────────────────────────────────────────────────────────────────
const GAP        = 12;
const CARD_RATIO = 0.74;

const STIFF_X  = 0.22;
const DAMP_X   = 0.65;
const STIFF_T  = 0.36;
const DAMP_T   = 0.82;
const MAX_TILT = 14;

const GRADE_COLOR = {
  UR: "#ffd700", SSR: "#ff6aff", SR: "#c084fc",
  R: "#60a5fa",  N: "#9ca3af",  CHAR: "#fb923c", "": "#fb923c",
};
const GRADE_TIER  = { UR: 4, SSR: 3, SR: 2, CHAR: 2, R: 1 };
const GRADE_LABEL = { UR:"★UR★", SSR:"✦SSR✦", SR:"◆SR◆", CHAR:"NEW CHAR", R:"R", N:"N", "":"" };
const GRADE_BG    = {
  UR:   "linear-gradient(135deg,#7a5000,#ffd700,#7a5000)",
  SSR:  "linear-gradient(135deg,#5a005a,#ff6aff,#5a005a)",
  SR:   "linear-gradient(135deg,#3a006a,#c084fc,#3a006a)",
  CHAR: "linear-gradient(135deg,#6a1800,#fb923c,#6a1800)",
};

const clamp  = (v, a, b) => Math.min(Math.max(v, a), b);
const pct    = (p, t)    => clamp(Math.round((p / t) * 100), 0, 100);
const fmt    = (n) =>
  n >= 1_000_000 ? `${(n/1e6).toFixed(1)}M`
  : n >= 10_000  ? `${(n/1e3).toFixed(0)}k`
  : n >= 1_000   ? `${(n/1e3).toFixed(1)}k`
  : String(n);
const gc     = (g) => GRADE_COLOR[g] ?? "#fff";
const getCW  = () => Math.round(window.innerWidth * CARD_RATIO);
const getUnit = () => getCW() + GAP;

function calcSkip(vel, totalPx, unit) {
  const absV = Math.abs(vel), absDrag = Math.abs(totalPx);
  const dir  = (vel > 0 || totalPx > 0) ? 1 : -1;
  if (absV < 1.2 && absDrag < unit * 0.18) return 0;
  if (absV < 1.0) return 0;
  if (absDrag >= unit * 0.85) return dir * 3;
  if (absDrag >= unit * 0.35) return dir * 2;
  return dir * 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. グローバル CSS (ご提示のコードと同様)
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&display=swap');
@keyframes mt-sway        { from{transform:translateX(-4px);opacity:.3} to{transform:translateX(4px);opacity:.9} }
@keyframes mt-donePulse   {
  0%,100%{ box-shadow:0 0 16px #c8782a44,0 0 40px #c8782a18,inset 0 0 20px #c8782a08 }
  50%    { box-shadow:0 0 30px #c8782a88,0 0 65px #c8782a33,inset 0 0 34px #c8782a16 }
}
@keyframes mt-btnGlow     {
  0%,100%{ box-shadow:0 4px 16px #c8782a55 }
  50%    { box-shadow:0 4px 28px #c8782a99,0 0 40px #c8782a33 }
}
@keyframes mt-shimmer     { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes mt-claimFlash  {
  0%  { box-shadow:0 0 0 #ffd70000 }
  30% { box-shadow:0 0 60px #ffd700bb,0 0 120px #ffd70055 }
  100%{ box-shadow:0 0 20px #ffd70000 }
}
@keyframes mt-shockwave   { 0%{transform:translate(-50%,-50%) scale(0);opacity:.9} 100%{transform:translate(-50%,-50%) scale(8);opacity:0} }
@keyframes mt-screenFlash { 0%{opacity:0} 15%{opacity:1} 100%{opacity:0} }
@keyframes mt-overlayIn   { from{opacity:0} to{opacity:1} }
@keyframes mt-overlayOut  { from{opacity:1} to{opacity:0} }
@keyframes mt-rewardPop   {
  0%  {transform:scale(0) rotate(-20deg);opacity:0}
  60% {transform:scale(1.18) rotate(4deg);opacity:1}
  80% {transform:scale(.94) rotate(-2deg)}
  100%{transform:scale(1) rotate(0)}
}
@keyframes mt-badgeSlide  { from{transform:translateY(-30px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes mt-nameSlide   { from{transform:translateY(30px);opacity:0}  to{transform:translateY(0);opacity:1} }
@keyframes mt-goldRain    { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(360deg);opacity:.4} }
@keyframes mt-shake       {
  0%,100%{transform:translateX(0)}
  15%{transform:translateX(-6px)} 30%{transform:translateX(6px)}
  45%{transform:translateX(-4px)} 60%{transform:translateX(4px)}
  75%{transform:translateX(-2px)} 90%{transform:translateX(2px)}
}
@keyframes mt-tapPulse    { 0%,100%{opacity:.5} 50%{opacity:1} }
`;

function injectCSS() {
  if (typeof document === "undefined" || document.getElementById("mt-styles")) return;
  const el = document.createElement("style");
  el.id = "mt-styles";
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. 演出用関数 (ご提示のコードと同様)
// ─────────────────────────────────────────────────────────────────────────────
function addScreenFlash(col, tier) {
  const el = document.createElement("div");
  const ms = [250,320,420,520,650][tier];
  Object.assign(el.style, {
    position:"fixed", inset:"0", zIndex:"8000", pointerEvents:"none",
    background:`radial-gradient(circle at 50% 50%,${col}44,${col}11 60%,transparent 80%)`,
    animation:`mt-screenFlash ${ms}ms ease-out forwards`,
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms + 50);
}

function spawnParticles(cx, cy, baseCol, count, tier) {
  const palettes = {
    0:["#fb923c","#fff"],
    1:["#60a5fa","#fff","#ffd700"],
    2:["#c084fc","#fff","#ffd700","#f87171"],
    3:["#ff6aff","#ffd700","#fff","#60a5fa","#c084fc"],
    4:["#ffd700","#fffacd","#fff","#ffec6e","#e8972a"],
  };
  const cols = [baseCol, ...(palettes[tier] ?? [])];
  for (let i = 0; i < count; i++) {
    const el  = document.createElement("div");
    const ang = (Math.PI * 2 / count) * i + Math.random() * 0.4;
    const spd = 60 + Math.random() * 100 * (tier + 1);
    const sz  = 5 + Math.random() * 9;
    const col = cols[Math.floor(Math.random() * cols.length)];
    const rot = Math.random() * 720;
    const dur = 700 + Math.random() * 600;
    const tx  = Math.cos(ang) * spd;
    const ty  = Math.sin(ang) * spd - 60;
    Object.assign(el.style, {
      position:"fixed", zIndex:"8500", pointerEvents:"none",
      left:`${cx}px`, top:`${cy}px`,
      width:`${sz}px`, height:`${sz * (Math.random() > .5 ? 1 : 2.5)}px`,
      background:col, borderRadius:Math.random() > .4 ? "50%" : "2px",
      willChange:"transform,opacity",
    });
    document.body.appendChild(el);
    const t0 = performance.now();
    const frame = (now) => {
      const t    = Math.min((now - t0) / dur, 1);
      const ease = 1 - t * t;
      el.style.transform = `translate(${tx*t}px,${ty*t+80*t*t}px) rotate(${rot*t}deg) translate(-50%,-50%)`;
      el.style.opacity   = String(Math.max(ease, 0));
      if (t < 1) requestAnimationFrame(frame); else el.remove();
    };
    requestAnimationFrame(frame);
  }
}

function spawnShockwave(cx, cy, col, delay) {
  setTimeout(() => {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position:"fixed", left:`${cx}px`, top:`${cy}px`,
      width:"40px", height:"40px", borderRadius:"50%",
      border:`2.5px solid ${col}`, boxShadow:`0 0 12px ${col}88`,
      pointerEvents:"none", zIndex:"8200",
      animation:"mt-shockwave .7s ease-out forwards",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 750);
  }, delay);
}

function showRewardOverlay(ic, nm, g, col, tier) {
  const bg       = GRADE_BG[g] ?? "linear-gradient(135deg,#2a1000,#c8782a,#2a1000)";
  const iconSize = tier >= 4 ? 110 : tier >= 3 ? 96 : 82;
  const overlay  = document.createElement("div");
  Object.assign(overlay.style, {
    position:"fixed", inset:"0", zIndex:"9000",
    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
    background:"rgba(0,0,0,.82)", animation:"mt-overlayIn .2s ease-out forwards",
    cursor:"pointer", fontFamily:"'Noto Sans JP',sans-serif",
  });
  overlay.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
      <div style="font-size:11px;font-weight:900;letter-spacing:4px;padding:4px 18px;
        border-radius:20px;background:${bg};color:#fff;
        text-shadow:0 0 12px ${col};box-shadow:0 0 20px ${col}88;
        animation:mt-badgeSlide .35s .05s cubic-bezier(.16,1,.3,1) both;">
        ${GRADE_LABEL[g] ?? "GET"}
      </div>
      <div style="font-size:${iconSize}px;line-height:1;
        filter:drop-shadow(0 0 28px ${col}) drop-shadow(0 0 60px ${col}66);
        animation:mt-rewardPop .5s .1s cubic-bezier(.16,1,.3,1) both;">
        ${ic}
      </div>
      <div style="font-size:18px;font-weight:900;letter-spacing:1px;color:#fff;
        text-shadow:0 0 16px ${col};text-align:center;max-width:280px;line-height:1.4;
        animation:mt-nameSlide .4s .25s cubic-bezier(.16,1,.3,1) both;">
        ${nm}
      </div>
      <div style="margin-top:20px;font-size:11px;color:rgba(255,255,255,.5);
        letter-spacing:2px;animation:mt-tapPulse 1.2s 1s infinite;">
        タップして閉じる
      </div>
    </div>
    <div style="position:absolute;inset:0;pointer-events:none;
      background:radial-gradient(circle at 50% 45%,${col}22 0%,transparent 65%);"></div>
  `;
  document.body.appendChild(overlay);
  const close = () => {
    overlay.style.animation = "mt-overlayOut .25s ease-in forwards";
    setTimeout(() => overlay.remove(), 280);
  };
  overlay.addEventListener("click", close);
  setTimeout(close, 2800);
}

function spawnGoldRain(col) {
  const shapes = ["★","✦","◆","●","▲","♦"];
  for (let i = 0; i < 40; i++) {
    const el  = document.createElement("div");
    const dur = 1200 + Math.random() * 800;
    Object.assign(el.style, {
      position:"fixed", top:"-40px", left:`${Math.random() * 100}vw`,
      fontSize:`${10 + Math.random() * 16}px`, color:col,
      textShadow:`0 0 8px ${col}`, pointerEvents:"none", zIndex:"8100",
      animation:`mt-goldRain ${dur}ms ${Math.random()*600}ms linear forwards`,
      opacity:".85",
    });
    el.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    document.body.appendChild(el);
    setTimeout(() => el.remove(), dur + 800);
  }
}

function claimAnimate(cardEl, btnEl, rw, col, rootEl) {
  const { ic, nm, g } = rw;
  const tier  = GRADE_TIER[g] ?? 0;
  const br    = btnEl.getBoundingClientRect();
  const cx    = br.left + br.width / 2;
  const cy    = br.top;

  cardEl.style.animation = "mt-claimFlash .7s ease-out forwards";
  setTimeout(() => { cardEl.style.animation = ""; }, 800);

  addScreenFlash(col, tier);
  spawnParticles(cx, cy, col, [20,30,45,60,80][tier], tier);

  if (tier >= 1) {
    for (let i = 0; i < tier + 1; i++) spawnShockwave(cx, cy, col, i * 120);
    const wrap = cardEl.closest("[data-card-wrap]");
    if (wrap) {
      wrap.style.transition = "transform .12s cubic-bezier(.36,.07,.19,.97)";
      const prev = wrap.style.transform || "";
      wrap.style.transform = prev + " scale(1.06)";
      setTimeout(() => {
        wrap.style.transform = prev;
        setTimeout(() => { wrap.style.transition = ""; }, 200);
      }, 120);
    }
  }

  if (tier >= 2) setTimeout(() => showRewardOverlay(ic, nm, g, col, tier), 180);
  if (tier >= 3) {
    spawnGoldRain(col);
    if (rootEl) {
      rootEl.style.animation = "mt-shake .45s ease-out";
      setTimeout(() => { rootEl.style.animation = ""; }, 500);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 定数 (ご提示のコードと同様)
// ─────────────────────────────────────────────────────────────────────────────
export const TABS = [
  { id:"wins",  icon:"🏆", label:"優勝"  },
  { id:"money", icon:"💰", label:"累計P" },
  { id:"move",  icon:"👟", label:"移動"  },
  { id:"npc",   icon:"👥", label:"NPC"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. メインコンポーネント (修正版)
// ─────────────────────────────────────────────────────────────────────────────
export default function MissionTab({
  winsCount = 0,
  missions  = {},
  initialClaimed = [], // 追加
  onClaimed,           // 引数を (id, rw) に変更
  onClose,             // 追加
}) {
  const [activeTab,   setActiveTab]   = useState("wins");
  const [curIdx,      setCurIdx]      = useState(0);
  const [claimed,     setClaimed]     = useState(() => new Set(initialClaimed)); // 引数から同期
  const [hintVisible, setHintVisible] = useState(true);

  const P = useRef({ x:0, xVel:0, xTarget:0, tilt:0, tiltVel:0, tiltTarget:0, mode:"idle", rafId:null });
  const curIdxRef    = useRef(0);
  const activeTabRef = useRef("wins");
  const missionsRef  = useRef(missions);
  const trackRef     = useRef(null);
  const railRef      = useRef(null);
  const wrapRefs     = useRef([]);
  const rootRef      = useRef(null);
  const hintTimer    = useRef(null);
  const onSettleRef  = useRef(null);

  useEffect(() => { curIdxRef.current    = curIdx;    }, [curIdx]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { missionsRef.current  = missions;  }, [missions]);

  useEffect(() => { injectCSS(); }, []);

  const applyTransforms = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const p    = P.current;
    const cw   = getCW();
    const unit = cw + GAP;
    rail.style.transform = `translateX(${(window.innerWidth - cw) / 2 - p.x}px)`;
    wrapRefs.current.forEach((wrap, i) => {
      if (!wrap) return;
      const dist    = (p.x - i * unit) / unit;
      const absD    = Math.abs(dist);
      const scale   = Math.max(0.82, 1 - absD * 0.085);
      const opacity = Math.max(0.35, 1 - absD * 0.40);
      const tiltMix = Math.max(0, 1 - absD * 1.6);
      wrap.style.transform = `scale(${scale.toFixed(4)}) translateZ(${Math.min(0, -absD * 25).toFixed(1)}px) rotateY(${(p.tilt * tiltMix).toFixed(2)}deg)`;
      wrap.style.opacity   = opacity.toFixed(3);
    });
  }, []);

  const stepSpring = useCallback(() => {
    const p = P.current;
    p.xVel    += STIFF_X * (p.xTarget - p.x) - DAMP_X * p.xVel;
    p.x       += p.xVel;
    p.tiltVel += STIFF_T * (p.tiltTarget - p.tilt) - DAMP_T * p.tiltVel;
    p.tilt    += p.tiltVel;
  }, []);

  const isSettled = useCallback(() => {
    const p = P.current;
    return Math.abs(p.xTarget - p.x) < 0.15 && Math.abs(p.xVel) < 0.15 && Math.abs(p.tilt) < 0.08 && Math.abs(p.tiltVel) < 0.08;
  }, []);

  const springTick = useCallback(() => {
    const p = P.current;
    p.rafId = null;
    if (p.mode !== "spring") return;
    stepSpring();
    applyTransforms();
    if (isSettled()) {
      p.x = p.xTarget; p.xVel = 0; p.tilt = 0; p.tiltVel = 0; p.mode = "idle";
      applyTransforms();
      const idx = Math.round(p.x / (getCW() + GAP));
      curIdxRef.current = idx;
      onSettleRef.current?.(idx);
      return;
    }
    p.rafId = requestAnimationFrame(springTick);
  }, [applyTransforms, isSettled, stepSpring]);

  const startSpring = useCallback(() => { if (!P.current.rafId) P.current.rafId = requestAnimationFrame(springTick); }, [springTick]);
  const stopSpring = useCallback(() => { if (P.current.rafId) { cancelAnimationFrame(P.current.rafId); P.current.rafId = null; } }, []);

  const snapToIdx = useCallback((idx) => {
    const ms   = missionsRef.current[activeTabRef.current];
    const unit = getUnit();
    const dir  = idx > curIdxRef.current ? 1 : -1;
    const p    = P.current;
    p.xTarget    = clamp(idx, 0, ms.length - 1) * unit;
    p.xVel       = dir * Math.min(Math.abs(p.xVel) * 0.06, 4);
    p.tiltTarget = 0;
    p.mode       = "spring";
    stopSpring();
    startSpring();
  }, [stopSpring, startSpring]);

  onSettleRef.current = useCallback((idx) => { setCurIdx(idx); }, []);

  useEffect(() => {
    const outer = trackRef.current;
    if (!outer) return;
    const d = { on:false, prevX:0, prevT:0, totalPx:0, buf:[] };
    const pushV = (v) => { d.buf.push(v); if (d.buf.length > 5) d.buf.shift(); };
    const avgV  = () => d.buf.length ? d.buf.reduce((a,b)=>a+b,0) / d.buf.length : 0;
    const onDown = (e) => {
      // ▼ 追加: ボタン（矢印や受け取るボタン）の上でクリックされた場合はスワイプ判定をキャンセル
      if (e.target.closest('button')) return;

      d.on = true; d.totalPx = 0; d.buf = [];
      P.current.mode = "drag";
      stopSpring();
      d.prevX = e.clientX; d.prevT = performance.now();
      outer.style.cursor = "grabbing";
      outer.setPointerCapture(e.pointerId);
      setHintVisible(false);
    };
    const onMove = (e) => {
      if (!d.on) return;
      const now  = performance.now();
      const dt   = Math.max(now - d.prevT, 1);
      const dx   = d.prevX - e.clientX;
      const vf   = dx / dt * 16;
      pushV(vf);
      const ms   = missionsRef.current[activeTabRef.current];
      const maxX = (ms.length - 1) * getUnit();
      P.current.x = clamp(P.current.x + dx, -getCW() * 0.2, maxX + getCW() * 0.2);
      d.totalPx += dx;
      d.prevX = e.clientX; d.prevT = now;
      P.current.tiltTarget = clamp(vf * 1.6, -MAX_TILT, MAX_TILT);
      P.current.tilt       = P.current.tilt * 0.7 + P.current.tiltTarget * 0.3;
      applyTransforms();
    };
    const onUp = () => {
      if (!d.on) return;
      d.on = false;
      outer.style.cursor = "grab";
      const unit = getUnit();
      const skip = calcSkip(avgV(), d.totalPx, unit);
      snapToIdx(skip === 0 ? Math.round(P.current.x / unit) : Math.round(P.current.x / unit) + skip);
    };
    const noScroll = (e) => e.preventDefault();
    outer.addEventListener("pointerdown", onDown, { passive: false });
    outer.addEventListener("pointermove", onMove, { passive: false });
    outer.addEventListener("pointerup",   onUp,   { passive: true  });
    outer.addEventListener("pointercancel", onUp,     { passive: true  });
    outer.addEventListener("pointerleave",  onUp,     { passive: true  });
    outer.addEventListener("touchmove",     noScroll, { passive: false });
    return () => {
      outer.removeEventListener("pointerdown",   onDown);
      outer.removeEventListener("pointermove",   onMove);
      outer.removeEventListener("pointerup",     onUp);
      outer.removeEventListener("pointercancel", onUp);
      outer.removeEventListener("pointerleave",  onUp);
      outer.removeEventListener("touchmove",     noScroll);
    };
  }, [activeTab, applyTransforms, snapToIdx, stopSpring]);

  const handleTabChange = useCallback((tabId) => {
    if (tabId === activeTabRef.current) return;
    stopSpring();
    const p = P.current;
    p.x = 0; p.xVel = 0; p.xTarget = 0; p.tilt = 0; p.tiltVel = 0; p.tiltTarget = 0; p.mode = "idle";
    curIdxRef.current = 0;
    setActiveTab(tabId);
    setCurIdx(0);
    setHintVisible(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintVisible(false), 2800);
  }, [stopSpring]);

  useEffect(() => { applyTransforms(); }, [activeTab, applyTransforms]);
  useEffect(() => { hintTimer.current = setTimeout(() => setHintVisible(false), 2800); return () => clearTimeout(hintTimer.current); }, [activeTab]);
  useEffect(() => {
    const fn = () => { const unit = getUnit(); P.current.x = curIdxRef.current * unit; P.current.xTarget = P.current.x; applyTransforms(); };
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, [applyTransforms]);

  const handleClaimInternal = useCallback((id, rw, cardEl, btnEl) => {
    setClaimed(prev => new Set(prev).add(id));
    claimAnimate(cardEl, btnEl, rw, gc(rw.g), rootRef.current);
    onClaimed?.(id, rw); // 親コンポーネントにIDと報酬データを渡す
  }, [onClaimed]);

  const arrowNav = useCallback((dir) => { snapToIdx(curIdxRef.current + dir); }, [snapToIdx]);

  const ms   = missions[activeTab] || [];
  const n    = ms.length;
  const next = ms.find(m => (m.pr || 0) < m.th);

  return (
    <div ref={rootRef} style={S.root}>
      <div style={S.header}>
        <div><div style={S.hSub}>路上サバイバルシティ</div><div style={S.hTitle}>🏆 ミッション</div></div>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <div style={S.badge}><span style={S.badgeLbl}>優勝</span><span style={S.badgeVal}>{winsCount}</span><span style={S.badgeLbl}>回</span></div>
          {/* 追加：閉じるボタン */}
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>
      </div>
      <nav style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={{ ...S.tabBtn, ...(t.id === activeTab ? S.tabActive : {}) }} onClick={() => handleTabChange(t.id)}>
            <span style={{ fontSize:14 }}>{t.icon}</span><span style={{ fontSize:10, fontWeight:700 }}>{t.label}</span>
            {t.id === activeTab && <div style={S.tabLine} />}
          </button>
        ))}
      </nav>
      <div style={S.scene}>
        <div style={S.fadeL} /><div style={S.fadeR} />
        <div style={{ ...S.hint, opacity: hintVisible ? 1 : 0 }}><span style={S.ha}>◀</span>スワイプして報酬を確認<span style={{ ...S.ha, animationDelay:".3s" }}>▶</span></div>
        <div ref={trackRef} style={S.track}>
          <button onClick={() => arrowNav(-1)} style={{ ...S.arrBtn, left:4, opacity:curIdx<=0?0:1, pointerEvents:curIdx<=0?"none":"auto" }}>‹</button>
          <div ref={railRef} style={S.rail}>
            {ms.map((m, i) => (
              <CardWrap key={m.id} ref={(el) => { wrapRefs.current[i] = el; }} m={m} claimed={claimed} onClaim={handleClaimInternal} />
            ))}
          </div>
          <button onClick={() => arrowNav(+1)} style={{ ...S.arrBtn, right:4, opacity:curIdx>=n-1?0:1, pointerEvents:curIdx>=n-1?"none":"auto" }}>›</button>
        </div>
        <div style={S.dots}>{ms.map((_, i) => ( <div key={i} style={{ height:4, borderRadius:2, transition:"width .2s,background .2s,box-shadow .2s", width: i===curIdx ? 14 : 4, background: i===curIdx ? "#e8972a" : "#4a3010", boxShadow: i===curIdx ? "0 0 6px #c8782a" : "none" }} /> ))}</div>
        <div style={S.progCount}>{curIdx+1} / {n}</div>
      </div>
      <div style={S.footer}>
        {next ? (
          <>
            <div style={S.footerRow}><span style={S.footerLbl}>NEXT</span><span style={S.footerName}>{next.label}</span><span style={{ fontSize:11, fontWeight:700, marginLeft:"auto", color:gc(next.rw.g) }}>{next.rw.ic} {next.rw.nm}</span></div>
            <div style={S.footerBarBg}><div style={{ height:"100%", borderRadius:3, width:`${pct(next.pr,next.th)}%`, background:`linear-gradient(90deg,${gc(next.rw.g)}55,${gc(next.rw.g)})`, boxShadow:`0 0 7px ${gc(next.rw.g)}44` }} /></div>
            <div style={S.footerPct}>{fmt(next.pr)} / {fmt(next.th)}（{pct(next.pr,next.th)}%）</div>
          </>
        ) : ( <div style={{ textAlign:"center" }}><span style={{ color:"#e8972a", fontSize:13, fontWeight:900 }}>🎉 全ミッション達成！</span></div> )}
      </div>
    </div>
  );
}

const CardWrap = forwardRef(function CardWrap({ m, claimed, onClaim }, ref) {
  return ( <div ref={ref} data-card-wrap style={{ flexShrink: 0, width: getCW(), height: "100%", display: "flex", alignItems: "center", justifyContent: "center", willChange: "transform, opacity", transformStyle: "preserve-3d" }}><MissionCard m={m} claimed={claimed} onClaim={onClaim} /></div> );
});

function MissionCard({ m, claimed, onClaim }) {
  const { id, th, pr, label, desc, rw } = m;
  const p = pct(pr, th);
  const done = (pr || 0) >= th;
  const isClaim = claimed.has(id);
  const col = gc(rw.g);
  const cardRef = useRef(null);
  const btnRef  = useRef(null);
  const handleClaim = useCallback((e) => { e.stopPropagation(); if (!done || isClaim) return; onClaim(id, rw, cardRef.current, btnRef.current); }, [done, isClaim, id, rw, onClaim]);

  return (
    <div ref={cardRef} style={{ ...S.card, borderColor: done && !isClaim ? "#c8782a" : "#3a2200", animation: done && !isClaim ? "mt-donePulse 2.2s ease-in-out infinite" : "none", boxShadow: done && !isClaim ? "0 0 16px #c8782a44,0 0 40px #c8782a18,inset 0 0 20px #c8782a08" : "none" }}>
      <div style={S.cardSheen} />
      {rw.g && <div style={{ ...S.gradeBadge, color:col, borderColor:`${col}55` }}>{rw.g==="CHAR" ? "NEW CHAR" : rw.g}</div>}
      {isClaim && <div style={S.claimedStamp}>CLAIMED</div>}
      <div style={{ ...S.rbox, background: done ? `radial-gradient(ellipse 80% 60% at 50% 30%,${col}1e,#0d0700 70%)` : "#0d0700" }}>
        {done && !isClaim && <div style={S.shimmer} />}
        <div style={{ fontSize:46, lineHeight:1, transition:"filter .4s", filter: done ? (isClaim ? "none" : `drop-shadow(0 0 14px ${col})`) : "brightness(0) opacity(.30) blur(1px)" }}>{rw.ic}</div>
        {done ? <div style={{ fontSize:11, fontWeight:700, letterSpacing:.3, textAlign:"center", padding:"0 4px", lineHeight:1.3, color:isClaim?"#3a2200":col }}>{rw.nm}</div> : <div style={{ fontSize:13, fontWeight:900, letterSpacing:5, color:"#4a3018" }}>？？？</div>}
      </div>
      <div style={S.mLabel}>{label}</div><div style={S.mDesc}>{desc}</div><div style={{ flex:"1 1 0", minHeight:6 }} />
      <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:9 }}>
        <div style={S.barBg}><div style={{ height:"100%", borderRadius:3, width:`${p}%`, background: done ? `linear-gradient(90deg,${col}77,${col})` : "linear-gradient(90deg,#2e1a00,#3a2400)", boxShadow: done ? `0 0 7px ${col}55` : "none" }} /></div>
        <div style={{ fontSize:9, textAlign:"right", color:"#7a5a30" }}><span style={{ color:done?col:"#5a3a18", fontWeight:700 }}>{fmt(pr)}</span>{" / "}{fmt(th)}</div>
      </div>
      <button ref={btnRef} disabled={!done||isClaim} onClick={handleClaim} onPointerDown={(e) => e.stopPropagation()} style={{ ...S.ctaBase, ...(isClaim ? S.ctaClaimed : done ? { ...S.ctaActive, animation:"mt-btnGlow 2s ease-in-out infinite" } : S.ctaDisabled) }}>{isClaim ? "✓ 受け取り済み" : done ? "🎁 受け取る！" : `あと ${fmt(th-pr)}`}</button>
    </div>
  );
}

const S = {
  root:{ position:"fixed", inset:0, zIndex:10000, display:"flex", flexDirection:"column", background:"#120900", overflow:"hidden", fontFamily:"'Noto Sans JP',sans-serif", userSelect:"none" },
  header:{ flex:"0 0 auto", padding:"14px 20px 11px", borderBottom:"1px solid #3a2200", display:"flex", alignItems:"center", justifyContent:"space-between", background:"linear-gradient(180deg,#1e140099,#12090066)", zIndex:20 },
  hSub:{ fontSize:10, color:"#7a5a30", letterSpacing:2 },
  hTitle:{ fontSize:20, fontWeight:900, letterSpacing:2, color:"#e8972a", textShadow:"0 0 20px #c8782a66,0 2px 4px #00000077" },
  badge:{ background:"#1c1000", border:"1.5px solid #c8782a", borderRadius:14, padding:"4px 13px", display:"flex", flexDirection:"column", alignItems:"center" },
  badgeLbl:{ fontSize:9, color:"#7a5a30", letterSpacing:1 },
  badgeVal:{ fontSize:20, fontWeight:900, color:"#e8d5b0", lineHeight:1.1 },
  closeBtn:{ background:'#3a2200', color:'#e8d5b0', border:'none', borderRadius:'50%', width:'36px', height:'36px', fontSize:'18px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 4px rgba(0,0,0,0.5)' },
  tabs:{ flex:"0 0 auto", display:"flex", background:"#1c1000", borderBottom:"1.5px solid #3a2200", zIndex:20 },
  tabBtn:{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"8px 2px 7px", background:"none", border:"none", borderBottom:"2px solid transparent", marginBottom:-1.5, cursor:"pointer", color:"#7a5a30", fontFamily:"inherit", transition:"color .2s,border-color .2s", position:"relative" },
  tabActive:{ color:"#e8972a", borderBottomColor:"#e8972a" },
  tabLine:{ position:"absolute", bottom:0, left:"15%", right:"15%", height:2, borderRadius:2, background:"linear-gradient(90deg,transparent,#e8972a,transparent)" },
  scene:{ flex:"1 1 0", minHeight:0, display:"flex", flexDirection:"column", alignItems:"center", overflow:"hidden", position:"relative" },
  fadeL:{ position:"absolute", top:0, bottom:0, left:0, width:36, zIndex:8, pointerEvents:"none", background:"linear-gradient(90deg,#120900 20%,transparent)" },
  fadeR:{ position:"absolute", top:0, bottom:0, right:0, width:36, zIndex:8, pointerEvents:"none", background:"linear-gradient(270deg,#120900 20%,transparent)" },
  hint:{ flex:"0 0 auto", fontSize:10, color:"#4a3018", letterSpacing:2, display:"flex", alignItems:"center", gap:8, padding:"7px 0 4px", transition:"opacity .7s", position:"relative", zIndex:9 },
  ha:{ display:"inline-block", animation:"mt-sway 1.1s ease-in-out infinite alternate" },
  track:{ flex:"1 1 0", minHeight:0, width:"100%", position:"relative", zIndex:5, display:"flex", alignItems:"center", overflow:"hidden", cursor:"grab", touchAction:"none", perspective:"900px", perspectiveOrigin:"50% 50%" },
  rail:{ display:"flex", alignItems:"center", height:"100%", gap:GAP, willChange:"transform", transformStyle:"preserve-3d" },
  arrBtn:{ position:"absolute", top:"50%", transform:"translateY(-50%)", zIndex:12, width:28, height:44, display:"flex", alignItems:"center", justifyContent:"center", background:"#1c100099", border:"1px solid #4a301066", borderRadius:8, cursor:"pointer", backdropFilter:"blur(4px)", transition:"opacity .25s", color:"#e8972a", fontSize:18, lineHeight:1, padding:0, fontFamily:"inherit" },
  dots:{ flex:"0 0 auto", display:"flex", gap:5, alignItems:"center", padding:"7px 0 4px", position:"relative", zIndex:9, flexWrap:"wrap", justifyContent:"center", maxWidth:"88%" },
  progCount:{ fontSize:9, color:"#4a3018", letterSpacing:1, padding:"1px 0 2px" },
  footer:{ flex:"0 0 auto", padding:"10px 20px 14px", borderTop:"1px solid #3a2200", zIndex:20 },
  footerRow:{ display:"flex", alignItems:"center", gap:8, marginBottom:6 },
  footerLbl:{ fontSize:9, color:"#7a5a30", letterSpacing:1.5 },
  footerName:{ fontSize:12, fontWeight:900, color:"#e8d5b0" },
  footerBarBg:{ height:5, borderRadius:3, background:"#1e1000", overflow:"hidden" },
  footerPct:{ fontSize:9, color:"#4a3018", textAlign:"right", marginTop:4 },
  card:{ borderRadius:18, display:"flex", flexDirection:"column", padding:"14px 14px 13px", border:"1.5px solid #3a2200", background:"linear-gradient(158deg,#201200,#160c00)", overflow:"hidden", position:"relative", transition:"border-color .35s,box-shadow .35s", width:"100%", height:"100%" },
  cardSheen:{ position:"absolute", inset:0, borderRadius:18, pointerEvents:"none", background:"radial-gradient(ellipse 100% 50% at 50% 0%,#ffffff05,transparent 60%)" },
  gradeBadge:{ alignSelf:"flex-start", flexShrink:0, fontSize:8, fontWeight:900, letterSpacing:2.5, padding:"2px 8px", borderRadius:5, border:"1px solid", marginBottom:6 },
  claimedStamp:{ position:"absolute", top:11, right:11, fontSize:7, fontWeight:900, letterSpacing:2, color:"#3a2200", border:"1.5px solid #3a2200", borderRadius:3, padding:"1px 5px", transform:"rotate(12deg)" },
  rbox:{ flex:"0 0 auto", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, height:"32%", minHeight:88, borderRadius:12, border:"1px solid #3a2200", position:"relative", overflow:"hidden", marginBottom:9 },
  shimmer:{ position:"absolute", inset:0, background:"linear-gradient(120deg,transparent 30%,rgba(200,120,42,.06) 50%,transparent 70%)", backgroundSize:"400px 100%", animation:"mt-shimmer 3s linear infinite" },
  mLabel:{ fontSize:15, fontWeight:900, color:"#e8d5b0", letterSpacing:.3, flex:"0 0 auto", marginBottom:2 },
  mDesc: { fontSize:9,  color:"#4a3018", letterSpacing:.3, flex:"0 0 auto" },
  barBg: { height:5, borderRadius:3, background:"#1e1000", overflow:"hidden" },
  ctaBase:{ flex:"0 0 auto", width:"100%", padding:"10px 0", borderRadius:11, border:"none", fontSize:13, fontWeight:900, letterSpacing:.3, cursor:"pointer", fontFamily:"inherit", transition:"transform .12s" },
  ctaActive:  { background:"linear-gradient(135deg,#e8972a,#c8782a)", color:"#fff", textShadow:"0 1px 3px #00000044" },
  ctaDisabled:{ background:"#1e1000", color:"#4a3018", cursor:"default", border:"1px solid #3a2200" },
  ctaClaimed: { background:"#150900", color:"#3a2200", cursor:"default" },
};