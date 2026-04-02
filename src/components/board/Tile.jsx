import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charEmoji } from '../../constants/characters';

// ... tileTooltipData の定義はそのまま ...
const tileTooltipData = { /* 省略 */ };

// React.memo で囲み、Propsが変わらない限り再レンダリングしないようにする
export const Tile = React.memo(({ 
    tile, owner, isFog, isClickable, onClick, playersOnTile, 
    isTruck, isPolice, isUncle, isAnimal, isYakuza, isLoanshark, isFriend, isActiveTurnPlayerOnTile,
    pathClass
}) => {
    // 🚨 修正1: Zustand から必要なものだけを「個別に」取り出す
    // 以前のように const { policePos, ... } = useGameStore() と書くと、
    // Storeの「何か」が更新されるたびに全マス目が再描画されてしまいます。
    const setTooltipData = useGameStore(state => state.setTooltipData);
    const policePos = useGameStore(state => state.policePos);
    const unclePos = useGameStore(state => state.unclePos);
    const animalPos = useGameStore(state => state.animalPos);
    const yakuzaPos = useGameStore(state => state.yakuzaPos);
    const loansharkPos = useGameStore(state => state.loansharkPos);
    const friendPos = useGameStore(state => state.friendPos);
    
    const touchTimer = useRef(null);

    const handleMouseEnter = (e) => {
        const wrapper = document.getElementById('game-board-wrapper');
        if (wrapper && wrapper.classList.contains('dragging')) return;
        if (isClickable) return; 
        
        const ttKey = tile.type in tileTooltipData ? tile.type : tile.area;
        const ttData = tileTooltipData[ttKey];
        if (ttData) {
            let descText = ttData.desc;
            const npcPosMap = [
                { pos: policePos,    info: { emoji:'👮', name:'警察', desc:'遭遇するとAP-2ペナルティ' } },
                { pos: unclePos,     info: { emoji:'🧓', name:'厄介なおじさん', desc:'遭遇するとカード破棄＆強制ターン終了' } },
                { pos: animalPos,    info: { emoji:'🐀', name:'野良動物', desc:'遭遇すると缶拾い/ゴミ漁り不可' } },
                { pos: yakuzaPos,    info: { emoji:'😎', name:'ヤクザ', desc:'遭遇すると30ダメ＋カード1枚強奪' } },
                { pos: loansharkPos, info: { emoji:'💀', name:'闇金', desc:'遭遇すると最大10P没収' } },
                { pos: friendPos,    info: { emoji:'🤝', name:'仲間のホームレス', desc:'出会うと缶を1個もらえる' } },
            ];
            const npcsHere = npcPosMap.filter(n => n.pos === tile.id);
            if (npcsHere.length > 0) {
                descText += '\n─────\n' + npcsHere.map(n => `${n.info.emoji}${n.info.name}: ${n.info.desc}`).join('\n');
            }

            // 🚨 修正2: 座標（X, Y）はStoreに入れない！テキストデータのみ渡す
            setTooltipData({
                title: ttData.title,
                desc: descText,
                visible: true // 表示フラグだけ立てる
            });
        }
    };

    // 🚨 修正3: handleMouseMove は削除！(マウス位置の更新は `TileTooltip.jsx` で window 側に委譲します)

    const handleMouseLeave = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        setTooltipData(null); // または { visible: false } など
    };

    const handleTouchStart = (e) => {
        touchTimer.current = setTimeout(() => {
            handleMouseEnter(e);
        }, 150);
    };

    const handleTouchEndOrCancel = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        setTimeout(handleMouseLeave, 300);
    };

    let classNameStr = `tile ${tile.type} ${tile.area}`;
    if (isFog) classNameStr += ' night-fog';
    if (isClickable) classNameStr += ' tile-highlight-branch';
    if (pathClass) classNameStr += ` ${pathClass}`;

    const iconStr = tile.type === 'can' ? '🥫' : tile.type === 'trash' ? '🗑️' : tile.type === 'shop' ? '🛒' : tile.type === 'job' ? '💼' : tile.type === 'koban' ? '👮' : tile.type === 'event' ? '❗' : tile.type === 'exchange' ? '💰' : tile.type === 'shelter' ? '🏕️' : tile.type === 'center' ? '🏥' : '';

    return (
        <div 
            id={`tile-${tile.id}`} 
            onClick={isClickable ? onClick : undefined}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEndOrCancel}
            onTouchCancel={handleTouchEndOrCancel}
            className={classNameStr}
            style={{ gridColumn: tile.col, gridRow: tile.row, cursor: isClickable ? 'pointer' : 'default' }}
        >
            {/* 中身はそのまま */}
            <div style={{ fontSize: '26px', zIndex: 2, pointerEvents: 'none' }}>{iconStr}</div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', zIndex: 2, pointerEvents: 'none', textAlign: 'center', lineHeight: 1.3, maxWidth: '72px', overflow: 'hidden', whiteSpace: 'nowrap', opacity: 0.9 }}>{tile.name}</div>
            
            {owner && <div className="owner-mark-clay" style={{ display: 'block', backgroundColor: owner.color, fontSize: '10px' }}>🚩</div>}

            {(tile.fieldCans > 0 || tile.fieldTrash > 0) && !isFog && (
                <div style={{ position:'absolute', top:'-10px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'2px', zIndex:5, background:'rgba(0,0,0,0.7)', borderRadius:'5px', padding:'2px 4px', fontSize:'12px' }}>
                    {tile.fieldCans > 0 && <span>🥫{tile.fieldCans}</span>}
                    {tile.fieldTrash > 0 && <span>🗑️{tile.fieldTrash}</span>}
                </div>
            )}

            {!isFog && playersOnTile.map(p => (
                <div key={p.id} className={`player-token pos-${p.id % 4} ${isActiveTurnPlayerOnTile && p.id === useGameStore.getState().turn ? 'token-active' : ''}`} style={{ borderColor: p.color, width: '36px', height: '36px' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1 }}>
                        <span style={{ fontSize:'18px' }}>{charEmoji[p.charType]}</span>
                        <span style={{ fontSize:'7px', fontWeight:900, color:p.color, textShadow:'0 0 4px rgba(0,0,0,1)', whiteSpace: 'nowrap', maxWidth: '32px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    </div>
                </div>
            ))}
            
            {!isFog && isTruck && <div className="truck-token">🚛</div>}
            {!isFog && isPolice && <div className="npc-token npc-police">👮</div>}
            {!isFog && isUncle && <div className="npc-token npc-uncle">🧓</div>}
            {!isFog && isAnimal && <div className="npc-token npc-animal">🐀</div>}
            {!isFog && isYakuza && <div className="npc-token npc-yakuza">😎</div>}
            {!isFog && isLoanshark && <div className="npc-token npc-loanshark">💀</div>}
            {!isFog && isFriend && <div className="npc-token npc-friend">🤝</div>}
        </div>
    );
}, 
// 🚨 修正4: props が変わった時「だけ」再レンダリングするカスタム比較関数
(prev, next) => {
    // 基本的な状態の変化をチェック
    if (prev.tile.id !== next.tile.id) return false;
    if (prev.isFog !== next.isFog) return false;
    if (prev.isClickable !== next.isClickable) return false;
    if (prev.pathClass !== next.pathClass) return false;
    if (prev.isTruck !== next.isTruck) return false;
    if (prev.isPolice !== next.isPolice) return false;
    if (prev.isUncle !== next.isUncle) return false;
    if (prev.isAnimal !== next.isAnimal) return false;
    if (prev.isYakuza !== next.isYakuza) return false;
    if (prev.isLoanshark !== next.isLoanshark) return false;
    if (prev.isFriend !== next.isFriend) return false;
    if (prev.isActiveTurnPlayerOnTile !== next.isActiveTurnPlayerOnTile) return false;
    if (prev.owner?.id !== next.owner?.id) return false;
    if (prev.tile.fieldCans !== next.tile.fieldCans) return false;
    if (prev.tile.fieldTrash !== next.tile.fieldTrash) return false;

    // 配列である playersOnTile は中身のIDで比較する
    const prevIds = prev.playersOnTile.map(p => p.id).join(',');
    const nextIds = next.playersOnTile.map(p => p.id).join(',');
    if (prevIds !== nextIds) return false;

    // 変化なしの場合は true を返し、再レンダリングをスキップ！
    return true;
});