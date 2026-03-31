import React from 'react';
import { useGameStore } from './store/useGameStore';
import { GameMain } from './features/GameMain';
import { SetupOffline } from './features/SetupOffline';
import { OnlineLobby } from './features/OnlineLobby'; // ▼ 追加

function App() {
  const gamePhase = useGameStore(state => state.gamePhase);
  const setGameState = useGameStore(state => state.setGameState);

  const goToModeSelect = () => setGameState({ gamePhase: 'mode_select' });
  const goToSetupOffline = () => setGameState({ gamePhase: 'setup_offline' });
  const goToOnlineLobby = () => setGameState({ gamePhase: 'online_lobby' }); // ▼ 追加

  return (
    <>
      {gamePhase === 'title' && (
        <div id="title-screen-overlay" onClick={goToModeSelect}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🏠</div>
          <div className="title-logo">脱・ホームレス<br/>サバイバルシティ</div>
          <div className="title-sub">〜React Edition〜</div>
          <div className="blink-text" style={{ paddingBottom: 0 }}>画面をタップしてスタート</div>
        </div>
      )}

      {gamePhase === 'mode_select' && (
        <div id="mode-select-overlay" style={{ display: 'flex' }}>
          <h2 style={{ fontSize: '32px', color: '#fdf5e6', textShadow: 'var(--clay-shadow-out)', marginBottom: '30px' }}>モード選択</h2>
          
          <button className="btn-large btn-brown" style={{ fontSize: '24px', padding: '20px 40px', width: '80%', maxWidth: '400px', marginBottom: '20px' }} onClick={goToSetupOffline}>
            🎮 オフラインで遊ぶ
          </button>
          
          {/* ▼ オンラインボタンを有効化 */}
          <button className="btn-large btn-blue" style={{ fontSize: '24px', padding: '20px 40px', width: '80%', maxWidth: '400px' }} onClick={goToOnlineLobby}>
            🌐 オンライン対戦
          </button>
        </div>
      )}

      {gamePhase === 'setup_offline' && <SetupOffline />}
      
      {/* ▼ オンラインロビー画面を追加 */}
      {gamePhase === 'online_lobby' && <OnlineLobby />}

      {gamePhase === 'playing' && (
        <>
          <h1 id="main-title">🏠 脱・ホームレス：サバイバルシティ</h1>
          <GameMain />
        </>
      )}
    </>
  );
}

export default App;