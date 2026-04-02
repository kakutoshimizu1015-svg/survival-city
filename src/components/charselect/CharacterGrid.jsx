import React from 'react';
import { charEmoji, charInfo } from '../../constants/characters';
import { CharacterIcon } from './CharacterIcon';

export const CharacterGrid = ({ charTypes, playerChoices, selectingPlayer, hoveredChar, onCharClick, onHoverChar }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '10px', height: '100%' }}>
            {charTypes.map(charType => {
                const isSelectedByCurrent = playerChoices[selectingPlayer?.id] === charType;
                const isDisabled = Object.values(playerChoices).includes(charType) && !isSelectedByCurrent;
                const isHovered = hoveredChar === charType;
                
                let status = isDisabled ? 'disabled' : isSelectedByCurrent ? 'selected' : isHovered ? 'hover' : 'idle';
                
                return (
                    <CharacterIcon
                        key={charType}
                        charType={charType}
                        name={charInfo[charType]?.name || '???'}
                        emoji={charEmoji[charType]}
                        status={status}
                        onClick={() => onCharClick(charType)}
                        onMouseEnter={() => onHoverChar(charType)}
                        onMouseLeave={() => onHoverChar(null)}
                    />
                );
            })}
        </div>
    );
};

export default CharacterGrid;