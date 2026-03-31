import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ClayButton } from '../common/ClayButton';

export const SettingsAndRules = () => {
    const { settingsActive, rulesActive, layoutMode, volume, setGameState } = useGameStore();

    if (!settingsActive && !rulesActive) return null;

    if (rulesActive) {
        return (
            <div className="modal-overlay" style={{ display: 'flex', zIndex: 1100 }}>
                <div className="modal-box" style={{ maxWidth: '600px', background: '#fdf5e6', color: '#3e2723', textAlign: 'left' }}>
                    <h2 style={{ textAlign: 'center', color: '#c0392b' }}>📖 遊び方・ルール</h2>
                    <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px', border: '1px solid #ccc' }}>
                        <h3>🏆 ゲームの目的</h3>
                        <p>規定ラウンド終了時に最も高いスコアを獲得したプレイヤーが優勝です。</p>
                        <h3>🎮 ターンの流れ</h3>
                        <ul>
                            <li>① サイコロを振りAPを獲得。ゾロ目は2倍！</li>
                            <li>② APを消費して移動、缶拾い、占領などのアクション。</li>
                            <li>③ カード（2AP消費）を使用して有利に進める。</li>
                        </ul>
                        <h3>⚠️ NPC</h3>
                        <p>警察はAP減少、ヤクザはダメージとカード強奪が発生します。</p>
                    </div>
                    <ClayButton onClick={() => setGameState({ rulesActive: false })} style={{ width: '100%', marginTop: '10px' }}>閉じる</ClayButton>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1100 }}>
            <div className="modal-box" style={{ background: '#fdf5e6', color: '#3e2723' }}>
                <h2>⚙️ メニュー</h2>
                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                    <label>🔊 音量: {Math.round(volume * 100)}%</label>
                    <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setGameState({ volume: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontWeight: 'bold' }}>📱 レイアウト切替</p>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {['auto', 'pc', 'sp'].map(m => (
                            <ClayButton key={m} onClick={() => setGameState({ layoutMode: m })} style={{ flex: 1, opacity: layoutMode === m ? 1 : 0.5 }}>
                                {m.toUpperCase()}
                            </ClayButton>
                        ))}
                    </div>
                </div>
                <ClayButton onClick={() => setGameState({ rulesActive: true, settingsActive: false })} style={{ width: '100%', marginBottom: '10px' }}>📖 ルールを見る</ClayButton>
                <ClayButton onClick={() => setGameState({ settingsActive: false })} style={{ width: '100%', background: '#7f8c8d' }}>閉じる</ClayButton>
            </div>
        </div>
    );
};