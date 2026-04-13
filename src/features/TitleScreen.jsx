import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const TitleScreen = () => {
    const setGameState = useGameStore(state => state.setGameState);

    return (
        <div
            className="dt-screen dt-title-bg"
            onClick={() => setGameState({ gamePhase: 'mode_select' })}
            style={{ alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}
        >
            {/* 背景の放射光 */}
            <div className="dt-title-glow" />

            {/* 火のアイコン */}
            <div style={{
                fontSize: 60, marginBottom: 8,
                animation: 'dt-fire-flicker 2s ease-in-out infinite alternate',
            }}>
                🔥
            </div>

            {/* サブタイトル */}
            <div style={{
                fontSize: 13, letterSpacing: 6, color: 'var(--dt-gold)',
                fontWeight: 500, marginBottom: 6,
            }}>
                HOMELESS
            </div>

            {/* メインタイトル */}
            <div style={{
                fontSize: 28, fontWeight: 900, color: 'var(--dt-text)',
                textAlign: 'center', lineHeight: 1.3,
                textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}>
                脱・ホームレス<br />サバイバルシティ
            </div>

            {/* ゴールドの区切り線 */}
            <div style={{
                width: 120, height: 1, margin: '16px 0',
                background: 'linear-gradient(to right, transparent, var(--dt-gold), transparent)',
            }} />

            {/* 英字サブ */}
            <div style={{ fontSize: 11, color: 'var(--dt-text-dim)', letterSpacing: 2 }}>
                SURVIVAL CITY
            </div>

            {/* TAP TO START */}
            <div style={{ position: 'absolute', bottom: 120, width: 280 }}>
                <div className="dt-cta" onClick={(e) => { e.stopPropagation(); setGameState({ gamePhase: 'mode_select' }); }}>
                    TAP TO START
                </div>
            </div>

            {/* 下部リンク */}
            <div style={{ position: 'absolute', bottom: 50, display: 'flex', gap: 20 }}>
                <button
                    onClick={(e) => { e.stopPropagation(); setGameState({ rulesActive: true }); }}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: 'var(--dt-text-muted)',
                        borderBottom: '1px solid var(--dt-text-muted)',
                        paddingBottom: 2, fontFamily: 'inherit',
                    }}
                >
                    📖 ルール
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setGameState({ tutorialActive: true }); }}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: 'var(--dt-text-muted)',
                        borderBottom: '1px solid var(--dt-text-muted)',
                        paddingBottom: 2, fontFamily: 'inherit',
                    }}
                >
                    🎓 チュートリアル
                </button>
            </div>
        </div>
    );
};
