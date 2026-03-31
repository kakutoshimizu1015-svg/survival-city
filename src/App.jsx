import React from 'react';
import { useGameStore } from './store/useGameStore';
import { GameMain } from './features/GameMain';
import { SetupOffline } from './features/SetupOffline';
import { OnlineLobby } from './features/OnlineLobby';
import { SettingsAndRules } from './components/overlays/SettingsAndRules';
import { TutorialOverlay } from './components/overlays/TutorialOverlay';

function App() {
  const { gamePhase, layoutMode, setGameState } = useGameStore();

  // レイアウトクラスの決定
  const layoutClass = layoutMode === 'sp' ? 'layout-mobile' : layoutMode === 'pc' ? 'layout-pc' : '';

  return (
    <div className={layoutClass}>
      {/* 設定・チュートリアルボタン（タイトル以外で表示） */}
      {gamePhase !== 'title' && (
        <button id="settings-btn" onClick={() => setGameState({ settingsActive: true })}>⚙️</button>
      )}

      {gamePhase === 'title' && (
        <div id="title-screen-overlay" onClick={() => setGameState({ gamePhase: 'mode_select' })}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🏠</div>
          <div className="title-logo">脱・ホームレス<br/>サバイバルシティ</div>
          <div className="blink-text">画面をタップしてスタート</div>
          <button className="btn-large" onClick={(e) => { e.stopPropagation(); setGameState({ tutorialActive: true }); }} style={{ marginTop: '20px', background: '#8e44ad', color: '#f1c40f' }}>📚 チュートリアル</button>
        </div>
      )}

      {gamePhase === 'mode_select' && (
        <div id="mode-select-overlay" style={{ display: 'flex' }}>
          <h2>モード選択</h2>
          <button className="btn-large btn-brown" onClick={() => setGameState({ gamePhase: 'setup_offline' })}>🎮 オフライン</button>
          <button className="btn-large btn-blue" onClick={() => setGameState({ gamePhase: 'online_lobby' })}>🌐 オンライン</button>
        </div>
      )}

      {gamePhase === 'setup_offline' && <SetupOffline />}
      {gamePhase === 'online_lobby' && <OnlineLobby />}
      {gamePhase === 'playing' && <GameMain />}

      {/* 共通オーバーレイ */}
      <SettingsAndRules />
      <TutorialOverlay />
    </div>
  );
}

export default App;