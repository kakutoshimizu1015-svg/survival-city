import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getScenarioSteps, exitTutorialSandbox, tutSandboxNextStep } from '../../game/sandbox';

export const SandboxGuide = () => {
    const { sandboxActive, sandboxScenario, sandboxStep } = useGameStore();
    const steps = sandboxScenario >= 0 ? getScenarioSteps(sandboxScenario) : [];
    const stepData = steps[sandboxStep];
    const highlightRef = useRef(null);

    useEffect(() => {
        if (!sandboxActive || !stepData) return;
        if (stepData.setup) stepData.setup();

        let interval;
        if (stepData.watchCondition) {
            interval = setInterval(() => {
                if (stepData.watchCondition()) {
                    clearInterval(interval);
                    setTimeout(() => tutSandboxNextStep(), 600);
                }
            }, 300);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [sandboxActive, sandboxScenario, sandboxStep]);

    useEffect(() => {
        if (!sandboxActive || !stepData?.highlight) {
            if (highlightRef.current) highlightRef.current.style.display = 'none';
            return;
        }
        let raf;
        const updateRing = () => {
            const el = document.querySelector(stepData.highlight);
            const ring = highlightRef.current;
            if (el && ring) {
                const rect = el.getBoundingClientRect();
                ring.style.display = 'block';
                ring.style.top = (rect.top - 6) + 'px';
                ring.style.left = (rect.left - 6) + 'px';
                ring.style.width = (rect.width + 12) + 'px';
                ring.style.height = (rect.height + 12) + 'px';
            }
            raf = requestAnimationFrame(updateRing);
        };
        raf = requestAnimationFrame(updateRing);
        return () => { if (raf) cancelAnimationFrame(raf); };
    }, [sandboxActive, sandboxStep, stepData]);

    if (!sandboxActive) return null;

    if (!stepData) {
        return (
            <div style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 29000, width: '92%', maxWidth: '520px', background: 'linear-gradient(145deg, #141428, #0a0a19)', border: '3px solid #f1c40f', borderRadius: '16px', boxShadow: '0 0 40px rgba(241,196,15,0.25), 0 8px 32px rgba(0,0,0,0.6)', color: '#fdf5e6', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(241,196,15,0.1)', borderBottom: '1px solid rgba(241,196,15,0.2)' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#f1c40f' }}>✅ 体験完了！</span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '32px', float: 'left', marginRight: '12px', marginBottom: '4px' }}>🎉</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#d5d5e0' }}><b>お疲れ様でした！</b><br/>チュートリアルに戻って続きを読むか、このまま自由にプレイできます。</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', border: '2px solid #e74c3c', background: 'rgba(231,76,60,0.15)', color: '#e74c3c' }} onClick={exitTutorialSandbox}>📚 チュートリアルに戻る</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div ref={highlightRef} style={{ position: 'fixed', zIndex: 28000, pointerEvents: 'none', border: '4px solid #f1c40f', borderRadius: '12px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.55), 0 0 20px rgba(241,196,15,0.6)', display: 'none', transition: 'all 0.1s' }}></div>
            <div style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 29000, width: '92%', maxWidth: '520px', background: 'linear-gradient(145deg, #141428, #0a0a19)', border: '3px solid #f1c40f', borderRadius: '16px', boxShadow: '0 0 40px rgba(241,196,15,0.25), 0 8px 32px rgba(0,0,0,0.6)', color: '#fdf5e6', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(241,196,15,0.1)', borderBottom: '1px solid rgba(241,196,15,0.2)' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#f1c40f' }}>{stepData.title || '📚 体験モード'}</span>
                    <span style={{ fontSize: '11px', color: '#95a5a6' }}>{sandboxStep + 1} / {steps.length}</span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '32px', float: 'left', marginRight: '12px', marginBottom: '4px' }}>{stepData.icon || '👆'}</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#d5d5e0' }} dangerouslySetInnerHTML={{ __html: stepData.text }}></div>
                </div>
                <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', border: '2px solid #e74c3c', background: 'rgba(231,76,60,0.15)', color: '#e74c3c' }} onClick={exitTutorialSandbox}>📚 チュートリアルに戻る</button>
                    {stepData.waitMode ? (
                        <button style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'default', border: '2px solid #3498db', background: 'rgba(52,152,219,0.15)', color: '#3498db' }}>{stepData.waitMode}</button>
                    ) : (
                        <button style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', border: '2px solid #f1c40f', background: '#f1c40f', color: '#1a1a2e' }} onClick={tutSandboxNextStep}>{stepData.nextLabel || '次へ ▶'}</button>
                    )}
                </div>
            </div>
        </>
    );
};