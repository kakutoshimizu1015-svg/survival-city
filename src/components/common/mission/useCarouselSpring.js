// src/components/common/mission/useCarouselSpring.js
import { useEffect, useRef } from 'react';

const STIFF_X = 0.22;
const DAMP_X  = 0.65;
const STIFF_T = 0.36;
const DAMP_T  = 0.82;
const MAX_TILT = 14;

export const useCarouselSpring = (itemCount, itemWidth, gap, activeIndex, setActiveIndex) => {
  const outerRef = useRef(null);
  const railRef = useRef(null);
  
  // Reactの再レンダリングを避けるため、アニメーション用の変数は全てRefで管理
  const state = useRef({
    x: 0, xVel: 0, xTarget: 0,
    tilt: 0, tiltVel: 0, tiltTarget: 0,
    mode: "idle", rafId: null,
    dragging: false, prevX: 0, prevT: 0, totalPx: 0, buf: []
  });

  const unit = itemWidth + gap;

  // トランスフォームの適用（毎フレーム呼ばれる）
  const applyTransforms = () => {
    if (!railRef.current) return;
    const s = state.current;
    const vw = window.innerWidth;
    
    // レール全体の移動
    railRef.current.style.transform = `translateX(${(vw - itemWidth) / 2 - s.x}px)`;

    // 各カードの3D変形
    const wraps = railRef.current.querySelectorAll('.card-wrap');
    wraps.forEach((wrap, i) => {
      const cardX = i * unit;
      const dist = (s.x - cardX) / unit;
      const absD = Math.abs(dist);

      const scale = Math.max(0.82, 1 - absD * 0.085);
      const opacity = Math.max(0.35, 1 - absD * 0.40);
      const tiltMix = Math.max(0, 1 - absD * 1.6);
      const tilt = s.tilt * tiltMix;
      const tz = Math.min(0, -absD * 25);

      wrap.style.transform = `scale(${scale.toFixed(4)}) translateZ(${tz.toFixed(1)}px) rotateY(${tilt.toFixed(2)}deg)`;
      wrap.style.opacity = opacity.toFixed(3);
    });
  };

  // スプリングループ
  const springTick = () => {
    const s = state.current;
    if (s.mode !== "spring") return;

    // 物理演算
    s.xVel += STIFF_X * (s.xTarget - s.x) - DAMP_X * s.xVel;
    s.x += s.xVel;
    s.tiltVel += STIFF_T * (s.tiltTarget - s.tilt) - DAMP_T * s.tiltVel;
    s.tilt += s.tiltVel;

    applyTransforms();

    // 収束判定
    if (Math.abs(s.xTarget - s.x) < 0.15 && Math.abs(s.xVel) < 0.15 && 
        Math.abs(s.tilt) < 0.08 && Math.abs(s.tiltVel) < 0.08) {
      s.x = s.xTarget; s.xVel = 0;
      s.tilt = 0; s.tiltVel = 0;
      s.mode = "idle";
      applyTransforms();
      
      const newIndex = Math.round(s.x / unit);
      if (activeIndex !== newIndex) setActiveIndex(newIndex);
      return;
    }
    s.rafId = requestAnimationFrame(springTick);
  };

  // 外部からタブ切り替え等でインデックスが変わった時の処理
  useEffect(() => {
    const s = state.current;
    if (s.mode === "drag") return; // ドラッグ中は無視
    s.xTarget = activeIndex * unit;
    s.mode = "spring";
    s.tiltTarget = 0;
    if (!s.rafId) s.rafId = requestAnimationFrame(springTick);
  }, [activeIndex, unit]);

  // 初期化とドラッグイベントのバインド
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const pushV = (v) => {
      state.current.buf.push(v);
      if (state.current.buf.length > 5) state.current.buf.shift();
    };
    const avgV = () => state.current.buf.length ? state.current.buf.reduce((a, b) => a + b, 0) / state.current.buf.length : 0;

    const handlePointerDown = (e) => {
      const s = state.current;
      s.dragging = true; s.buf = []; s.totalPx = 0;
      s.mode = "drag";
      if (s.rafId) cancelAnimationFrame(s.rafId);
      s.prevX = e.clientX; s.prevT = performance.now();
      outer.setPointerCapture(e.pointerId);
      outer.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e) => {
      const s = state.current;
      if (!s.dragging) return;
      const now = performance.now();
      const dt = Math.max(now - s.prevT, 1);
      const dx = s.prevX - e.clientX;
      const vf = (dx / dt) * 16;
      
      pushV(vf);
      
      const maxX = (itemCount - 1) * unit;
      s.x = Math.min(Math.max(s.x + dx, -itemWidth * 0.2), maxX + itemWidth * 0.2);
      s.totalPx += dx;
      s.prevX = e.clientX; s.prevT = now;
      
      s.tiltTarget = Math.min(Math.max(vf * 1.6, -MAX_TILT), MAX_TILT);
      s.tilt = s.tilt * 0.7 + s.tiltTarget * 0.3;
      
      applyTransforms();
    };

    const handlePointerUp = () => {
      const s = state.current;
      if (!s.dragging) return;
      s.dragging = false;
      outer.style.cursor = 'grab';

      const v = avgV();
      const absV = Math.abs(v);
      const absDrag = Math.abs(s.totalPx);
      const dir = (v > 0 || s.totalPx > 0) ? 1 : -1;

      let skip = 0;
      if (absV >= 1.0 || absDrag >= unit * 0.18) {
        if (absDrag >= unit * 0.85) skip = dir * 3;
        else if (absDrag >= unit * 0.35) skip = dir * 2;
        else skip = dir * 1;
      }

      const base = Math.round(s.x / unit);
      const tgt = Math.min(Math.max(skip === 0 ? base : base + skip, 0), itemCount - 1);

      s.xTarget = tgt * unit;
      s.xVel = dir * Math.min(absV * 0.06, 4.0);
      s.tiltTarget = 0;
      s.mode = "spring";
      if (!s.rafId) s.rafId = requestAnimationFrame(springTick);
    };

    outer.addEventListener("pointerdown", handlePointerDown);
    outer.addEventListener("pointermove", handlePointerMove);
    outer.addEventListener("pointerup", handlePointerUp);
    outer.addEventListener("pointercancel", handlePointerUp);

    return () => {
      outer.removeEventListener("pointerdown", handlePointerDown);
      outer.removeEventListener("pointermove", handlePointerMove);
      outer.removeEventListener("pointerup", handlePointerUp);
      outer.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [itemCount, unit]);

  return { outerRef, railRef };
};