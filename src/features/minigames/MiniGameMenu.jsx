import React from 'react';
import { useGameStore } from '../../store/useGameStore';

const gamesList = [
    { id: 'box', icon: '📦', name: '箱選びゲーム', desc: '10秒で当たりの箱を選べ！', reward: '最大+10P' },
    { id: 'vend', icon: '🏧', name: 'ボロ自販機ガチャ', desc: '3台から当たり1台を選べ！', reward: '最大+15P' },
    { id: 'hl', icon: '🃏', name: 'ハイ＆ロー', desc: '10秒で連続正解を重ねろ！', reward: '最大+25P' },
    { id: 'slot', icon: '🎰', name: '路上スロット', desc: '10秒以内に全リールを止めろ', reward: '最大+50P' },
    { id: 'fly', icon: '🪰', name: 'ハエ捕まえ', desc: '10秒で3匹捕まえろ！', reward: '最大+15P' },
    { id: 'scratch', icon: '🪙', name: 'スクラッチくじ', desc: '10秒で3マス削れ！', reward: '最大+20P' },
    { id: 'trash', icon: '🗑️', name: 'ゴミ箱あさり', desc: '10秒！危険なゴミ箱に注意', reward: '最大+15P' },
    { id: 'beg', icon: '🙏', name: '物乞いゲーム', desc: '10秒で通行人に物乞い！', reward: '最大+20P' },
    { id: 'rain', icon: '☔', name: '雨宿りダッシュ', desc: '10秒で障害物を越えろ！', reward: '最大+12P' },
    { id: 'kashi', icon: '🍱', name: '炊き出し争奪戦', desc: '10秒で弁当を3個キャッチ！', reward: '最大+15P' },
    { id: 'oxo', icon: '♟️', name: '路上○×ゲーム', desc: '5秒制限！CPUに勝て！', reward: '賭けP×2' },
    { id: 'rat', icon: '🐀', name: 'ネズミ追い払い', desc: '10秒！荷物を守れ！', reward: '最大+12P' },
    { id: 'drunk', icon: '🍺', name: '酔っ払いバランス', desc: '10秒間バランスを保て！', reward: '最大+15P' },
    { id: 'music', icon: '🎸', name: '路上ライブ音ゲー', desc: '10秒ライブで投げ銭！', reward: '最大+20P' },
    { id: 'nego', icon: '💬', name: '闇市交渉ゲーム', desc: '3アイテムを最高値で売れ！', reward: '最大+25P' }
];

export default function MiniGameMenu() {
    const goGame = (id) => {
        useGameStore.setState({ gamePhase: 'minigame_playing', selectedMiniGame: id });
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: '#0c0a07', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px 20px', zIndex: 1000
        }}>
            <p style={{ marginTop: '1.5rem', fontSize: '0.7rem', letterSpacing: '0.3em', color: '#7a6a4a' }}>脱・ホームレスサバイバルシティ</p>
            <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(2.5rem, 9vw, 5rem)', lineHeight: 0.9, color: '#c97b2a', textShadow: '0 0 40px rgba(201,123,42,0.4), 4px 4px 0 #000', textAlign: 'center', margin: '0.5rem 0' }}>路上<br />ミニゲーム</h1>
            <div style={{ width: '200px', height: '2px', background: 'linear-gradient(90deg, transparent, #c97b2a, transparent)', margin: '0.7rem auto' }}></div>
            
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem',
                width: '100%', maxWidth: '500px', marginTop: '20px'
            }}>
                {gamesList.map(g => (
                    <div key={g.id} onClick={() => goGame(g.id)} style={{
                        background: '#1a1309', border: '1px solid #3d2e1a', borderRadius: '13px',
                        padding: '1rem 0.8rem', cursor: 'pointer', textAlign: 'center', userSelect: 'none',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)', transition: 'transform 0.1s'
                    }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.3rem' }}>{g.icon}</span>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f0e8d0', marginBottom: '0.15rem' }}>{g.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#7a6a4a', lineHeight: 1.5 }}>{g.desc}</div>
                        <div style={{ fontSize: '0.62rem', color: '#c97b2a', marginTop: '0.25rem', fontWeight: 700 }}>{g.reward}</div>
                    </div>
                ))}
            </div>

            <button 
                onClick={() => useGameStore.setState({ gamePhase: 'mode_select' })}
                style={{
                    marginTop: '30px', padding: '10px 20px', borderRadius: '8px',
                    background: '#241a0e', border: '1px solid #5a4228', color: '#d4c4a0',
                    cursor: 'pointer', fontWeight: 'bold'
                }}
            >← モード選択へ戻る</button>
        </div>
    );
}