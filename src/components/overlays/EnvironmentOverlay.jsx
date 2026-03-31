import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export const EnvironmentOverlay = () => {
    const { isRainy, isNight, gameOver, players } = useGameStore();

    if (gameOver) {
        const sortedPlayers = [...players].sort((a, b) => b.p - a.p);
        return (
            <div className="modal-overlay" style={{ display: 'flex', zIndex: 5000, background: 'rgba(0,0,0,0.85)' }}>
                <div className="modal-box" style={{ width: '400px', textAlign: 'center' }}>
                    <h1 style={{ color: '#f1c40f' }}>🏆 最終結果</h1>
                    {sortedPlayers.map((p, i) => (
                        <div key={p.id} style={{ fontSize: '20px', margin: '10px 0', borderBottom: '1px solid #555' }}>
                            {i+1}位: {p.name} - {p.p}P (🥫{p.cans})
                        </div>
                    ))}
                    <button className="btn-large btn-brown" style={{ marginTop: '20px' }} onClick={() => window.location.reload()}>
                        タイトルへ戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* 夜の演出 */}
            {isNight && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    pointerEvents: 'none', zIndex: 1300,
                    background: 'radial-gradient(circle, transparent 30%, rgba(0,0,20,0.4) 70%)',
                    mixBlendMode: 'multiply'
                }} />
            )}
            {/* 雨の演出 */}
            {isRainy && (
                <div className="rain-container" style={{ position: 'fixed', zIndex: 1301, pointerEvents: 'none', width: '100%', height: '100%' }}>
                    {/* CSSアニメーションで雨を降らせる（index.cssに元々あるはずです） */}
                    <div className="rain"></div>
                </div>
            )}
        </>
    );
};