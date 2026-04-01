import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { GameMain } from './features/GameMain';
import { SetupOffline } from './features/SetupOffline';
import { OnlineLobby } from './features/OnlineLobby';
import { SettingsAndRules } from './components/overlays/SettingsAndRules';
import { TutorialOverlay } from './components/overlays/TutorialOverlay';
import { SandboxGuide } from './components/overlays/SandboxGuide';

function App() {
  const { gamePhase, layoutMode, weatherState, isNight, horrorMode } = useGameStore();

  useEffect(() => {
    // 既存の関連クラスを全てリセットして競合を防ぐ
    document.body.classList.remove('layout-pc', 'layout-mobile', 'sunny', 'rainy', 'cloudy', 'night', 'horror-mode');
    
    // レイアウトモードの適用
    if (layoutMode === 'sp') document.body.classList.add('layout-mobile');
    if (layoutMode === 'pc') document.body.classList.add('layout-pc');
    
    // 天候・昼夜・恐怖演出の適用
    if (weatherState) document.body.classList.add(weatherState);
    if (isNight) document.body.classList.add('night');
    if (horrorMode) document.body.classList.add('horror-mode');
  }, [layoutMode, weatherState, isNight, horrorMode]);

  return (
    <>
      {gamePhase !== 'title' && (
        <button id="settings-btn" onClick={() => useGameStore.setState({ settingsActive: true })}>⚙️</button>
      )}

      {gamePhase === 'title' && (
        <div id="title-screen-overlay" onClick={() => useGameStore.setState({ gamePhase: 'mode_select' })}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🏠</div>
          <div className="title-logo">脱・ホームレス<br/>サバイバルシティ</div>
          <div className="blink-text">画面をタップしてスタート</div>
          
          {/* ▼ 追加：遊び方・ルールボタン（タップしてもゲームが始まらないよう e.stopPropagation() を付与） */}
          <button 
            className="btn-large" 
            onClick={(e) => { 
              e.stopPropagation(); 
              useGameStore.setState({ rulesActive: true }); 
            }} 
            style={{ marginTop: '10px', background: '#3498db', color: '#fff' }}
          >
            📖 遊び方・ルールを見る
          </button>

          <button 
            className="btn-large" 
            onClick={(e) => { 
              e.stopPropagation(); 
              useGameStore.setState({ tutorialActive: true }); 
            }} 
            style={{ marginTop: '15px', background: '#8e44ad', color: '#f1c40f' }}
          >
            📚 チュートリアル
          </button>
        </div>
      )}

      {gamePhase === 'mode_select' && (
        <div id="mode-select-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2>モード選択</h2>
          <button className="btn-large btn-brown" onClick={() => useGameStore.setState({ gamePhase: 'setup_offline' })}>🎮 オフライン</button>
          <button className="btn-large btn-blue" onClick={() => useGameStore.setState({ gamePhase: 'online_lobby' })}>🌐 オンライン</button>
        </div>
      )}

      {gamePhase === 'setup_offline' && <SetupOffline />}
      {gamePhase === 'online_lobby' && <OnlineLobby />}
      {gamePhase === 'playing' && <GameMain />}

      {/* 共通のポップアップ画面群 */}
      <SettingsAndRules />
      <TutorialOverlay />
      <SandboxGuide />
    </>
  );
}

export default App;