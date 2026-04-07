import { ref, push, set } from 'firebase/database';
import { db } from '../lib/firebase';

// ==========================================
// ▼ 開発者専用のシークレットコード
// （※本来は環境変数やバックエンドで管理すべきですが、今回はフロントに持たせています）
// ==========================================
const DEV_SECRET_CODE = "DEV_MAIL_2026";

/**
 * 開発者コードを利用して全体メール（プレゼント付き）を送信する
 * @param {string} devCode - フォームに入力されたパスワード
 * @param {Object} mailData - { title, text, p, cans }
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendGlobalMail = async (devCode, mailData) => {
    // 1. 開発者コードの検証
    if (devCode !== DEV_SECRET_CODE) {
        return { success: false, message: "開発者コードが間違っています。" };
    }

    try {
        // 2. globalMails ノードへ新しいメールをプッシュ
        const globalMailsRef = ref(db, 'globalMails');
        const newMailRef = push(globalMailsRef);

        await set(newMailRef, {
            title: mailData.title || "運営からの手紙",
            text: mailData.text || "",
            p: Number(mailData.p) || 0,
            cans: Number(mailData.cans) || 0,
            timestamp: Date.now()
        });

        return { success: true, message: "全体メールの送信に成功しました！" };
    } catch (error) {
        console.error("全体メール送信エラー:", error);
        return { success: false, message: "送信中に通信エラーが発生しました。" };
    }
};