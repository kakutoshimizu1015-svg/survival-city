import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charTokenImages, charEmoji, pIdColors } from '../../constants/characters';

// Z軸によるスケール計算
const getDepthScale = (z) => Math.max(0.35, 1 - (z || 0) * 0.09);

export const PlayerToken = ({ player, gridConfig }) => {
    const mapData = useGameStore(state => state.mapData);
    const turn = useGameStore(state => state.turn);
    
    // サバイバー等の画像アセット取得（設定がないキャラはnullになる）
    const tokenImages = useMemo(() => charTokenImages[player.charType] || null, [player.charType]);

    // マス目の論理的なピクセル座標を計算するヘルパー
    const getTileCoords = useCallback((tileId) => {
        const tile = mapData.find(t => t.id === tileId);
        // 構文エラーを修正（スペース削除）
        if (!tile || !gridConfig) return { x: 0, y: 0, z: 0 };
        const { tileSize, gap, padding } = gridConfig;
        
        // CSS Gridの col, row からグリッド内の中心座標を割り出す
        const cx = padding + (tile.col - 1) * (tileSize + gap) + tileSize / 2;
        let cy = padding + (tile.row - 1) * (tileSize + gap) + tileSize / 2;
        
        // Tile.jsxのZ軸 translateY に合わせてY座標を調整（駒の浮きを修正）
        cy += -(tile.z || 0) * 15;

        return { x: cx, y: cy, z: tile.z || 0 };
    }, [mapData, gridConfig]);

    // エフェクト・表示用ステート
    const [dustTrail, setDustTrail] = useState([]);
    const [imageSrc, setImageSrc] = useState(tokenImages?.front || null);

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
        posId: player.pos,
        initialized: false
    });

    // 砂埃エフェクトの追加
    const addDust = useCallback((x, y, z) => {
        if (!tokenImages) return; // 画像キャラ以外は出さない
        const ds = getDepthScale(z);
        const newDust = {
            id: Date.now() + Math.random(),
            x: x + (Math.random() * 10 - 5),
            y: y, // 足元の座標に合わせる
            s: ds
        };
        setDustTrail(prev => [...prev.slice(-4), newDust]);
    }, [tokenImages]);

    // 砂埃エフェクトの自動消去タイマー
    useEffect(() => {
        if (dustTrail.length > 0) {
            const timer = setTimeout(() => setDustTrail(t => t.slice(1)), 380);
            return () => clearTimeout(timer);
        }
    }, [dustTrail]);

    // DOMのスタイルを直接更新して描画を反映（画像キャラ用）
    const updateDOM = useCallback(() => {
        if (!tokenImages) return;
        const curr = state.current;
        const depthScale = getDepthScale(curr.z);

        // スピン時の紙の薄さ（cosカーブで立体回転を表現）
        const spinWidth = curr.isSpinning ? Math.max(0.02, Math.abs(Math.cos(curr.spinAngle))) : 1;
        const scaleX = curr.facing * spinWidth * depthScale;
        const scaleY = depthScale;

        // 待機時の上下の揺れ
        const idleBob = curr.isMoving ? 0 : Math.sin(curr.idlePhase * 0.03) * -1.5;
        const totalY = curr.y + idleBob + curr.hop;

        // Y座標に基づくZソート
        const zIndex = Math.floor(curr.y);

        if (containerRef.current) {
            containerRef.current.style.transform = `translate3d(${curr.x}px, ${totalY}px, 0)`;
            containerRef.current.style.zIndex = zIndex;
        }
        
        if (wrapperRef.current) {
            // 足元の中心を起点にする
            wrapperRef.current.style.transform = `translate(-50%, -100%) scale(${scaleX}, ${scaleY}) rotate(${curr.tilt}deg)`;
        }

        if (shadowRef.current) {
            // 影をマスの中心にピッタリ合わせる
            shadowRef.current.style.transform = `translate3d(${curr.x}px, ${curr.y}px, 0) translate(-50%, -50%) scale(${depthScale})`;
            shadowRef.current.style.opacity = curr.isMoving ? "0.35" : "0.65";
            shadowRef.current.style.zIndex = zIndex - 1;
        }
    }, [tokenImages]);

    // 初期位置の設定
    useEffect(() => {
        if (!gridConfig || !mapData.length || state.current.initialized) return;
        const coords = getTileCoords(player.pos);
        state.current.x = coords.x;
        state.current.y = coords.y;
        state.current.z = coords.z;
        state.current.initialized = true;
        updateDOM();
    }, [gridConfig, mapData, player.pos, getTileCoords, updateDOM]);

    // 常時実行される待機アニメーションループ（画像キャラ用）
    useEffect(() => {
        if (!tokenImages) return;
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
    }, [tokenImages, updateDOM]);

    // ペーパーマリオ風の回転アニメーション
    const runSpinAnim = useCallback((newFacing) => {
        return new Promise(resolve => {
            state.current.isSpinning = true;
            const startTime = performance.now();
            const spinDur = 550; 

            const tick = (now) => {
                const t = Math.min((now - startTime) / spinDur, 1);
                const eased = t < 0.3
                    ? (t / 0.3) * (t / 0.3) * 0.3
                    : t > 0.7
                    ? 0.7 + (1 - ((1 - t) / 0.3) * ((1 - t) / 0.3)) * 0.3
                    : 0.3 + (t - 0.3) / 0.4 * 0.4;

                state.current.spinAngle = eased * Math.PI * 2;
                state.current.hop = Math.sin(state.current.spinAngle) * -8 * getDepthScale(state.current.z);

                if (t >= 0.5 && state.current.facing !== newFacing) {
                    state.current.facing = newFacing;
                }

                const showBack = state.current.spinAngle > Math.PI * 0.45 && state.current.spinAngle < Math.PI * 1.55;
                setImageSrc(showBack ? tokenImages.back : tokenImages.front);

                updateDOM();

                if (t < 1) {
                    requestAnimationFrame(tick);
                } else {
                    state.current.isSpinning = false;
                    state.current.spinAngle = 0;
                    state.current.hop = 0;
                    state.current.facing = newFacing;
                    setImageSrc(tokenImages.front);
                    updateDOM();
                    resolve();
                }
            };
            requestAnimationFrame(tick);
        });
    }, [tokenImages, updateDOM]);

    // 放物線ジャンプアニメーション
    const runJumpAnim = useCallback((target) => {
        return new Promise(resolve => {
            const startX = state.current.x;
            const startY = state.current.y;
            const startZ = state.current.z;
            const dur = 330;
            const startTime = performance.now();

            addDust(startX, startY, startZ); 

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
                    addDust(target.x, target.y, target.z); 
                    updateDOM();
                    resolve();
                }
            };
            requestAnimationFrame(tick);
        });
    }, [addDust, updateDOM]);

    // 移動制御
    const animateTo = useCallback(async (target) => {
        state.current.isMoving = true;
        useGameStore.setState({ isTokenAnimating: true });

        const dx = target.x - state.current.x;
        
        let newFacing = state.current.facing;
        if (dx > 0) newFacing = -1; 
        else if (dx < 0) newFacing = 1; 

        if (tokenImages && newFacing !== state.current.facing) {
            await runSpinAnim(newFacing);
        } else {
            state.current.facing = newFacing; 
        }

        await runJumpAnim(target);

        state.current.isMoving = false;
        state.current.tilt = 0;
        updateDOM();
        useGameStore.setState({ isTokenAnimating: false });
    }, [tokenImages, runSpinAnim, runJumpAnim, updateDOM]);

    // ストア上の位置変更検知
    useEffect(() => {
        if (!state.current.initialized || !gridConfig) return;
        if (player.pos !== state.current.posId && mapData.length > 0) {
            const targetCoords = getTileCoords(player.pos);
            animateTo(targetCoords);
            state.current.posId = player.pos;
        }
    }, [player.pos, mapData, gridConfig, getTileCoords, animateTo]);

    // ▼▼▼ 条件分岐描画 ▼▼▼

    if (!tokenImages || !gridConfig) {
        // 【1】画像データがないキャラクター（元のゲームと同じ見た目を復元）
        const coords = getTileCoords(player.pos);
        const depthScale = getDepthScale(coords.z);
        const isActive = player.id === turn && !state.current.isMoving;

        return (
            <div style={{
                position: 'absolute',
                left: coords.x,
                top: coords.y,
                transform: `scale(${depthScale}) translate(-50%, -100%)`,
                transformOrigin: 'bottom center',
                transition: 'left 0.3s ease, top 0.3s ease, transform 0.3s ease', 
                zIndex: Math.floor(coords.y)
            }}>
                <div className={`player-token pos-${player.id % 4} ${isActive ? 'token-active' : ''}`} 
                     style={{ borderColor: player.color, width: '36px', height: '36px' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1 }}>
                        <span style={{ fontSize:'18px' }}>{charEmoji[player.charType]}</span>
                        <span style={{ fontSize:'7px', fontWeight:900, color:player.color, textShadow:'0 0 4px rgba(0,0,0,1)', whiteSpace: 'nowrap', maxWidth: '32px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</span>
                    </div>
                </div>
            </div>
        );
    }

    // 【2】画像データがあるキャラクター（サバイバー）の場合
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
                    position: 'absolute',
                    left: 0, top: 0,
                    transformOrigin: 'bottom center',
                    width: gridConfig.tileSize * 1.3,
                    height: gridConfig.tileSize * 1.3,
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