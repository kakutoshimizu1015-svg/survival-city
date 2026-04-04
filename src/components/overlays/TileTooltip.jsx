import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';

export const TileTooltip = () => {
    // Storeからはテキストデータと表示フラグ(visible)のみを購読
    const tooltipData = useGameStore(state => state.tooltipData);
    const tooltipRef = useRef(null);

    // マウス/タッチ座標への追従処理（Reactの再レンダリングを通さず直接DOM操作）
    useEffect(() => {
        if (!tooltipData || !tooltipData.visible || !tooltipRef.current) return;

        const updatePosition = (clientX, clientY) => {
            const el = tooltipRef.current;
            if (!el) return;
            
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                // ▼ 修正: スマホの場合は指と被らないよう、画面上部中央に固定表示する
                el.style.left = '50%';
                el.style.top = '12%'; 
                el.style.transform = 'translateX(-50%)';
            } else {
                // PC用: カーソル追従 (以前と同じロジック)
                const x = clientX + 14;
                const y = clientY - 10;
                // 画面外にはみ出さないための調整
                el.style.left = `${Math.min(x, window.innerWidth - 220)}px`;
                el.style.top = `${Math.max(y, 4)}px`;
                el.style.transform = 'none';
            }
        };

        // ▼ 修正: Tile.jsxから渡された初期座標がある場合は、touchmoveを待たずに即座に描画
        if (tooltipData.x !== undefined && tooltipData.y !== undefined) {
            updatePosition(tooltipData.x, tooltipData.y);
        } else {
            // 安全策のフォールバック
            updatePosition(window.innerWidth / 2, window.innerHeight / 2);
        }

        const handleMouseMove = (e) => {
            updatePosition(e.clientX, e.clientY);
        };

        const handleTouchMove = (e) => {
            if (e.touches && e.touches.length > 0) {
                updatePosition(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        // windowに対してイベントリスナーを登録
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [tooltipData]); // tooltipData が変更された（表示された）時だけイベントを付け外し

    // 非表示の時はレンダリングしない
    if (!tooltipData || !tooltipData.visible) return null;

    return (
        <div
            id="tile-tooltip"
            ref={tooltipRef}
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
                display: 'block', // 常に block
                maxWidth: '200px',
                width: 'max-content', // ▼ 追加: 中央寄せの際に潰れるのを防ぐ
                boxShadow: '0 4px 16px rgba(0,0,0,0.8)',
                lineHeight: 1.5,
                // 初期位置は画面外か左上にしておく。すぐに useEffect で正しい位置に上書きされる
                left: '-999px',
                top: '-999px',
                willChange: 'left, top, transform' // GPUアクセラレーションのヒント
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