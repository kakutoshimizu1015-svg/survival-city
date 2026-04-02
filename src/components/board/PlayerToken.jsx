import React, { useState, useEffect, useRef, useCallback } from 'react';
import { charEmoji, charImages } from '../../constants/characters';
import { useGameStore } from '../../store/useGameStore';

// マスのグリッドサイズ設定 (GameBoardのCSSと合わせる)
const TILE_SIZE = 60;
const TILE_GAP = 20;
const BOARD_PADDING = 30;

const getPixelCoords = (col, row) => {
  return {
    x: BOARD_PADDING + (col - 1) * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
    y: BOARD_PADDING + (row - 1) * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
  };
};

export const PlayerToken = ({ player, mapData, isActiveTurn }) => {
  const isImage = charImages[player.charType] !== undefined;
  
  // 初期位置
  const initialTile = mapData.find(t => t.id === player.pos) || mapData[0];
  const initialCoords = getPixelCoords(initialTile.col, initialTile.row);
  
  const [animPos, setAnimPos] = useState(initialCoords);
  const [facing, setFacing] = useState(-1); // -1=right, 1=left
  const [isMoving, setIsMoving] = useState(false);
  
  const [spinAngle, setSpinAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const animRef = useRef(null);
  const spinRef = useRef(null);
  const prevPosRef = useRef(player.pos);

  // ペーパーマリオ風の回転アニメーション (サバイバー専用)
  const triggerSpin = useCallback((newFacing) => {
    return new Promise((resolve) => {
      if (isSpinning || !isImage) { 
        setFacing(newFacing);
        resolve(); 
        return; 
      }
      setIsSpinning(true);
      const startTime = performance.now();
      const spinDur = 550;

      const animateSpin = (now) => {
        const t = Math.min((now - startTime) / spinDur, 1);
        const eased = t < 0.3 ? (t / 0.3) ** 2 * 0.3 : t > 0.7 ? 0.7 + (1 - ((1 - t) / 0.3) ** 2) * 0.3 : 0.3 + (t - 0.3) / 0.4 * 0.4;
        
        setSpinAngle(eased * Math.PI * 2);
        
        if (t >= 0.5 && facing !== newFacing) setFacing(newFacing);
        
        if (t < 1) {
          spinRef.current = requestAnimationFrame(animateSpin);
        } else {
          setSpinAngle(0);
          setFacing(newFacing);
          setIsSpinning(false);
          resolve();
        }
      };
      spinRef.current = requestAnimationFrame(animateSpin);
    });
  }, [isSpinning, facing, isImage]);

  // 移動アニメーション
  useEffect(() => {
    if (prevPosRef.current === player.pos) return;
    
    const startTile = mapData.find(t => t.id === prevPosRef.current);
    const endTile = mapData.find(t => t.id === player.pos);
    
    if (!startTile || !endTile) {
      prevPosRef.current = player.pos;
      return;
    }

    const startCoords = getPixelCoords(startTile.col, startTile.row);
    const endCoords = getPixelCoords(endTile.col, endTile.row);
    
    const dx = endCoords.x - startCoords.x;
    let newFacing = facing;
    if (dx > 0) newFacing = -1;
    else if (dx < 0) newFacing = 1;

    const runAnimation = async () => {
      if (newFacing !== facing && isImage) {
        await triggerSpin(newFacing);
      } else {
        setFacing(newFacing);
      }

      setIsMoving(true);
      const startTime = performance.now();
      const dur = 350;

      const animateMove = (now) => {
        const t = Math.min((now - startTime) / dur, 1);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const jumpArc = -4 * (t - 0.5) * (t - 0.5) + 1;
        const jumpHeight = 30 + Math.abs(endCoords.y - startCoords.y) * 0.2 + Math.abs(endCoords.x - startCoords.x) * 0.1;

        setAnimPos({
          x: startCoords.x + dx * eased,
          y: startCoords.y + (endCoords.y - startCoords.y) * eased - jumpArc * jumpHeight,
        });

        if (t < 1) {
          animRef.current = requestAnimationFrame(animateMove);
        } else {
          setAnimPos(endCoords);
          setIsMoving(false);
          prevPosRef.current = player.pos;
        }
      };
      animRef.current = requestAnimationFrame(animateMove);
    };

    runAnimation();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (spinRef.current) cancelAnimationFrame(spinRef.current);
    };
  }, [player.pos, mapData, facing, isImage, triggerSpin]);

  // レンダリング用の計算
  const spinWidth = isSpinning ? Math.max(0.02, Math.abs(Math.cos(spinAngle))) : 1;
  const effectiveScaleX = facing * spinWidth;
  const showBack = isSpinning && spinAngle > Math.PI * 0.45 && spinAngle < Math.PI * 1.55;
  const spinHop = isSpinning ? Math.sin(spinAngle) * -8 : 0;
  
  // プレイヤーカラーの枠など
  const borderColor = isActiveTurn ? '#ffe066' : player.color;

  return (
    <div style={{
      position: 'absolute',
      left: animPos.x,
      top: animPos.y + spinHop,
      transform: 'translate(-50%, -50%)',
      zIndex: 10 + (player.pos % 100), // 手前に来るように調整可能
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transition: isMoving ? 'none' : 'transform 0.1s',
    }}>
      <div style={{
        width: 44, height: 44,
        border: `3px solid ${borderColor}`,
        borderRadius: isImage ? '8px' : '50%', // サバイバーは四角っぽく、絵文字は丸く
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isActiveTurn ? `0 0 15px ${borderColor}` : '0 4px 6px rgba(0,0,0,0.5)',
        transform: `scaleX(${effectiveScaleX})`,
        overflow: 'hidden'
      }}>
        {isImage ? (
          <img 
            src={showBack ? charImages[player.charType].back : charImages[player.charType].front} 
            alt={player.name} 
            style={{ width: '120%', height: '120%', objectFit: 'contain', transform: `scaleX(${facing})` }} 
            // 枠ごと反転すると画像も反転してしまうため、imgタグで再度反転して相殺する
          />
        ) : (
          <span style={{ fontSize: '24px', transform: `scaleX(${facing})` }}>
            {charEmoji[player.charType]}
          </span>
        )}
      </div>

      {/* プレイヤー名ラベル (回転させないためコンテナの外に配置) */}
      <div style={{
        marginTop: 2, fontSize: '10px', fontWeight: 900, color: player.color,
        textShadow: '1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000',
        whiteSpace: 'nowrap', maxWidth: '48px', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {player.name}
      </div>
    </div>
  );
};