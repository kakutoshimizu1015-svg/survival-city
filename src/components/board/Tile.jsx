import React, { useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { tileTooltipData, TILE_COLORS } from '../../constants/maps';
import { getDepthScale, getTileW, getTileH, getSideH } from '../../utils/gameLogic';
import jinchiBuilding from '../../assets/images/jinchi_building.png';

export const Tile = React.memo(({ 
    tile, owner, isFog, isClickable, onClick, 
    isTruck, isPolice, isUncle, isAnimal, isYakuza, isLoanshark, isFriend, pathClass
}) => {
    const setTooltipData = useGameStore(state => state.setTooltipData);
    // Stateオブジェクト返却による無駄な再レンダリング・無限ループを防止するため個別にフックを呼び出す
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

    const { x, y, z = 0 } = tile;
    const colors = TILE_COLORS[tile.type] || TILE_COLORS["normal"];
    const tw = getTileW(z);
    const th = getTileH(z);
    const sh = getSideH(z);
    const ds = getDepthScale(z);

    const hasBuilding = tile.area === 'slum' && tile.type === 'normal';
    const isJinchi = owner !== null && owner !== undefined;

    const buildingFilter = isJinchi 
        ? `drop-shadow(0 0 8px ${owner.color}) drop-shadow(0 0 16px ${owner.color})` 
        : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))';

    const iconStr = tile.type === 'can' ? '🥫' : tile.type === 'trash' ? '🗑️' : tile.type === 'shop' ? '🛒' : tile.type === 'job' ? '💼' : tile.type === 'koban' ? '👮' : tile.type === 'event' ? '❗' : tile.type === 'exchange' ? '💰' : tile.type === 'shelter' ? '🏕️' : tile.type === 'center' ? '🏥' : '';
    const fontSize = Math.max(5, 10 * ds);
    const iconSize = Math.max(10, 26 * ds);

    let classNameStr = `tile ${tile.type} ${tile.area}`;
    if (isFog) classNameStr += ' night-fog';
    if (isClickable) classNameStr += ' tile-highlight-branch';
    if (pathClass) classNameStr += ` ${pathClass}`;

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
                position: 'absolute', 
                left: x, 
                top: y, 
                width: tw, 
                height: th + sh, 
                zIndex: Math.floor(y), 
                cursor: isClickable ? 'pointer' : 'default',
                opacity: isFog ? 0.2 : Math.max(0.4, 0.65 + ds * 0.35)
            }}
        >
            {/* HTML互換を保つため、タイルの立体構造だけ背面のSVGとして描画 */}
            <svg width={tw + 4*ds} height={th + sh + 6*ds} style={{ position: 'absolute', top: -2*ds, left: -2*ds, overflow: 'visible', pointerEvents: 'none' }}>
                <ellipse cx={tw/2 + 2*ds} cy={th + sh + 3*ds + 2*ds} rx={tw*0.4} ry={3*ds} fill="rgba(0,0,0,0.18)" />
                <path d={`M${2*ds},${th+2*ds} L${2*ds},${th+sh+2*ds} Q${tw/2+2*ds},${th+sh+2.5*ds+2*ds} ${tw+2*ds},${th+sh+2*ds} L${tw+2*ds},${th+2*ds} Z`} fill={colors.bg} />
                <rect x={2*ds} y={2*ds} width={tw} height={th} rx={3*ds} fill={colors.top} stroke={isClickable ? "#ffe066" : `rgba(255,255,255,${0.08+ds*0.1})`} strokeWidth={isClickable ? 2.5*ds : 0.6} />
                <line x1={4*ds} y1={1+2*ds} x2={tw} y2={1+2*ds} stroke={colors.hi} strokeWidth={1*ds} strokeLinecap="round" opacity={0.5} />
                {pathClass && <rect x={2*ds} y={2*ds} width={tw} height={th} rx={3*ds} fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth={2*ds} />}
            </svg>

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

            {!hasBuilding && (
                <>
                    <div style={{ position: 'absolute', top: th * 0.1, width: '100%', textAlign: 'center', fontSize: `${iconSize}px`, zIndex: 2, pointerEvents: 'none' }}>{iconStr}</div>
                    <div style={{ position: 'absolute', top: th * 0.7, width: '100%', textAlign: 'center', fontSize: `${fontSize}px`, fontWeight: 'bold', color: `rgba(255,255,255,${0.5 + ds * 0.4})`, fontFamily: "'DotGothic16', monospace", zIndex: 2, pointerEvents: 'none', whiteSpace: 'nowrap' }}>{tile.name}</div>
                </>
            )}

            {isJinchi && (
                <div style={{ position: 'absolute', right: 0, top: 0, width: `${6*ds}px`, height: `${6*ds}px`, borderRadius: '50%', backgroundColor: owner.color, zIndex: 3, pointerEvents: 'none' }} />
            )}

            {(tile.fieldCans > 0 || tile.fieldTrash > 0) && !isFog && (
                <div style={{ position:'absolute', top: -15 * ds, left:'50%', transform:'translateX(-50%)', display:'flex', gap:'2px', zIndex:5, background:'rgba(0,0,0,0.7)', borderRadius:'5px', padding:'2px 4px', fontSize:`${fontSize + 2}px`, color: '#fff', pointerEvents: 'none' }}>
                    {tile.fieldCans > 0 && <span>🥫{tile.fieldCans}</span>}
                    {tile.fieldTrash > 0 && <span>🗑️{tile.fieldTrash}</span>}
                </div>
            )}
            
            {!isFog && isTruck && <div style={{ position: 'absolute', top: -10*ds, left: '50%', transform: 'translateX(-50%)', fontSize: `${iconSize*1.2}px`, zIndex: 5, pointerEvents: 'none' }}>🚛</div>}
            {!isFog && isPolice && <div style={{ position: 'absolute', top: -10*ds, left: '50%', transform: 'translateX(-50%)', fontSize: `${iconSize*1.2}px`, zIndex: 5, pointerEvents: 'none' }}>👮</div>}
            {!isFog && isUncle && <div style={{ position: 'absolute', top: -10*ds, left: '50%', transform: 'translateX(-50%)', fontSize: `${iconSize*1.2}px`, zIndex: 5, pointerEvents: 'none' }}>🧓</div>}
            {!isFog && isAnimal && <div style={{ position: 'absolute', top: -10*ds, left: '50%', transform: 'translateX(-50%)', fontSize: `${iconSize*1.2}px`, zIndex: 5, pointerEvents: 'none' }}>🐀</div>}
            {!isFog && isYakuza && <div style={{ position: 'absolute', top: -10*ds, left: '50%', transform: 'translateX(-50%)', fontSize: `${iconSize*1.2}px`, zIndex: 5, pointerEvents: 'none' }}>😎</div>}
            {!isFog && isLoanshark && <div style={{ position: 'absolute', top: -10*ds, left: '50%', transform: 'translateX(-50%)', fontSize: `${iconSize*1.2}px`, zIndex: 5, pointerEvents: 'none' }}>💀</div>}
            {!isFog && isFriend && <div style={{ position: 'absolute', top: -10*ds, left: '50%', transform: 'translateX(-50%)', fontSize: `${iconSize*1.2}px`, zIndex: 5, pointerEvents: 'none' }}>🤝</div>}
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
    return true;
});