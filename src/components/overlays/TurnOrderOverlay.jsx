import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { CharImage } from '../common/CharImage';
import { DiceOverlayInner } from './DiceOverlay'; // 新しいリッチサイコロを読み込む

export const TurnOrderOverlay = () => {
    const { turnOrderActive, turnOrderData, setGameState } = useGameStore();
    const [animState, setAnimState] = useState({ step: -1, currentRolls: [], showResult: false });
    const [activeDiceAnim, setActiveDiceAnim] = useState(null); // リッチサイコロ用のステート

    useEffect(() => {
        if (!turnOrderActive || !turnOrderData) return;

        let isMounted = true;
        const runAnim = async () => {
            const { players, diceValues } = turnOrderData;
            const rolls = players.map(p => ({ d1: '?', d2: '?', total: '—', rolling: false, done: false }));
            setAnimState({ step: -1, currentRolls: rolls, showResult: false });

            await new Promise(r => setTimeout(r, 800));

            for (let i = 0; i < players.length; i++) {
                if (!isMounted) return;
                
                // サイコロの出目を取得
                const d1 = diceValues[i].d1;
                const d2 = diceValues[i].d2;
                
                // リッチサイコロを画面に表示する
                setActiveDiceAnim({
                    active: true,
                    d1, d2, d3: 0,
                    isDouble: d1 === d2,
                    text: ''
                });

                rolls[i].rolling = true;
                setAnimState({ step: i, currentRolls: [...rolls], showResult: false });

                // 完全に演出が終わり、結果テキストが表示されるまで待つ (4.6秒)
                await new Promise(r => setTimeout(r, 4600));
                
                if (!isMounted) return;

                // 演出が終わったらリッチサイコロを非表示にして結果をリストに反映
                setActiveDiceAnim(null);
                rolls[i].rolling = false;
                rolls[i].done = true;
                rolls[i].d1 = d1;
                rolls[i].d2 = d2;
                rolls[i].total = d1 + d2;
                
                setAnimState({ step: i, currentRolls: [...rolls], showResult: false });
                await new Promise(r => setTimeout(r, 600)); // 次の人へ行く前のちょっとした間
            }

            if (!isMounted) return;
            setAnimState({ step: players.length, currentRolls: [...rolls], showResult: true });
        };

        runAnim();
        return () => { isMounted = false; };
    }, [turnOrderActive, turnOrderData]);

    if (!turnOrderActive || !turnOrderData) return null;

    const handleClose = () => {
        if (!animState.showResult) return;
        const { players, sortedOrder } = turnOrderData;
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#9b59b6', '#1abc9c', '#e91e8c'];
        
        const newPlayers = sortedOrder.map((origIdx, newIdx) => {
            const p = players[origIdx];
            return { ...p, id: newIdx, color: colors[newIdx % 8] };
        });

        setGameState({ players: newPlayers, turn: 0, turnOrderActive: false, turnOrderData: null });
    };

    const { players, sortedOrder } = turnOrderData;
    const displayOrder = animState.showResult ? sortedOrder : players.map((_, i) => i);
    const rankIcons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

    return (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 10000, background: 'rgba(0,0,0,0.85)' }} onClick={handleClose}>
            {/* ▼ リッチサイコロがアクティブな時だけオーバーレイの最前面に描画する */}
            {activeDiceAnim && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10001, pointerEvents: 'none' }}>
                    <DiceOverlayInner diceAnim={activeDiceAnim} />
                </div>
            )}

            <div className="modal-box" style={{ background: 'rgba(62,47,42,0.97)', border: '6px solid #f1c40f', maxWidth: '500px', padding: '25px 30px' }} onClick={e => e.stopPropagation()}>
                <h2 style={{ color: '#f1c40f', borderBottom: '2px dashed #f1c40f', paddingBottom: '10px', marginTop: 0 }}>🎲 順番決めダイス！</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {displayOrder.map((idx, rank) => {
                        const p = players[idx];
                        const roll = animState.currentRolls[idx] || {};
                        const isWinner = animState.showResult && rank === 0;
                        
                        return (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
                                background: isWinner ? '#5c4a44' : '#4a3b32', 
                                border: `2px solid ${isWinner ? '#f1c40f' : (roll.done ? '#2ecc71' : roll.rolling ? '#f1c40f' : '#8d6e63')}`,
                                borderRadius: '10px', transition: 'all 0.4s',
                                boxShadow: isWinner ? '0 0 15px rgba(241,196,15,0.8)' : 'none'
                            }}>
                                <div style={{ fontSize: '20px', minWidth: '28px', textAlign: 'center' }}>{animState.showResult ? rankIcons[rank] : '—'}</div>
                                
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', border: `3px solid ${p.color}`, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#8d7b68', flexShrink: 0, overflow: 'hidden' }}>
                                    <CharImage charType={p.charType} size={36} />
                                </div>

                                <div style={{ flex: 1, fontWeight: 'bold', color: p.color, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.name} {p.isCPU && <span style={{color:'#bdc3c7', fontSize:'11px'}}>(CPU)</span>}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    <div style={{ width: '36px', height: '36px', background: '#fdf5e6', color: '#c0392b', fontSize: '18px', fontWeight: 'bold', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'inset 0 0 6px rgba(0,0,0,0.2)' }}>{roll.d1}</div>
                                    <div style={{ width: '36px', height: '36px', background: '#fdf5e6', color: '#c0392b', fontSize: '18px', fontWeight: 'bold', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'inset 0 0 6px rgba(0,0,0,0.2)' }}>{roll.d2}</div>
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1c40f', minWidth: '36px', textAlign: 'center', textShadow: '0 0 8px rgba(241,196,15,0.5)' }}>{roll.total}</div>
                            </div>
                        );
                    })}
                </div>

                {animState.showResult ? (
                    <button className="btn-large btn-blue" style={{ width: '100%', marginTop: '20px' }} onClick={handleClose}>タップしてゲーム開始！</button>
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '15px', color: '#bdc3c7', fontWeight: 'bold' }}>
                        {animState.step === -1 ? 'まもなくダイスロールが始まります...' : '順番を決定中...'}
                    </div>
                )}
            </div>
        </div>
    );
};