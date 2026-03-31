import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ClayButton } from '../common/ClayButton';

export const TutorialOverlay = () => {
    const { tutorialActive, tutorialStep, setGameState } = useGameStore();

    if (!tutorialActive) return null;

    const steps = [
        { tab: '🎯 目的', text: 'このゲームは規定ラウンド終了時に最も高いスコアを持つプレイヤーの勝利です。お金（P）だけでなく陣地の価値も重要です。' },
        { tab: '🎲 ターン', text: 'サイコロの合計分「AP」を獲得します。移動（1AP）やカード使用（2AP）に消費します。' },
        { tab: '🏘️ 陣地', text: 'マスを占領すると毎ターン家賃収入が入ります。リヤカーを装備すると収入が2倍になります。' }
    ];

    return (
        <div id="tutorial-overlay" className="active" style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,25,0.97)', zIndex: 30000, display: 'flex', flexDirection: 'column', color: '#fff' }}>
            <div style={{ padding: '20px', background: '#1a1a3e', borderBottom: '3px solid #f1c40f', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>📚 チュートリアル</span>
                <button onClick={() => setGameState({ tutorialActive: false })} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <div style={{ background: 'rgba(40,40,65,0.95)', padding: '30px', borderRadius: '15px', border: '1px solid #f1c40f' }}>
                    <h3>{steps[tutorialStep].tab}</h3>
                    <p style={{ fontSize: '18px', lineHeight: '1.8' }}>{steps[tutorialStep].text}</p>
                </div>
            </div>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a2e' }}>
                <ClayButton disabled={tutorialStep === 0} onClick={() => setGameState({ tutorialStep: tutorialStep - 1 })}>◀ 前へ</ClayButton>
                <span>{tutorialStep + 1} / {steps.length}</span>
                {tutorialStep < steps.length - 1 ? (
                    <ClayButton onClick={() => setGameState({ tutorialStep: tutorialStep + 1 })}>次へ ▶</ClayButton>
                ) : (
                    <ClayButton onClick={() => setGameState({ tutorialActive: false })}>完了</ClayButton>
                )}
            </div>
        </div>
    );
};