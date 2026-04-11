import React, { useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { getCircularOffset } from '../../utils/gameLogic';
import { CharImage } from '../common/CharImage';
import { TOKEN_CONFIG } from '../../constants/characters';
import { MAP_CONFIG } from '../../constants/maps';

const SHOW_TILE_TEXT = false;

export const tileTooltipData = {
    center:    { title:"🏥 病院（スタート地点）", desc:"HPが0になると強制送還。最大15P没収・装備1つロスト。" },
    normal:    { title:"🛣️ 通常の道", desc:"特別な効果なし。移動の通過点。" },
    normal_slum: { title:"🏚️ スラムの道", desc:"【陣地化可能】コスト:3P / 維持費:0P / 収入:1P\n治安が悪く、道端にはゴミや空き缶が転がっていることが多い。" },
    normal_commercial: { title:"🏙️ 商業の道", desc:"【陣地化可能】コスト:3P/ 維持費:1P / 収入:2P\n人通りが多く、バイトやショップへのアクセスが良い。" },
    normal_luxury: { title:"🏰 高級住宅街の道", desc:"【陣地化可能】コスト:3P/ 維持費:2P / 収入:3P\n閑静な住宅街。家賃収入が高いが、警察のパトロールも多い。" },
    can:       { title:"🥫 空き缶", desc:"1APで缶を拾う（1ターン3回まで）。雨の日は雨具が必要。" },
    trash:     { title:"🗑️ ゴミ山", desc:"2APでゴミを漁る。失敗するとパトカーに補導されAP-2ペナルティ。" },
    exchange:  { title:"💱 買取所", desc:"拾った缶・ゴミを現在相場でP換金（0AP）。" },
    job:       { title:"💼 バイト", desc:"3APで挑戦。成功率60-80%で12P獲得。" },
    shop:      { title:"🛒 ショップ", desc:"カードを購入（4-6P）または手持ちカードを2Pで売却できる。" },
    event:     { title:"🎲 イベント", desc:"ミニゲームまたはストーリーイベントが発生！カード獲得のチャンス。" },
    shelter:   { title:"🏕️ 避難所", desc:"止まるとステルス状態になり、次の敵を1回やり過ごせる。" },
    manhole:   { title:"🕳️ マンホール", desc:"1APで別のマンホールへランダムワープ。" },
    koban:     { title:"🚓 交番", desc:"職務質問でその場に足止め。このターンは移動不可。" },
    slum:      { title:"🏚️ スラムエリア", desc:"缶・ゴミが多い。相場が低め。" },
    commercial:{ title:"🏙️ 商業エリア", desc:"バイト・ショップが充実。中程度の相場。" },
    luxury:    { title:"🏰 高級エリア", desc:"収入が高い。パトカーが多くパトロールする。" },
};

export const Tile = React.memo(({ 
    tile, owner, isFog, isNight, isClickable, isDashTarget, onClick, maxRow,
    isTruck, isPolice, isUncle, isAnimal, isYakuza, isLoanshark, isFriend, pathClass,
    // 【最適化】GameBoard.jsxからpropsで受け取る（Zustand購読8個を撤廃）
    players, npcs, horrorMode
}) => {
    // setTooltipDataのみ残す（アクション関数はZustand購読してもre-renderを起こさない）
    const setTooltipData = useGameStore(state => state.setTooltipData);

    // ▼ 探偵の罠システム用ステート
    const traps = useGameStore(state => state.traps);
    const isTrapScanActive = useGameStore(state => state.isTrapScanActive);
    const turnPlayer = useGameStore(state => state.players[state.turn]);

    // npcsをdestructure（後方互換：propsがない場合は空オブジェクトで安全に動作）
    const { truckPos, policePos, unclePos, animalPos, yakuzaPos, loansharkPos, friendPos } = npcs || {};

    const isHorrorTruckTile = horrorMode && isTruck;
    
    const liteMode = useUserStore(state => state.liteMode); 
    const showTileLabels = useUserStore(state => state.showTileLabels);

    const touchTimer = useRef(null);

    const handleMouseEnter = (e, initialX = 0, initialY = 0) => {
        const wrapper = document.getElementById('game-board-wrapper');
        if (wrapper && wrapper.classList.contains('dragging')) return;
        if (isClickable) return; 
        
        let ttKey = tile.type in tileTooltipData ? tile.type : tile.area;
        
        // ★追加: 道マス(normal)の場合はエリアごとにキーを分ける
        if (tile.type === 'normal') {
            ttKey = `normal_${tile.area}`;
        }

        const ttData = tileTooltipData[ttKey] || tileTooltipData['normal']; // ★万が一データがない場合の安全対策
        if (ttData) {
            let descText = ttData.desc;
            const npcPosMap = [
                { pos: policePos,    info: { emoji:'🚓', name:'パトカー', desc:'遭遇すると次回AP-2' } },
                { pos: unclePos,     info: { emoji:'🧓', name:'厄介なおじさん', desc:'遭遇すると手札をランダムに1枚破棄' } },
                { pos: animalPos,    info: { emoji:'🐀', name:'野良動物', desc:'遭遇すると缶拾い/ゴミ漁り不可' } },
                { pos: yakuzaPos,    info: { emoji:'😎', name:'ヤクザ', desc:'遭遇すると15〜20ダメ＋カード1枚強奪' } },
                { pos: loansharkPos, info: { emoji:'💀', name:'闇金', desc:'遭遇すると所持Pの20%(最大20P)没収' } },
                { pos: friendPos,    info: { emoji:'🤝', name:'仲間のホームレス', desc:'出会うと缶を1個もらえる' } },
            ];
            const npcsHere = npcPosMap.filter(n => n.pos === tile.id);
            if (npcsHere.length > 0) {
                descText += '\n─────\n' + npcsHere.map(n => `${n.info.emoji}${n.info.name}: ${n.info.desc}`).join('\n');
            }

            if (owner) {
                descText += `\n─────\n🚩 所有者: ${owner.name}`;
            }

            let x = initialX, y = initialY;
            if (e && e.clientX !== undefined) {
                x = e.clientX;
                y = e.clientY;
            }

            setTooltipData({ title: ttData.title, desc: descText, visible: true, x, y });
        }
    };

    const handleMouseLeave = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        setTooltipData(null); 
    };

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        const startX = touch.clientX;
        const startY = touch.clientY;
        touchTimer.current = setTimeout(() => { 
            handleMouseEnter(null, startX, startY); 
        }, 80); 
    };

    const handleTouchEndOrCancel = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        setTimeout(handleMouseLeave, 1500);
    };

    let classNameStr = `tile ${tile.type} ${tile.area}`;
    if (isFog && !isHorrorTruckTile) classNameStr += ' night-fog';
    // 【修正】夜間の可視タイルに温かい発光エフェクトを適用（以前は削除されていた）
    if (!isFog && isNight && !isHorrorTruckTile) classNameStr += ' night-visible';
    
    if (isClickable) {
        if (isDashTarget) {
            classNameStr += ' tile-highlight-dash';
        } else {
            classNameStr += ' tile-highlight-branch';
        }
    }
    
    if (pathClass) classNameStr += ` ${pathClass}`;

    const iconStr = tile.type === 'can' ? '🥫' : tile.type === 'trash' ? '🗑️' : tile.type === 'shop' ? '🛒' : tile.type === 'job' ? '💼' : tile.type === 'koban' ? '👮' : tile.type === 'event' ? '❗' : tile.type === 'exchange' ? '💰' : tile.type === 'shelter' ? '🏕️' : tile.type === 'center' ? '🏥' : '';
    const isJinchi = owner !== null && owner !== undefined;

    // 動的にオフセットを計算する関数に置き換え
    const getNpcStyle = (npcId, isTruck = false) => {
        const offset = getCircularOffset(npcId, tile.id, players, npcs, TOKEN_CONFIG.npc.offsetRadius);
        return {
            position: 'absolute', left: '50%', bottom: isTruck ? '10%' : '15%', zIndex: 5, pointerEvents: 'none',
            transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)`,
            opacity: isTruck ? (horrorMode ? 1 : TOKEN_CONFIG.npc.truckOpacity) : 1,
            transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
        };
    };

    // ★ 中身がはみ出さないためのサイズ自動計算
    const emojiSize = Math.max(14, MAP_CONFIG.TILE_SIZE * 0.32);
    const labelSize = Math.max(8, MAP_CONFIG.TILE_SIZE * 0.12);
    const badgeSize = Math.max(9, MAP_CONFIG.TILE_SIZE * 0.15);

    // JS側での色計算ロジック（areaBgColor, areaBorder）を削除し、CSSクラス管理に一元化

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
                opacity: (isFog && !isHorrorTruckTile) ? 0.2 : 1,
                zIndex: isHorrorTruckTile ? 9999 : tile.row,

                width: `${MAP_CONFIG.TILE_SIZE}px`,
                height: `${MAP_CONFIG.TILE_SIZE}px`,
                minWidth: `${MAP_CONFIG.TILE_SIZE}px`,
                minHeight: `${MAP_CONFIG.TILE_SIZE}px`,
                boxSizing: 'border-box', // ★ 枠線などを内側に含める
                flexShrink: 0,           // ★ 潰れるのを防ぐ
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                placeSelf: 'center'
                // インラインスタイルでの色指定を削除
            }}
        >
            <div style={{ fontSize: `${emojiSize}px`, zIndex: 2, pointerEvents: 'none', lineHeight: 1 }}>{iconStr}</div>
            
            {SHOW_TILE_TEXT && (
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 'bold', zIndex: 2, pointerEvents: 'none', textAlign: 'center', lineHeight: 1.2, maxWidth: '90%', overflow: 'hidden', whiteSpace: 'nowrap', opacity: 0.9 }}>{tile.name}</div>
            )}
            
            {showTileLabels && (
                <div style={{
                    position: 'absolute', top: '2px', left: '2px', zIndex: 10,
                    background: 'rgba(0,0,0,0.65)', color: tile.next?.length > 1 ? '#f1c40f' : '#fff', 
                    padding: '1px 3px', borderRadius: '3px', fontSize: `${labelSize}px`, fontWeight: 'bold', pointerEvents: 'none',
                    border: tile.next?.length > 1 ? '1px solid #f1c40f' : 'none'
                }}>
                    {tile.next?.length > 1 ? `${tile.id} (分岐)` : tile.id}
                </div>
            )}

            {isJinchi && <div className="owner-mark-clay" style={{ display: 'block', backgroundColor: owner.color, fontSize: `${badgeSize}px`, zIndex: 3, padding: '2px', minWidth: 'auto', minHeight: 'auto' }}>🚩</div>}

            {(tile.fieldCans > 0 || tile.fieldTrash > 0) && (!isFog || isHorrorTruckTile) && (
                <div style={{ position:'absolute', top:'-10%', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'2px', zIndex:5, background:'rgba(0,0,0,0.7)', borderRadius:'5px', padding:'1px 3px', fontSize: `${badgeSize}px`, whiteSpace:'nowrap' }}>
                    {tile.fieldCans > 0 && <span>🥫{tile.fieldCans}</span>}
                    {tile.fieldTrash > 0 && <span>🗑️{tile.fieldTrash}</span>}
                </div>
            )}
            
            {(!isFog || isHorrorTruckTile) && isTruck && (
                <CharImage charType="truck" size={TOKEN_CONFIG.npc.truckSize} style={getNpcStyle('truck', true)} className="truck-token" />
            )}
            
            {!isFog && isPolice    && <CharImage charType="police"    size={TOKEN_CONFIG.npc.policeSize}    style={getNpcStyle('police')} />}
            {!isFog && isUncle     && <CharImage charType="uncle"     size={TOKEN_CONFIG.npc.uncleSize}     style={getNpcStyle('uncle')} />}
            {!isFog && isAnimal    && <CharImage charType="animal"    size={TOKEN_CONFIG.npc.animalSize}    style={getNpcStyle('animal')} />}
            {!isFog && isYakuza    && <CharImage charType="yakuza"    size={TOKEN_CONFIG.npc.yakuzaSize}    style={getNpcStyle('yakuza')} />}
            {!isFog && isLoanshark && <CharImage charType="loanshark" size={TOKEN_CONFIG.npc.loansharkSize} style={getNpcStyle('loanshark')} />}
            {!isFog && isFriend    && <CharImage charType="friend"    size={TOKEN_CONFIG.npc.friendSize}    style={getNpcStyle('friend')} />}

            {/* ▼ 罠の描画（透過して表示） */}
            {traps?.map((trap, idx) => {
                if (trap.tileId !== tile.id) return null;
                
                // ▼ スキャンボタンを押している（isTrapScanActive） 且つ 自分が仕掛けた罠（trap.ownerId === turnPlayer?.id）の場合のみ可視化
                const isVisible = isTrapScanActive && trap.ownerId === turnPlayer?.id;
                if (!isVisible) return null;
                
                const trapEmoji = trap.type === 'police' ? '👮' : trap.type === 'pitfall' ? '🕳️' : '📡';
                return (
                    <div key={`trap-${idx}`} style={{
                        position: 'absolute', bottom: '2px', right: '2px', zIndex: 4, pointerEvents: 'none',
                        fontSize: `${badgeSize * 1.5}px`, opacity: 0.8, filter: 'drop-shadow(0 0 3px red)'
                    }}>
                        {trapEmoji}
                    </div>
                );
            })}
        </div>
    );
}, 
(prev, next) => {
    if (prev.tile.id !== next.tile.id) return false;
    if (prev.isFog !== next.isFog) return false;
    if (prev.isNight !== next.isNight) return false;
    if (prev.isClickable !== next.isClickable) return false;
    if (prev.isDashTarget !== next.isDashTarget) return false; 
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
    // 【最適化】propsで受け取るようになった値の比較
    if (prev.horrorMode !== next.horrorMode) return false;
    // npcsはGameBoardで個別にisXxxフラグとして渡されるため、ここではポインタ比較のみ
    if (prev.npcs !== next.npcs) return false;
    // players: 同じマスにいるプレイヤー数が変わる可能性があるため長さで比較
    if (prev.players?.length !== next.players?.length) return false;
    if (prev.players?.some((p, i) => p.pos !== next.players?.[i]?.pos || p.hp !== next.players?.[i]?.hp)) return false;
    return true;
});