import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charTokenImages, charEmoji, pIdColors } from '../../constants/characters';

const getDepthScale = (z) => Math.max(0.35, 1 - (z || 0) * 0.09);

export const PlayerToken = ({ player, gridConfig }) => {
    const mapData = useGameStore(state => state.mapData);
    const turn = useGameStore(state => state.turn);
    
    const tokenImages = useMemo(() => charTokenImages[player.charType] || null, [player.charType]);

    // 座標計算（宙に浮く現象をTile.jsxと完全同期して修正）
    const getTileCoords = useCallback((tileId) => {
        const tile = mapData.find(t => t.id === tileId);
        if (!tile || !gridConfig) return { x: 0, y: 0, z: 0 };
        const { tileSize, gap, padding } = gridConfig;
        
        const cx = padding + (tile.col - 1) * (tileSize + gap) + tileSize / 2;
        let cy = padding + (tile.row - 1) * (tileSize + gap) + tileSize / 2;
        
        // Tile.jsxと同じZ軸のYズレ( -16 )を、スケールも加味して計算
        const depthScale = getDepthScale(tile.z);
        const yOffset = -(tile.z || 0) * 16 * depthScale; 
        cy += yOffset;

        return { x: cx, y: cy, z: tile.z || 0 };
    }, [mapData, gridConfig]);

    const [dustTrail, setDustTrail] = useState([]);
    const [imageSrc, setImageSrc] = useState(tokenImages?.front || null);

    const containerRef = useRef(null);
    const wrapperRef = useRef(null);
    const shadowRef = useRef(null);

    const state = useRef({
        x: 0, y: 0, z: 0,
        facing: -1, 
        isSpinning: false,
        spinAngle: 0,
        isMoving: false,
        idlePhase: 0,
        tilt: 0,
        hop: 0,
        posId: player.pos,
        initialized: false
    });

    const addDust = useCallback((x, y, z) => {
        if (!tokenImages) return; 
        const ds = getDepthScale(z);
        const newDust = {
            id: Date.now() + Math.random(),
            x: x + (Math.random() * 10 - 5),
            y: y, 
            s: ds
        };
        setDustTrail(prev => [...prev.slice(-4), newDust]);
    }, [tokenImages]);

    useEffect(() => {
        if (dustTrail.length > 0) {
            const timer = setTimeout(() => setDustTrail(t => t.slice(1)), 380);
            return () => clearTimeout(timer);
        }
    }, [dustTrail]);

    const updateDOM = useCallback(() => {
        if (!tokenImages) return;
        const curr = state.current;
        const depthScale = getDepthScale(curr.z);

        const spinWidth = curr.isSpinning ? Math.max(0.02, Math.abs(Math.cos(curr.spinAngle))) : 1;
        const scaleX = curr.facing * spinWidth * depthScale;
        const scaleY = depthScale;

        // 待機時の揺れを極小化（フワフワ感を抑える）
        const idleBob = curr.isMoving ? 0 : Math.sin(curr.idlePhase * 0.03) * -1.0;
        const totalY = curr.y + idleBob + curr.hop;
        const zIndex = Math.floor(curr.y);

        if (containerRef.current) {
            containerRef.current.style.transform = `translate3d(${curr.x}px, ${totalY}px, 0)`;
            containerRef.current.style.zIndex = zIndex;
        }
        
        if (wrapperRef.current) {
            wrapperRef.current.style.transform = `translate(-50%, -100%) scale(${scaleX}, ${scaleY}) rotate(${curr.tilt}deg)`;
        }

        if (shadowRef.current) {
            shadowRef.current.style.transform = `translate3d(${curr.x}px, ${curr.y}px, 0) translate(-50%, -50%) scale(${depthScale})`;
            shadowRef.current.style.opacity = curr.isMoving ? "0.35" : "0.65";
            shadowRef.current.style.zIndex = zIndex - 1;
        }
    }, [tokenImages]);

    useEffect(() => {
        if (!gridConfig || !mapData.length || state.current.initialized) return;
        const coords = getTileCoords(player.pos);
        state.current.x = coords.x;
        state.current.y = coords.y;
        state.current.z = coords.z;
        state.current.initialized = true;
        updateDOM();
    }, [gridConfig, mapData, player.pos, getTileCoords, updateDOM]);

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
                
                // ジャンプの高さを徹底的に低くし、機敏な移動に
                const jumpHeight = 15 + Math.abs(target.y - startY) * 0.15 + Math.abs(target.x - startX) * 0.1;

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

    useEffect(() => {
        if (!state.current.initialized || !gridConfig) return;
        if (player.pos !== state.current.posId && mapData.length > 0) {
            const targetCoords = getTileCoords(player.pos);
            animateTo(targetCoords);
            state.current.posId = player.pos;
        }
    }, [player.pos, mapData, gridConfig, getTileCoords, animateTo]);


    if (!tokenImages || !gridConfig) {
        // 画像なしのキャラ（その他のキャラ）もサイズを大きく
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
                     style={{ borderColor: player.color, width: '90px', height: '90px', borderWidth: '4px' }}> {/* 倍以上に拡大 */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1 }}>
                        <span style={{ fontSize:'40px' }}>{charEmoji[player.charType]}</span>
                        <span style={{ fontSize:'12px', fontWeight:900, color:player.color, textShadow:'0 0 4px rgba(0,0,0,1)', whiteSpace: 'nowrap', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes dustAnim {
                    0% { opacity: 0.45; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -150%) scale(3.5); }
                }
            `}</style>

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

            <div ref={shadowRef} style={{
                position: 'absolute',
                left: 0, top: 0,
                width: 24, height: 8,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.3)',
                transformOrigin: 'center center',
                pointerEvents: 'none'
            }} />

            <div ref={containerRef} style={{
                position: 'absolute',
                left: 0, top: 0,
                pointerEvents: 'none',
            }}>
                <div ref={wrapperRef} style={{
                    position: 'absolute',
                    left: 0, top: 0,
                    transformOrigin: 'bottom center',
                    // ▼ 駒を限界まで大きく（元のtileSize * 1.3 から 3.0に拡大）
                    width: gridConfig.tileSize * 3.0, 
                    height: gridConfig.tileSize * 3.0,
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