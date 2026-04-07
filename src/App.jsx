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

      {/* ▼ 修正: 表示条件に setup_offline を追加し、サイズを少し小さく調整 */}
      {(gamePhase === 'title' || gamePhase === 'mode_select' || gamePhase === 'setup_offline') && !rulesActive && !tutorialActive && !settingsActive && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%',
          background: 'rgba(15, 15, 20, 0.98)', padding: '4px 0', display: 'flex',
          justifyContent: 'center', alignItems: 'center', gap: '12px',
          zIndex: 999999, fontSize: '11px', fontWeight: 'bold', 
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

      {/* (中略: title-screen-overlay の部分はそのまま) */}

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
                
                <button onClick={() => setShowFriendModal(true)} style={{
                    background: '#2980b9', color: '#FFF', border: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', position: 'relative'
                }}>
                    👥 フレンド
                </button>

                {/* ▼ 修正: メールモーダルを開く処理を確実に独立化 */}
                <button onClick={() => setShowMailboxModal(true)} style={{
                    background: '#e67e22', color: '#FFF', border: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', position: 'relative'
                }}>
                    📮 メール
                    {unreadMailsCount > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e74c3c', color: '#FFF', fontSize: '10px', padding: '2px 6px', borderRadius: '50%', border: '2px solid #fff', animation: 'canBounce 1s infinite' }}>{unreadMailsCount}</span>}
                </button>

                {/* モード選択画面の設定ボタン（実装済みですが念のため確認） */}
                <button onClick={() => useGameStore.setState({ settingsActive: true })} style={{
                    background: '#7f8c8d', color: '#FFF', border: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'
                }}>
                    ⚙️ 設定
                </button>
            </div>
          </div>

          <h2 style={{ margin: '10px 0' }}>モード選択</h2>
          <button className="btn-large btn-brown" onClick={() => setGameState({ gamePhase: 'setup_offline' })}>🎮 オフライン</button>
          <button className="btn-large btn-blue" onClick={() => setGameState({ gamePhase: 'online_lobby' })}>🌐 オンライン</button>
          
          {/* ▼ 修正: ミニゲーム遷移を確実に独立化 */}
          <button className="btn-large" style={{ background: '#27ae60', color: '#fff' }} onClick={() => setGameState({ gamePhase: 'minigames' })}>🎲 ミニゲームで稼ぐ</button>
          <button className="btn-large" style={{ background: '#c0392b', color: '#fff' }} onClick={() => setGameState({ gamePhase: 'gacha' })}>🔥 ガチャ屋台へ行く</button>
        </div>
      )}
      
      {/* 遷移先コンポーネント群 */}
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