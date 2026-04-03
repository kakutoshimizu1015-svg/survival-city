import React, { useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getDepthScale } from '../../utils/gameLogic';
import jinchiBuilding from '../../assets/images/jinchi_building.png';

// ▼ テキストの表示/非表示を切り替えるフラグ（trueで表示、falseで非表示）
const SHOW_TILE_TEXT = false;

export const tileTooltipData = {
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

export const Tile = React.memo(({ 
    tile, owner, isFog, isClickable, onClick, maxRow,
    isTruck, isPolice, isUncle, isAnimal, isYakuza, isLoanshark, isFriend, pathClass
}) => {
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

            setTooltipData({ title: ttData.title, desc: descText, visible: true });
        }
    };

    const handleMouseLeave = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        setTooltipData(null); 
    };

    const handleTouchStart = (e) => {
        touchTimer.current = setTimeout(() => { handleMouseEnter(e); }, 150);
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
    
    const hasBuilding = tile.area === 'slum' && tile.type === 'normal';
    const isJinchi = owner !== null && owner !== undefined;

    const buildingFilter = isJinchi 
        ? `drop-shadow(0 0 8px ${owner.color}) drop-shadow(0 0 16px ${owner.color})` 
        : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))';

    // 遠近法のスケール計算
    const ds = getDepthScale(tile.row, maxRow);

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
            style={{ 
                gridColumn: tile.col, 
                gridRow: tile.row, 
                cursor: isClickable ? 'pointer' : 'default', 
                position: 'relative',
                // ▼ スケールは残し、透明度は1に固定（視界外のみ0.2）
                transform: `scale(${ds})`,
                transformOrigin: 'center center',
                opacity: isFog ? 0.2 : 1,
                zIndex: tile.row 
            }}
        >
            {hasBuilding && !isFog && (
                <img 
                    src={jinchiBuilding} 
                    alt="建物" 
                    style={{
                        position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)',
                        width: '140%', height: 'auto', pointerEvents: 'none', zIndex: 1, opacity: 0.95, 
                        imageRendering: 'pixelated', WebkitFontSmoothing: 'none',
                        filter: buildingFilter,
                        transition: 'filter 0.3s ease'
                    }}
                />
            )}

            <div style={{ fontSize: '26px', zIndex: 2, pointerEvents: 'none' }}>{iconStr}</div>
            
            {/* ▼ SHOW_TILE_TEXTフラグがtrueの時のみ文字を描画 */}
            {SHOW_TILE_TEXT && (
                <div style={{ fontSize: '9px', fontWeight: 'bold', zIndex: 2, pointerEvents: 'none', textAlign: 'center', lineHeight: 1.3, maxWidth: '72px', overflow: 'hidden', whiteSpace: 'nowrap', opacity: 0.9 }}>{tile.name}</div>
            )}
            
            {isJinchi && <div className="owner-mark-clay" style={{ display: 'block', backgroundColor: owner.color, fontSize: '10px', zIndex: 3 }}>🚩</div>}

            {(tile.fieldCans > 0 || tile.fieldTrash > 0) && !isFog && (
                <div style={{ position:'absolute', top:'-10px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'2px', zIndex:5, background:'rgba(0,0,0,0.7)', borderRadius:'5px', padding:'2px 4px', fontSize:'12px' }}>
                    {tile.fieldCans > 0 && <span>🥫{tile.fieldCans}</span>}
                    {tile.fieldTrash > 0 && <span>🗑️{tile.fieldTrash}</span>}
                </div>
            )}
            
            {!isFog && isTruck && <div className="truck-token" style={{zIndex: 5}}>🚛</div>}
            {!isFog && isPolice && <div className="npc-token npc-police" style={{zIndex: 5}}>👮</div>}
            {!isFog && isUncle && <div className="npc-token npc-uncle" style={{zIndex: 5}}>🧓</div>}
            {!isFog && isAnimal && <div className="npc-token npc-animal" style={{zIndex: 5}}>🐀</div>}
            {!isFog && isYakuza && <div className="npc-token npc-yakuza" style={{zIndex: 5}}>😎</div>}
            {!isFog && isLoanshark && <div className="npc-token npc-loanshark" style={{zIndex: 5}}>💀</div>}
            {!isFog && isFriend && <div className="npc-token npc-friend" style={{zIndex: 5}}>🤝</div>}
        </div>
    );
}, 
(prev, next) => {
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
    if (prev.maxRow !== next.maxRow) return false;
    return true;
});