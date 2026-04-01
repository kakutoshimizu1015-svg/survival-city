import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export const TileTooltip = () => {
    const { tooltipData } = useGameStore();

    if (!tooltipData) return null;

    return (
        <div
            id="tile-tooltip"
            style={{
                position: 'fixed',
                zIndex: 9800,
                background: 'rgba(10,10,20,0.97)',
                color: '#fdf5e6',
                border: '2px solid #f1c40f',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 'bold',
                pointerEvents: 'none',
                display: 'block',
                maxWidth: '200px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.8)',
                lineHeight: 1.5,
                left: `${Math.min(tooltipData.x + 14, window.innerWidth - 220)}px`,
                top: `${Math.max(tooltipData.y - 10, 4)}px`,
            }}
        >
            <div className="tt-title" style={{ fontSize: '15px', color: '#f1c40f', borderBottom: '1px dashed #8d6e63', paddingBottom: '4px', marginBottom: '4px' }}>
                {tooltipData.title}
            </div>
            <div className="tt-desc" style={{ fontSize: '12px', color: '#bdc3c7', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {tooltipData.desc}
            </div>
        </div>
    );
};