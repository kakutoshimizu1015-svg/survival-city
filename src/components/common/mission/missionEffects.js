export const claimAnimate = (cardEl, btnEl, reward, col) => {
  const { ic, nm, g } = reward;
  const bRect = btnEl.getBoundingClientRect();
  const cx = bRect.left + bRect.width / 2;
  const cy = bRect.top;

  const tier = g === "UR" ? 4 : g === "SSR" ? 3 : (g === "SR" || g === "CHAR") ? 2 : g === "R" ? 1 : 0;

  addScreenFlash(col, tier);
  const pCount = [20, 30, 45, 60, 80][tier];
  spawnParticles(cx, cy, col, pCount, tier);

  if (tier >= 1) {
    const rings = [1, 2, 3].slice(0, tier + 1);
    rings.forEach((_, i) => spawnShockwave(cx, cy, col, i * 120));
    
    const wrap = cardEl.closest(".card-wrap");
    if (wrap) {
      const orig = wrap.style.transform;
      wrap.style.transition = "transform .12s cubic-bezier(.36,.07,.19,.97)";
      wrap.style.transform = "scale(1.06)";
      setTimeout(() => { wrap.style.transform = orig; setTimeout(() => wrap.style.transition = "", 200); }, 120);
    }
  }

  if (tier >= 2) setTimeout(() => showRewardOverlay(ic, nm, g, col, tier), 180);
  if (tier >= 3) spawnGoldRain(col);
};

const addScreenFlash = (col, tier) => {
  const el = document.createElement("div");
  const dur = [250, 320, 420, 520, 650][tier];
  el.style.cssText = `position:fixed;inset:0;z-index:8000;pointer-events:none;background:radial-gradient(circle at 50% 50%,${col}44,${col}11 60%,transparent 80%);transition:opacity ${dur}ms;opacity:1;`;
  document.body.appendChild(el);
  setTimeout(() => el.style.opacity = '0', 50);
  setTimeout(() => el.remove(), dur + 50);
};

const spawnParticles = (cx, cy, baseCol, count, tier) => {
  const extraCols = { 0:["#fb923c","#fff"], 1:["#60a5fa","#fff","#ffd700"], 2:["#c084fc","#fff","#ffd700","#f87171"], 3:["#ff6aff","#ffd700","#fff","#60a5fa","#c084fc"], 4:["#ffd700","#fffacd","#fff","#ffec6e","#ffd700","#e8972a"] }[tier] || [];
  const cols = [baseCol, ...extraCols];

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const ang = (Math.PI * 2 / count) * i + Math.random() * 0.4;
    const spd = 60 + Math.random() * 100 * (tier + 1);
    const sz = 5 + Math.random() * 9;
    const col2 = cols[Math.floor(Math.random() * cols.length)];
    const rot = Math.random() * 720;
    const dur = 700 + Math.random() * 600;
    const tx = Math.cos(ang) * spd;
    const ty = Math.sin(ang) * spd - 60;

    el.style.cssText = `position:fixed;z-index:8500;pointer-events:none;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz * (Math.random() > .5 ? 1 : 2.5)}px;background:${col2};border-radius:${Math.random() > .4 ? "50%" : "2px"};will-change:transform,opacity;`;
    document.body.appendChild(el);

    const start = performance.now();
    const frame = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - t * t;
      el.style.transform = `translate(${tx * t}px,${ty * t + 80 * t * t}px) rotate(${rot * t}deg) translate(-50%,-50%)`;
      el.style.opacity = ease > 0 ? ease : 0;
      if (t < 1) requestAnimationFrame(frame);
      else el.remove();
    };
    requestAnimationFrame(frame);
  }
};

const spawnShockwave = (cx, cy, col, delay) => {
  setTimeout(() => {
    const el = document.createElement("div");
    el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:40px;height:40px;border-radius:50%;border:2.5px solid ${col};box-shadow:0 0 12px ${col}88;pointer-events:none;z-index:8200;transition:transform 0.7s ease-out, opacity 0.7s ease-out;transform:translate(-50%,-50%) scale(0);opacity:0.9;`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.transform = 'translate(-50%,-50%) scale(8)'; el.style.opacity = '0'; }, 10);
    setTimeout(() => el.remove(), 750);
  }, delay);
};

const showRewardOverlay = (ic, nm, g, col, tier) => {
  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.82);cursor:pointer;opacity:0;transition:opacity 0.2s;`;
  const iconSize = tier >= 4 ? 110 : tier >= 3 ? 96 : 82;

  overlay.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
      <div style="font-size:11px;font-weight:900;letter-spacing:4px;padding:4px 18px;border-radius:20px;background:linear-gradient(135deg,#2a1000,${col},#2a1000);color:#fff;box-shadow:0 0 20px ${col}88;">GET</div>
      <div style="font-size:${iconSize}px;line-height:1;filter:drop-shadow(0 0 28px ${col}) drop-shadow(0 0 60px ${col}66);">${ic}</div>
      <div style="font-size:18px;font-weight:900;color:#fff;text-shadow:0 0 16px ${col};text-align:center;">${nm}</div>
      <div style="margin-top:20px;font-size:11px;color:rgba(255,255,255,.5);">タップして閉じる</div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.style.opacity = '1', 10);

  const close = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 250); };
  overlay.addEventListener("click", close);
  setTimeout(close, 2800);
};

const spawnGoldRain = (col) => {
  const shapes = ["★", "✦", "◆", "●", "▲", "♦"];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    const x = Math.random() * 100;
    const dur = 1200 + Math.random() * 800;
    const sz = 10 + Math.random() * 16;
    el.style.cssText = `position:fixed;top:-40px;left:${x}vw;font-size:${sz}px;color:${col};text-shadow:0 0 8px ${col};pointer-events:none;z-index:8100;opacity:0.85;transition:transform ${dur}ms linear;`;
    el.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    document.body.appendChild(el);
    setTimeout(() => { el.style.transform = `translateY(110vh) rotate(360deg)`; }, 10);
    setTimeout(() => el.remove(), dur + 800);
  }
};