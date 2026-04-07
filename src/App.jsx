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
import MinigamesApp from './features/minigames/MinigamesApp';

import { GlobalInviteModal } from './components/common/GlobalInviteModal';
import { FriendListModal } from './components/common/FriendListModal';
import { UserProfileModal } from './components/common/UserProfileModal';
import { MailboxOverlay } from './components/common/MailboxOverlay';

function App() {
  const { gamePhase, layoutMode, weatherState, isNight, horrorMode, rulesActive, tutorialActive, settingsActive } = useGameStore();
  const { isLoggedIn, uid, playerName, wins, totalEarnedP, totalWins, gachaCans, gachaPoints, friendRequests, inbox, claimedMails } = useUserStore();
  
  const [localName, setLocalName] = useState(playerName);
  
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showMailboxModal, setShowMailboxModal] = useState(false);
  const [selectedProfileUid, setSelectedProfileUid] = useState(null);

  const unreadMailsCount = (inbox || []).filter(mail => !(claimedMails || []).includes(mail.id)).length;

  useEffect(() => {
    if (!isLoggedIn) loginAnonymously();
  }, [isLoggedIn]);

  useEffect(() => {
    if (playerName) setLocalName(playerName);
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
      <GlobalInviteModal />

      {showFriendModal && (
        <FriendListModal onClose={() => setShowFriendModal(false)} onSelectFriend={(targetUid) => setSelectedProfileUid(targetUid)} />
      )}
      {selectedProfileUid && (
        <UserProfileModal uid={selectedProfileUid} onClose={() => setSelectedProfileUid(null)} />
      )}
      {showMailboxModal && (
        <MailboxOverlay onClose={() => setShowMailboxModal(false)} />
      )}

      {/* ▼ 修正: トップバーを少し小さくし、確実に出るようにz-indexを999999に設定 */}
      {(gamePhase === 'title' || gamePhase === 'mode_select') && isLoggedIn && !rulesActive && !tutorialActive && !settingsActive && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%',
          background: 'rgba(15, 15, 20, 0.98)', padding: '6px 0', display: 'flex',
          justifyContent: 'center', alignItems: 'center', gap: '15px',
          zIndex: 999999, fontSize: '13px', fontWeight: 'bold', 
          borderBottom: '2px solid #f1c40f', boxShadow: '0 2px 8px rgba(0,0,0,0.8)', flexWrap: 'wrap'
        }}>
          <div style={{ color: '#ecf0f1' }}>👤 {playerName || 'Player'}</div>
          <div style={{ color: '#f1c40f' }}>🏆 優勝: {totalWins || wins}回</div>
          <div style={{ color: '#2ecc71' }}>🥫 缶: {gachaCans || 0}</div>
          <div style={{ color: '#3498db' }}>💰 P: {gachaPoints || 0}</div>
        </div>
      )}

      {gamePhase !== 'title' && gamePhase !== 'gacha' && gamePhase !== 'minigames' && gamePhase !== 'mode_select' && (
        <button id="settings-btn" onClick={() => useGameStore.setState({ settingsActive: true })}>⚙️</button>
      )}

      {gamePhase === 'title' && (
        <div id="title-screen-overlay" onClick={() => useGameStore.setState({ gamePhase: 'mode_select' })}>
          <div style={{ fontSize: '80px', marginBottom: '20px', marginTop: '60px' }}>🏠</div>
          <div className="title-logo">脱・ホームレス<br/>サバイバルシティ</div>
          <div className="blink-text">画面をタップしてスタート</div>
          
          <button 
            className="btn-large" 
            onClick={(e) => { e.stopPropagation(); useGameStore.setState({ rulesActive: true }); }} 
            style={{ marginTop: '10px', background: '#3498db', color: '#fff' }}
          >
            📖 遊び方・ルールを見る
          </button>
          <button 
            className="btn-large" 
            onClick={(e) => { e.stopPropagation(); useGameStore.setState({ tutorialActive: true }); }} 
            style={{ marginTop: '15px', background: '#8e44ad', color: '#f1c40f' }}
          >
            📚 チュートリアル
          </button>
        </div>
      )}

      {gamePhase === 'mode_select' && (
        <div id="mode-select-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div className="panel" style={{ marginTop: '30px', marginBottom: '20px', padding: '15px 20px', background: 'rgba(92, 74, 68, 0.95)', textAlign: 'center', borderRadius: '12px', border: '2px solid #8d6e63', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
            <div style={{ color: '#fdf5e6', marginBottom: '10px', fontSize: '15px', fontWeight: 'bold' }}>👤 プレイヤー設定 & ソーシャル</div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <input 
                  type="text" value={localName} onChange={(e) => setLocalName(e.target.value)} onBlur={handleNameBlur}
                  placeholder="名前を入力..."
                  style={{ padding: '10px', borderRadius: '8px', border: 'none', textAlign: 'center', width: '160px', fontSize: '16px', fontWeight: 'bold', color: '#333' }}
                  maxLength={10}
                />
                
                {/* 独立したフレンドボタン */}
                <button onClick={() => setShowFriendModal(true)} style={{
                    background: '#2980b9', color: '#FFF', border: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', position: 'relative'
                }}>
                    👥 フレンド
                    {friendRequests?.length > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e74c3c', color: '#FFF', fontSize: '10px', padding: '2px 6px', borderRadius: '50%', border: '2px solid #fff' }}>{friendRequests.length}</span>}
                </button>

                {/* 独立したメールボタン */}
                <button onClick={() => setShowMailboxModal(true)} style={{
                    background: '#e67e22', color: '#FFF', border: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', position: 'relative'
                }}>
                    📮 メール
                    {unreadMailsCount > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e74c3c', color: '#FFF', fontSize: '10px', padding: '2px 6px', borderRadius: '50%', border: '2px solid #fff', animation: 'canBounce 1s infinite' }}>{unreadMailsCount}</span>}
                </button>

                {/* モード選択画面用の設定ボタン */}
                <button onClick={() => useGameStore.setState({ settingsActive: true })} style={{
                    background: '#7f8c8d', color: '#FFF', border: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'
                }}>
                    ⚙️ 設定
                </button>
            </div>
            <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '8px' }}>※名前は入力後、枠外をタップで自動保存</div>
          </div>

          <h2 style={{ margin: '10px 0' }}>モード選択</h2>
          
          {/* 独立した各モードへの遷移ボタン */}
          <button className="btn-large btn-brown" onClick={() => useGameStore.setState({ gamePhase: 'setup_offline' })}>🎮 オフライン</button>
          <button className="btn-large btn-blue" onClick={() => useGameStore.setState({ gamePhase: 'online_lobby' })}>🌐 オンライン</button>
          <button className="btn-large" style={{ background: '#27ae60', color: '#fff' }} onClick={() => useGameStore.setState({ gamePhase: 'minigames' })}>🎲 ミニゲームで稼ぐ</button>
          <button className="btn-large" style={{ background: '#c0392b', color: '#fff' }} onClick={() => useGameStore.setState({ gamePhase: 'gacha' })}>🔥 ガチャ屋台へ行く</button>
        </div>
      )}

      {gamePhase === 'setup_offline' && <SetupOffline />}
      {gamePhase === 'online_lobby' && <OnlineLobby />}
      {gamePhase === 'playing' && <GameMain />}
      {gamePhase === 'gacha' && <GachaScreen />}
      {gamePhase === 'minigames' && <MinigamesApp />}

      <SettingsAndRules />
      <TutorialOverlay />
      <SandboxGuide />
    </>
  );
}

export default App;