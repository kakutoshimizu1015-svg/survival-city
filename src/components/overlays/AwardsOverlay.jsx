import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { playSfx } from '../../utils/audio';
import { ClayButton } from '../common/ClayButton';
import { CharImage } from '../common/CharImage';

export const AwardsOverlay = () => {
    const { awardsActive, awardsData, pendingGameResult, setGameState, players } = useGameStore();
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [showWinner, setShowWinner] = useState(false);

    useEffect(() => {
        if (awardsActive && awardsData) {
            setCurrentIndex(0);
            setShowWinner(false);
        }
    }, [awardsActive, awardsData]);

    useEffect(() => {
        if (currentIndex >= 0 && currentIndex < awardsData.length) {
            // ドラムロールの代わりの効果音
            playSfx('move'); 
            
            const timer = setTimeout(() => {
                setShowWinner(true);
                if (awardsData[currentIndex].value > 0) {
                    playSfx('success');
                } else {
                    playSfx('fail');
                }
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [currentIndex, awardsData]);

    if (!awardsActive || !awardsData || currentIndex < 0) return null;

    const handleNext = () => {
        if (currentIndex < awardsData.length - 1) {
            setShowWinner(false);
            setCurrentIndex(currentIndex + 1);
        } else {
            // 全ての表彰が終わったら、最終結果（リザルト画面）を表示
            playSfx('win'); // ここでついに優勝ファンファーレ
            setGameState({
                awardsActive: false,
                gameResult: pendingGameResult,
                pendingGameResult: null
            });
        }
    };

    const isFinished = currentIndex >= awardsData.length;
    if (isFinished) return null;

    const currentAward = awardsData[currentIndex];

    return (
        <div className="modal-overlay" style={{ zIndex: 30000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}>
            
            <style>{`
                @keyframes pulseText {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(1.1); opacity: 1; }
                }
                @keyframes bounceInAward {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.1); opacity: 1; }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>

            <h1 style={{ color: '#f1c40f', textShadow: '0 0 10px #e67e22', marginBottom: '20px', fontSize: '32px' }}>🏆 各部門 表彰式 🏆</h1>

            <div className="panel" style={{ background: '#fdf5e6', padding: '30px', borderRadius: '15px', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
                <h2 style={{ color: '#c0392b', margin: '0 0 10px 0' }}>{currentAward.name}</h2>
                <p style={{ color: '#555', fontSize: '14px', marginBottom: '20px', fontWeight: 'bold' }}>{currentAward.desc}</p>

                <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {!showWinner ? (
                        <div style={{ fontSize: '24px', animation: 'pulseText 0.3s infinite alternate', color: '#8e44ad', fontWeight: 'bold' }}>
                            🥁 該当者は...？
                        </div>
                    ) : (
                        <div style={{ animation: 'bounceInAward 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                            {currentAward.value > 0 ? (
                                <>
                                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
                                        {currentAward.winners.map(wId => {
                                            const p = players.find(x => x.id === wId);
                                            return (
                                                <div key={wId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <CharImage charType={p.charType} size={70} />
                                                    <span style={{ fontWeight: 'bold', color: p.color, marginTop: '5px', fontSize: '18px', textShadow: '1px 1px 0 #fff' }}>{p.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60', background: 'rgba(46, 204, 113, 0.1)', padding: '10px', borderRadius: '8px' }}>
                                        記録: <span style={{fontSize: '22px'}}>{currentAward.value}</span> <br/>
                                        <span style={{ color: '#e74c3c', fontSize: '20px', display: 'inline-block', marginTop: '5px' }}>✨ ボーナス +50P 獲得!! ✨</span>
                                    </div>
                                </>
                            ) : (
                                <div style={{ fontSize: '22px', color: '#7f8c8d', fontWeight: 'bold' }}>該当者なし...</div>
                            )}
                        </div>
                    )}
                </div>

                {showWinner && (
                    <ClayButton onClick={handleNext} style={{ marginTop: '20px', width: '100%', background: currentIndex < awardsData.length - 1 ? '#3498db' : '#e67e22', fontSize: '18px' }}>
                        {currentIndex < awardsData.length - 1 ? '次の発表へ ＞' : '総合成績を見る 🏆'}
                    </ClayButton>
                )}
            </div>
        </div>
    );
};