import React, { useState, useEffect, useRef, useCallback } from 'react';
import { charEmoji, charImages } from '../../constants/characters';
import { useUserStore } from '../../store/useUserStore';

export const PlayerToken = ({ player, mapData, isActiveTurn }) => {
    const isImage = charImages && charImages[player.charType] !== undefined;
    
    // ▼ 追加：ユーザーの端末から設定を読み込む
    const showSmoke = useUserStore(state => state.showSmoke);

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

    // ▼ 修正：ペーパーマリオ風の完全回転（2π）アニメーション
    const triggerSpin = useCallback((newFacing) => {
        return new Promise((resolve) => {
            if (isSpinning || !isImage) {
                setFacing(newFacing);
                resolve();
                return;
            }
            setIsSpinning(true);
            const startTime = performance.now();
            const spinDur = 550; // パタッという回転感のためのタメ時間

            const animateSpin = (now) => {
                const t = Math.min((now - startTime) / spinDur, 1);
                // カスタムイージング: 前後はゆっくり、中間は速く
                const eased = t < 0.3
                    ? (t / 0.3) * (t / 0.3) * 0.3
                    : t > 0.7
                    ? 0.7 + (1 - ((1 - t) / 0.3) * ((1 - t) / 0.3)) * 0.3
                    : 0.3 + (t - 0.3) / 0.4 * 0.4;

                // 2πのフル回転
                setSpinAngle(eased * Math.PI * 2);

                // 回転の半分のタイミングで新しい向きをセット
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

    // ジャンプ・移動アニメーション
    useEffect(() => {
        if (prevPosRef.current === player.pos) return;
        const startTile = mapData.find(t => t.id === prevPosRef.current);
        const endTile = mapData.find(t => t.id === player.pos);

        if (!startTile || !endTile) {
            prevPosRef.current = player.pos;
            return;
        }

        const sx = (startTile.col - endTile.col) * 80;
        const sy = (startTile.row - endTile.row) * 80;
        const ex = 0;
        const ey = 0;

        const dx = endTile.col - startTile.col;
        let newFacing = facing;
        if (dx > 0) newFacing = -1; // 右へ移動
        else if (dx < 0) newFacing = 1; // 左へ移動

        const runAnimation = async () => {
            // ▼ 修正：ここで回転が終わるまで完全に待機する！
            if (newFacing !== facing && isImage) {
                await triggerSpin(newFacing);
            } else {
                setFacing(newFacing);
            }

            setIsMoving(true);
            const dur = 350;
            const startTime = performance.now();

            if (showSmoke) {
                setDustTrail(t => [...t.slice(-5), { x: sx, y: sy, id: Date.now() }]);
            }

            const animateMove = (now) => {
                const t = Math.min((now - startTime) / dur, 1);
                // パラボラジャンプの計算
                const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                const jumpArc = -4 * (t - 0.5) * (t - 0.5) + 1;
                const jumpHeight = 44 + Math.abs(ey - sy) * 0.4 + Math.abs(ex - sx) * 0.15;

                setOffset({
                    x: sx + (ex - sx) * eased,
                    y: sy + (ey - sy) * eased,
                    jump: jumpArc * jumpHeight
                });

                if (t < 1) {
                    animRef.current = requestAnimationFrame(animateMove);
                } else {
                    setOffset({ x: ex, y: ey, jump: 0 });
                    setIsMoving(false);
                    // 着地時の土埃（設定ON時のみ）
                    if (showSmoke) {
                        setDustTrail(t => [...t.slice(-4),
                            { x: ex - 12, y: ey, id: Date.now() },
                            { x: ex + 12, y: ey, id: Date.now() + 1 }
                        ]);
                    }
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
    }, [player.pos, mapData, facing, isImage, triggerSpin, showSmoke]);

    // ▼ 修正：cos(spinAngle) を用いて紙の薄さを完全再現
    const spinWidth = isSpinning ? Math.max(0.02, Math.abs(Math.cos(spinAngle))) : 1;
    // 半回転〜1回転半の間は裏面画像を表示
    const showBack = isSpinning && spinAngle > Math.PI * 0.45 && spinAngle < Math.PI * 1.55;
    // ▼ 修正：回転中のホップ（浮き上がり）を追加
    const spinHop = isSpinning ? Math.sin(spinAngle) * -12 : 0;
    
    const idleBob = Math.sin(idlePhase * 0.06) * -3;
    const tilt = isMoving ? Math.sin(Date.now() * 0.015) * 6 : 0;

    const currentTile = mapData.find(t => t.id === player.pos) || mapData[0];
    const zIndexBase = 50 + currentTile.row * 10;
    const FOOT_Y = 15;

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

            <div style={{
                position: 'absolute',
                left: '50%', top: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                
                {/* 煙エフェクト（条件付き描画） */}
                {showSmoke && dustTrail.map(d => (
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

                {/* 落ち影 */}
                <div style={{
                    position: 'absolute',
                    left: '50%', top: FOOT_Y,
                    width: 32, height: 10, background: 'rgba(0,0,0,0.5)', borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: isMoving ? 0.35 : 0.7,
                    transition: 'opacity 0.2s',
                    zIndex: zIndexBase - 1, pointerEvents: 'none'
                }} />

                {/* キャラクター本体 */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    // ▼ 修正：回転中のホップ（spinHop）を加算
                    top: `calc(${FOOT_Y}px - ${offset.jump}px + ${isMoving ? 0 : idleBob}px + ${spinHop}px)`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: zIndexBase,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'
                }}>
                    <div style={{
                        width: isImage ? 80 : 44, height: isImage ? 80 : 44,
                        position: 'relative',
                        // ▼ 修正：cosで計算した spinWidth を適用し、ペーパーマリオ風の幅を再現
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
                                    bottom: 0, 
                                    imageRendering: 'pixelated', WebkitFontSmoothing: 'none',
                                    transform: `scaleX(${facing})`, 
                                    filter: isActiveTurn ? 'drop-shadow(0 0 8px #ffe066)' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))'
                                }} />
                        ) : (
                            <span style={{ fontSize: 26, transform: `scaleX(${facing})` }}>{charEmoji[player.charType]}</span>
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