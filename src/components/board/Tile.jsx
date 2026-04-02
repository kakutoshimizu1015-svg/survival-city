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
    // Zustandフックを分割呼び出しして無駄な再レンダリングを防止
    const policePos = useGameStore(state => state.policePos);
    const unclePos = useGameStore(state => state.unclePos);
    const animalPos = useGameStore(state => state.animalPos);
    const yakuzaPos = useGameStore(state => state.yakuzaPos);
    const loansharkPos = useGameStore(state => state.loansharkPos);
    const friendPos = useGameStore(state => state.friendPos);
    
    const touchTimer = useRef(null);

    const handleMouseEnter = (e) => {
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
    // TILE_COLORSから立体マス用の色を取得、デフォルトはnormal
    const colors = TILE_COLORS[tile.type] || TILE_COLORS["normal"];
    
    // z値に基づくスケーリング計算
    const tw = getTileW(z);
    const th = getTileH(z);
    const sh = getSideH(z);
    const ds = getDepthScale(z); // 奥行きスケール (0.35〜1.0)

    // スラムエリアの「道(normal)」には常に建物を建てる
    const hasBuilding = tile.area === 'slum' && tile.type === 'normal';
    const isJinchi = owner !== null && owner !== undefined;

    // 陣地化された場合はプレイヤーカラーで発光させる
    const buildingFilter = isJinchi 
        ? `drop-shadow(0 0 8px ${owner.color}) drop-shadow(0 0 16px ${owner.color})` 
        : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))';

    const iconStr = tile.type === 'can' ? '🥫' : tile.type === 'trash' ? '🗑️' : tile.type === 'shop' ? '🛒' : tile.type === 'job' ? '💼' : tile.type === 'koban' ? '👮' : tile.type === 'event' ? '❗' : tile.type === 'exchange' ? '💰' : tile.type === 'shelter' ? '🏕️' : tile.type === 'center' ? '🏥' : '';
    
    // ds(スケール)を文字サイズやアイコンサイズに適用する
    const fontSize = Math.max(5, 10 * ds);
    const iconSize = Math.max(10, 20 * ds);

    // HTML Grid廃止、SVGベースの立体描画へ移行
    return (
        <g 
            id={`tile-${tile.id}`} 
            opacity={isFog ? 0.2 : Math.max(0.4, 0.65 + ds * 0.35)}
            onClick={isClickable ? onClick : undefined}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEndOrCancel}
            onTouchCancel={handleTouchEndOrCancel}
            style={{ cursor: isClickable ? 'pointer' : 'default' }}
        >
            {/* タイル影（上面と同じサイズを上面の下に描画） */}
            <ellipse cx={x + tw/2} cy={y + th + sh + 3 * ds} rx={tw * 0.4} ry={3 * ds} fill="rgba(0,0,0,0.18)" />

            {/* 立体的な側面 (上面の下に描画) */}
            <path d={`M${x},${y + th} L${x},${y + th + sh} Q${x + tw/2},${y + th + sh + 2.5 * ds} ${x + tw},${y + th + sh} L${x + tw},${y + th} Z`} fill={colors.side} />

            {/* 立体的な上面 (最前面に描画) */}
            <rect x={x} y={y} width={tw} height={th} rx={3 * ds} fill={colors.top} stroke={isClickable ? "#ffe066" : `rgba(255,255,255,${0.08 + ds * 0.1})`} strokeWidth={isClickable ? 2.5 * ds : 0.6} />

            {/* 陣地建物（ペーパーマリオ風、上面の中央下部に立てる） */}
            {hasBuilding && !isFog && (
                <image 
                    href={jinchiBuilding} 
                    x={x + tw/2 - tw * 0.7} // タイルの中央に合わせる
                    y={y - tw * 0.9}       // タイルの上面の中央下部に立てる
                    width={tw * 1.4}       // タイルの幅に合わせて拡大
                    height={tw * 1.4}
                    opacity={0.95} 
                    style={{ filter: buildingFilter, imageRendering: 'pixelated' }} 
                />
            )}

            {/* ハイライト */}
            <line x1={x + 2 * ds} y1={y + 1} x2={x + tw - 2 * ds} y2={y + 1} stroke={colors.hi} strokeWidth={ds} strokeLinecap="round" opacity={0.5} />

            {/* アイコンとラベル（建物がない場合のみ表示） */}
            {!hasBuilding && (
                <>
                    <text 
                        x={x + tw/2} 
                        y={y + th * 0.55} 
                        textAnchor="middle" 
                        fontSize={iconSize} 
                        pointerEvents="none"
                    >
                        {iconStr}
                    </text>
                    <text 
                        x={x + tw/2} 
                        y={y + th * 0.85} 
                        textAnchor="middle" 
                        fill={`rgba(255,255,255,${0.5 + ds * 0.4})`} 
                        fontSize={fontSize} 
                        fontFamily="'DotGothic16', monospace" 
                        fontWeight="bold" 
                        pointerEvents="none"
                    >
                        {tile.name}
                    </text>
                </>
            )}

            {/* オーナーフラグ */}
            {isJinchi && (
                <circle cx={x + tw - 4 * ds} cy={y + 4 * ds} r={4 * ds} fill={owner.color} />
            )}

            {/* フィールドの缶・ゴミ表示（ds倍率を文字サイズに適用） */}
            {(tile.fieldCans > 0 || tile.fieldTrash > 0) && !isFog && (
                <text 
                    x={x + tw/2} 
                    y={y - 5 * ds} 
                    textAnchor="middle" 
                    fontSize={fontSize + 2} 
                    fill="#fff" 
                    pointerEvents="none" 
                    style={{ textShadow: "1px 1px 2px #000" }}
                >
                    {tile.fieldCans > 0 ? `🥫${tile.fieldCans}` : ''} {tile.fieldTrash > 0 ? `🗑️${tile.fieldTrash}` : ''}
                </text>
            )}

            {/* NPCトークン（ds倍率を文字サイズとY座標に適用） */}
            {!isFog && (
                <text 
                    x={x + tw/2} 
                    y={y - 10 * ds} 
                    textAnchor="middle" 
                    fontSize={iconSize * 1.2} 
                    pointerEvents="none"
                >
                    {isTruck ? '🚛' : isPolice ? '👮' : isUncle ? '🧓' : isAnimal ? '🐀' : isYakuza ? '😎' : isLoanshark ? '💀' : isFriend ? '🤝' : ''}
                </text>
            )}

            {/* パスプレビューのハイライト */}
            {pathClass && (
                <rect 
                    x={x} y={y} 
                    width={tw} height={th} 
                    rx={3 * ds} 
                    fill="none" 
                    stroke="rgba(255, 255, 255, 0.5)" 
                    strokeWidth={2 * ds} 
                />
            )}
        </g>
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