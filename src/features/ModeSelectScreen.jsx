import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useUserStore } from '../store/useUserStore';
import { savePlayerName } from '../utils/userLogic';

/**
 * ModeSelectScreen
 * 
 * ガチャ画面と統一されたダークテーマのモード選択画面。
 * PLAY / EARN / SOCIAL の3カテゴリに機能を分類し、視覚的な優先度を明確にしている。
 * 
 * Props:
 *   onShowFriendModal   - フレンドモーダルを開くコールバック
 *   onShowMailbox       - メールボックスを開くコールバック
 *   onShowLoginBonus    - ログインボーナスを手動表示するコールバック
 *   onShowMission       - ミッションモーダルを開くコールバック
 *   onShowSettings      - 設定画面を開くコールバック
 *   friendReqCount      - フレンド申請の未読数
 *   unreadMailCount     - メールの未読数
 */
export const ModeSelectScreen = ({
    onShowFriendModal,
    onShowMailbox,
    onShowLoginBonus,
    onShowMission,
    onShowSettings,
    friendReqCount = 0,
    unreadMailCount = 0,
}) => {
    const setGameState = useGameStore(state => state.setGameState);
    const { playerName, totalWins, wins, gachaCans, gachaPoints } = useUserStore();

    const [localName, setLocalName] = useState(playerName || '');
    const [isEditingName, setIsEditingName] = useState(false);

    const handleNameSave = () => {
        setIsEditingName(false);
        if (localName && localName.trim() !== '' && localName !== playerName) {
            savePlayerName(localName);
        }
    };

    const displayWins = totalWins || wins || 0;

    return (
        <div className="dt-screen">
            {/* ── Sticky Header ── */}
            <div className="dt-sticky-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--dt-text-dim)', letterSpacing: 1 }}>
                            WELCOME BACK
                        </div>
                        {isEditingName ? (
                            <input
                                className="dt-input"
                                type="text"
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                                onBlur={handleNameSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                                autoFocus
                                maxLength={10}
                                style={{ marginTop: 4, width: 150, fontSize: 16, fontWeight: 800 }}
                            />
                        ) : (
                            <div
                                onClick={() => setIsEditingName(true)}
                                style={{
                                    fontSize: 18, fontWeight: 800, color: 'var(--dt-text)',
                                    cursor: 'pointer',
                                }}
                                title="タップで名前を変更"
                            >
                                {playerName || 'Player'}
                            </div>
                        )}
                    </div>

                    {/* 資産バッジ群 */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <StatusBadge emoji="🏆" value={displayWins} color="#c8a24e" bgColor="rgba(200,162,78,0.1)" borderColor="rgba(200,162,78,0.2)" />
                        <StatusBadge emoji="🥫" value={gachaCans || 0} color="#2ecc71" bgColor="rgba(46,204,113,0.1)" borderColor="rgba(46,204,113,0.2)" />
                        <StatusBadge emoji="P" value={gachaPoints || 0} color="#3498db" bgColor="rgba(52,152,219,0.1)" borderColor="rgba(52,152,219,0.2)" />
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div style={{ padding: 20, flex: 1 }}>

                {/* ===== PLAY ===== */}
                <div className="dt-section-label">PLAY</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexDirection: 'column' }}>
                    <PlayCard
                        emoji="🎮"
                        title="ゲームをプレイ"
                        subtitle="CPUと対戦"
                        borderColor="var(--dt-gold)"
                        bgGrad="linear-gradient(145deg, #1e1a14, #141210)"
                        accentColor="rgba(200,162,78,0.1)"
                        subtitleColor="var(--dt-text-dim)"
                        onClick={() => setGameState({ gamePhase: 'setup_offline' })}
                    />
                    <PlayCard
                        emoji="🌐"
                        title="みんなでゲームをプレイ"
                        subtitle="友達と対戦"
                        borderColor="var(--dt-blue)"
                        bgGrad="linear-gradient(145deg, #0f1520, #0a0f18)"
                        accentColor="rgba(52,152,219,0.1)"
                        subtitleColor="#6a8aaa"
                        onClick={() => setGameState({ gamePhase: 'online_lobby' })}
                    />
                </div>

                {/* ===== EARN ===== */}
                <div className="dt-section-label">EARN</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <EarnCard
                        emoji="🎲"
                        title="ミニゲーム"
                        subtitle="Pを稼ぐ"
                        borderColor="rgba(46,204,113,0.4)"
                        bgGrad="linear-gradient(145deg, #0f1a10, #0a120a)"
                        titleColor="var(--dt-green)"
                        subtitleColor="#5a8a5a"
                        onClick={() => setGameState({ gamePhase: 'minigames' })}
                    />
                    <EarnCard
                        emoji="🔥"
                        title="ガチャ屋台"
                        subtitle="スキンを引く"
                        borderColor="rgba(230,126,34,0.4)"
                        bgGrad="linear-gradient(145deg, #1a1008, #120c04)"
                        titleColor="var(--dt-orange)"
                        subtitleColor="#8a6a3a"
                        onClick={() => setGameState({ gamePhase: 'gacha' })}
                    />
                </div>

                {/* ===== SOCIAL ===== */}
                <div className="dt-section-label">SOCIAL</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
                    <SocialIcon emoji="👥" label="フレンド" badge={friendReqCount} onClick={onShowFriendModal} />
                    <SocialIcon emoji="📮" label="メール" badge={unreadMailCount} onClick={onShowMailbox} />
                    <SocialIcon emoji="🗓" label="ボーナス" onClick={onShowLoginBonus} />
                    <SocialIcon emoji="🏆" label="ミッション" onClick={onShowMission} />
                </div>

                {/* ===== SETTINGS BAR ===== */}
                <div
                    onClick={onShowSettings}
                    style={{
                        background: 'rgba(200,162,78,0.06)',
                        border: '1px solid rgba(200,162,78,0.12)',
                        borderRadius: 12, padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    }}
                >
                    <span style={{ fontSize: 11, color: 'var(--dt-gold)', fontWeight: 600, flex: 1 }}>
                        ⚙ 設定
                    </span>
                    <span style={{ fontSize: 14, color: 'var(--dt-text-muted)' }}>❯</span>
                </div>
            </div>
        </div>
    );
};


/* ── Sub-components ── */

const StatusBadge = ({ emoji, value, color, bgColor, borderColor }) => (
    <div className="dt-badge" style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
        <span style={{ fontSize: 12 }}>{emoji}</span>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value}</span>
    </div>
);

const PlayCard = ({ emoji, title, subtitle, borderColor, bgGrad, accentColor, subtitleColor, onClick }) => (
    <div
        className="dt-card-interactive"
        onClick={onClick}
        style={{ flex: 1, background: bgGrad, borderColor }}
    >
        <div style={{
            position: 'absolute', top: 0, right: 0, width: 60, height: 60,
            background: `radial-gradient(circle at 100% 0%, ${accentColor}, transparent)`,
            pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 32 }}>{emoji}</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dt-text)', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12, color: subtitleColor }}>{subtitle}</div>
            </div>
        </div>
    </div>
);

const EarnCard = ({ emoji, title, subtitle, borderColor, bgGrad, titleColor, subtitleColor, onClick }) => (
    <div
        className="dt-card-interactive"
        onClick={onClick}
        style={{ flex: 1, background: bgGrad, borderColor, textAlign: 'center', padding: 16 }}
    >
        <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: titleColor }}>{title}</div>
        <div style={{ fontSize: 10, color: subtitleColor, marginTop: 2 }}>{subtitle}</div>
    </div>
);

const SocialIcon = ({ emoji, label, badge = 0, onClick }) => (
    <div className="dt-social-icon" onClick={onClick}>
        {badge > 0 && <div className="dt-notif-dot">{badge}</div>}
        <div style={{ fontSize: 20, marginBottom: 6 }}>{emoji}</div>
        <div style={{ fontSize: 10, color: '#8a8a8a', fontWeight: 600 }}>{label}</div>
    </div>
);
