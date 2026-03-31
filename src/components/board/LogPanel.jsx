import React from 'react';

export const LogPanel = () => {
    return (
        <div id="log-area" style={{ width: '100%', marginTop: '10px' }}>
            <div id="log-panel-clay" className="panel" style={{ width: '100%', position: 'relative' }}>
                <div id="log" style={{ height: '120px', overflowY: 'scroll', textAlign: 'left', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', color: '#5c4a44' }}>
                    <div>&gt; ゲーム画面の読み込みが完了しました。</div>
                    <div>&gt; （ここに今後のログが表示されます）</div>
                </div>
            </div>
        </div>
    );
};