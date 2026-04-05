import { useUserStore } from '../store/useUserStore';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export const playSfx = (type) => {
    try {
        const volume = useUserStore.getState().volume ?? 1.0;
        if (volume <= 0) return;

        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        let baseGain = 0;
        
        if (type === 'dice') { o.type = 'square'; o.frequency.value = 440; baseGain = 0.15; g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15); o.start(); o.stop(audioCtx.currentTime + 0.15); }
        else if (type === 'coin') { o.type = 'sine'; o.frequency.value = 880; baseGain = 0.15; g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); o.start(); o.stop(audioCtx.currentTime + 0.3); }
        else if (type === 'hit') { o.type = 'sawtooth'; o.frequency.value = 150; baseGain = 0.15; g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2); o.start(); o.stop(audioCtx.currentTime + 0.2); }
        else if (type === 'success') { 
            o.type = 'sine'; o.frequency.value = 523; baseGain = 0.15; 
            setTimeout(() => { 
                const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain(); 
                o2.connect(g2); g2.connect(audioCtx.destination); 
                g2.gain.value = 0.15 * volume; 
                o2.type = 'sine'; o2.frequency.value = 659; 
                g2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); 
                o2.start(); o2.stop(audioCtx.currentTime + 0.3); 
            }, 150); 
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2); 
            o.start(); o.stop(audioCtx.currentTime + 0.2); 
        }
        else if (type === 'fail') { o.type = 'sawtooth'; o.frequency.value = 200; baseGain = 0.15; o.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.4); g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4); o.start(); o.stop(audioCtx.currentTime + 0.4); }
        else if (type === 'move') { o.type = 'triangle'; o.frequency.value = 600; baseGain = 0.08; g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); o.start(); o.stop(audioCtx.currentTime + 0.1); }
        else if (type === 'death') { o.type = 'sawtooth'; o.frequency.value = 300; baseGain = 0.15; o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.8); g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8); o.start(); o.stop(audioCtx.currentTime + 0.8); }
        else if (type === 'win') { o.type = 'sine'; o.frequency.value = 523; baseGain = 0.15; g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5); o.start(); o.stop(audioCtx.currentTime + 0.5); }
        else if (type === 'card') { o.type = 'triangle'; o.frequency.value = 1047; baseGain = 0.1; g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2); o.start(); o.stop(audioCtx.currentTime + 0.2); }
        
        g.gain.value = baseGain * volume;
    } catch(e) { console.error("SFX Error", e); }
};