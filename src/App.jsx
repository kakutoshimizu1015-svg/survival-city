import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { useUserStore } from './store/useUserStore';
import { loginAnonymously } from './utils/authLogic';
import { savePlayerName } from './utils/userLogic';

import { GameMain } from './features/GameMain';
import { SetupOffline } from './features/SetupOffline';
import { OnlineLobby } from './features/OnlineLobby';
import { SettingsAndRules } from './components/overlays/SettingsAndRules';
import { TutorialOverlay } from './components/overlays/TutorialOverlay';
import { SandboxGuide } from './components/overlays/SandboxGuide';
import GachaScreen from './features/GachaScreen';

// ▼ 新規追加
import MiniGameMenu from './features/minigames/MiniGameMenu';
import MiniGameContainer from './features/minigames/MiniGameContainer';

function App() {
  const { gamePhase, layoutMode, weatherState, isNight, horrorMode, rulesActive, tutorialActive, settingsActive } = useGameStore();
  const { isLoggedIn, uid, playerName, wins, totalEarnedP, totalWins, gachaCans, gachaPoints } = useUserStore();
  const [localName, setLocalName] = useState(playerName);

  useEffect(() => {
    if (!isLoggedIn) {
      loginAnonymously();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (playerName) {
      setLocalName(playerName);
    }
  }, [playerName]);

  useEffect(() => {
    document.body.classList.remove('layout-pc', 'layout-mobile', 'sunny', 'rainy', 'cloudy', 'night', 'horror-mode');
    
    if (layoutMode === 'sp') document.body.classList.add('layout-mobile');
    if (layoutMode === 'pc') document.body.classList.add('layout-pc');
    
    if (weatherState) document.body.classList.add(weatherState);
    if (isNight) document.body.classList.add('night');
    if (horrorMode) document.body.classList.add('horror-mode');
  }, [layoutMode, weatherState, isNight, horrorMode]);

  const handleNameBlur = () => {
    if (localName && localName.trim() !== '' && localName !== playerName) {
      savePlayerName(localName);
    }
  };

  return (
    <>
      {/* ▼ 修正: gamePhase === 'minigame_menu' を条件から外し、ミニゲーム画面では非表示にする */}
      {(gamePhase === 'title' || gamePhase === 'mode_select') && isLoggedIn && !rulesActive && !tutorialActive && !settingsActive && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%',
          background: 'rgba(20,20,30,0.95)', padding: '12px 0', display: 'flex',
          justifyContent: 'center', alignItems: 'center', gap: '25px',
          zIndex: 99999, fontSize: '16px', fontWeight: 'bold', 
          borderBottom: '3px solid #f1c40f', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', flexWrap: 'wrap'
        }}>
          <div style={{ color: '#ecf0f1' }}>👤 {playerName || 'Player'}</div>
          <div style={{ color: '#f1c40f' }}>🏆 優勝: {totalWins || wins}回</div>
          <div style={{ color: '#2ecc71' }}>🥫 ガチャ資産(缶): {gachaCans || 0}</div>
          <div style={{ color: '#3498db' }}>💰 ガチャ資産(P): {gachaPoints || 0}</div>
        </div>
      )}

      {gamePhase !== 'title' && gamePhase !== 'gacha' && gamePhase !== 'minigame_menu' && gamePhase !== 'minigame_playing' && (
        <button id="settings-btn" onClick={() => useGameStore.setState({ settingsActive: true })}>⚙️</button>
      )}

      {gamePhase === 'title' && (
        <div id="title-screen-overlay" onClick={() => useGameStore.setState({ gamePhase: 'mode_select' })}>
          <div style={{ fontSize: '80px', marginBottom: '20px', marginTop: '60px' }}>🏠</div>
          <div className="title-logo">脱・ホームレス<br/>サバイバルシティ</div>
          <div className="blink-text">画面をタップしてスタート</div>
          
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
          
          <div className="panel" style={{ marginTop: '40px', marginBottom: '40px', padding: '20px', background: 'rgba(92, 74, 68, 0.95)', textAlign: 'center', borderRadius: '12px', border: '2px solid #8d6e63', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
            <div style={{ color: '#fdf5e6', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>👤 プレイヤー名を設定</div>
            <input 
              type="text" 
              value={localName} 
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="名前を入力..."
              style={{ padding: '12px', borderRadius: '8px', border: 'none', textAlign: 'center', width: '220px', fontSize: '20px', fontWeight: 'bold', color: '#333' }}
              maxLength={10}
            />
            <div style={{ fontSize: '12px', color: '#bdc3c7', marginTop: '8px' }}>※入力後、枠外をタップで自動保存</div>
          </div>

          <h2>モード選択</h2>
          <button className="btn-large btn-brown" onClick={() => useGameStore.setState({ gamePhase: 'setup_offline' })}>🎮 オフライン</button>
          <button className="btn-large btn-blue" onClick={() => useGameStore.setState({ gamePhase: 'online_lobby' })}>🌐 オンライン</button>
          {/* ▼ 追加: ミニゲームモード */}
          <button className="btn-large" style={{ background: '#27ae60', color: '#fff' }} onClick={() => useGameStore.setState({ gamePhase: 'minigame_menu' })}>🎲 ミニゲームで稼ぐ</button>
          <button className="btn-large" style={{ background: '#e67e22', color: '#fff' }} onClick={() => useGameStore.setState({ gamePhase: 'gacha' })}>🔥 ガチャ屋台へ行く</button>
        </div>
      )}

      {gamePhase === 'setup_offline' && <SetupOffline />}
      {gamePhase === 'online_lobby' && <OnlineLobby />}
      {gamePhase === 'playing' && <GameMain />}
      {gamePhase === 'gacha' && <GachaScreen />}
      
      {/* ▼ 追加: ミニゲームモードのルーティング */}
      {gamePhase === 'minigame_menu' && <MiniGameMenu />}
      {gamePhase === 'minigame_playing' && <MiniGameContainer />}

      <SettingsAndRules />
      <TutorialOverlay />
      <SandboxGuide />
    </>
  );
}

export default App;