import React, { useState, useEffect, useRef, useCallback } from 'react';
import { charEmoji, charImages } from '../../constants/characters';

export const PlayerToken = ({ player, mapData, isActiveTurn }) => {
    const isImage = charImages && charImages[player.charType] !== undefined;

    // 平面移動(x, y)とジャンプ高さ(jump)を管理するオフセット
    const [offset, setOffset] = useState({ x: 0, y: 0, jump: 0 });
    const [facing, setFacing] = useState(1); // 1 = 右向き, -1 = 左向き
    const [isMoving, setIsMoving] = useState(false);
    const [idlePhase, setIdlePhase] = useState(0);
    const [spinAngle, setSpinAngle] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [dustTrail, setDustTrail] = useState([]);

    const animRef = useRef(null);
    const spinRef = useRef(null);
    const prevPosRef = useRef(player.pos);

    // 待機時のフワフワ上下運動
    useEffect(() => {
        if (isMoving) return;
        let f = 0, raf;
        const tick = () => { f++; setIdlePhase(f); raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [isMoving]);

    // 土埃エフェクトのクリーンアップ
    useEffect(() => {
        if (dustTrail.length > 0) {
            const timer = setTimeout(() => setDustTrail(t => t.slice(1)), 400);
            return () => clearTimeout(timer);
        }
    }, [dustTrail]);

    // ペーパーマリオ風の回転アニメーション
    const triggerSpin = useCallback((newFacing) => {
        return new Promise((resolve) => {
            if (isSpinning || !isImage) {
                setFacing(newFacing);
                resolve();
                return;
            }
            setIsSpinning(true);
            const startTime = performance.now();
            const spinDur = 550;

            const animateSpin = (now) => {
                const t = Math.min((now - startTime) / spinDur, 1);
                const eased = t < 0.3
                    ? (t / 0.3) * (t / 0.3) * 0.3
                    : t > 0.7
                    ? 0.7 + (1 - ((1 - t) / 0.3) * ((1 - t) / 0.3)) * 0.3
                    : 0.3 + (t - 0.3) / 0.4 * 0.4;

                setSpinAngle(eased * Math.PI * 2);

                if (t >= 0.5 && facing !== newFacing) {
                    setFacing(newFacing);
                }

                if (t < 1) {
                    spinRef.current = requestAnimationFrame(animateSpin);
                } else {
                    setSpinAngle(0);
                    setFacing(newFacing);
                    setIsSpinning(false);
                    resolve();
                }
            };
            spinRef.current = requestAnimationFrame(animateSpin);
        });
    }, [isSpinning, facing, isImage]);

    // ジャンプ・移動アニメーション（相対座標方式）
    useEffect(() => {
        if (prevPosRef.current === player.pos) return;
        const startTile = mapData.find(t => t.id === prevPosRef.current);
        const endTile = mapData.find(t => t.id === player.pos);

        if (!startTile || !endTile) {
            prevPosRef.current = player.pos;
            return;
        }

        // 新しいマス(endTile)を基準とした、古いマス(startTile)の相対開始座標
        const sx = (startTile.col - endTile.col) * 80;
        const sy = (startTile.row - endTile.row) * 80;
        const ex = 0; // 最終的には(0,0)に着地し、マスの中央と完全に一致する
        const ey = 0;

        const dx = endTile.col - startTile.col;
        let newFacing = facing;
        if (dx > 0) newFacing = -1; // 右へ移動
        else if (dx < 0) newFacing = 1; // 左へ移動

        const runAnimation = async () => {
            // 方向転換が必要なら先にスピンする
            if (newFacing !== facing && isImage) {
                await triggerSpin(newFacing);
            } else {
                setFacing(newFacing);
            }

            setIsMoving(true);
            const dur = 350;
            const startTime = performance.now();

            setDustTrail(t => [...t.slice(-5), { x: sx, y: sy, id: Date.now() }]);

            const animateMove = (now) => {
                const t = Math.min((now - startTime) / dur, 1);
                // パラボラジャンプの計算
                const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                const jumpArc = -4 * (t - 0.5) * (t - 0.5) + 1;
                const jumpHeight = 44 + Math.abs(ey - sy) * 0.4 + Math.abs(ex - sx) * 0.15;

                const currentX = sx + (ex - sx) * eased;
                const currentY = sy + (ey - sy) * eased;

                setOffset({
                    x: currentX,
                    y: currentY,
                    jump: jumpArc * jumpHeight
                });

                if (t < 1) {
                    animRef.current = requestAnimationFrame(animateMove);
                } else {
                    setOffset({ x: ex, y: ey, jump: 0 });
                    setIsMoving(false);
                    // 着地時の土埃
                    setDustTrail(t => [...t.slice(-4),
                        { x: ex - 12, y: ey, id: Date.now() },
                        { x: ex + 12, y: ey, id: Date.now() + 1 }
                    ]);
                    prevPosRef.current = player.pos;
                }
            };
            animRef.current = requestAnimationFrame(animateMove);
        };

        runAnimation();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            if (spinRef.current) cancelAnimationFrame(spinRef.current);
        };
    }, [player.pos, mapData, facing, isImage, triggerSpin]);

    // 描画用の状態計算
    const spinWidth = isSpinning ? Math.max(0.02, Math.abs(Math.cos(spinAngle))) : 1;
    const showBack = isSpinning && spinAngle > Math.PI * 0.45 && spinAngle < Math.PI * 1.55;
    const spinHop = isSpinning ? Math.sin(spinAngle) * -12 : 0;
    const idleBob = Math.sin(idlePhase * 0.06) * -3;
    const tilt = isMoving ? Math.sin(Date.now() * 0.015) * 6 : 0;

    const currentTile = mapData.find(t => t.id === player.pos) || mapData[0];
    const zIndexBase = 50 + currentTile.row * 10;

    // マスの中央を基準とした時の、足元（影の描画位置）のYオフセット
    const FOOT_Y = 15;

    return (
        <div style={{
            gridColumn: currentTile.col, // ★ここでCSS Gridのマスに直接配置（絶対にズレない）
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

            {/* 平面移動(x, y)を担うコンテナ */}
            <div style={{
                position: 'absolute',
                left: '50%', top: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                
                {/* 土埃エフェクト */}
                {dustTrail.map(d => (
                    <div key={d.id} style={{
                        position: 'absolute', 
                        left: `calc(50% + ${d.x - offset.x}px)`, 
                        top: `calc(${FOOT_Y}px + ${d.y - offset.y}px)`,
                        width: 14, height: 14, background: 'rgba(210,195,150,0.7)', borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        animation: 'tokenDustAnim 0.4s ease-out forwards', pointerEvents: 'none',
                        zIndex: zIndexBase - 2
                    }} />
                ))}

                {/* 落ち影（FOOT_Yに配置） */}
                <div style={{
                    position: 'absolute',
                    left: '50%', top: FOOT_Y,
                    width: 32, height: 10, background: 'rgba(0,0,0,0.5)', borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: isMoving ? 0.35 : 0.7,
                    transition: 'opacity 0.2s',
                    zIndex: zIndexBase - 1, pointerEvents: 'none'
                }} />

                {/* キャラクター本体（FOOT_Yを基準に下端をピッタリ合わせる） */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: `calc(${FOOT_Y}px - ${offset.jump}px + ${isMoving ? 0 : idleBob}px + ${spinHop}px)`,
                    transform: 'translate(-50%, -100%)', // 足元(bottom)を中心に固定
                    zIndex: zIndexBase,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'
                }}>
                    <div style={{
                        width: isImage ? 80 : 44, height: isImage ? 80 : 44,
                        position: 'relative',
                        transform: `scaleX(${spinWidth}) rotate(${tilt}deg)`,
                        transformOrigin: 'bottom center',
                        background: isImage ? 'transparent' : 'rgba(0,0,0,0.6)',
                        border: isImage ? 'none' : `3px solid ${isActiveTurn ? '#ffe066' : player.color}`,
                        borderRadius: isImage ? '0' : '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: (!isImage && isActiveTurn) ? `0 0 15px ${player.color}` : 'none',
                    }}>
                        {isImage ? (
                            <img src={showBack ? charImages[player.charType].back : charImages[player.charType].front} alt=""
                                style={{
                                    position: 'absolute', 
                                    width: '100%', height: '100%', 
                                    objectFit: 'contain', 
                                    bottom: 0, // ★底辺の余白を0にすることで浮き上がりを完全に解消
                                    imageRendering: 'pixelated', WebkitFontSmoothing: 'none',
                                    transform: `scaleX(${facing})`, 
                                    filter: isActiveTurn ? 'drop-shadow(0 0 8px #ffe066)' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))'
                                }} />
                        ) : (
                            <span style={{ fontSize: 26, transform: `scaleX(${facing})` }}>{charEmoji[player.charType]}</span>
                        )}
                    </div>

                    {/* プレイヤー名ラベル */}
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