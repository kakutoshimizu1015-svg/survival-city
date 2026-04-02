import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { pIdColors } from '../../constants/characters';
// ▼ 拡張子を .png に修正
import jinchiBuildingImg from '../../assets/images/map/jinchi_building.png'; 

const tileTooltipData = { center: { title:"🏥 病院（スタート地点）", desc:"HPが0になると強制送還。最大15P没収・装備1つロスト。" }, normal: { title:"🛣️ 通常の道", desc:"特別な効果なし。移動の通過点。" }, can: { title:"🥫 空き缶", desc:"1APで缶を拾う（1ターン3回まで）。雨の日は雨具が必要。" }, trash: { title:"🗑️ ゴミ山", desc:"2APでゴミを漁る。失敗すると警察に補導されAP-2ペナルティ。" }, exchange: { title:"💱 買取所", desc:"拾った缶・ゴミを現在相場でP換金（0AP）。" }, job: { title:"💼 バイト", desc:"3APで挑戦。成功率60-80%で12P獲得。" }, shop: { title:"🛒 ショップ", desc:"カードを購入（4-6P）または手持ちカードを2Pで売却できる。" }, event: { title:"🎲 イベント", desc:"ミニゲームまたはストーリーイベントが発生！カード獲得のチャンス。" }, shelter: { title:"🏕️ 避難所", desc:"止まるとステルス状態になり、次の敵を1回やり過ごせる。" }, manhole: { title:"🕳️ マンホール", desc:"1APで別のマンホールへランダムワープ。" }, koban: { title:"🚓 交番", desc:"職務質問でその場に足止め。このターンは移動不可。" }, slum: { title:"🏚️ スラムエリア", desc:"缶・ゴミが多い。相場が低め。" }, commercial:{ title:"🏙️ 商業エリア", desc:"バイト・ショップが充実。中程度の相場。" }, luxury: { title:"🏰 高級エリア", desc:"収入が高い。警察が多くパトロールする。" }, };

export const Tile = React.memo(({ tile, owner, isFog, isClickable, onClick, isTruck, isPolice, isUncle, isAnimal, isYakuza, isLoanshark, isFriend, pathClass }) => {
    // zustand から個別に取得（再レンダリング抑制のため）
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
        if ((wrapper && wrapper.classList.contains('dragging')) || isClickable) return; 
        
        const ttKey = tile.type in tileTooltipData ? tile.type : tile.area;
        const ttData = tileTooltipData[ttKey];
        if (ttData) {
            let descText = ttData.desc;
            const npcPosMap = [ { pos: policePos, info: { emoji:'👮', name:'警察', desc:'遭遇するとAP-2ペナルティ' } }, { pos: unclePos, info: { emoji:'🧓', name:'厄介なおじさん', desc:'遭遇するとカード破棄＆強制ターン終了' } }, { pos: animalPos, info: { emoji:'🐀', name:'野良動物', desc:'遭遇すると缶拾い/ゴミ漁り不可' } }, { pos: yakuzaPos, info: { emoji:'😎', name:'ヤクザ', desc:'遭遇すると30ダメ＋カード1枚強奪' } }, { pos: loansharkPos, info: { emoji:'💀', name:'闇金', desc:'遭遇すると最大10P没収' } }, { pos: friendPos, info: { emoji:'🤝', name:'仲間のホームレス', desc:'出会うと缶を1個もらえる' } }, ];
            const npcsHere = npcPosMap.filter(n => n.pos === tile.id);
            if (npcsHere.length > 0) descText += '\n─────\n' + npcsHere.map(n => `${n.info.emoji}${n.info.name}: ${n.info.desc}`).join('\n');
            setTooltipData({ title: ttData.title, desc: descText, visible: true });
        }
    };

    const handleMouseLeave = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        setTooltipData(null); 
    };

    const handleTouchStart = (e) => touchTimer.current = setTimeout(() => handleMouseEnter(e), 150);
    const handleTouchEndOrCancel = () => { if (touchTimer.current) clearTimeout(touchTimer.current); setTimeout(handleMouseLeave, 300); };

    let classNameStr = `tile ${tile.type} ${tile.area}`;
    if (isFog) classNameStr += ' night-fog';
    if (isClickable) classNameStr += ' tile-highlight-branch';
    if (pathClass) classNameStr += ` ${pathClass}`;

    const iconStr = tile.type === 'can' ? '🥫' : tile.type === 'trash' ? '🗑️' : tile.type === 'shop' ? '🛒' : tile.type === 'job' ? '💼' : tile.type === 'koban' ? '👮' : tile.type === 'event' ? '❗' : tile.type === 'exchange' ? '💰' : tile.type === 'shelter' ? '🏕️' : tile.type === 'center' ? '🏥' : '';

    // ▼▼▼ 疑似3D Z軸（奥行き）スケール計算の追加 ▼▼▼
    const depthScale = Math.max(0.35, 1 - (tile.z || 0) * 0.09);

    return (
        <div id={`tile-${tile.id}`} onClick={isClickable ? onClick : undefined} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEndOrCancel} onTouchCancel={handleTouchEndOrCancel} className={classNameStr}
            style={{ 
                gridColumn: tile.col, gridRow: tile.row, cursor: isClickable ? 'pointer' : 'default',
                // ▼▼▼ スタイル適用 ▼▼▼
                transform: `scale(${depthScale}) translateY(${-(tile.z || 0) * 15}px)`,
                transformOrigin: 'bottom center',
                zIndex: Math.floor(tile.row) // Y軸ベースのZソート
            }}
        >
            <div style={{ fontSize: '26px', zIndex: 2, pointerEvents: 'none' }}>{iconStr}</div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', zIndex: 2, pointerEvents: 'none', textAlign: 'center', lineHeight: 1.3, maxWidth: '72px', overflow: 'hidden', whiteSpace: 'nowrap', opacity: 0.9 }}>{tile.name}</div>
            
            {/* ▼▼▼ 陣地の場合、建物のビジュアルを表示 ▼▼▼ */}
            {owner && (
                <div style={{
                    position: 'absolute',
                    top: '-50px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '84px', height: '84px',
                    pointerEvents: 'none',
                    zIndex: 1
                }}>
                    <img src={jinchiBuildingImg} alt="陣地" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            )}

            {owner && <div className="owner-mark-clay" style={{ display: 'block', backgroundColor: owner.color, fontSize: '10px', zIndex: 3 }}>🚩</div>}

            {(tile.fieldCans > 0 || tile.fieldTrash > 0) && !isFog && (
                <div style={{ position:'absolute', top:'-10px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'2px', zIndex:5, background:'rgba(0,0,0,0.7)', borderRadius:'5px', padding:'2px 4px', fontSize:'12px' }}>
                    {tile.fieldCans > 0 && <span>🥫{tile.fieldCans}</span>}{tile.fieldTrash > 0 && <span>🗑️{tile.fieldTrash}</span>}
                </div>
            )}
            
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
(prev, next) => {
    // React.memo の比較ロジック
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
    if (prev.owner?.id !== next.owner?.id) return false;
    if (prev.tile.fieldCans !== next.tile.fieldCans) return false;
    if (prev.tile.fieldTrash !== next.tile.fieldTrash) return false;
    return true;
});