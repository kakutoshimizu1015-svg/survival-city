import React, { useState, useEffect, useRef } from 'react';
import { charEmoji, charImages } from '../../constants/characters';
import { useUserStore } from '../../store/useUserStore';

export const PlayerToken = ({ player, mapData, isActiveTurn }) => {
    const isImage = charImages && charImages[player.charType] !== undefined;
    const showSmoke = useUserStore(state => state.showSmoke);

    const [dustTrail, setDustTrail] = useState([]);
    
    // ▼ 修正: DOM要素を直接操作するための参照（Ref）
    const wrapRef = useRef(null);
    const tokenWrapperRef = useRef(null);
    const scaleRef = useRef(null);
    const frontImgRef = useRef(null);
    const backImgRef = useRef(null);
    const emojiRef = useRef(null);
    const shadowRef = useRef(null);

    const facingRef = useRef(1); // 1 = 右向き, -1 = 左向き
    const isAnimatingRef = useRef(false);
    const idleRafRef = useRef(null);
    const prevPosRef = useRef(player.pos);

    const FOOT_Y = 15;
    const currentTile = mapData.find(t => t.id === player.pos) || mapData[0];
    const zIndexBase = 50 + currentTile.row * 10;

    // 土埃のクリーンアップ
    useEffect(() => {
        if (dustTrail.length > 0) {
            const timer = setTimeout(() => setDustTrail(t => t.slice(1)), 400);
            return () => clearTimeout(timer);
        }
    }, [dustTrail]);

    // 待機時のフワフワ上下運動（DOM直接操作）
    const startIdle = () => {
        if (isAnimatingRef.current) return;
        const now = performance.now();
        const idleBob = Math.sin(now * 0.005) * -3; 
        
        if (tokenWrapperRef.current) {
            tokenWrapperRef.current.style.transform = `translate(-50%, calc(-100% + ${idleBob}px))`;
        }
        if (scaleRef.current) {
            scaleRef.current.style.transform = `scaleX(1) rotate(0deg)`;
        }
        if (shadowRef.current) shadowRef.current.style.opacity = 0.7;

        idleRafRef.current = requestAnimationFrame(startIdle);
    };

    useEffect(() => {
        idleRafRef.current = requestAnimationFrame(startIdle);
        return () => {
            if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);
        };
    }, []);

    // 移動＆回転アニメーション（DOM直接操作）
    useEffect(() => {
        if (prevPosRef.current === player.pos) return;
        const startTile = mapData.find(t => t.id === prevPosRef.current);
        const endTile = mapData.find(t => t.id === player.pos);

        if (!startTile || !endTile) {
            prevPosRef.current = player.pos;
            return;
        }

        // アニメーション開始
        isAnimatingRef.current = true;
        if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);

        const sx = (startTile.col - endTile.col) * 80;
        const sy = (startTile.row - endTile.row) * 80;
        const ex = 0;
        const ey = 0;

        const dx = endTile.col - startTile.col;
        let newFacing = facingRef.current;
        if (dx > 0) newFacing = -1; 
        else if (dx < 0) newFacing = 1;

        let spinRaf, moveRaf;

        // 画像の向きを適用するヘルパー関数
        const updateFacingDOM = (f) => {
            if (frontImgRef.current && backImgRef.current) {
                frontImgRef.current.style.opacity = 1;
                backImgRef.current.style.opacity = 0;
                frontImgRef.current.style.transform = `scaleX(${f})`;
                backImgRef.current.style.transform = `scaleX(${f})`;
            }
            if (emojiRef.current) emojiRef.current.style.transform = `scaleX(${f})`;
        };

        // 回転アニメーション
        const triggerSpin = () => {
            return new Promise((resolve) => {
                if (!isImage || newFacing === facingRef.current) {
                    facingRef.current = newFacing;
                    updateFacingDOM(newFacing);
                    resolve();
                    return;
                }

                const startTime = performance.now();
                const spinDur = 550;

                const animateSpin = (now) => {
                    const t = Math.min((now - startTime) / spinDur, 1);
                    const eased = t < 0.3 ? (t / 0.3) ** 2 * 0.3 : t > 0.7 ? 0.7 + (1 - ((1 - t) / 0.3) ** 2) * 0.3 : 0.3 + (t - 0.3) / 0.4 * 0.4;
                    const angle = eased * Math.PI * 2;
                    const spinWidth = Math.max(0.02, Math.abs(Math.cos(angle)));
                    const spinHop = Math.sin(angle) * -12;
                    const showBack = angle > Math.PI * 0.45 && angle < Math.PI * 1.55;

                    const curFacing = t >= 0.5 ? newFacing : facingRef.current;
                    
                    // DOMのスタイルを直接書き換える（再レンダリングさせない）
                    if (frontImgRef.current && backImgRef.current) {
                        frontImgRef.current.style.opacity = showBack ? 0 : 1;
                        backImgRef.current.style.opacity = showBack ? 1 : 0;
                        frontImgRef.current.style.transform = `scaleX(${curFacing})`;
                        backImgRef.current.style.transform = `scaleX(${curFacing})`;
                    }
                    if (scaleRef.current) scaleRef.current.style.transform = `scaleX(${spinWidth}) rotate(0deg)`;
                    if (tokenWrapperRef.current) tokenWrapperRef.current.style.transform = `translate(-50%, calc(-100% + ${spinHop}px))`;
                    if (wrapRef.current) wrapRef.current.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`;

                    if (t < 1) {
                        spinRaf = requestAnimationFrame(animateSpin);
                    } else {
                        facingRef.current = newFacing;
                        updateFacingDOM(newFacing);
                        resolve();
                    }
                };
                spinRaf = requestAnimationFrame(animateSpin);
            });
        };

        // ジャンプ移動アニメーション
        const runMove = async () => {
            await triggerSpin(); // 回転が終わるまで待つ

            const startTime = performance.now();
            const dur = 350;

            if (showSmoke) setDustTrail(t => [...t.slice(-5), { x: sx, y: sy, id: Date.now() }]);

            const animateMove = (now) => {
                const t = Math.min((now - startTime) / dur, 1);
                const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                const jumpArc = -4 * (t - 0.5) * (t - 0.5) + 1;
                const jumpHeight = 44 + Math.abs(ey - sy) * 0.4 + Math.abs(ex - sx) * 0.15;

                const currentX = sx + (ex - sx) * eased;
                const currentY = sy + (ey - sy) * eased;
                const tilt = Math.sin(now * 0.015) * 6;

                // DOM直接操作
                if (wrapRef.current) wrapRef.current.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
                if (tokenWrapperRef.current) tokenWrapperRef.current.style.transform = `translate(-50%, calc(-100% - ${jumpArc * jumpHeight}px))`;
                if (scaleRef.current) scaleRef.current.style.transform = `scaleX(1) rotate(${tilt}deg)`;
                if (shadowRef.current) shadowRef.current.style.opacity = 0.35;

                if (t < 1) {
                    moveRaf = requestAnimationFrame(animateMove);
                } else {
                    // 着地時のリセット
                    if (wrapRef.current) wrapRef.current.style.transform = `translate(-50%, -50%)`;
                    if (tokenWrapperRef.current) tokenWrapperRef.current.style.transform = `translate(-50%, -100%)`;
                    if (scaleRef.current) scaleRef.current.style.transform = `scaleX(1) rotate(0deg)`;
                    if (shadowRef.current) shadowRef.current.style.opacity = 0.7;

                    if (showSmoke) {
                        setDustTrail(t => [...t.slice(-4), { x: ex - 12, y: ey, id: Date.now() }, { x: ex + 12, y: ey, id: Date.now() + 1 }]);
                    }

                    prevPosRef.current = player.pos;
                    isAnimatingRef.current = false;
                    idleRafRef.current = requestAnimationFrame(startIdle);
                }
            };
            moveRaf = requestAnimationFrame(animateMove);
        };

        runMove();

        return () => {
            if (spinRaf) cancelAnimationFrame(spinRaf);
            if (moveRaf) cancelAnimationFrame(moveRaf);
        };
    }, [player.pos, mapData, isImage, showSmoke]);

    return (
        <div style={{
            gridColumn: currentTile.col,
            gridRow: currentTile.row,
            position: 'relative',
            width: '100%', height: '100%',
            zIndex: zIndexBase,
            pointerEvents: 'none'
        }}>
            <style>{`
                @keyframes tokenDustAnim {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.6; }
                    100% { transform: translate(-50%, -200%) scale(2.5); opacity: 0; }
                }
            `}</style>

            {/* 平面移動を担うラッパー */}
            <div ref={wrapRef} style={{
                position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                
                {/* 煙エフェクト */}
                {showSmoke && dustTrail.map(d => (
                    <div key={d.id} style={{
                        position: 'absolute', left: `calc(50% + ${d.x}px)`, top: `calc(${FOOT_Y}px + ${d.y}px)`,
                        width: 14, height: 14, background: 'rgba(210,195,150,0.7)', borderRadius: '50%',
                        transform: 'translate(-50%, -50%)', animation: 'tokenDustAnim 0.4s ease-out forwards', pointerEvents: 'none',
                        zIndex: zIndexBase - 2
                    }} />
                ))}

                {/* 落ち影 */}
                <div ref={shadowRef} style={{
                    position: 'absolute', left: '50%', top: FOOT_Y, width: 32, height: 10, background: 'rgba(0,0,0,0.5)', borderRadius: '50%',
                    transform: 'translate(-50%, -50%)', opacity: 0.7, zIndex: zIndexBase - 1, pointerEvents: 'none'
                }} />

                {/* 上下動（ジャンプ・ホップ）を担うラッパー */}
                <div ref={tokenWrapperRef} style={{
                    position: 'absolute', left: '50%', top: `${FOOT_Y}px`, transform: 'translate(-50%, -100%)',
                    zIndex: zIndexBase, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'
                }}>
                    {/* 回転や傾きを担うラッパー */}
                    <div ref={scaleRef} style={{
                        width: isImage ? 80 : 44, height: isImage ? 80 : 44,
                        position: 'relative', transformOrigin: 'bottom center',
                        background: isImage ? 'transparent' : 'rgba(0,0,0,0.6)',
                        border: isImage ? 'none' : `3px solid ${isActiveTurn ? '#ffe066' : player.color}`,
                        borderRadius: isImage ? '0' : '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: (!isImage && isActiveTurn) ? `0 0 15px ${player.color}` : 'none',
                    }}>
                        {isImage ? (
                            <>
                                <img ref={frontImgRef} src={charImages[player.charType].front} alt=""
                                    style={{
                                        position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', bottom: 0, 
                                        imageRendering: 'pixelated', WebkitFontSmoothing: 'none',
                                        transform: `scaleX(${facingRef.current})`, 
                                        filter: isActiveTurn ? 'drop-shadow(0 0 8px #ffe066)' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))'
                                    }} />
                                <img ref={backImgRef} src={charImages[player.charType].back} alt=""
                                    style={{
                                        position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', bottom: 0, 
                                        imageRendering: 'pixelated', WebkitFontSmoothing: 'none',
                                        transform: `scaleX(${facingRef.current})`, opacity: 0, // 初期は非表示
                                        filter: isActiveTurn ? 'drop-shadow(0 0 8px #ffe066)' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))'
                                    }} />
                            </>
                        ) : (
                            <span ref={emojiRef} style={{ fontSize: 26, transform: `scaleX(${facingRef.current})` }}>{charEmoji[player.charType]}</span>
                        )}
                    </div>

                    <div style={{
                        marginTop: 2, fontSize: 12, fontWeight: 900, color: player.color,
                        textShadow: '1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000',
                        whiteSpace: 'nowrap'
                    }}>
                        {player.name}
                    </div>
                </div>
            </div>
        </div>
    );
};