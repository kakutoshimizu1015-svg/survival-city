import React, { useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charEmoji } from '../../constants/characters';

const tileTooltipData = {
    center:    { title:"🏥 病院（スタート地点）", desc:"HPが0になると強制送還。最大15P没収・装備1つロスト。" },
    normal:    { title:"🛣️ 通常の道", desc:"特別な効果なし。移動の通過点。" },
    can:       { title:"🥫 空き缶", desc:"1APで缶を拾う（1ターン3回まで）。雨の日は雨具が必要。" },
    trash:     { title:"🗑️ ゴミ山", desc:"2APでゴミを漁る。失敗すると警察に補導されAP-2ペナルティ。" },
    exchange:  { title:"💱 買取所", desc:"拾った缶・ゴミを現在相場でP換金（0AP）。" },
    job:       { title:"💼 バイト", desc:"3APで挑戦。成功率60-80%で12P獲得。" },
    shop:      { title:"🛒 ショップ", desc:"カードを購入（4-6P）または手持ちカードを2Pで売却できる。" },
    event:     { title:"🎲 イベント", desc:"ミニゲームまたはストーリーイベントが発生！カード獲得のチャンス。" },
    shelter:   { title:"🏕️ 避難所", desc:"止まるとステルス状態になり、次の敵を1回やり過ごせる。" },
    manhole:   { title:"🕳️ マンホール", desc:"1APで別のマンホールへランダムワープ。" },
    koban:     { title:"🚓 交番", desc:"職務質問でその場に足止め。このターンは移動不可。" },
    slum:      { title:"🏚️ スラムエリア", desc:"缶・ゴミが多い。相場が低め。" },
    commercial:{ title:"🏙️ 商業エリア", desc:"バイト・ショップが充実。中程度の相場。" },
    luxury:    { title:"🏰 高級エリア", desc:"収入が高い。警察が多くパトロールする。" },
};

export const Tile = ({ 
    tile, owner, isFog, isClickable, onClick, playersOnTile, 
    isTruck, isPolice, isUncle, isAnimal, isYakuza, isLoanshark, isFriend, isActiveTurnPlayerOnTile,
    pathClass
}) => {
    const { setTooltipData, policePos, unclePos, animalPos, yakuzaPos, loansharkPos, friendPos } = useGameStore();
    const touchTimer = useRef(null);

    const handleMouseEnter = (e) => {
        // ドラッグ中はツールチップの計算を完全にキャンセルし、処理落ちを防ぐ
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

            const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            const y = e.clientY || (e.touches && e.touches[0].clientY) || 0;

            setTooltipData({
                title: ttData.title,
                desc: descText,
                x, y
            });
        }
    };

    const handleMouseMove = (e) => {
        const wrapper = document.getElementById('game-board-wrapper');
        if (wrapper && wrapper.classList.contains('dragging')) return;
        if (isClickable) return;

        if (useGameStore.getState().tooltipData) {
            const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            const y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            setTooltipData({ ...useGameStore.getState().tooltipData, x, y });
        }
    };

    const handleMouseLeave = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        setTooltipData(null);
    };

    // スマホでは少しだけ遅延させることで、スワイプ操作の邪魔をしないようにする
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
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEndOrCancel}
            onTouchCancel={handleTouchEndOrCancel}
            className={classNameStr}
            style={{ gridColumn: tile.col, gridRow: tile.row, cursor: isClickable ? 'pointer' : 'default' }}
        >
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
};