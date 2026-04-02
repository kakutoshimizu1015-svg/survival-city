import React, { useState, useEffect, useRef, useCallback } from 'react';
import { charEmoji, charImages } from '../../constants/characters';

// マスのグリッド座標を、#game-board 内の絶対ピクセル座標に変換する関数
// （Tileサイズ60px, Gap20px, BoardPadding30px に完全適合）
const getTileCenter = (col, row) => ({
    x: 60 + (col - 1) * 80,
    y: 60 + (row - 1) * 80
});

export const PlayerToken = ({ player, mapData, isActiveTurn }) => {
    const isImage = charImages && charImages[player.charType] !== undefined;

    // 初期位置の設定
    const initialTile = mapData.find(t => t.id === player.pos) || mapData[0];
    const initCenter = getTileCenter(initialTile.col, initialTile.row);

    const [animPos, setAnimPos] = useState({ x: initCenter.x, y: initCenter.y, groundY: initCenter.y });
    const [facing, setFacing] = useState(1); // 1 = 右向き, -1 = 左向き
    const [isMoving, setIsMoving] = useState(false);
    const [idlePhase, setIdlePhase] = useState(0);
    const [spinAngle, setSpinAngle] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [dustTrail, setDustTrail] = useState([]);

    const animRef = useRef(null);
    const spinRef = useRef(null);
    const prevPosRef = useRef(player.pos);

    // 待機時のフワフワ上下運動（Idle Bobbing）
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

    // ペーパーマリオ風の回転アニメーション（イージング完全再現）
    const triggerSpin = useCallback((newFacing) => {
        return new Promise((resolve) => {
            if (isSpinning || !isImage) {
                setFacing(newFacing);
                resolve();
                return;
            }
            setIsSpinning(true);
            const startTime = performance.now();
            const spinDur = 550; // 劇的なターンを演出する絶妙なタメ時間

            const animateSpin = (now) => {
                const t = Math.min((now - startTime) / spinDur, 1);
                // プレビュー版と全く同じイージングカーブ
                const eased = t < 0.3
                    ? (t / 0.3) * (t / 0.3) * 0.3
                    : t > 0.7
                    ? 0.7 + (1 - ((1 - t) / 0.3) * ((1 - t) / 0.3)) * 0.3
                    : 0.3 + (t - 0.3) / 0.4 * 0.4;

                setSpinAngle(eased * Math.PI * 2);

                // 回転の頂点で画像の向きを反転
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

    // ジャンプ・移動アニメーション（パラボラ計算完全再現）
    useEffect(() => {
        if (prevPosRef.current === player.pos) return;
        const startTile = mapData.find(t => t.id === prevPosRef.current);
        const endTile = mapData.find(t => t.id === player.pos);

        if (!startTile || !endTile) {
            prevPosRef.current = player.pos;
            return;
        }

        const sx = 60 + (startTile.col - 1) * 80;
        const sy = 60 + (startTile.row - 1) * 80;
        const ex = 60 + (endTile.col - 1) * 80;
        const ey = 60 + (endTile.row - 1) * 80;

        const dx = ex - sx;
        let newFacing = facing;
        if (dx > 0) newFacing = -1; // 右へ移動 (-1で右を向く)
        else if (dx < 0) newFacing = 1; // 左へ移動 (1で左を向く)

        const runAnimation = async () => {
            // 方向転換が必要なら先にスピンする
            if (newFacing !== facing && isImage) {
                await triggerSpin(newFacing);
            } else {
                setFacing(newFacing);
            }

            setIsMoving(true);
            const dur = 330;
            const startTime = performance.now();

            // ジャンプ開始時の土埃
            setDustTrail(t => [...t.slice(-5), { x: sx, y: sy + 10, id: Date.now() }]);

            const animateMove = (now) => {
                const t = Math.min((now - startTime) / dur, 1);
                // イーズイン・アウトと放物線の計算
                const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                const jumpArc = -4 * (t - 0.5) * (t - 0.5) + 1;
                const jumpHeight = 44 + Math.abs(ey - sy) * 0.4 + Math.abs(ex - sx) * 0.15;

                setAnimPos({
                    x: sx + (ex - sx) * eased,
                    y: sy + (ey - sy) * eased - jumpArc * jumpHeight, // ジャンプ中のY座標
                    groundY: sy + (ey - sy) * eased // 影を落とすための地面のY座標
                });

                if (t < 1) {
                    animRef.current = requestAnimationFrame(animateMove);
                } else {
                    setAnimPos({ x: ex, y: ey, groundY: ey });
                    setIsMoving(false);
                    // 着地時の土埃（左右に広がる）
                    setDustTrail(t => [...t.slice(-4),
                        { x: ex - 12, y: ey + 10, id: Date.now() },
                        { x: ex + 12, y: ey + 10, id: Date.now() + 1 }
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
    const spinHop = isSpinning ? Math.sin(spinAngle) * -12 : 0; // 回転中の軽いホップ
    const idleBob = Math.sin(idlePhase * 0.06) * -3; // 待機中のフワフワ感
    const tilt = isMoving ? Math.sin(Date.now() * 0.015) * 6 : 0; // 歩行時の傾き

    const currentTile = mapData.find(t => t.id === player.pos) || mapData[0];
    const zIndexBase = 50 + currentTile.row * 10; // 奥から手前へのZソート

    return (
        <>
            <style>{`
                @keyframes tokenDustAnim {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.6; }
                    100% { transform: translate(-50%, -200%) scale(2.5); opacity: 0; }
                }
            `}</style>

            {/* 土埃エフェクト */}
            {dustTrail.map(d => (
                <div key={d.id} style={{
                    position: 'absolute', left: d.x, top: d.y,
                    width: 14, height: 14, background: 'rgba(210,195,150,0.7)', borderRadius: '50%',
                    animation: 'tokenDustAnim 0.4s ease-out forwards', pointerEvents: 'none',
                    zIndex: zIndexBase - 2
                }} />
            ))}

            {/* 落ち影（ジャンプ中は薄くなる） */}
            <div style={{
                position: 'absolute',
                left: animPos.x, top: animPos.groundY + 8,
                width: 36, height: 12, background: 'rgba(0,0,0,0.5)', borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: isMoving ? 0.35 : 0.7,
                transition: 'opacity 0.2s',
                zIndex: zIndexBase - 1, pointerEvents: 'none'
            }} />

            {/* プレイヤー駒 本体 */}
            <div style={{
                position: 'absolute',
                left: animPos.x,
                top: animPos.y + (isMoving ? 0 : idleBob) + spinHop,
                transform: 'translate(-50%, -100%)', // 足元を中心に固定
                zIndex: zIndexBase,
                display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'
            }}>
                {/* 回転や傾きが適用されるラッパー */}
                <div style={{
                    width: isImage ? 88 : 48, height: isImage ? 88 : 48,
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
                                position: 'absolute', width: '115%', height: '115%', objectFit: 'contain', bottom: -5,
                                imageRendering: 'pixelated', WebkitFontSmoothing: 'none',
                                transform: `scaleX(${facing})`, // 進行方向に応じた画像の反転
                                filter: isActiveTurn ? 'drop-shadow(0 0 8px #ffe066)' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))'
                            }} />
                    ) : (
                        <span style={{ fontSize: 26, transform: `scaleX(${facing})` }}>{charEmoji[player.charType]}</span>
                    )}
                </div>

                {/* プレイヤー名ラベル */}
                <div style={{
                    marginTop: 4, fontSize: 13, fontWeight: 900, color: player.color,
                    textShadow: '1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000',
                    whiteSpace: 'nowrap'
                }}>
                    {player.name}
                </div>
            </div>
        </>
    );
};