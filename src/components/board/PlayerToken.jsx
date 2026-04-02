import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';

// ▼ アセット画像（パスは実際のプロジェクトに合わせてください）
import survivorFront from '../../assets/images/characters/homeless_front.jpg';
import survivorBack from '../../assets/images/characters/homeless_back.jpg';

// マップのグリッド計算用の定数（GameBoard.jsxのスタイルに合わせています）
const TILE_SIZE = 60;
const GAP = 20;
const PADDING = 30;

// Z軸によるスケール計算
const getDepthScale = (z) => Math.max(0.35, 1 - (z || 0) * 0.09);

// マス目の論理的なピクセル座標を計算するヘルパー
const getTileCoords = (tile) => {
    if (!tile) return { x: 0, y: 0, z: 0 };
    // col, row からグリッド内の中心座標を割り出す
    const cx = PADDING + (tile.col - 1) * (TILE_SIZE + GAP) + TILE_SIZE / 2;
    const cy = PADDING + (tile.row - 1) * (TILE_SIZE + GAP) + TILE_SIZE / 2;
    return { x: cx, y: cy, z: tile.z || 0 };
};

export const PlayerToken = ({ player }) => {
    const mapData = useGameStore(state => state.mapData);
    
    // エフェクト・表示用ステート
    const [dustTrail, setDustTrail] = useState([]);
    const [imageSrc, setImageSrc] = useState(survivorFront);

    // DOM操作用のRef
    const containerRef = useRef(null);
    const wrapperRef = useRef(null);
    const shadowRef = useRef(null);

    // アニメーション用のミュータブルな状態（再レンダリングを防ぐためRefで管理）
    const state = useRef({
        x: 0, y: 0, z: 0,
        facing: -1, // -1: 右向き, 1: 左向き
        isSpinning: false,
        spinAngle: 0,
        isMoving: false,
        idlePhase: 0,
        tilt: 0,
        hop: 0,
        posId: player.pos
    });

    // 砂埃エフェクトの追加
    const addDust = useCallback((x, y, z) => {
        const ds = getDepthScale(z);
        const newDust = {
            id: Date.now() + Math.random(),
            x: x + (Math.random() * 10 - 5),
            y: y + 10 * ds, // 足元
            s: ds
        };
        setDustTrail(prev => [...prev.slice(-4), newDust]);
    }, []);

    // 砂埃エフェクトの自動消去タイマー
    useEffect(() => {
        if (dustTrail.length > 0) {
            const timer = setTimeout(() => setDustTrail(t => t.slice(1)), 380);
            return () => clearTimeout(timer);
        }
    }, [dustTrail]);

    // DOMのスタイルを直接更新して描画を反映
    const updateDOM = useCallback(() => {
        const curr = state.current;
        const depthScale = getDepthScale(curr.z);

        // スピン時の紙の薄さ（cosカーブで立体回転を表現）
        const spinWidth = curr.isSpinning ? Math.max(0.02, Math.abs(Math.cos(curr.spinAngle))) : 1;
        const scaleX = curr.facing * spinWidth * depthScale;
        const scaleY = depthScale;

        // 待機時の上下の揺れ
        const idleBob = curr.isMoving ? 0 : Math.sin(curr.idlePhase * 0.03) * -1.5;
        const totalY = curr.y + idleBob + curr.hop;

        // Y座標に基づくZソート（手前のものが前に来るように）
        const zIndex = Math.floor(curr.y);

        if (containerRef.current) {
            containerRef.current.style.transform = `translate3d(${curr.x}px, ${totalY}px, 0)`;
            containerRef.current.style.zIndex = zIndex;
        }
        
        if (wrapperRef.current) {
            wrapperRef.current.style.transform = `translate(-50%, -100%) scale(${scaleX}, ${scaleY}) rotate(${curr.tilt}deg)`;
        }

        if (shadowRef.current) {
            shadowRef.current.style.transform = `translate3d(${curr.x}px, ${curr.y + 10 * depthScale}px, 0) translate(-50%, -50%) scale(${depthScale})`;
            shadowRef.current.style.opacity = curr.isMoving ? "0.35" : "0.65";
            shadowRef.current.style.zIndex = zIndex - 1;
        }
    }, []);

    // 初期位置の設定
    useEffect(() => {
        const initialTile = mapData.find(t => t.id === player.pos);
        if (initialTile) {
            const coords = getTileCoords(initialTile);
            state.current.x = coords.x;
            state.current.y = coords.y;
            state.current.z = coords.z;
            updateDOM();
        }
    }, [mapData, player.pos, updateDOM]);

    // 常時実行される待機アニメーションループ
    useEffect(() => {
        let rafId;
        const tick = () => {
            if (!state.current.isMoving) {
                state.current.idlePhase++;
                updateDOM();
            } else {
                state.current.tilt = Math.sin(Date.now() * 0.008) * 3;
                updateDOM();
            }
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [updateDOM]);

    // ペーパーマリオ風の回転アニメーション
    const runSpinAnim = useCallback((newFacing) => {
        return new Promise(resolve => {
            state.current.isSpinning = true;
            const startTime = performance.now();
            const spinDur = 550; // 劇的なターンを演出するための時間

            const tick = (now) => {
                const t = Math.min((now - startTime) / spinDur, 1);
                // イージング: ゆっくり開始、中間速く、最後ゆっくり
                const eased = t < 0.3
                    ? (t / 0.3) * (t / 0.3) * 0.3
                    : t > 0.7
                    ? 0.7 + (1 - ((1 - t) / 0.3) * ((1 - t) / 0.3)) * 0.3
                    : 0.3 + (t - 0.3) / 0.4 * 0.4;

                state.current.spinAngle = eased * Math.PI * 2;
                // 回転時に少しだけ跳ねる
                state.current.hop = Math.sin(state.current.spinAngle) * -8 * getDepthScale(state.current.z);

                // 半回転した時点で向き（Facing）を反転
                if (t >= 0.5 && state.current.facing !== newFacing) {
                    state.current.facing = newFacing;
                }

                // 背面を見せるタイミングの計算
                const showBack = state.current.spinAngle > Math.PI * 0.45 && state.current.spinAngle < Math.PI * 1.55;
                setImageSrc(showBack ? survivorBack : survivorFront);

                updateDOM();

                if (t < 1) {
                    requestAnimationFrame(tick);
                } else {
                    state.current.isSpinning = false;
                    state.current.spinAngle = 0;
                    state.current.hop = 0;
                    state.current.facing = newFacing;
                    setImageSrc(survivorFront);
                    updateDOM();
                    resolve();
                }
            };
            requestAnimationFrame(tick);
        });
    }, [updateDOM]);

    // 放物線を描くジャンプアニメーション
    const runJumpAnim = useCallback((target) => {
        return new Promise(resolve => {
            const startX = state.current.x;
            const startY = state.current.y;
            const startZ = state.current.z;
            const dur = 330;
            const startTime = performance.now();

            addDust(startX, startY, startZ); // 出発時の砂埃

            const tick = (now) => {
                const t = Math.min((now - startTime) / dur, 1);
                const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                const jumpArc = -4 * (t - 0.5) * (t - 0.5) + 1;
                const jumpHeight = 44 + Math.abs(target.y - startY) * 0.4 + Math.abs(target.x - startX) * 0.15;

                state.current.x = startX + (target.x - startX) * eased;
                state.current.y = startY + (target.y - startY) * eased - jumpArc * jumpHeight;
                state.current.z = startZ + (target.z - startZ) * eased;

                updateDOM();

                if (t < 1) {
                    requestAnimationFrame(tick);
                } else {
                    state.current.x = target.x;
                    state.current.y = target.y;
                    state.current.z = target.z;
                    addDust(target.x, target.y, target.z); // 着地時の砂埃
                    updateDOM();
                    resolve();
                }
            };
            requestAnimationFrame(tick);
        });
    }, [addDust, updateDOM]);

    // 移動全体を管理（スピン判定＋ジャンプ）
    const animateTo = useCallback(async (target) => {
        state.current.isMoving = true;
        const dx = target.x - state.current.x;
        
        let newFacing = state.current.facing;
        if (dx > 0) newFacing = -1; // 右へ
        else if (dx < 0) newFacing = 1; // 左へ

        // 進行方向が変わった場合、先にスピンアニメーションを実行
        if (newFacing !== state.current.facing) {
            await runSpinAnim(newFacing);
        }

        // 目的地へジャンプ
        await runJumpAnim(target);

        state.current.isMoving = false;
        state.current.tilt = 0;
        updateDOM();
    }, [runSpinAnim, runJumpAnim, updateDOM]);

    // ストア上の現在位置（player.pos）の変更を検知して移動発火
    useEffect(() => {
        if (player.pos !== state.current.posId && mapData.length > 0) {
            const targetTile = mapData.find(t => t.id === player.pos);
            if (targetTile) {
                const targetCoords = getTileCoords(targetTile);
                animateTo(targetCoords);
                state.current.posId = player.pos;
            }
        }
    }, [player.pos, mapData, animateTo]);

    // レンダーツリー（CSSのtransformで操作されるため、極力軽量に保つ）
    return (
        <>
            <style>{`
                @keyframes dustAnim {
                    0% { opacity: 0.45; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -150%) scale(3.5); }
                }
            `}</style>

            {/* 砂埃エフェクト */}
            {dustTrail.map(d => (
                <div key={d.id} style={{
                    position: 'absolute',
                    left: d.x, top: d.y,
                    width: 10 * d.s, height: 10 * d.s,
                    borderRadius: '50%',
                    background: 'rgba(210,195,150,0.45)',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: Math.floor(d.y) - 1,
                    animation: 'dustAnim 0.4s forwards'
                }} />
            ))}

            {/* 足元の影 */}
            <div ref={shadowRef} style={{
                position: 'absolute',
                left: 0, top: 0,
                width: 24, height: 8,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.3)',
                transformOrigin: 'center center',
                pointerEvents: 'none'
            }} />

            {/* プレイヤーの駒（メイン） */}
            <div ref={containerRef} style={{
                position: 'absolute',
                left: 0, top: 0,
                pointerEvents: 'none',
            }}>
                <div ref={wrapperRef} style={{
                    transformOrigin: 'bottom center',
                    width: 80, height: 80, // 基本サイズ（ここからZスケールで縮小される）
                }}>
                    <img 
                        src={imageSrc} 
                        alt={player.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'auto' }} 
                    />
                </div>
            </div>
        </>
    );
};