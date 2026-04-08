import React, { useState } from 'react';
import { sendGlobalMail } from '../../utils/adminLogic';

// ▼ 3つのテンプレート定義
const TEMPLATES = {
    A: { 
        name: "【A】重大なバグ・進行不能",
        title: "【重要】不具合のお詫びとアイテム補填について", 
        body: "いつも『ホームレスサバイバルシティ』をプレイしていただきありがとうございます。運営チームです。\n\n下記の期間において、ゲームの進行やスコアに重大な影響を与える不具合が発生しておりました。\n\n【修正内容】\n{{DETAIL}}\n\n本件の対象期間中にプレイされていた皆様には、多大なるご迷惑をおかけしましたことを深くお詫び申し上げます。\nお詫びとして、ささやかではございますが本メールにアイテムを添付いたしました。お受け取りいただけますと幸いです。\n\n引き続き、本作をよろしくお願いいたします。" 
    },
    B: { 
        name: "【B】軽微なバグ・表示修正",
        title: "不具合修正のお知らせとプレゼント", 
        body: "いつもプレイしていただきありがとうございます！\n本日のアップデートにて、以下の不具合を修正いたしました。\n\n【修正内容】\n{{DETAIL}}\n\nご不便をおかけしたお詫びとして、アイテムをお送りいたします。\n今後とも『ホームレスサバイバルシティ』をお楽しみください！" 
    },
    C: { 
        name: "【C】サーバー障害・メンテ",
        title: "サーバー障害（緊急メンテナンス）のお詫び", 
        body: "いつも本作をお楽しみいただきありがとうございます。\n\n先ほど、ネットワーク接続が不安定になる問題が発生したため、緊急の修正対応を実施いたしました。\n\n【対応内容】\n{{DETAIL}}\n\nプレイ中に通信が切断されてしまった皆様へ、心よりお詫び申し上げます。\nお詫びの品を添付いたしましたので、次回プレイ時にお役立てください。" 
    }
};

export const AdminMailConsole = ({ onClose }) => {
    const [devCode, setDevCode] = useState('');
    const [templateType, setTemplateType] = useState('A');
    const [detail, setDetail] = useState('');
    const [p, setP] = useState(0);
    const [cans, setCans] = useState(0);
    const [statusMsg, setStatusMsg] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!devCode) { setStatusMsg("⚠️ パスワードを入力してください"); return; }
        if (!detail) { setStatusMsg("⚠️ 修正内容（詳細）を入力してください"); return; }

        setIsSending(true);
        setStatusMsg("🔄 送信中...");

        // テンプレートの {{DETAIL}} 部分を入力された詳細テキストに置換
        const selectedTpl = TEMPLATES[templateType];
        const finalBodyText = selectedTpl.body.replace('{{DETAIL}}', detail);

        const mailData = {
            title: selectedTpl.title,
            text: finalBodyText,
            p: Number(p),
            cans: Number(cans)
        };

        const result = await sendGlobalMail(devCode, mailData);
        
        setStatusMsg(result.success ? "✅ " + result.message : "❌ " + result.message);
        setIsSending(false);

        if (result.success) {
            setTimeout(() => { if(onClose) onClose(); }, 2000);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                background: '#1e272e', border: '2px solid #e1b12c', borderRadius: '8px',
                padding: '20px', width: '90%', maxWidth: '500px', color: '#f5f6fa'
            }}>
                <h2 style={{ color: '#e1b12c', marginTop: 0, borderBottom: '1px solid #555', paddingBottom: '10px' }}>
                    🛠️ 運営メール送信コンソール
                </h2>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>開発者パスワード</label>
                    <input 
                        type="password" value={devCode} onChange={e => setDevCode(e.target.value)}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', background: '#2f3640', color: 'white', border: '1px solid #718093' }}
                        placeholder="DEV_MAIL_2026"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>お詫びテンプレート</label>
                    <select 
                        value={templateType} onChange={e => setTemplateType(e.target.value)}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', background: '#2f3640', color: 'white', border: '1px solid #718093' }}
                    >
                        {Object.entries(TEMPLATES).map(([key, tpl]) => (
                            <option key={key} value={key}>{tpl.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>詳細（修正内容や対応内容）</label>
                    <textarea 
                        value={detail} onChange={e => setDetail(e.target.value)}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', height: '80px', background: '#2f3640', color: 'white', border: '1px solid #718093' }}
                        placeholder="例：陣地の維持費のみが徴収され、収入が加算されない不具合を修正いたしました。"
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>補填 P</label>
                        <input type="number" min="0" value={p} onChange={e => setP(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', background: '#2f3640', color: 'white', border: '1px solid #718093' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>補填 空き缶</label>
                        <input type="number" min="0" value={cans} onChange={e => setCans(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', background: '#2f3640', color: 'white', border: '1px solid #718093' }} />
                    </div>
                </div>

                {statusMsg && (
                    <div style={{ marginBottom: '15px', fontSize: '14px', color: statusMsg.includes('✅') ? '#4cd137' : '#e84118' }}>
                        {statusMsg}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: '#718093', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>閉じる</button>
                    <button onClick={handleSend} disabled={isSending} style={{ padding: '8px 16px', background: '#e1b12c', color: '#2f3640', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {isSending ? '送信中...' : '全体メール送信'}
                    </button>
                </div>
            </div>
        </div>
    );
};