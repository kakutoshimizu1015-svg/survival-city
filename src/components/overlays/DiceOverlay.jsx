import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

export const DiceOverlay = () => {
    const diceAnim = useGameStore(state => state.diceAnim);
    const [displayD1, setDisplayD1] = useState(1);
    const [displayD2, setDisplayD2] = useState(1);

    // アニメーション用のランダム数字切り替え
    useEffect(() => {
        let interval;
        // isStopped が false（計算式が含まれていない）なら回し続ける
        const isRolling = diceAnim.active && !diceAnim.text.includes('=');
        
        if (isRolling) {
            interval = setInterval(() => {
                setDisplayD1(Math.floor(Math.random() * 6) + 1);
                setDisplayD2(Math.floor(Math.random() * 6) + 1);
            }, 100);
        } else if (diceAnim.active) {
            // 止まったら実際の出目を表示
            setDisplayD1(diceAnim.d1);
            setDisplayD2(diceAnim.d2);
        }
        return () => clearInterval(interval);
    }, [diceAnim]);

    if (!diceAnim.active) return null;

    const isStopped = diceAnim.text.includes('=');

    return (
        <div id="dice-overlay" style={{ display: 'flex' }}>
            <div id="dice-message">{isStopped ? '' : diceAnim.text}</div>
            <div className="dice-container">
                <div className={`dice ${isStopped ? 'stopped' : 'rolling'}`}>{displayD1}</div>
                <div className={`dice ${isStopped ? 'stopped' : 'rolling'}`}>{displayD2}</div>
            </div>
            <div id="dice-result">{isStopped ? diceAnim.text : ''}</div>
        </div>
    );
};