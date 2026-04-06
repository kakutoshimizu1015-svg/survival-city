import React, { useEffect, useState } from 'react';
import { useLobbyStore } from '../../store/useLobbyStore';

export const ChatOverlay = () => {
    const { chatQueue, removeChatFromQueue } = useLobbyStore();

    return (
        <div style={{
            position: 'absolute',
            bottom: '150px',
            left: 0,
            width: '100%',
            height: '60%',
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            {chatQueue.map((chat) => (
                <ChatItem key={chat.id} chat={chat} onComplete={() => removeChatFromQueue(chat.id)} />
            ))}
        </div>
    );
};

const ChatItem = ({ chat, onComplete }) => {
    const [bottomPos] = useState(() => Math.floor(Math.random() * 60) + '%');

    useEffect(() => {
        const timer = setTimeout(onComplete, 6000); // 6秒かけて消える
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="chat-float-anim" style={{
            position: 'absolute',
            bottom: bottomPos,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textShadow: '1px 1px 2px #000',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
            {chat.sender}: {chat.text}
        </div>
    );
};