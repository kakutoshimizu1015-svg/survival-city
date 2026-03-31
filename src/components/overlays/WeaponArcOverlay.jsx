import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { dealDamage } from '../../game/combat';
import { logMsg } from '../../game/actions';

export const WeaponArcOverlay = () => {
    const weaponArcData = useGameStore(state => state.weaponArcData);
    const mapData = useGameStore(state => state.mapData);
    const [angleDeg, setAngleDeg] = useState(90);
    const [attackerPos, setAttackerPos] = useState({ x: 0, y: 0 });
    const [radius, setRadius] = useState(0);

    // ▼ 追加：ドラッグ操作用の参照（Ref）
    const panelRef = useRef(null);

    // 画面上のマス（タイル）の位置を計算して、弧の中心を合わせる処理
    useEffect(() => {
        if (!weaponArcData) return;
        
        const updatePos = () => {
            const tileEl = document.getElementById(`tile-${weaponArcData.attacker.pos}`);
            if (tileEl) {
                const rect = tileEl.getBoundingClientRect();
                setAttackerPos({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                });
                setRadius(rect.width * (weaponArcData.cardData.range + 0.8));
            }
        };
        
        updatePos();
        const wrapper = document.getElementById('game-board-wrapper');
        if (wrapper) wrapper.addEventListener('scroll', updatePos);
        window.addEventListener('resize', updatePos);
        
        return () => {
            if (wrapper) wrapper.removeEventListener('scroll', updatePos);
            window.removeEventListener('resize', updatePos);
        };
    }, [weaponArcData, angleDeg]);

    // ▼ 追加：パネルをドラッグして移動させる処理
    useEffect(() => {
        const el = panelRef.current;
        if (!el || !weaponArcData) return;

        let ox = 0, oy = 0, startX = 0, startY = 0;
        
        const onDown = (e) => {
            // スライダーやボタンを触ったときはドラッグしない
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
            
            startX = (e.touches ? e.touches[0].clientX : e.clientX);
            startY = (e.touches ? e.touches[0].clientY : e.clientY);
            ox = el.offsetLeft; 
            oy = el.offsetTop;
            
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
        };

        const onMove = (e) => {
            const cx = (e.touches ? e.touches[0].clientX : e.clientX);
            const cy = (e.touches ? e.touches[0].clientY : e.clientY);
            const nx = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  ox + cx - startX));
            const ny = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, oy + cy - startY));
            
            // パネルの位置を更新
            el.style.left = nx + 'px'; 
            el.style.top = ny + 'px';
            el.style.bottom = 'auto'; 
            el.style.transform = 'none';
            if (e.cancelable) e.preventDefault();
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
        };

        el.addEventListener('mousedown', onDown);
        el.addEventListener('touchstart', onDown, { passive: false });

        return () => {
            el.removeEventListener('mousedown', onDown);
            el.removeEventListener('touchstart', onDown);
            onUp();
        };
    }, [weaponArcData]);

    if (!weaponArcData) return null;

    const { cardData, targets, attacker } = weaponArcData;
    const attackerTile = mapData.find(t => t.id === attacker.pos);
    if (!attackerTile) return null;

    const spreadDeg = 75; 
    
    // 当たり判定の計算
    const hitTargets = targets.filter(target => {
        const targetTile = mapData.find(t => t.id === target.pos);
        if (!targetTile) return false;
        
        const dx = targetTile.col - attackerTile.col;
        const dy = targetTile.row - attackerTile.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > cardData.range + 0.5) return false; 
        
        let targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        let diff = Math.abs(targetAngle - angleDeg);
        if (diff > 180) diff = 360 - diff;
        
        return diff <= spreadDeg || dist === 0;
    });

    const fireWeapon = () => {
        useGameStore.setState({ weaponArcData: null });
        if (hitTargets.length === 0) {
            logMsg(`⚔️ ${cardData.name}発射！しかし射程内に敵がいなかった...`);
            return;
        }
        if (cardData.aoe) {
            hitTargets.forEach(t => dealDamage(t.id, cardData.dmg, cardData.name, attacker.id));
            logMsg(`💥 広範囲攻撃！ ${hitTargets.length}人に命中！`);
        } else {
            dealDamage(hitTargets[0].id, cardData.dmg, cardData.name, attacker.id);
        }
    };

    const startRad = (angleDeg - spreadDeg) * Math.PI / 180;
    const endRad = (angleDeg + spreadDeg) * Math.PI / 180;
    const x1 = attackerPos.x + radius * Math.cos(startRad);
    const y1 = attackerPos.y + radius * Math.sin(startRad);
    const x2 = attackerPos.x + radius * Math.cos(endRad);
    const y2 = attackerPos.y + radius * Math.sin(endRad);
    const pathData = `M ${attackerPos.x} ${attackerPos.y} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

    return (
        <>
            {/* 扇形を描画するレイヤー */}
            <svg width="100vw" height="100vh" style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 1400 }}>
                {radius > 0 && (
                    <>
                        <path d={pathData} fill="url(#arcGradient)" stroke="rgba(255,80,50,0.95)" strokeWidth="2.5" />
                        <line 
                            x1={attackerPos.x} y1={attackerPos.y} 
                            x2={attackerPos.x + radius * Math.cos(angleDeg * Math.PI / 180)} 
                            y2={attackerPos.y + radius * Math.sin(angleDeg * Math.PI / 180)} 
                            stroke="rgba(255,255,80,0.85)" strokeWidth="2" strokeDasharray="8,5" 
                        />
                        <circle cx={attackerPos.x} cy={attackerPos.y} r="9" fill="#e74c3c" />

                        {hitTargets.map(target => {
                            const tEl = document.getElementById(`tile-${target.pos}`);
                            if (!tEl) return null;
                            const tRect = tEl.getBoundingClientRect();
                            const tx = tRect.left + tRect.width / 2;
                            const ty = tRect.top + tRect.height / 2;
                            return (
                                <g key={target.id}>
                                    <circle cx={tx} cy={ty} r="22" fill="rgba(231,76,60,0.55)" stroke="#ff3300" strokeWidth="3" />
                                    <text x={tx} y={ty - 28} fill="#ff3300" fontSize="12" fontWeight="bold" textAnchor="middle">{target.name}</text>
                                </g>
                            );
                        })}
                        <defs>
                            <radialGradient id="arcGradient" gradientUnits="userSpaceOnUse" cx={attackerPos.x} cy={attackerPos.y} r={radius}>
                                <stop offset="0%" stopColor="rgba(231,76,60,0.7)" />
                                <stop offset="65%" stopColor="rgba(231,76,60,0.38)" />
                                <stop offset="100%" stopColor="rgba(231,76,60,0.04)" />
                            </radialGradient>
                        </defs>
                    </>
                )}
            </svg>

            {/* ▼ 変更：ref={panelRef} と cursor: 'move' を追加 */}
            <div ref={panelRef} style={{
                position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(20,20,30,0.95)', border: '3px solid #e74c3c', borderRadius: '16px',
                padding: '14px 24px', zIndex: 1500, color: '#fdf5e6', textAlign: 'center', width: '300px',
                boxShadow: '0 0 30px rgba(231,76,60,0.5)', cursor: 'move' 
            }}>
                <div style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px', pointerEvents: 'none' }}>
                    ⚔️ {cardData.name} (射程{cardData.range})
                </div>
                
                <input 
                    type="range" min="-180" max="180" value={angleDeg} 
                    onChange={e => setAngleDeg(Number(e.target.value))} 
                    style={{ width: '100%', accentColor: '#e74c3c', marginBottom: '10px' }}
                />
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '15px', pointerEvents: 'none' }}>スライダーで撃つ方向を調整（枠をドラッグで移動）</div>

                <div style={{ fontSize: '13px', color: '#f1c40f', marginBottom: '15px', minHeight: '20px', pointerEvents: 'none' }}>
                    {hitTargets.length > 0 ? `🎯 射程内: ${hitTargets.map(t => t.name).join(', ')}` : '射程内に対象なし'}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-large" style={{ background: '#e74c3c', flex: 1, border: 'none', color: 'white', cursor: 'pointer' }} onClick={fireWeapon}>💥 攻撃！</button>
                    <button className="btn-large" style={{ background: '#7f8c8d', flex: 1, border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => useGameStore.setState({ weaponArcData: null })}>✕ キャンセル</button>
                </div>
            </div>
        </>
    );
};