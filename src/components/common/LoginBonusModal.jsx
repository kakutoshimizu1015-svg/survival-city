import React, { useState } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { syncGachaData } from '../../utils/userLogic';
import { GACHA_POOL } from '../../constants/characters';

// ==========================================
// ▼ ログインボーナス報酬マスターデータ
// ==========================================
const LOGIN_REWARDS = [
    { day: 1, type: "p", amount: 100, label: "100 P", icon: "💰" },
    { day: 2, type: "can", amount: 10, label: "10 缶", icon: "🥫" },
    { day: 3, type: "p", amount: 300, label: "300 P", icon: "💰" },
    { day: 4, type: "can", amount: 20, label: "20 缶", icon: "🥫" },
    { day: 5, type: "p", amount: 500, label: "500 P", icon: "💰" },
    { day: 6, type: "can", amount: 50, label: "50 缶", icon: "🥫" },
    // ▼ 7日目: 限定スキン（マスターデータに存在するIDを指定）。被った場合は fallbackP を付与。
    { day: 7, type: "skin", skinId: "SSR_boss", amount: 1, fallbackP: 1000, label: "限定スキン", icon: "✨" }, 
];

// ▼ 修正: App.jsxから手動開閉用の props を受け取る
export default function LoginBonusModal({ manualOpen, onCloseManual }) {
    const { 
        loginDays, 
        showLoginBonusToday, 
        unlockedSkins, 
        addGachaAssets, 
        unlockMultipleSkins, 
        setUserData 
    } = useUserStore();

    const [isClaiming, setIsClaiming] = useState(false);
    const [conversionMessage, setConversionMessage] = useState(null);

    // ▼ 修正: 今日のボーナスが未受取、または手動で開かれた場合のみ描画する
    if (!showLoginBonusToday && !manualOpen) return null;

    // デバッグ・フェイルセーフ用: loginDaysが不正な値にならないように補正
    const currentDay = Math.max(1, Math.min(7, loginDays || 1));
    const todayReward = LOGIN_REWARDS[currentDay - 1];

    const handleClaim = async () => {
        if (isClaiming) return;
        setIsClaiming(true);

        // 報酬付与ロジック
        if (todayReward.type === "p") {
            addGachaAssets(0, todayReward.amount);
        } else if (todayReward.type === "can") {
            addGachaAssets(todayReward.amount, 0);
        } else if (todayReward.type === "skin") {
            const alreadyOwned = unlockedSkins.includes(todayReward.skinId);
            if (alreadyOwned) {
                // 重複救済：Pに変換
                addGachaAssets(0, todayReward.fallbackP);
                setConversionMessage(`所持済みスキンだったため、${todayReward.fallbackP} Pに変換されました！`);
                await new Promise(r => setTimeout(r, 2000));
            } else {
                // 新規獲得
                unlockMultipleSkins([todayReward.skinId]);
            }
        }

        // Firebaseに即座に同期してリロード消失を防ぐ
        await syncGachaData();

        // モーダルを閉じる
        setUserData({ showLoginBonusToday: false });
        setIsClaiming(false);
        if (onCloseManual) onCloseManual();
    };

    const targetSkinData = GACHA_POOL.find(s => s.id === LOGIN_REWARDS[6].skinId);

    const BG = "#0C0600";
    const PANEL = "#1E0E00";
    const BORD = "#5C3015";
    const GOLD = "#D4A017";
    const ACC = "#FF6600";
    const LIGHT = "#EDE0C4";

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, 
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: 20, fontFamily: '"Noto Sans JP", sans-serif',
            animation: 'fadeIn 0.3s ease'
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popUp { from { transform: scale(0.8) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                @keyframes pulseHighlight { 0%, 100% { box-shadow: 0 0 10px ${ACC}55; } 50% { box-shadow: 0 0 25px ${ACC}AA; } }
                @keyframes bounceIcon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            `}</style>

            <div style={{
                background: `radial-gradient(ellipse at top, #2A1200 0%, ${PANEL} 80%)`, 
                border: `3px solid ${GOLD}`, borderRadius: 16, width: '100%', maxWidth: 360, 
                padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden',
                animation: 'popUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <div style={{ position: 'absolute', top: -40, left: -40, right: -40, height: 100, background: 'radial-gradient(ellipse, rgba(255,215,0,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />

                <h2 style={{ color: GOLD, fontSize: 22, margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    🗓 ログインボーナス
                </h2>
                <p style={{ color: LIGHT, fontSize: 13, margin: '0 0 20px 0', opacity: 0.9 }}>
                    毎日ログインして豪華アイテムをゲットしよう！<br/>（現在 <span style={{ color: ACC, fontWeight: 'bold', fontSize: 16 }}>{currentDay}</span> 日目）
                </p>

                {/* 1〜6日目のグリッド */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                    {LOGIN_REWARDS.slice(0, 6).map((reward, i) => {
                        const day = i + 1;
                        const isPast = day < currentDay || (!showLoginBonusToday && day === currentDay);
                        const isToday = day === currentDay && showLoginBonusToday;
                        const isFuture = day > currentDay;

                        return (
                            <div key={day} style={{
                                background: isPast ? '#0A0500' : isToday ? '#3D1A08' : '#150800',
                                border: `2px solid ${isToday ? ACC : isPast ? '#333' : BORD}`,
                                borderRadius: 10, padding: '10px 4px', position: 'relative',
                                opacity: isFuture ? 0.6 : 1,
                                animation: isToday ? 'pulseHighlight 2s infinite' : 'none',
                                filter: isPast ? 'grayscale(100%) brightness(0.5)' : 'none'
                            }}>
                                <div style={{ fontSize: 10, color: isToday ? GOLD : '#888', fontWeight: 'bold', marginBottom: 4 }}>{day}日目</div>
                                <div style={{ fontSize: 24, animation: isToday ? 'bounceIcon 1.5s ease-in-out infinite' : 'none' }}>
                                    {reward.icon}
                                </div>
                                <div style={{ fontSize: 11, color: LIGHT, fontWeight: 'bold', marginTop: 4 }}>{reward.label}</div>
                                {isPast && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#66BB6A', textShadow: '0 0 8px #000' }}>✔</div>}
                            </div>
                        );
                    })}
                </div>

                {/* 7日目（特別枠） */}
                <div style={{
                    background: currentDay === 7 ? 'linear-gradient(135deg, #4A1500, #2A0800)' : '#150800',
                    border: `2px solid ${currentDay === 7 ? '#FFD700' : BORD}`,
                    borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 16,
                    opacity: currentDay < 7 ? 0.6 : 1,
                    animation: currentDay === 7 && showLoginBonusToday ? 'pulseHighlight 2s infinite' : 'none',
                    filter: currentDay > 7 || (!showLoginBonusToday && currentDay === 7) ? 'grayscale(100%) brightness(0.5)' : 'none'
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%', background: '#0C0600', 
                        border: `3px solid ${currentDay === 7 ? '#FFD700' : '#444'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative'
                    }}>
                        {targetSkinData ? (
                            <>
                                {currentDay === 7 && showLoginBonusToday && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%)', animation: 'fadeIn 1s infinite alternate' }} />}
                                <img src={targetSkinData.front} alt="7日目報酬" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </>
                        ) : (
                            <span style={{ fontSize: 32 }}>✨</span>
                        )}
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontSize: 12, color: currentDay === 7 ? '#FFD700' : '#888', fontWeight: 'bold' }}>7日目 最終報酬</div>
                        <div style={{ fontSize: 16, color: LIGHT, fontWeight: 'bold', marginBottom: 2 }}>{LOGIN_REWARDS[6].label}</div>
                        <div style={{ fontSize: 10, color: '#AAA' }}>※所持済みの場合は {LOGIN_REWARDS[6].fallbackP}P に変換</div>
                    </div>
                    {(!showLoginBonusToday && currentDay === 7) && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#66BB6A', textShadow: '0 0 10px #000' }}>✔</div>}
                </div>

                {/* 変換メッセージ */}
                {conversionMessage && (
                    <div style={{ marginTop: 16, padding: '8px 12px', background: 'rgba(255, 102, 0, 0.2)', border: `1px solid ${ACC}`, borderRadius: 8, color: '#FFD700', fontSize: 12, fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>
                        {conversionMessage}
                    </div>
                )}

                {/* ▼ 修正: 未受取の場合は「受け取る」ボタン、受取済みの場合は「閉じる」ボタンを表示 */}
                {showLoginBonusToday ? (
                    <button 
                        onClick={handleClaim} 
                        disabled={isClaiming}
                        style={{
                            marginTop: 24, width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${ACC}`,
                            background: isClaiming ? '#333' : 'linear-gradient(135deg, #8B2500, #5C1A00)',
                            color: '#FFF', fontSize: 16, fontWeight: 'bold', cursor: isClaiming ? 'not-allowed' : 'pointer',
                            boxShadow: isClaiming ? 'none' : '0 4px 10px rgba(0,0,0,0.5)',
                            transition: 'transform 0.1s, filter 0.1s'
                        }}
                    >
                        {isClaiming ? '受け取り処理中...' : '報酬を受け取る！'}
                    </button>
                ) : (
                    <button 
                        onClick={onCloseManual} 
                        style={{
                            marginTop: 24, width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${BORD}`,
                            background: '#150800', color: LIGHT, fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                        }}
                    >
                        閉じる
                    </button>
                )}
            </div>
        </div>
    );
}