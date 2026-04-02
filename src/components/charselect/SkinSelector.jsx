import React from 'react';

/**
 * スキン選択UI（将来拡張用）
 * characters.js に skins データを追加した際に本格化する。
 * 現時点では「デフォルト」のみ表示し、拡張ポイントを用意。
 */
export const SkinSelector = ({ charKey, color }) => {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        fontSize: 10, color: '#8d6e63', fontWeight: 700, marginBottom: 6,
        fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: 2,
      }}>
        ▸ スキン
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* デフォルトスキン（常に選択状態）*/}
        <div style={{
          width: 34, height: 34, borderRadius: 6, 
          border: `2px solid ${color}`,
          background: `linear-gradient(135deg, ${color}44, ${color}22)`,
          boxShadow: `0 0 10px ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, color: '#fdf5e6', fontWeight: 700,
        }}>
          ✓
        </div>

        {/* ロックされた将来スキン */}
        {[1, 2].map(i => (
          <div key={i} style={{
            width: 34, height: 34, borderRadius: 6,
            border: '1px dashed rgba(141,110,99,0.3)',
            background: 'rgba(30,25,20,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, opacity: 0.3, cursor: 'not-allowed',
          }}>
            🔒
          </div>
        ))}

        <span style={{
          fontSize: 9, color: 'rgba(141,110,99,0.5)', marginLeft: 4,
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
        }}>
          COMING SOON
        </span>
      </div>
    </div>
  );
};
