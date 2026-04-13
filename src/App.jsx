import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { useUserStore } from './store/useUserStore';
import { initAuth } from './utils/authLogic';
import { savePlayerName } from './utils/userLogic';

// ── Features ──
import { TitleScreen } from './features/TitleScreen';
import { ModeSelectScreen } from './features/ModeSelectScreen';
import { SetupOffline } from './features/SetupOffline';
import { OnlineLobby } from './features/OnlineLobby';
import { GameMain } from './features/GameMain';
import GachaScreen from './features/GachaScreen';
import MinigamesApp from './features/minigames/MinigamesApp';

// ── Overlays ──
import { SettingsAndRules } from './components/overlays/SettingsAndRules';
import { TutorialOverlay } from './components/overlays/TutorialOverlay';
import { SandboxGuide } from './components/overlays/SandboxGuide';

// ── Modals ──
import LoginBonusModal from './components/common/LoginBonusModal';
import { GlobalInviteModal } from './components/common/GlobalInviteModal';
import { FriendListModal } from './components/common/FriendListModal';
import { UserProfileModal } from './components/common/UserProfileModal';
import { MailboxOverlay } from './components/common/MailboxOverlay';
import { SkinTradeModal } from './components/common/SkinTradeModal';
import { TradeNotificationOverlay } from './components/overlays/TradeNotificationOverlay';
import { MissionContainer } from './components/common/mission/MissionContainer';

// ── Styles ──
import './styles/darkTheme.css';


function App() {
    /* ── Store ── */
    const {
        gamePhase, layoutMode, weatherState, isNight, horrorMode,
        rulesActive, tutorialActive, settingsActive, setGameState,
    } = useGameStore();

    const {
        isAuthResolved, playerName, wins, totalWins,
        gachaCans, gachaPoints, friendRequests, inbox, claimedMails, lastClaimedDate,
    } = useUserStore();

    /* ── Local state ── */
    const [showFriendModal, setShowFriendModal] = useState(false);
    const [showMailboxModal, setShowMailboxModal] = useState(false);
    const [selectedProfileUid, setSelectedProfileUid] = useState(null);
    const [showManualLoginBonus, setShowManualLoginBonus] = useState(false);
    const [showMissionModal, setShowMissionModal] = useState(false);
    const [tradeTarget, setTradeTarget] = useState(null);

    /* ── Derived ── */
    const safeInbox = Array.isArray(inbox) ? inbox : (inbox ? Object.values(inbox) : []);
    const safeClaimedMails = Array.isArray(claimedMails) ? claimedMails : (claimedMails ? Object.values(claimedMails) : []);
    const safeFriendReqs = Array.isArray(friendRequests) ? friendRequests : (friendRequests ? Object.values(friendRequests) : []);
    const unreadMailsCount = safeInbox.filter(mail => mail && !safeClaimedMails.includes(mail.id)).length;

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hasClaimedToday = lastClaimedDate === todayStr;

    const isMenuPhase = gamePhase === 'title' || gamePhase === 'mode_select' || gamePhase === 'setup_offline';

    /* ── Effects ── */
    useEffect(() => {
        initAuth().then((resolvedUid) => {
            if (resolvedUid) console.log('Auth Initialized!');
        });
    }, []);

    useEffect(() => {
        document.body.classList.remove('layout-pc', 'layout-mobile', 'sunny', 'rainy', 'cloudy', 'night', 'horror-mode');
        if (layoutMode === 'sp') document.body.classList.add('layout-mobile');
        if (layoutMode === 'pc') document.body.classList.add('layout-pc');
        if (weatherState) document.body.classList.add(weatherState);
        if (isNight) document.body.classList.add('night');
        if (horrorMode) document.body.classList.add('horror-mode');
    }, [layoutMode, weatherState, isNight, horrorMode]);

    /* body背景をダークテーマに統一（水色を上書き） */
    useEffect(() => {
        const darkPhases = ['title', 'mode_select', 'setup_offline', 'online_lobby', 'playing', 'gacha', 'minigames'];
        if (darkPhases.includes(gamePhase)) {
            document.body.style.backgroundColor = '#120e08';
            document.body.style.backgroundImage = 'none';
        }
        return () => {
            document.body.style.backgroundColor = '';
            document.body.style.backgroundImage = '';
        };
    }, [gamePhase]);

    /* ── Loading screen ── */
    if (!isAuthResolved) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                alignItems: 'center', height: '100vh', background: '#120e08', color: '#c8a24e', fontWeight: 'bold',
            }}>
                <div style={{ fontSize: 40, marginBottom: 20, animation: 'spin 1s linear infinite' }}>🔄</div>
                <div>サーバーと同期中...</div>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            {/* ── Global overlays (常時レンダリング) ── */}
            <GlobalInviteModal />
            <TradeNotificationOverlay />

            {tradeTarget && (
                <SkinTradeModal
                    targetUid={tradeTarget.uid}
                    targetName={tradeTarget.name}
                    onClose={() => setTradeTarget(null)}
                />
            )}

            {/* ── Login Bonus ── */}
            {gamePhase === 'mode_select' && (!hasClaimedToday || showManualLoginBonus) && (
                <LoginBonusModal
                    manualOpen={showManualLoginBonus}
                    onCloseManual={() => setShowManualLoginBonus(false)}
                    hasClaimedToday={hasClaimedToday}
                    todayStr={todayStr}
                />
            )}

            {/* ── Friend Modal ── */}
            {showFriendModal && (
                <FriendListModal
                    onClose={() => setShowFriendModal(false)}
                    onSelectFriend={(targetUid) => setSelectedProfileUid(targetUid)}
                    onStartTrade={(tUid, tName) => {
                        setTradeTarget({ uid: tUid, name: tName });
                        setShowFriendModal(false);
                    }}
                />
            )}

            {/* ── Profile Modal ── */}
            {selectedProfileUid && (
                <UserProfileModal uid={selectedProfileUid} onClose={() => setSelectedProfileUid(null)} />
            )}

            {/* ── Mailbox ── */}
            {showMailboxModal && (
                <MailboxOverlay onClose={() => setShowMailboxModal(false)} />
            )}

            {/* ── Mission ── */}
            <MissionContainer isOpen={showMissionModal} onClose={() => setShowMissionModal(false)} />

            {/* ── Settings button (ゲーム中のみ) ── */}
            {gamePhase !== 'title' && gamePhase !== 'gacha' && gamePhase !== 'minigames' && gamePhase !== 'mode_select' && gamePhase !== 'setup_offline' && (
                <button id="settings-btn" onClick={(e) => { e.stopPropagation(); setGameState({ settingsActive: true }); }}>⚙️</button>
            )}

            {/* ══════════════════════════════
               Screen Router
               ══════════════════════════════ */}

            {gamePhase === 'title' && <TitleScreen />}

            {gamePhase === 'mode_select' && (
                <ModeSelectScreen
                    onShowFriendModal={() => setShowFriendModal(true)}
                    onShowMailbox={() => setShowMailboxModal(true)}
                    onShowLoginBonus={() => setShowManualLoginBonus(true)}
                    onShowMission={() => setShowMissionModal(true)}
                    onShowSettings={() => setGameState({ settingsActive: true })}
                    friendReqCount={safeFriendReqs.length}
                    unreadMailCount={unreadMailsCount}
                />
            )}

            {gamePhase === 'setup_offline' && <SetupOffline />}
            {gamePhase === 'online_lobby' && <OnlineLobby />}
            {gamePhase === 'playing' && <GameMain />}
            {gamePhase === 'gacha' && <GachaScreen />}
            {gamePhase === 'minigames' && <MinigamesApp />}

            {/* ── Shared overlays ── */}
            <SettingsAndRules />
            <TutorialOverlay />
            <SandboxGuide />
        </>
    );
}

export default App;
