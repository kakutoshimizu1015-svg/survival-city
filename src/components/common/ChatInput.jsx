import React, { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useLobbyStore } from '../../store/useLobbyStore';

export const ChatInput = () => {
    const [text, setText] = useState('');
    const { status, isHost, connections, hostConnection, myUserId, lobbyPlayers } = useNetworkStore();
    const { addChatToQueue } = useLobbyStore();

    // オンライン接続時のみ表示
    if (status !== 'connected') return null;

    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        
        const me = lobbyPlayers.find(p => p.userId === myUserId);
        const senderName = me ? me.name : '名無し';
        
        const chatData = {
            id: Date.now() + Math.random(),
            sender: senderName,
            text: text.trim(),
        };

        // 1. 自身の画面上に流す
        addChatToQueue(chatData);
        
        // 2. 自身のログ領域に追加
        const logger = document.getElementById("log");
        if (logger) {
            const chatHtml = `<div style="color: #007bff; margin: 4px 0;">[チャット] ${senderName}: ${chatData.text}</div>`;
            logger.insertAdjacentHTML('beforeend', chatHtml);
            logger.scrollTop = logger.scrollHeight;
        }

        // 3. 通信で送信
        const data = { type: 'CHAT', chat: chatData };
        if (isHost) {
            connections.forEach(c => c.open && c.send(data));
        } else if (hostConnection && hostConnection.open) {
            hostConnection.send(data);
        }

        setText('');
    };

    return (
        <div style={{ width: '100%', padding: '0 5px', boxSizing: 'border-box' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', width: '100%', marginTop: '5px', gap: '5px' }}>
                <input 
                    type="text" 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    placeholder="メッセージを入力..." 
                    maxLength="40"
                    style={{ flexGrow: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', outline: 'none' }}
                />
                <button type="submit" className="clay-btn" style={{ padding: '10px 16px', whiteSpace: 'nowrap', borderRadius: '8px', border: 'none', backgroundColor: '#e2d5c3', fontWeight: 'bold', cursor: 'pointer', boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                    送信
                </button>
            </form>
        </div>
    );
};