import React from 'react';
import { useGameStore, isSameTeam } from '../../store/useGameStore';
import { deckData } from '../../constants/cards';
import { ClayButton } from '../common/ClayButton';
import { playSfx } from '../../utils/audio';

export const TeamActionOverlay = () => {
    const { teamActionActive, players, turn, setGameState } = useGameStore();
    const cp = players[turn];

    if (!teamActionActive || !cp) return null;
    const teammates = players.filter(op => op.id !== cp.id && op.pos === cp.pos && op.hp > 0 && isSameTeam(cp, op));

    const giveCard = (tmId, cardIdx) => {
        const cId = cp.hand[cardIdx];
        useGameStore.getState().updateCurrentPlayer(p => { const h = [...p.hand]; h.splice(cardIdx, 1); return { hand: h }; });
        useGameStore.getState().updatePlayer(tmId, p => ({ hand: [...p.hand, cId] }));
        playSfx('card'); setGameState({ teamActionActive: false });
    };

    return (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1100 }}>
            <div className="modal-box" style={{ background: '#1a1a2e', color: '#fdf5e6', border: '3px solid #f1c40f' }}>
                <h2 style={{ color: '#f1c40f' }}>🤝 チーム連携</h2>
                <p style={{ fontSize: '13px', color: '#bdc3c7' }}>同マスの味方にカードを渡せます。</p>
                {teammates.map(tm => (
                    <div key={tm.id} style={{ background: 'rgba(255,255,255,0.06)', padding: '12px', borderRadius: '10px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{tm.name} (HP:{tm.hp})</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {cp.hand.map((cId, idx) => (
                                <button key={idx} disabled={tm.hand.length >= tm.maxHand} onClick={() => giveCard(tm.id, idx)} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', border: `2px solid ${deckData.find(d=>d.id===cId)?.color}` }}>
                                    {deckData.find(d=>d.id===cId)?.name} を渡す
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                <ClayButton onClick={() => setGameState({ teamActionActive: false })} style={{ width: '100%', background: '#7f8c8d', marginTop: '10px' }}>閉じる</ClayButton>
            </div>
        </div>
    );
};