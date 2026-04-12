import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { getCircularOffset } from '../../utils/gameLogic';
import { CharImage } from '../common/CharImage';
import { TOKEN_CONFIG } from '../../constants/characters';
import { MAP_CONFIG } from '../../constants/maps';
// ▼ 変更: ニセ情報の実行関数をインポート
import { executeFakeInfo } from '../../game/cards';

export const PlayerToken = ({ player, mapData, isActiveTurn, maxRow }) => {
    const showSmoke = useUserStore(state => state.showSmoke);
    const liteMode = useUserStore(state => state.liteMode); 

    // ▼ 変更: ニセ情報モードのステートを取得
    const { players, isFakeInfoPicking, fakeInfoTargets } = useGameStore();
    
    const policePos = useGameStore(state => state.policePos);
    const truckPos = useGameStore(state => state.truckPos);
    const unclePos = useGameStore(state => state.unclePos);
    const animalPos = useGameStore(state => state.animalPos);
    const yakuzaPos = useGameStore(state => state.yakuzaPos);
    const loansharkPos = useGameStore(state => state.loansharkPos);
    const friendPos = useGameStore(state => state.friendPos);

    const npcs = { policePos, truckPos, unclePos, animalPos, yakuzaPos, loansharkPos, friendPos };

    const offset = getCircularOffset(player.id, player.pos, players, npcs, TOKEN_CONFIG.player.offsetRadius);

    const offsetRef = useRef(offset);
    useEffect(() => { offsetRef.current = offset; }, [offset.x, offset.y]);

    const prevOffsetRef = useRef({ x: 0, y: 0 });
    const lastPosRef = useRef(player.pos);
    if (lastPosRef.current !== player.pos) {
        lastPosRef.current = player.pos;
    } else {
        prevOffsetRef.current = offset;
    }

    const [dustTrail, setDustTrail] = useState([]);
    
    const wrapRef = useRef(null);
    const tokenWrapperRef = useRef(null);
    const scaleRef = useRef(null);
    const innerTokenRef = useRef(null); 
    const shadowRef = useRef(null);

    const facingRef = useRef(1);
    const isAnimatingRef = useRef(false);
    const idleRafRef = useRef(null);
    const prevPosRef = useRef(player.pos);

    const FOOT_Y = 5; 
    const currentTile = mapData.find(t => t.id === player.pos) || mapData[0];
    const zIndexBase = 50 + currentTile.row * 10;
    
    const ds = TOKEN_CONFIG.player.scaleMultiplier;

    const tokenWidth = TOKEN_CONFIG.player.imageSize;
    const tokenHeight = TOKEN_CONFIG.player.imageSize;

    useEffect(() => {
        if (dustTrail.length > 0) {
            const timer = setTimeout(() => setDustTrail(t => t.slice(1)), 400);
            return () => clearTimeout(timer);
        }
    }, [dustTrail]);

    const startIdle = () => {
        if (isAnimatingRef.current) return;
        if (liteMode) return; 
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
    }, [liteMode]); 

    useEffect(() => {
        if (!isAnimatingRef.current && wrapRef.current) {
            wrapRef.current.style.transition = 'transform 0.4s ease-out';
            wrapRef.current.style.transform = `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`;
        }
    }, [offset.x, offset.y]);

    useLayoutEffect(() => {
        if (prevPosRef.current === player.pos) return;
        const startTile = mapData.find(t => t.id === prevPosRef.current);
        const endTile = mapData.find(t => t.id === player.pos);

        if (!startTile || !endTile) {
            prevPosRef.current = player.pos;
            return;
        }

        isAnimatingRef.current = true;
        if (idleRafRef.current) cancelAnimationFrame(idleRafRef.current);

        const tileDist = MAP_CONFIG.TILE_SIZE + MAP_CONFIG.GAP;
        const sx = (startTile.col - endTile.col) * tileDist + prevOffsetRef.current.x;
        const sy = (startTile.row - endTile.row) * tileDist + prevOffsetRef.current.y;
        
        if (wrapRef.current) {
            wrapRef.current.style.transition = 'none';
            wrapRef.current.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`;
        }

        const ex = 0;
        const ey = 0;

        const dx = endTile.col - startTile.col;
        let newFacing = facingRef.current;
        if (dx > 0) newFacing = -1; 
        else if (dx < 0) newFacing = 1;

        let spinRaf, moveRaf;

        const updateFacingDOM = (f) => {
            if (innerTokenRef.current) innerTokenRef.current.style.transform = `scaleX(${f})`;
        };

        const triggerSpin = () => {
            return new Promise((resolve) => {
                if (newFacing === facingRef.current) {
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
                    const curFacing = t >= 0.5 ? newFacing : facingRef.current;
                    
                    if (innerTokenRef.current) innerTokenRef.current.style.transform = `scaleX(${curFacing})`;
                    if (scaleRef.current) scaleRef.current.style.transform = `scaleX(${spinWidth}) rotate(0deg)`;
                    if (tokenWrapperRef.current) tokenWrapperRef.current.style.transform = `translate(-50%, calc(-100% + ${spinHop}px))`;

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

        const runMove = async () => {
            await triggerSpin(); 

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

                if (wrapRef.current) wrapRef.current.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
                if (tokenWrapperRef.current) tokenWrapperRef.current.style.transform = `translate(-50%, calc(-100% - ${jumpArc * jumpHeight}px))`;
                if (scaleRef.current) scaleRef.current.style.transform = `scaleX(1) rotate(${tilt}deg)`;
                if (shadowRef.current) shadowRef.current.style.opacity = 0.35;

                if (t < 1) {
                    moveRaf = requestAnimationFrame(animateMove);
                } else {
                    if (wrapRef.current) {
                        wrapRef.current.style.transition = 'none';
                        wrapRef.current.style.transform = `translate(-50%, -50%)`;
                    }
                    if (tokenWrapperRef.current) tokenWrapperRef.current.style.transform = `translate(-50%, -100%)`;
                    if (scaleRef.current) scaleRef.current.style.transform = `scaleX(1) rotate(0deg)`;
                    if (shadowRef.current) shadowRef.current.style.opacity = 0.7;

                    if (showSmoke) {
                        setDustTrail(t => [...t.slice(-4), { x: -12, y: 0, id: Date.now() }, { x: 12, y: 0, id: Date.now() + 1 }]);
                    }

                    prevPosRef.current = player.pos;
                    isAnimatingRef.current = false;
                    
                    requestAnimationFrame(() => {
                        if (wrapRef.current) {
                            wrapRef.current.style.transition = 'transform 0.4s ease-out';
                            wrapRef.current.style.transform = `translate(calc(-50% + ${offsetRef.current.x}px), calc(-50% + ${offsetRef.current.y}px))`;
                        }
                        if (!liteMode) idleRafRef.current = requestAnimationFrame(startIdle); 
                    });
                }
            };
            moveRaf = requestAnimationFrame(animateMove);
        };

        runMove();

        return () => {
            if (spinRaf) cancelAnimationFrame(spinRaf);
            if (moveRaf) cancelAnimationFrame(moveRaf);
        };
    }, [player.pos, mapData, showSmoke, liteMode]); 

    const isTeam = player.teamColor && player.teamColor !== 'none';
    const glowColor = isTeam ? player.teamColor : player.color;

    const isPoisoned = player.statusEffects?.poison > 0;
    const poisonFilter = `drop-shadow(0 0 10px #9b59b6) sepia(0.5) hue-rotate(250deg) saturate(2)`;

    const playerGlowFilter = liteMode 
        ? (isPoisoned ? poisonFilter : (isTeam || isActiveTurn ? `drop-shadow(0 0 6px ${glowColor})` : 'none'))
        : (isPoisoned ? poisonFilter : (isActiveTurn 
            ? `drop-shadow(0 0 15px #ffe066) drop-shadow(0 0 8px ${glowColor})` 
            : (isTeam ? `drop-shadow(0 0 15px ${glowColor})` : `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 4px 6px rgba(0,0,0,0.6))`)));

    // ▼ 変更: ニセ情報の対象プレイヤーかどうかを判定し、クリックイベントを付与
    const isTargetable = isFakeInfoPicking && fakeInfoTargets.includes(player.id);
    const handleClick = () => {
        if (isTargetable) {
            executeFakeInfo(player.id);
        }
    };

    return (
        <div style={{
            gridColumn: currentTile.col,
            gridRow: currentTile.row,
            position: 'relative',
            width: '100%', height: '100%',
            zIndex: isTargetable ? 9999 : (zIndexBase + 10), // ▼ 変更: ターゲット時は最前面へ
            pointerEvents: isTargetable ? 'auto' : 'none',   // ▼ 変更: ターゲット時のみクリック可能に
            transform: `scale(${ds})`,
            transformOrigin: 'center center',
            cursor: isTargetable ? 'pointer' : 'default'     // ▼ 変更: マウスカーソルをポインターに
        }}
        onClick={handleClick} // ▼ 変更: クリックイベントをバインド
        >
            <style>{`
                @keyframes tokenDustAnim {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.6; }
                    100% { transform: translate(-50%, -200%) scale(2.5); opacity: 0; }
                }
                @keyframes targetPulse {
                    0% { filter: drop-shadow(0 0 5px red) brightness(1); transform: scale(1); }
                    50% { filter: drop-shadow(0 0 15px red) brightness(1.2); transform: scale(1.1); }
                    100% { filter: drop-shadow(0 0 5px red) brightness(1); transform: scale(1); }
                }
            `}</style>

            <div ref={wrapRef} style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                
                {showSmoke && dustTrail.map(d => (
                    <div key={d.id} style={{
                        position: 'absolute', left: `calc(50% + ${d.x}px)`, top: `calc(${FOOT_Y}px + ${d.y}px)`,
                        width: 14, height: 14, background: 'rgba(210,195,150,0.7)', borderRadius: '50%',
                        transform: 'translate(-50%, -50%)', animation: 'tokenDustAnim 0.4s ease-out forwards', pointerEvents: 'none',
                        zIndex: zIndexBase - 2
                    }} />
                ))}

                <div ref={shadowRef} style={{
                    position: 'absolute', left: '50%', top: FOOT_Y, width: 32, height: 10, background: 'rgba(0,0,0,0.5)', borderRadius: '50%',
                    transform: 'translate(-50%, -50%)', opacity: 0.7, zIndex: zIndexBase - 1, pointerEvents: 'none',
                    display: liteMode ? 'none' : 'block' 
                }} />

                <div ref={tokenWrapperRef} style={{
                    position: 'absolute', left: '50%', top: `${FOOT_Y}px`, transform: 'translate(-50%, -100%)',
                    zIndex: zIndexBase, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'
                }}>
                    <div ref={scaleRef} style={{
                        width: tokenWidth, height: tokenHeight,
                        position: 'relative', transformOrigin: 'bottom center',
                        background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        // ▼ 変更: ターゲット時のアニメーションを付与
                        animation: isTargetable ? 'targetPulse 1s infinite' : 'none'
                    }}>
                        <div ref={innerTokenRef} style={{ width: '100%', height: '100%', transform: `scaleX(${facingRef.current})` }}>
                            <CharImage
                                charType={player.charType} 
                                skinId={player.skinId}
                                size="100%" 
                                imgStyle={{ filter: playerGlowFilter, bottom: 0, position: 'absolute' }}
                            />
                        </div>
                    </div>

                    <div style={{
                        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                        marginTop: 2, fontSize: TOKEN_CONFIG.player.nameFontSize, fontWeight: 900, color: player.color,
                        textShadow: '1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000',
                        whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}>
                        {isPoisoned && <span style={{ fontSize: '14px', filter: 'drop-shadow(0 0 2px #9b59b6)', animation: 'pulse 1.5s infinite' }}>☠️</span>}
                        {player.name}
                    </div>
                </div>
            </div>
        </div>
    );
};