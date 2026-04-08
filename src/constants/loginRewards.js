// 7日サイクルの報酬データ
export const LOGIN_REWARDS = [
    { day: 1, type: "p", amount: 100, label: "100 P", icon: "💰" },
    { day: 2, type: "can", amount: 10, label: "10 缶", icon: "🥫" },
    { day: 3, type: "p", amount: 300, label: "300 P", icon: "💰" },
    { day: 4, type: "can", amount: 20, label: "20 缶", icon: "🥫" },
    { day: 5, type: "p", amount: 500, label: "500 P", icon: "💰" },
    { day: 6, type: "can", amount: 50, label: "50 缶", icon: "🥫" },
    { day: 7, type: "skin", skinId: "SSR_boss_alt", amount: 1, fallbackP: 1000, label: "限定スキン", icon: "✨" }, // 被った場合は1000Pに変換
];