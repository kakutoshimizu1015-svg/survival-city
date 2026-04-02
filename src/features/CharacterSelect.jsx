import React, { useMemo } from 'react';
import ClayButton from '../components/common/ClayButton';
import { useGameStore } from '../store/useGameStore';
import { charEmoji, charInfo } from '../constants/characters';
import { CharacterGrid } from '../components/charselect/CharacterGrid';
import { CharacterPreview } from '../components/charselect/CharacterPreview';

export const CharacterSelect = () => {
    const players = useGameStore(state => state.players) || [];
    const setGameState = useGameStore(state => state.setGameState);
    
    const [selectingPlayerIndex, setSelectingPlayerIndex] = React.useState(0);
    const [playerChoices, setPlayerChoices] = React.useState({}); // {playerId: charType}
    const [hoveredChar, setHoveredChar] = React.useState(null);

    // 安全対策: charEmojiが空の場合のフォールバック
    const charTypes = useMemo(() => {
        const keys = Object.keys(charEmoji || {});
        return keys.length > 0 ? keys : ['survivor'];
    }, []);

    const selectingPlayer = useMemo(() => players[selectingPlayerIndex] || {}, [players, selectingPlayerIndex]);

    const handleCharClick = (charType) => {
        const disabled = Object.values(playerChoices).includes(charType);
        if (disabled) return;
        
        setPlayerChoices(prev => ({ ...prev, [selectingPlayer.id]: charType }));
        useGameStore.getState().showToast(`${selectingPlayer.name || 'プレイヤー'} が ${charInfo[charType]?.name || 'キャラクター'} を選択しました`);

        if (selectingPlayerIndex < players.length - 1) {
            setSelectingPlayerIndex(prev => prev + 1);
        } else {
            // 全員選択完了
            const finalPlayers = players.map(p => ({
                ...p,
                charType: playerChoices[p.id] || charType // 最後の人の選択を反映
            }));
            setGameState({ players: finalPlayers, gamePhase: 'playing' });
            useGameStore.getState().addEventPopup(0, "✅", "ゲーム開始！", "キャラクターの選択が完了しました", "good");
        }
    };

    return (
        <div id="screen-char-select" style={{ position: 'fixed', inset: '0', background: 'linear-gradient(to right, #b0b0b0, #f0c830, #f8f8f8)', display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(62,47,42,0.95)', padding: '10px 20px', borderRadius: '10px', color: '#fdf5e6', border: '3px solid #fdf5e6', textAlign: 'center', marginBottom: '16px', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
                <h1 style={{ fontSize: '22px', color: '#f1c40f', textShadow: '2px 2px 0 rgba(0,0,0,0.4)', margin: '0 0 6px 0' }}>SURVIVOR SELECT</h1>
                <p style={{ fontSize: '13px', margin: 0, fontWeight: 'bold' }}>
                    <span style={{ color: selectingPlayer?.color || '#fff' }}>{selectingPlayer?.name || 'プレイヤー'}</span> のキャラクターを選択してください。
                </p>
            </div>

            <div style={{ display: 'flex', flexGrow: 1, gap: '20px', minHeight: 0 }}>
                {/* プレビューパネル */}
                <div style={{ flex: 1.2, height: '100%' }}>
                    <CharacterPreview charType={hoveredChar || playerChoices[selectingPlayer?.id] || charTypes[0]} />
                </div>
                
                {/* グリッドパネル（CharacterGridコンポーネントに委譲） */}
                <div style={{ flex: 1, height: '100%' }}>
                    <CharacterGrid 
                        charTypes={charTypes}
                        playerChoices={playerChoices}
                        selectingPlayer={selectingPlayer}
                        hoveredChar={hoveredChar}
                        onCharClick={handleCharClick}
                        onHoverChar={setHoveredChar}
                    />
                </div>
            </div>
            
            <ClayButton style={{ position: 'absolute', bottom: '24px', right: '24px' }} onClick={() => setGameState({ gamePhase: 'mode_select' })}>タイトルへ戻る</ClayButton>
        </div>
    );
};

export default CharacterSelect;