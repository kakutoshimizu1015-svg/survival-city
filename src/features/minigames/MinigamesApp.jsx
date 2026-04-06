import React, { useState, useEffect, useRef, useCallback } from "react"
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { syncGachaData } from '../../utils/userLogic';

/* ─── utils ─────────────────────────────── */
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const sleep = ms => new Promise(r => setTimeout(r, ms))
const beep = (freq = 440, dur = 0.1) => {
  try {
    const a = new (window.AudioContext || window.webkitAudioContext)()
    const o = a.createOscillator(), g = a.createGain()
    o.connect(g); g.connect(a.destination)
    o.frequency.value = freq
    g.gain.setValueAtTime(0.25, a.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur)
    o.start(); o.stop(a.currentTime + dur)
  } catch (_) {}
}

/* ─── CSS ────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Bebas+Neue&display=swap');
:root{--bg:#0c0a07;--card:#1a1309;--card2:#241a0e;--card3:#2e2213;--border:#3d2e1a;--border2:#5a4228;--amber:#c97b2a;--gold:#e8b84b;--gold2:#ffd166;--green2:#4e8539;--red2:#b52e1e;--text:#d4c4a0;--dim:#7a6a4a;--white:#f0e8d0;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
@keyframes popIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
@keyframes glow{0%,100%{box-shadow:0 0 10px rgba(232,184,75,.3)}50%{box-shadow:0 0 30px rgba(232,184,75,.8)}}
@keyframes jackpot{0%{transform:scale(1)}25%{transform:scale(1.1) rotate(-2deg)}75%{transform:scale(1.1) rotate(2deg)}100%{transform:scale(1)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes flyBuzz{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
@keyframes lightBlink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes jumpAnim{0%{bottom:24px}50%{bottom:88px}100%{bottom:24px}}
@keyframes rainFall{from{transform:translateY(-10px);opacity:0}to{transform:translateY(100vh);opacity:.5}}
@keyframes coinDrop{from{transform:translateX(-50%) translateY(-15px);opacity:1}to{transform:translateX(-50%) translateY(25px);opacity:0}}
@keyframes catchFx{from{transform:scale(.5) translateY(0);opacity:1}to{transform:scale(1.5) translateY(-40px);opacity:0}}
.runner-jump{animation:jumpAnim .5s ease!important;}
.lightdot{width:9px;height:9px;border-radius:50%;background:var(--amber);box-shadow:0 0 8px var(--amber);animation:lightBlink 1s ease infinite;}
.lightdot:nth-child(2){animation-delay:.2s}.lightdot:nth-child(3){animation-delay:.4s}.lightdot:nth-child(4){animation-delay:.6s}.lightdot:nth-child(5){animation-delay:.8s}
.rain-drop{position:absolute;color:#6af;animation:rainFall linear infinite;opacity:.4;font-size:.85rem;user-select:none;}
.fly-el{position:absolute;font-size:2.1rem;cursor:pointer;user-select:none;z-index:10;line-height:1;}
.catch-fx{position:absolute;pointer-events:none;z-index:20;font-size:1.1rem;font-weight:900;animation:catchFx .5s ease-out forwards;}
.rat-el{position:absolute;font-size:1.7rem;cursor:pointer;user-select:none;z-index:10;}
.rat-fx{position:absolute;pointer-events:none;z-index:20;font-size:1rem;font-weight:900;animation:catchFx .5s ease-out forwards;}
.bento-el{position:absolute;font-size:1.7rem;z-index:8;}
.music-note{position:absolute;height:38px;border-radius:8px;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:700;z-index:10;}
.coin-drop{position:absolute;bottom:22px;left:50%;font-size:1.1rem;animation:coinDrop .5s ease-in forwards;pointer-events:none;}
`
function GlobalStyles() { return <style dangerouslySetInnerHTML={{ __html: CSS }} /> }

/* ─── Shared UI ─────────────────────────── */
const S = {
  screen: { position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',overflowY:'auto',overflowX:'hidden',background:'#0c0a07', color:'var(--text)', fontFamily:"'Noto Sans JP',sans-serif", zIndex:1000 },
  header: { width:'100%',display:'flex',alignItems:'center',gap:'.7rem',padding:'.65rem .9rem',background:'rgba(0,0,0,.65)',backdropFilter:'blur(8px)',borderBottom:'1px solid #3d2e1a',position:'sticky',top:0,zIndex:50,flexShrink:0 },
  body: { flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'1rem',width:'100%',maxWidth:500,margin:'0 auto',gap:'.85rem' },
  card: { background:'#1a1309',border:'1px solid #3d2e1a',borderRadius:13,padding:'1rem .8rem',cursor:'pointer',textAlign:'center',userSelect:'none',position:'relative',overflow:'hidden',transition:'transform .18s cubic-bezier(.34,1.56,.64,1),border-color .15s,background .15s' },
  instr: { fontSize:'.78rem',color:'#7a6a4a',textAlign:'center',lineHeight:1.6,background:'rgba(0,0,0,.4)',padding:'.5rem .9rem',borderRadius:8,border:'1px solid #3d2e1a',width:'100%' },
  btnPrim: { background:'linear-gradient(135deg,#c97b2a,#8a5010)',border:'none',borderRadius:12,color:'#f0e8d0',font:"700 1rem 'Noto Sans JP',sans-serif",padding:'.75rem 2.2rem',cursor:'pointer',boxShadow:'0 4px 20px rgba(201,123,42,.4)',userSelect:'none' },
  statBox: { background:'#241a0e',border:'1px solid #3d2e1a',borderRadius:8,padding:'.35rem .9rem',textAlign:'center',fontSize:'.85rem' },
  resultBox: { textAlign:'center',animation:'popIn .4s cubic-bezier(.34,1.56,.64,1)',background:'#241a0e',border:'1px solid #5a4228',borderRadius:14,padding:'.9rem 1.2rem',width:'100%' },
  dangerTrack: { width:'100%',height:13,background:'#2e2213',borderRadius:7,overflow:'hidden',border:'1px solid #3d2e1a' },
  wetTrack: { width:'100%',height:13,background:'#2e2213',borderRadius:7,overflow:'hidden',border:'1px solid #3d2e1a' },
}

function BackBtn({ onClick }) {
  return <button onClick={onClick} style={{ background:'#2e2213',border:'1px solid #3d2e1a',color:'#d4c4a0',padding:'.35rem .9rem',borderRadius:6,cursor:'pointer',font:"inherit",fontSize:'.82rem',flexShrink:0 }}>← 戻る</button>
}
function BtnPrim({ children, onClick, disabled, style }) {
  return <button onClick={onClick} disabled={disabled} style={{ ...S.btnPrim, ...(disabled ? {opacity:.4,cursor:'not-allowed'} : {}), ...style }}>{children}</button>
}
function StatBox({ label, val, style }) {
  return <div style={S.statBox}><span style={{ fontSize:'.6rem',color:'#7a6a4a',letterSpacing:'.1em',display:'block' }}>{label}</span><span style={{ fontWeight:700,color:'#f0e8d0',...style }}>{val}</span></div>
}
function DangerBar({ pct, color='#c97b2a' }) {
  return <div style={S.dangerTrack}><div style={{ height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#4e8539,#c97b2a,#b52e1e)',borderRadius:7,transition:'width .3s ease' }} /></div>
}
function Instr({ children }) { return <div style={S.instr}>{children}</div> }
function ResultBox({ result }) {
  if (!result) return null
  const { win, icon, main, sub, pts: p } = result
  return (
    <div style={S.resultBox}>
      <div style={{ fontSize:'.8rem',fontWeight:900,letterSpacing:'.15em',padding:'.2rem .8rem',borderRadius:20,display:'inline-block',marginBottom:'.35rem', background:win?'rgba(78,133,57,.3)':'rgba(140,35,24,.3)', color:win?'#90e060':'#ff8070', border:`1px solid ${win?'#4e8539':'#8c2318'}` }}>{win?'✅ SUCCESS':'❌ FAILED'}</div>
      <div style={{ fontSize:'1.35rem',fontWeight:900,color:win?'#e8b84b':'#b52e1e' }}>{icon} {main}</div>
      {sub && <div style={{ fontSize:'.82rem',color:'#7a6a4a',marginTop:'.25rem' }}>{sub}</div>}
      {p > 0 && <div style={{ fontSize:'.95rem',color:'#e8b84b',fontWeight:700,marginTop:'.3rem' }}>+{p}P ゲット！</div>}
    </div>
  )
}
function GameHeader({ title, pts, timer, onBack }) {
  return (
    <div style={S.header}>
      <BackBtn onClick={onBack} />
      <span style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.3rem',color:'#c97b2a',letterSpacing:'.05em' }}>{title}</span>
      <span style={{ fontSize:'.82rem',color:'#e8b84b',fontWeight:700 }}>💰{pts}P</span>
      {timer != null && <span style={{ marginLeft:'auto',fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.5rem',color:timer<=3?'#b52e1e':'#e8b84b',minWidth:'2rem',textAlign:'right' }}>{timer}</span>}
    </div>
  )
}

/* ─── Timer hook ────────────────────────── */
function useTimer(secs, onEnd) {
  const [time, setTime] = useState(secs)
  const ivRef = useRef(null)
  const doneRef = useRef(false)
  const cbRef = useRef(onEnd)
  cbRef.current = onEnd

  const start = useCallback((overrideSecs) => {
    const total = overrideSecs ?? secs
    doneRef.current = false
    setTime(total)
    clearInterval(ivRef.current)
    let t = total
    ivRef.current = setInterval(() => {
      t--
      setTime(t)
      if (t <= 0) {
        clearInterval(ivRef.current)
        if (!doneRef.current) { doneRef.current = true; cbRef.current() }
      }
    }, 1000)
  }, [secs])

  const stop = useCallback(() => {
    doneRef.current = true
    clearInterval(ivRef.current)
  }, [])

  useEffect(() => () => clearInterval(ivRef.current), [])
  return { time, start, stop }
}

/* ════════════════════════════════════════
   G1: 箱選びゲーム
════════════════════════════════════════ */
function BoxGame({ pts, addPts, onBack }) {
  const [msg, setMsg] = useState('シャッフル中…')
  const [states, setStates] = useState(['','',''])
  const [result, setResult] = useState(null)
  const doneRef = useRef(false)
  const winRef = useRef(-1)
  const autoRef = useRef(null)
  const { time, start, stop } = useTimer(10, () => { if (!doneRef.current) pick(rnd(0,2)) })

  const pick = useCallback(async (idx) => {
    if (doneRef.current) return
    doneRef.current = true; stop(); clearTimeout(autoRef.current)
    const win = idx === winRef.current
    setStates(prev => { const n=[...prev]; n[idx]=win?'win':'lose'; return n })
    await sleep(400)
    if (!win) setStates(prev => { const n=[...prev]; n[winRef.current]='win'; return n })
    await sleep(200)
    setStates(prev => prev.map((s,i) => (i===idx||i===winRef.current) ? s : 'dim'))
    const prizes=[{e:'🥫',l:'空き缶発見！',p:3},{e:'💰',l:'お金を見つけた！',p:10},{e:'🍺',l:'ビール缶ゲット！',p:5}]
    const pr=prizes[rnd(0,2)]
    if (win) { addPts(pr.p); setResult({win:true,icon:pr.e,main:pr.l,pts:pr.p}) }
    else setResult({win:false,icon:'💀',main:'ハズレ…',sub:'また挑戦しな',pts:0})
  }, [stop, addPts])

  const init = useCallback(async () => {
    doneRef.current=false; winRef.current=rnd(0,2)
    setResult(null); setMsg('シャッフル中…'); setStates(['','',''])
    for (let r=0;r<6;r++) {
      const a=rnd(0,2),b=(a+1+rnd(0,1))%3
      setStates(prev=>{const n=[...prev];n[a]='shake';n[b]='shake';return n})
      await sleep(300)
      setStates(prev=>{const n=[...prev];if(n[a]==='shake')n[a]='';if(n[b]==='shake')n[b]='';return n})
      await sleep(70)
    }
    setMsg('どれだ！10秒以内に選べ！')
    start()
  }, [start])

  useEffect(() => { init() }, []) // eslint-disable-line

  const boxStyle = (s) => ({
    width:100,height:110,
    background: s==='win'?'linear-gradient(145deg,#2a5a18,#163a0a)':s==='lose'?'linear-gradient(145deg,#5a1818,#3a0a0a)':'linear-gradient(145deg,#9b7520,#5c4010)',
    border:`3px solid ${s==='win'?'#4a8a28':s==='lose'?'#8a2828':'#7a5a18'}`,
    borderRadius:8,cursor:doneRef.current?'default':'pointer',
    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
    fontSize:'2.6rem',position:'relative',boxShadow:'0 6px 20px rgba(0,0,0,.6)',
    opacity:s==='dim'?0.4:1,transition:'transform .18s',animation:s==='shake'?'shake .35s ease':s==='win'?'glow 1.5s ease infinite':'none',
    userSelect:'none'
  })

  return (
    <div style={S.screen}>
      <GameHeader title="📦 箱選びゲーム" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>{msg}</Instr>
        <div style={{display:'flex',gap:'1rem',justifyContent:'center'}}>
          {states.map((s,i)=>(
            <div key={i} style={boxStyle(s)} onClick={()=>!doneRef.current&&s!=='dim'&&pick(i)}>
              {s==='win'?'✅':s==='lose'?'❌':'📦'}
              <span style={{position:'absolute',bottom:6,fontFamily:"'Bebas Neue',sans-serif",fontSize:'.75rem',color:'rgba(255,255,255,.4)'}}>BOX {i+1}</span>
            </div>
          ))}
        </div>
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G2: ボロ自販機ガチャ
════════════════════════════════════════ */
const VEND_WIN=[{e:'💰',l:'コイン大量発見！',p:15},{e:'🥤',l:'コーヒー缶！',p:10},{e:'🎁',l:'謎のプレゼント！',p:12}]
const VEND_LOSE=[{e:'❌',l:'空っぽ…',p:0},{e:'🕷️',l:'クモが出た！',p:0},{e:'💨',l:'何も出てこない…',p:0}]
const VEND_COLORS=[['#2a3020','#3d4a30','#4a6a38'],['#2a2010','#3d3018','#6a5020'],['#102030','#182838','#204858']]

function VendGame({ pts, addPts, onBack }) {
  const [choices, setChoices] = useState([])
  const [screens, setScreens] = useState(['?','?','?'])
  const [dimmed, setDimmed] = useState([false,false,false])
  const [result, setResult] = useState(null)
  const [showCoin, setShowCoin] = useState(-1)
  const doneRef = useRef(false)
  const choicesRef = useRef([])
  const { time, start, stop } = useTimer(10, () => { if (!doneRef.current) pick(rnd(0,2)) })

  const pick = useCallback(async (idx) => {
    if (doneRef.current) return
    doneRef.current = true; stop()
    const ch = choicesRef.current
    for (const f of ['⚙️','🔄','⚡','🔄']) {
      setScreens(prev => { const n=[...prev]; n[idx]=f; return n })
      await sleep(130)
    }
    setScreens(prev => { const n=[...prev]; n[idx]=ch[idx].e; return n })
    if (ch[idx].p > 0) { setShowCoin(idx); setTimeout(()=>setShowCoin(-1), 600) }
    await sleep(250)
    for (let i=0;i<3;i++) {
      if (i!==idx) {
        setScreens(prev => { const n=[...prev]; n[i]=ch[i].e; return n })
        setDimmed(prev => { const n=[...prev]; n[i]=true; return n })
        await sleep(250)
      }
    }
    const pr = ch[idx]
    if (pr.p > 0) { addPts(pr.p); setResult({win:true,icon:pr.e,main:pr.l,pts:pr.p}) }
    else setResult({win:false,icon:'💀',main:'空っぽ…',sub:'3台のうちハズレを選んだ',pts:0})
  }, [stop, addPts])

  const init = useCallback(() => {
    doneRef.current = false
    const win = VEND_WIN[rnd(0,VEND_WIN.length-1)]
    const losers = [...VEND_LOSE].sort(()=>Math.random()-.5).slice(0,2)
    const ch = [win,...losers].sort(()=>Math.random()-.5)
    choicesRef.current = ch; setChoices(ch)
    setScreens(['?','?','?']); setDimmed([false,false,false]); setResult(null); setShowCoin(-1)
    start()
  }, [start])

  useEffect(() => { init() }, []) // eslint-disable-line

  return (
    <div style={S.screen}>
      <GameHeader title="🏧 ボロ自販機ガチャ" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>3台のうち当たりは1台だけ！はずれ2台は空っぽ！</Instr>
        <div style={{display:'flex',gap:'.8rem',justifyContent:'center'}}>
          {choices.map((ch,i)=>(
            <div key={i} onClick={()=>!doneRef.current&&!dimmed[i]&&pick(i)} style={{
              width:110,height:180,borderRadius:'8px 8px 4px 4px',cursor:dimmed[i]||doneRef.current?'default':'pointer',
              display:'flex',flexDirection:'column',alignItems:'center',padding:'.5rem .4rem',
              position:'relative',border:`3px solid ${VEND_COLORS[i][2]}`,
              background:`linear-gradient(180deg,${VEND_COLORS[i][0]},${VEND_COLORS[i][1]})`,
              opacity:dimmed[i]?0.4:1,transition:'transform .18s,opacity .3s',boxShadow:'-4px 4px 15px rgba(0,0,0,.7)',userSelect:'none'
            }}>
              <div style={{width:'85%',height:62,background:'#080f08',border:'2px solid #1a2a1a',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.9rem',marginBottom:'.35rem'}}>
                {screens[i]==='?'?<span style={{opacity:.45,fontSize:'1.5rem'}}>?</span>:<span>{screens[i]}</span>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2,width:'85%',marginBottom:'.25rem'}}>
                {[0,1,2].map(j=><div key={j} style={{height:12,borderRadius:2,border:'1px solid rgba(255,255,255,.1)',background:VEND_COLORS[i][2]}}/>)}
              </div>
              <div style={{width:'55%',height:16,background:'#050505',border:'2px solid #1a1a1a',borderRadius:2,marginTop:'auto',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.6rem',color:'#444'}}>↓</div>
              <div style={{fontSize:'.6rem',color:'rgba(255,255,255,.35)',marginTop:3,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:'.1em'}}>{['缶ジュース','エナジー','ビール'][i]}</div>
              {showCoin===i && <div className="coin-drop">🪙</div>}
            </div>
          ))}
        </div>
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G3: ハイ＆ロー
════════════════════════════════════════ */
const SUITS=['♠','♥','♦','♣'],CVALS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],CNUMS=[1,2,3,4,5,6,7,8,9,10,11,12,13]

function HLGame({ pts, addPts, onBack }) {
  const [deck, setDeck] = useState([])
  const [idx, setIdx] = useState(0)
  const [streak, setStreak] = useState(0)
  const [nextCard, setNextCard] = useState(null)
  const [result, setResult] = useState(null)
  const doneRef = useRef(false)
  const streakRef = useRef(0)
  const idxRef = useRef(0)
  const deckRef = useRef([])
  const guessing = useRef(false)
  const { time, start, stop } = useTimer(10, () => { if (!doneRef.current) endHL() })

  const endHL = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true; stop()
    const p = streakRef.current * 5
    const win = streakRef.current >= 3
    if (win) addPts(p)
    setResult({win,icon:win?'🎉':'💀',main:win?`${streakRef.current}連続正解！`:'連続3回に届かず…',sub:`${streakRef.current}連続 × 5P`,pts:win?p:0})
  }, [stop, addPts])

  const guess = useCallback(async (dir) => {
    if (doneRef.current || guessing.current) return
    guessing.current = true
    const d = deckRef.current; const i = idxRef.current
    const cur = d[i], nxt = d[i+1]
    if (!nxt) { endHL(); guessing.current = false; return }
    setNextCard(nxt)
    const ok = (dir==='h' && nxt.n>=cur.n)||(dir==='l' && nxt.n<=cur.n)
    await sleep(450)
    if (ok) {
      streakRef.current++; setStreak(streakRef.current)
      idxRef.current++; setIdx(idxRef.current)
      await sleep(550)
      setNextCard(null)
      guessing.current = false
    } else {
      doneRef.current = true; stop()
      await sleep(300)
      const win = false
      setResult({win,icon:'💀',main:'ハズレ…',sub:`${streakRef.current}連続で止まった`,pts:0})
      guessing.current = false
    }
  }, [endHL, stop])

  const init = useCallback(() => {
    doneRef.current=false; streakRef.current=0; idxRef.current=0; guessing.current=false
    const d=[]
    for(const s of SUITS) for(let i=0;i<CVALS.length;i++) d.push({s,v:CVALS[i],n:CNUMS[i]})
    d.sort(()=>Math.random()-.5)
    deckRef.current=d; setDeck(d); setIdx(0); setStreak(0); setNextCard(null); setResult(null)
    start()
  }, [start])

  useEffect(() => { init() }, []) // eslint-disable-line

  const cur = deckRef.current[idxRef.current] || deckRef.current[0]
  const Card = ({c,faceDown}) => {
    const red = c && (c.s==='♥'||c.s==='♦')
    return (
      <div style={{width:118,height:168,borderRadius:12,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 30px rgba(0,0,0,.8)',position:'relative',overflow:'hidden', background:faceDown?undefined:'linear-gradient(145deg,#f2eada,#e0d2b0)',border:faceDown?'3px solid #2a3a6a':'3px solid #c4a870', backgroundImage:faceDown?'repeating-linear-gradient(45deg,#1a2a5a 0px,#1a2a5a 6px,#0f1a3a 6px,#0f1a3a 12px)':undefined}}>
        {faceDown ? <span style={{fontSize:'2.8rem'}}>🂠</span> : c && <>
          <div style={{position:'absolute',top:7,left:9,fontSize:'.8rem',fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:red?'#cc2222':'#1a0a0a',lineHeight:1.1}}>{c.v}<br/>{c.s}</div>
          <div style={{fontSize:'3rem',color:red?'#cc2222':'#1a0a0a',fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",lineHeight:1}}>{c.v}</div>
          <div style={{fontSize:'1.8rem',color:red?'#cc2222':'#1a0a0a'}}>{c.s}</div>
          <div style={{position:'absolute',bottom:7,right:9,fontSize:'.8rem',fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:red?'#cc2222':'#1a0a0a',lineHeight:1.1,transform:'rotate(180deg)'}}>{c.v}<br/>{c.s}</div>
        </>}
      </div>
    )
  }

  return (
    <div style={S.screen}>
      <GameHeader title="🃏 ハイ＆ロー" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>10秒間で連続正解を重ねろ！3連続以上で成功！</Instr>
        <div style={{fontWeight:700,color:'#e8b84b',textAlign:'center'}}>🔥 連続正解: {streak} 回</div>
        <div style={{display:'flex',gap:'1.2rem',alignItems:'center',justifyContent:'center'}}>
          <Card c={cur} faceDown={false}/>
          <span style={{fontSize:'1.8rem',color:'#7a6a4a'}}>→</span>
          <Card c={nextCard} faceDown={!nextCard}/>
        </div>
        {!result && <div style={{display:'flex',gap:'.8rem'}}>
          <button onClick={()=>guess('h')} style={{background:'linear-gradient(135deg,#2a5a1a,#183a0a)',border:'2px solid #4a8a2a',borderRadius:12,color:'#a0e080',font:"700 .95rem 'Noto Sans JP',sans-serif",padding:'.7rem 1.5rem',cursor:'pointer'}}>▲ HIGH</button>
          <button onClick={()=>guess('l')} style={{background:'linear-gradient(135deg,#5a1a1a,#3a0a0a)',border:'2px solid #8a2a2a',borderRadius:12,color:'#e08080',font:"700 .95rem 'Noto Sans JP',sans-serif",padding:'.7rem 1.5rem',cursor:'pointer'}}>▼ LOW</button>
        </div>}
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G4: 路上スロット
════════════════════════════════════════ */
const SLOT_SYMS=['🥫','💰','🍺','🐀','💊','🚬','🗑️']
const SLOT_SH=80, SLOT_TOT=SLOT_SYMS.length*SLOT_SH, SLOT_REPS=3

function SlotGame({ pts, addPts, onBack }) {
  const [running, setRunning] = useState(false)
  const [stoppedResults, setStoppedResults] = useState([null,null,null])
  const [stoppedFlags, setStoppedFlags] = useState([false,false,false])
  const [result, setResult] = useState(null)
  const reelRefs = [useRef(null),useRef(null),useRef(null)]
  const rafRef = useRef(null)
  const reelData = useRef([{offset:0,speed:3.5,stopped:false,result:null},{offset:0,speed:4.2,stopped:false,result:null},{offset:0,speed:3.8,stopped:false,result:null}])
  const runRef = useRef(false)
  const { time, start, stop } = useTimer(10, () => {
    if (!runRef.current) return
    reelData.current.forEach((_,i)=>{ if(!reelData.current[i].stopped) stopReel(i) })
  })

  const tick = useCallback(() => {
    let any = false
    reelData.current.forEach((r,i) => {
      if (!r.stopped) { r.offset = (r.offset + r.speed) % SLOT_TOT; any = true }
      if (reelRefs[i].current) reelRefs[i].current.style.transform = `translateY(${-SLOT_TOT+r.offset}px)`
    })
    if (any) rafRef.current = requestAnimationFrame(tick)
    else checkSlot()
  }, []) // eslint-disable-line

  const checkSlot = useCallback(() => {
    const rs = reelData.current.map(r=>r.result)
    setStoppedResults([...rs])
    const a=rs[0]===rs[1],b=rs[1]===rs[2],c=rs[0]===rs[2]
    const allSame=a&&b, twoSame=a||b||c
    stop(); runRef.current=false; setRunning(false)
    setStoppedFlags([false,false,false])
    reelData.current.forEach(r=>{r.stopped=false;r.result=null})
    if (allSame) {
      const p=rs[0]==='💰'?50:20; addPts(p)
      setResult({win:true,icon:'🎊',main:`ジャックポット！ ${rs.join('')}`,pts:p})
    } else if (twoSame) {
      addPts(5); setResult({win:true,icon:'✨',main:`2つ揃い！ ${rs.join('')}`,pts:5})
    } else {
      setResult({win:false,icon:'💀',main:`ハズレ ${rs.join('')}`,pts:0})
    }
  }, [stop, addPts])

  const stopReel = useCallback((i) => {
    const r = reelData.current[i]
    if (r.stopped || !runRef.current) return
    r.stopped = true
    const iy = SLOT_SH + SLOT_TOT - r.offset
    r.result = SLOT_SYMS[((Math.floor(iy/SLOT_SH)%SLOT_SYMS.length)+SLOT_SYMS.length)%SLOT_SYMS.length]
    setStoppedFlags(prev => { const n=[...prev]; n[i]=true; return n })
    setStoppedResults(prev => { const n=[...prev]; n[i]=r.result; return n })
    if (reelData.current.every(r=>r.stopped)) { cancelAnimationFrame(rafRef.current); setTimeout(checkSlot,150) }
  }, [checkSlot])

  const startSlot = useCallback(() => {
    if (runRef.current) return
    runRef.current = true; setRunning(true); setResult(null)
    setStoppedResults([null,null,null]); setStoppedFlags([false,false,false])
    reelData.current.forEach(r=>{ r.stopped=false; r.result=null; r.offset=Math.random()*SLOT_TOT })
    start(); rafRef.current=requestAnimationFrame(tick)
  }, [start, tick])

  const init = useCallback(() => { setResult(null); setStoppedResults([null,null,null]); setStoppedFlags([false,false,false]); setRunning(false); runRef.current=false }, [])
  useEffect(() => { init(); return ()=>{cancelAnimationFrame(rafRef.current)} }, []) // eslint-disable-line

  useEffect(() => {
    reelRefs.forEach(ref => {
      if (!ref.current) return
      ref.current.innerHTML = ''
      for (let rep=0;rep<SLOT_REPS;rep++) SLOT_SYMS.forEach(s=>{ const d=document.createElement('div'); d.style.cssText='width:84px;height:80px;display:flex;align-items:center;justify-content:center;font-size:2.4rem;user-select:none;'; d.textContent=s; ref.current.appendChild(d) })
    })
  }, []) // eslint-disable-line

  return (
    <div style={S.screen}>
      <GameHeader title="🎰 路上スロット" pts={pts} timer={running?time:null} onBack={onBack}/>
      <div style={S.body}>
        <Instr>10秒以内に全リールをSTOP！時間切れで自動停止！</Instr>
        <div style={{background:'linear-gradient(180deg,#2a1805,#130d03)',border:'4px solid #5a3a12',borderRadius:18,padding:'1rem .9rem',width:'100%',boxShadow:'0 0 40px rgba(201,123,42,.15)'}}>
          <div style={{display:'flex',justifyContent:'center',gap:'.4rem',marginBottom:'.7rem'}}>
            {[0,1,2,3,4].map(i=><div key={i} className="lightdot" style={{animationDelay:`${i*.2}s`}}/>)}
          </div>
          <div style={{display:'flex',gap:'.5rem',justifyContent:'center',marginBottom:'.8rem'}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.4rem'}}>
                <div style={{width:84,height:220,overflow:'hidden',position:'relative',background:'#060402',border:'3px solid #3a2208',borderRadius:8,boxShadow:'inset 0 0 20px rgba(0,0,0,.9)'}}>
                  <div style={{position:'absolute',top:70,left:0,right:0,height:80,borderTop:'2px solid rgba(201,123,42,.7)',borderBottom:'2px solid rgba(201,123,42,.7)',background:'rgba(201,123,42,.05)',zIndex:5}}/>
                  <div style={{position:'absolute',inset:0,zIndex:6,pointerEvents:'none',background:'linear-gradient(to bottom,#060402 0%,transparent 25%,transparent 75%,#060402 100%)'}}/>
                  <div ref={reelRefs[i]} style={{position:'absolute',top:0,left:0,width:'100%'}}/>
                </div>
                <button onClick={()=>stopReel(i)} disabled={!running||stoppedFlags[i]} style={{
                  width:84,background:stoppedFlags[i]?'linear-gradient(135deg,#1a3a08,#0d2005)':'linear-gradient(135deg,#5a2808,#3a1805)',
                  border:`2px solid ${stoppedFlags[i]?'#3a6a18':'#8a4a18'}`,borderRadius:8,
                  color:stoppedFlags[i]?'#90c060':'#e0a070',font:"700 .7rem 'Noto Sans JP',sans-serif",
                  padding:'.45rem .25rem',cursor:running&&!stoppedFlags[i]?'pointer':'not-allowed',opacity:running?1:.35,letterSpacing:'.05em'
                }}>{stoppedFlags[i]&&stoppedResults[i]?`✓ ${stoppedResults[i]}`:'STOP'}</button>
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'.62rem',color:'#7a6a4a',marginBottom:'.4rem'}}>
            <span>💰×3=+50P</span><span>3揃い=+20P</span><span>2揃い=+5P</span>
          </div>
          {!running && !result && <button onClick={startSlot} style={{width:'100%',background:'linear-gradient(135deg,#c97b2a,#7a4808)',border:'none',borderRadius:12,color:'#f0e8d0',font:"700 1rem 'Noto Sans JP',sans-serif",padding:'.8rem',cursor:'pointer'}}>🎰 スタート！</button>}
          {!running && result && <button onClick={startSlot} style={{width:'100%',background:'linear-gradient(135deg,#c97b2a,#7a4808)',border:'none',borderRadius:12,color:'#f0e8d0',font:"700 1rem 'Noto Sans JP',sans-serif",padding:'.8rem',cursor:'pointer'}}>🎰 もう一度！</button>}
        </div>
        <ResultBox result={result}/>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G5: ハエ捕まえ
════════════════════════════════════════ */
function FlyGame({ pts, addPts, onBack }) {
  const [caught, setCaught] = useState(0)
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState(null)
  const [fxList, setFxList] = useState([])
  const arenaRef = useRef(null)
  const flyElRef = useRef(null)
  const rafRef = useRef(null)
  const pos = useRef({x:0,y:0,vx:5,vy:3})
  const caughtRef = useRef(0)
  const doneRef = useRef(false)
  const { time, start, stop } = useTimer(10, () => { if (!doneRef.current) endFly() })

  const endFly = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true; stop(); cancelAnimationFrame(rafRef.current)
    const c = caughtRef.current, win = c >= 3
    if (win) addPts(15)
    setResult({win,icon:win?'🪰🪰🪰':'⏰',main:win?'3匹全部捕まえた！':'時間切れ！',sub:`${c}匹捕獲`,pts:win?15:c*3})
  }, [stop, addPts])

  const moveFly = useCallback(() => {
    if (doneRef.current || !arenaRef.current || !flyElRef.current) return
    const W = arenaRef.current.offsetWidth - 36, H = arenaRef.current.offsetHeight - 36
    const p = pos.current
    if (Math.random() < .04) { const ang=Math.random()*Math.PI*2; const spd=5+caughtRef.current*1.5; p.vx=Math.cos(ang)*spd; p.vy=Math.sin(ang)*spd }
    p.vx += (Math.random()-.5)*.8; p.vy += (Math.random()-.5)*.8
    const spd = Math.hypot(p.vx,p.vy), max = 9+caughtRef.current*1.5
    if (spd>max) { p.vx=p.vx/spd*max; p.vy=p.vy/spd*max }
    p.x += p.vx; p.y += p.vy
    if (p.x<0){p.x=0;p.vx=Math.abs(p.vx)+1} if(p.x>W){p.x=W;p.vx=-Math.abs(p.vx)-1}
    if (p.y<0){p.y=0;p.vy=Math.abs(p.vy)+1} if(p.y>H){p.y=H;p.vy=-Math.abs(p.vy)-1}
    flyElRef.current.style.left = p.x + 'px'
    flyElRef.current.style.top = p.y + 'px'
    flyElRef.current.style.transform = p.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)'
    rafRef.current = requestAnimationFrame(moveFly)
  }, [])

  const catchFly = useCallback((e) => {
    e.stopPropagation()
    if (doneRef.current) return
    caughtRef.current++; setCaught(caughtRef.current)
    const id = Date.now()
    setFxList(prev=>[...prev,{id,x:pos.current.x,y:pos.current.y}])
    setTimeout(()=>setFxList(prev=>prev.filter(f=>f.id!==id)),500)
    if (arenaRef.current) {
      const W=arenaRef.current.offsetWidth-36,H=arenaRef.current.offsetHeight-36
      pos.current.x = 20+Math.random()*(W-20); pos.current.y = 20+Math.random()*(H-20)
      const ang=Math.random()*Math.PI*2, spd=7+caughtRef.current*2
      pos.current.vx=Math.cos(ang)*spd; pos.current.vy=Math.sin(ang)*spd
    }
    if (caughtRef.current >= 3) setTimeout(endFly, 200)
  }, [endFly])

  const startFly = useCallback(() => {
    setStarted(true)
    const W=arenaRef.current.offsetWidth/2, H=arenaRef.current.offsetHeight/2
    const ang=Math.random()*Math.PI*2; pos.current={x:W,y:H,vx:Math.cos(ang)*5,vy:Math.sin(ang)*5}
    start(); rafRef.current=requestAnimationFrame(moveFly)
  }, [start, moveFly])

  const init = useCallback(() => {
    doneRef.current=false; caughtRef.current=0; setCaught(0); setStarted(false); setResult(null); setFxList([])
    cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => { init(); return ()=>{ doneRef.current=true; cancelAnimationFrame(rafRef.current) } }, []) // eslint-disable-line

  return (
    <div style={S.screen}>
      <GameHeader title="🪰 ハエ捕まえ" pts={pts} timer={started&&!result?time:null} onBack={onBack}/>
      <div style={S.body}>
        <Instr>10秒で3匹捕まえたら成功！</Instr>
        <div style={{display:'flex',gap:'1.5rem',alignItems:'center',justifyContent:'center'}}>
          <div style={{textAlign:'center'}}><div style={{fontSize:'.6rem',color:'#7a6a4a',letterSpacing:'.1em'}}>CATCH</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'2.5rem',color:'#e8b84b'}}>{caught}</div></div>
          <div style={{display:'flex',gap:'.35rem'}}>
            {[0,1,2].map(i=><div key={i} style={{width:18,height:18,borderRadius:'50%',border:'2px solid #5a4228',background:i<caught?'#4e8539':'#241a0e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem'}}>{i<caught?'✓':'🪰'}</div>)}
          </div>
        </div>
        <div ref={arenaRef} style={{width:'100%',maxWidth:420,height:310,background:'linear-gradient(160deg,#1a1208,#0d0a05)',border:'2px solid #3d2e1a',borderRadius:14,position:'relative',overflow:'hidden',cursor:'crosshair'}}>
          {!started && !result && (
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'.5rem'}}>
              <div onClick={startFly} style={{fontSize:'4rem',animation:'flyBuzz .3s ease infinite',cursor:'pointer'}}>🪰</div>
              <div style={{fontSize:'.85rem',color:'#7a6a4a'}}>タップでスタート！</div>
            </div>
          )}
          {started && !result && <div ref={flyElRef} className="fly-el" onClick={catchFly}>🪰</div>}
          {fxList.map(f=><div key={f.id} className="catch-fx" style={{left:f.x,top:f.y,color:'#e8b84b'}}>✨+1</div>)}
        </div>
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G6: スクラッチくじ
════════════════════════════════════════ */
const SC_SYMS=['🥫','💰','🍺','🐀','💊','🎁']

function ScratchCell({ sym, onRevealed, disabled }) {
  const cvRef = useRef(null)
  const revealedRef = useRef(false)
  const scratchRef = useRef(false)

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return
    const ctx = cv.getContext('2d')
    const g = ctx.createLinearGradient(0,0,84,84)
    g.addColorStop(0,'#4a3520'); g.addColorStop(.5,'#3a2818'); g.addColorStop(1,'#2e1e10')
    ctx.fillStyle=g; ctx.fillRect(0,0,84,84)
    ctx.strokeStyle='rgba(180,130,70,.15)'; ctx.lineWidth=1
    for(let y=8;y<84;y+=13){ctx.beginPath();ctx.moveTo(0,y+(Math.random()-.5)*3);ctx.lineTo(84,y+(Math.random()-.5)*3);ctx.stroke()}
    ctx.font='bold 26px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.fillStyle='rgba(220,170,80,.6)'; ctx.fillText('？',42,40)
    ctx.font='8px sans-serif'; ctx.fillStyle='rgba(180,140,70,.45)'; ctx.fillText('¥100',42,68)
  }, [])

  const doScratch = useCallback((cx,cy) => {
    if (revealedRef.current || disabled) return
    const cv = cvRef.current; if (!cv) return
    const ctx = cv.getContext('2d')
    ctx.globalCompositeOperation='destination-out'; ctx.beginPath(); ctx.arc(cx,cy,18,0,Math.PI*2); ctx.fill()
    const data=ctx.getImageData(0,0,84,84).data; let tr=0
    for(let p=3;p<data.length;p+=4) if(data[p]<50) tr++
    if(tr/(84*84)>.5 && !revealedRef.current) {
      revealedRef.current=true; cv.style.pointerEvents='none'; onRevealed()
    }
  }, [disabled, onRevealed])

  const handlers = {
    onMouseDown: e=>{ scratchRef.current=true; const r=cvRef.current.getBoundingClientRect(); doScratch(e.clientX-r.left,e.clientY-r.top) },
    onMouseMove: e=>{ if(!scratchRef.current)return; const r=cvRef.current.getBoundingClientRect(); doScratch(e.clientX-r.left,e.clientY-r.top) },
    onMouseUp: ()=>scratchRef.current=false, onMouseLeave: ()=>scratchRef.current=false,
    onTouchStart: e=>{ e.preventDefault(); const r=cvRef.current.getBoundingClientRect(); const t=e.touches[0]; doScratch(t.clientX-r.left,t.clientY-r.top) },
    onTouchMove: e=>{ e.preventDefault(); const r=cvRef.current.getBoundingClientRect(); const t=e.touches[0]; doScratch(t.clientX-r.left,t.clientY-r.top) },
  }

  return (
    <div style={{width:84,height:84,position:'relative',borderRadius:8,overflow:'hidden',border:'2px solid #3d2e1a'}}>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.1rem',background:'#241a0e'}}>{sym}</div>
      <canvas ref={cvRef} width={84} height={84} style={{position:'absolute',inset:0,touchAction:'none',cursor:'crosshair'}} {...handlers}/>
    </div>
  )
}

function ScratchGame({ pts, addPts, onBack }) {
  const [grid, setGrid] = useState([])
  const [revealed, setRevealed] = useState([])
  const [count, setCount] = useState(0)
  const [result, setResult] = useState(null)
  const countRef = useRef(0)
  const revRef = useRef([])
  const gridRef = useRef([])
  const doneRef = useRef(false)
  const { time, start, stop } = useTimer(10, () => { if(!doneRef.current) checkScratch() })

  const checkScratch = useCallback(() => {
    if (doneRef.current) return; doneRef.current=true; stop()
    const revSyms = gridRef.current.filter((_,i)=>revRef.current[i])
    const counts={}; revSyms.forEach(s=>counts[s]=(counts[s]||0)+1)
    const mx=Math.max(0,...Object.values(counts))
    const ws=Object.keys(counts).find(k=>counts[k]===mx)||''
    const win=mx>=2; const p=mx>=3?20:mx>=2?5:0
    if(p>0) addPts(p)
    setResult({win,icon:win?'🎊':'💀',main:win?`${ws}×${mx} 揃い！`:'揃わなかった…',sub:`削ったマス: ${revSyms.join(' ')}`,pts:p})
  }, [stop, addPts])

  const onRevealed = useCallback((i) => {
    if (revRef.current[i]) return
    revRef.current[i]=true; countRef.current++
    setRevealed([...revRef.current]); setCount(countRef.current)
    if (countRef.current>=3) { stop(); setTimeout(checkScratch,600) }
  }, [stop, checkScratch])

  const init = useCallback(() => {
    doneRef.current=false; countRef.current=0; revRef.current=Array(9).fill(false)
    let g=Array.from({length:9},()=>SC_SYMS[rnd(0,5)])
    if(Math.random()<.25){ const sym=SC_SYMS[rnd(0,5)]; const pos=[0,1,2,3,4,5,6,7,8].sort(()=>Math.random()-.5).slice(0,3); pos.forEach(p=>g[p]=sym) }
    gridRef.current=g; setGrid(g); setRevealed(Array(9).fill(false)); setCount(0); setResult(null)
    start()
  }, [start])

  useEffect(() => { init() }, []) // eslint-disable-line

  return (
    <div style={S.screen}>
      <GameHeader title="🪙 スクラッチくじ" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>10秒以内に3マス削れ！2つ以上揃えば成功！</Instr>
        <div style={{fontSize:'.95rem',fontWeight:700,color:'#c97b2a',textAlign:'center'}}>あと {Math.max(0,3-count)} マス削れます</div>
        <div style={{background:'linear-gradient(145deg,#1a1308,#0d0a05)',border:'2px solid #3d2e1a',borderRadius:14,padding:'.9rem',display:'inline-block'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,84px)',gridTemplateRows:'repeat(3,84px)',gap:'.45rem'}}>
            {grid.map((sym,i)=><ScratchCell key={`${i}-${sym}`} sym={sym} disabled={count>=3} onRevealed={()=>onRevealed(i)}/>)}
          </div>
        </div>
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G7: ゴミ箱あさり
════════════════════════════════════════ */
const TRASH_DATA=[
  {label:'🗑️',name:'普通のゴミ箱',danger:15,type:'normal',results:[{e:'🥫',t:'can'},{e:'🍔',t:'food'},{e:'💀',t:'empty'}]},
  {label:'🗑️',name:'ゴミ箱2',danger:12,type:'normal',results:[{e:'🥫',t:'can'},{e:'🪙',t:'money'},{e:'🐀',t:'empty'}]},
  {label:'🗑️',name:'捨て場',danger:8,type:'normal',results:[{e:'💰',t:'money'},{e:'🍜',t:'food'},{e:'💀',t:'empty'}]},
  {label:'⚠️🗑️',name:'危険なゴミ箱！',danger:80,type:'danger',results:[{e:'🚔',t:'police'}]},
  {label:'🚫🗑️',name:'立入禁止！',danger:100,type:'danger',results:[{e:'🚔',t:'police'}]},
]

function TrashGame({ pts, addPts, onBack }) {
  const [cans, setCans] = useState([])
  const [doneList, setDoneList] = useState([])
  const [popList, setPopList] = useState({})
  const [danger, setDanger] = useState(0)
  const [loot, setLoot] = useState({can:0,food:0,money:0})
  const [result, setResult] = useState(null)
  const doneRef = useRef(false)
  const searchingRef = useRef(false)
  const dangerRef = useRef(0)
  const lootRef = useRef({can:0,food:0,money:0})
  const doneListRef = useRef([])
  const { time, start, stop } = useTimer(10, () => { if(!doneRef.current) endTrash(true,'time') })

  const endTrash = useCallback((win, reason) => {
    if (doneRef.current) return; doneRef.current=true; stop()
    const l=lootRef.current; const p=l.can*2+l.food*3+l.money*4
    if(reason==='police') setResult({win:false,icon:'🚔',main:'警察に捕まった！',sub:'全て没収…',pts:0})
    else { if(p>0)addPts(p); setResult({win:p>0,icon:p>0?'🗑️':'💀',main:p>0?'収穫完了！':'何も見つからなかった…',sub:`缶×${l.can} 食料×${l.food} 金×${l.money}`,pts:p}) }
  }, [stop, addPts])

  const search = useCallback(async (idx, cd) => {
    if (doneRef.current || searchingRef.current || doneListRef.current.includes(idx)) return
    searchingRef.current=true
    setPopList(prev=>({...prev,[idx]:'⏳'}))
    await sleep(300)
    const res=cd.results[rnd(0,cd.results.length-1)]
    setPopList(prev=>({...prev,[idx]:res.e}))
    if(res.t==='can') lootRef.current.can++
    else if(res.t==='food') lootRef.current.food++
    else if(res.t==='money') lootRef.current.money+=2
    setLoot({...lootRef.current})
    doneListRef.current.push(idx); setDoneList([...doneListRef.current])
    dangerRef.current=Math.min(100,dangerRef.current+cd.danger); setDanger(dangerRef.current)
    setTimeout(()=>setPopList(prev=>{const n={...prev};delete n[idx];return n}),700)
    searchingRef.current=false
    if(dangerRef.current>=100) endTrash(false,'police')
    else if(doneListRef.current.length>=5) endTrash(true,'all')
  }, [endTrash])

  const init = useCallback(() => {
    doneRef.current=false; searchingRef.current=false; dangerRef.current=0; lootRef.current={can:0,food:0,money:0}; doneListRef.current=[]
    setDanger(0); setLoot({can:0,food:0,money:0}); setDoneList([]); setPopList({}); setResult(null)
    const shuffled=[...TRASH_DATA].sort(()=>Math.random()-.5).slice(0,5)
    setCans(shuffled); start()
  }, [start])

  useEffect(() => { init() }, []) // eslint-disable-line

  return (
    <div style={S.screen}>
      <GameHeader title="🗑️ ゴミ箱あさり" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>⚠️マークのゴミ箱は即タイホ！普通のゴミ箱から缶・食料・金を漁れ！</Instr>
        <div style={{display:'flex',gap:'.8rem',justifyContent:'center',flexWrap:'wrap'}}>
          <StatBox label="🥫 缶" val={loot.can}/><StatBox label="🍔 食料" val={loot.food}/><StatBox label="💰 金" val={loot.money}/>
        </div>
        <div style={{width:'100%'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'.72rem',marginBottom:3}}><span style={{color:'#7a6a4a'}}>⚠️ 危険度</span><span style={{color:'#b52e1e'}}>{danger}%</span></div>
          <DangerBar pct={danger}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.65rem',width:'100%'}}>
          {cans.map((cd,i)=>{
            const done=doneList.includes(i)
            return (
              <div key={i} onClick={()=>search(i,cd)} style={{
                height:85,background:cd.type==='danger'?'linear-gradient(145deg,#3a1808,#200a05)':'linear-gradient(145deg,#2a2018,#1a1510)',
                border:`2px solid ${cd.type==='danger'?'#6a2010':'#3d2e18'}`,borderRadius:10,cursor:done||doneRef.current?'default':'pointer',
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                opacity:done?0.4:1,position:'relative',userSelect:'none',transition:'transform .18s'
              }}>
                <span style={{fontSize:'1.4rem'}}>{cd.label}</span>
                <span style={{fontSize:'.58rem',color:'#7a6a4a',marginTop:2}}>{cd.name}</span>
                {popList[i] && <div style={{position:'absolute',top:-5,right:-5,fontSize:'.7rem',fontWeight:900,padding:'2px 5px',borderRadius:6,background:cd.type==='danger'?'#8a2020':'#3a5020',color:'#fff',animation:'popIn .3s ease'}}>{popList[i]}</div>}
              </div>
            )
          })}
        </div>
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G8: 物乞いゲーム
════════════════════════════════════════ */
const BEG_NPCS=[{e:'🤵',name:'サラリーマン',p:5},{e:'👩',name:'主婦',p:0},{e:'🧑‍🎓',name:'学生',p:2},{e:'🕴️',name:'ヤクザ',p:-3},{e:'👮',name:'警察官',p:-5},{e:'👴',name:'おじいさん',p:4},{e:'💼',name:'社長',p:10}]
const BEG_MSGS={5:'「しょうがないな」💰',0:'無視された…',2:'「少しだけ」🪙','-3':'「うっとうしい！」👊','-5':'「不法行為だ！」🚔',4:'「元気出せ」🪙',10:'「頑張れよ」💰💰'}

function BegGame({ pts, addPts, subPts, onBack }) {
  const [npcX, setNpcX] = useState(112)
  const [npcEmoji, setNpcEmoji] = useState(null)
  const [feedback, setFeedback] = useState({ text:'', color:'#7a6a4a' })
  const [earned, setEarned] = useState(0)
  const [count, setCount] = useState(6)
  const [result, setResult] = useState(null)
  const npcRef = useRef(null)
  const npcXRef = useRef(112)
  const countRef = useRef(6)
  const earnedRef = useRef(0)
  const activeRef = useRef(false)
  const doneRef = useRef(false)
  const ivRef = useRef(null)
  const { time, start, stop } = useTimer(10, () => { if(!doneRef.current) endBeg() })

  const endBeg = useCallback(() => {
    if(doneRef.current)return; doneRef.current=true; stop(); clearInterval(ivRef.current)
    const p=Math.max(0,earnedRef.current); const win=p>=5
    setResult({win,icon:win?'💰':'😔',main:win?'物乞い成功！':'稼ぎが足りなかった…',sub:`5P以上で成功。獲得 ${p}P`,pts:win?p:0})
  }, [stop])

  const spawnNPC = useCallback(() => {
    if(doneRef.current||countRef.current<=0) return
    const npc=BEG_NPCS[rnd(0,BEG_NPCS.length-1)]
    npcRef.current=npc; activeRef.current=true; npcXRef.current=112
    setNpcX(112); setNpcEmoji(npc.e); setFeedback({text:'',color:'#7a6a4a'})
    const spd=rnd(12,22)/10
    ivRef.current=setInterval(()=>{
      npcXRef.current-=spd; setNpcX(npcXRef.current)
      if(npcXRef.current<-18){
        clearInterval(ivRef.current); activeRef.current=false
        countRef.current--; setCount(countRef.current)
        setFeedback({text:'逃した…',color:'#7a6a4a'})
        if(countRef.current>0&&!doneRef.current) setTimeout(()=>spawnNPC(),700)
        else if(countRef.current<=0&&!doneRef.current) setTimeout(endBeg,500)
      }
    },100)
  }, [endBeg])

  const doBeg = useCallback(() => {
    if(doneRef.current||!activeRef.current)return
    const inZone=npcXRef.current>=38&&npcXRef.current<=62
    clearInterval(ivRef.current); activeRef.current=false
    const npc=npcRef.current; const gain=npc.p
    earnedRef.current+=gain
    if(gain>0)addPts(gain); else if(gain<0)subPts(-gain)
    setEarned(Math.max(0,earnedRef.current))
    const txt=inZone?(npc.name+'—'+(BEG_MSGS[gain]||'')+(gain>0?' +'+gain+'P':gain<0?' '+gain+'P':'')):'タイミングが悪い…無視'
    setFeedback({text:txt,color:gain>0?'#e8b84b':gain<0?'#b52e1e':'#7a6a4a'})
    countRef.current--; setCount(countRef.current)
    if(countRef.current<=0) setTimeout(endBeg,700)
    else setTimeout(()=>spawnNPC(),1100)
  }, [addPts, subPts, endBeg, spawnNPC])

  const init = useCallback(() => {
    doneRef.current=false; activeRef.current=false; countRef.current=6; earnedRef.current=0
    clearInterval(ivRef.current); setCount(6); setEarned(0); setNpcEmoji(null); setFeedback({text:'',color:'#7a6a4a'}); setResult(null)
    start(); spawnNPC()
  }, [start, spawnNPC])

  useEffect(() => { init(); return ()=>{ doneRef.current=true; clearInterval(ivRef.current) } }, []) // eslint-disable-line

  return (
    <div style={S.screen}>
      <GameHeader title="🙏 物乞い" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>⭐ゾーンにNPCがいるとき押せ！5P以上稼げば成功！</Instr>
        <div style={{display:'flex',gap:'.8rem',justifyContent:'center'}}>
          <StatBox label="残りNPC" val={count}/><StatBox label="💰 獲得" val={`${earned}P`} style={{color:'#e8b84b'}}/>
        </div>
        <div style={{width:'100%',maxWidth:420,height:120,background:'linear-gradient(to bottom,#1a1208,#0d0a05 60%,#222018 60%,#1a1810 100%)',border:'2px solid #3d2e1a',borderRadius:12,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:50,background:'linear-gradient(to bottom,#242018,#1a1810)',borderTop:'2px dashed #3a3028'}}/>
          <div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',width:85,height:50,background:'rgba(232,184,75,.08)',borderLeft:'2px dashed rgba(232,184,75,.5)',borderRight:'2px dashed rgba(232,184,75,.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.85rem',opacity:.6}}>⭐</div>
          <div style={{position:'absolute',bottom:5,left:'50%',transform:'translateX(-50%)',fontSize:'1.7rem',zIndex:5}}>🧎</div>
          {npcEmoji && <div style={{position:'absolute',bottom:6,left:`${npcX}%`,fontSize:'1.7rem',zIndex:4,whiteSpace:'nowrap'}}>{npcEmoji}</div>}
        </div>
        <div style={{height:'1.4rem',textAlign:'center',fontWeight:700,fontSize:'.9rem',color:feedback.color}}>{feedback.text}</div>
        {!result && <BtnPrim onClick={doBeg}>🙏 お恵みを…</BtnPrim>}
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G9: 雨宿りダッシュ
════════════════════════════════════════ */
const OBS_LIST=[{e:'👮',name:'警察',danger:28},{e:'🐕',name:'野良犬',danger:20},{e:'💦',name:'水たまり',danger:12},{e:'🧟',name:'おじさん',danger:25}]

function RainGame({ pts, addPts, onBack }) {
  const [wet, setWet] = useState(0)
  const [obsX, setObsX] = useState(-100)
  const [obsEmoji, setObsEmoji] = useState(null)
  const [info, setInfo] = useState('障害物を待て…')
  const [jumping, setJumping] = useState(false)
  const [result, setResult] = useState(null)
  const wetRef = useRef(0)
  const jumpRef = useRef(false)
  const doneRef = useRef(false)
  const queueRef = useRef([])
  const obsIdxRef = useRef(0)
  const wetIvRef = useRef(null)
  const rafRef = useRef(null)
  const arenaRef = useRef(null)
  const { time, start, stop } = useTimer(10, () => { if(!doneRef.current) endRain(wetRef.current<100) })

  const endRain = useCallback((win) => {
    if(doneRef.current)return; doneRef.current=true; stop(); clearInterval(wetIvRef.current); cancelAnimationFrame(rafRef.current)
    const p=win?Math.max(2,Math.floor(12*(1-wetRef.current/100))):0
    if(p>0)addPts(p)
    setResult({win,icon:win?'🏕️':'💧',main:win?'雨宿り成功！':'びしょ濡れで動けない…',sub:`濡れ度 ${Math.floor(wetRef.current)}%`,pts:p})
  }, [stop, addPts])

  const sendObs = useCallback(() => {
    if(doneRef.current||obsIdxRef.current>=queueRef.current.length)return
    const obs=queueRef.current[obsIdxRef.current++]
    setInfo(`⚠️ ${obs.name}が来る！`); setObsEmoji(obs.e)
    const W=arenaRef.current?.offsetWidth||400
    let ox=W+40; setObsX(ox); let hit=false
    const tick=()=>{
      if(doneRef.current)return
      ox-=4; setObsX(ox)
      const runX=W*0.18
      if(!hit&&Math.abs(ox-runX)<38){
        hit=true
        if(!jumpRef.current){
          wetRef.current=Math.min(100,wetRef.current+obs.danger); setWet(wetRef.current)
          setInfo(`💥 ${obs.name}にぶつかった！`)
          if(wetRef.current>=100){cancelAnimationFrame(rafRef.current);endRain(false);return}
        } else { setInfo('🌟 ジャンプ成功！') }
      }
      if(ox<-60){ setObsEmoji(null); setTimeout(()=>{if(!doneRef.current&&obsIdxRef.current<queueRef.current.length)sendObs()},800); return }
      rafRef.current=requestAnimationFrame(tick)
    }
    rafRef.current=requestAnimationFrame(tick)
  }, [endRain])

  const doJump = useCallback(() => {
    if(doneRef.current||jumpRef.current)return
    jumpRef.current=true; setJumping(true)
    setTimeout(()=>{jumpRef.current=false;setJumping(false)},500)
  }, [])

  const init = useCallback(() => {
    doneRef.current=false; jumpRef.current=false; wetRef.current=0; obsIdxRef.current=0
    clearInterval(wetIvRef.current); cancelAnimationFrame(rafRef.current)
    setWet(0); setJumping(false); setObsX(-100); setObsEmoji(null); setInfo('障害物を待て…'); setResult(null)
    queueRef.current=[...OBS_LIST].sort(()=>Math.random()-.5)
    wetIvRef.current=setInterval(()=>{if(!doneRef.current){wetRef.current=Math.min(100,wetRef.current+1.5);setWet(wetRef.current)}},400)
    start(); setTimeout(()=>sendObs(),1800)
  }, [start, sendObs])

  useEffect(() => { init(); return ()=>{ doneRef.current=true; clearInterval(wetIvRef.current); cancelAnimationFrame(rafRef.current) } }, []) // eslint-disable-line

  return (
    <div style={S.screen}>
      <GameHeader title="☔ 雨宿りダッシュ" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>障害物がきたらジャンプ！濡れ度100%で失敗！</Instr>
        <div style={{width:'100%'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'.72rem',marginBottom:3}}><span style={{color:'#6af'}}>☔ 濡れ度</span><span style={{color:'#6af'}}>{Math.floor(wet)}%</span></div>
          <div style={S.wetTrack}><div style={{height:'100%',width:`${wet}%`,background:'linear-gradient(90deg,#3a7aa0,#1a3a6a)',borderRadius:7,transition:'width .4s ease'}}/></div>
        </div>
        <div ref={arenaRef} style={{width:'100%',maxWidth:420,height:180,background:'linear-gradient(to bottom,#0d1a2a,#101510 65%,#1a2018 65%,#181e15 100%)',border:'2px solid #3d2e1a',borderRadius:12,position:'relative',overflow:'hidden'}}>
          {[...Array(10)].map((_,i)=><div key={i} className="rain-drop" style={{left:`${rnd(0,100)}%`,animationDuration:`${rnd(5,10)/10}s`,animationDelay:`${rnd(0,10)/10}s`}}>|</div>)}
          <div style={{position:'absolute',bottom:20,left:'18%',fontSize:'1.9rem',zIndex:10}} className={jumping?'runner-jump':''}>🏃</div>
          {obsEmoji && <div style={{position:'absolute',bottom:24,left:obsX,fontSize:'1.7rem',zIndex:8,transition:'none'}}>{obsEmoji}</div>}
          <div style={{position:'absolute',bottom:0,right:8,width:65,height:70,background:'rgba(50,40,20,.8)',border:'2px solid #5a4228',borderRadius:'6px 6px 0 0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.2rem'}}>🏕️</div>
        </div>
        <div style={{display:'flex',gap:'.8rem',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontSize:'.82rem',color:'#7a6a4a'}}>{info}</div>
          <button onClick={doJump} style={{background:'linear-gradient(135deg,#2a5a8a,#1a3a6a)',border:'2px solid #3a7ab0',borderRadius:14,color:'#a0d0f0',font:"700 1rem 'Noto Sans JP',sans-serif",padding:'.8rem 2.5rem',cursor:'pointer'}}>⬆️ JUMP！</button>
        </div>
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G10: 炊き出し争奪戦
════════════════════════════════════════ */
function KashiGame({ pts, addPts, onBack }) {
  const [score, setScore] = useState(0)
  const [rival, setRival] = useState(0)
  const [playerX, setPlayerX] = useState(40)
  const [rivalX, setRivalX] = useState(68)
  const [bentos, setBentos] = useState([])
  const [result, setResult] = useState(null)
  const pxRef = useRef(40)
  const rxRef = useRef(68)
  const scoreRef = useRef(0)
  const rivalRef = useRef(0)
  const bentosRef = useRef([])
  const moveDirRef = useRef(0)
  const doneRef = useRef(false)
  const moveIvRef = useRef(null)
  const bentoIvRef = useRef(null)
  const idRef = useRef(0)
  const { time, start, stop } = useTimer(10, () => { if(!doneRef.current) endKashi() })

  const endKashi = useCallback(() => {
    if(doneRef.current)return; doneRef.current=true; stop()
    clearInterval(moveIvRef.current); clearInterval(bentoIvRef.current)
    bentosRef.current.forEach(b=>{ if(b.iv)clearInterval(b.iv) }); bentosRef.current=[]
    const win=scoreRef.current>=3; const p=scoreRef.current*3; if(p>0)addPts(p)
    setResult({win,icon:win?'🍱':'😢',main:win?'弁当3個ゲット！':'3個に届かなかった…',sub:`あなた${scoreRef.current}個 / ライバル${rivalRef.current}個`,pts:p})
    setBentos([])
  }, [stop, addPts])

  const spawnBento = useCallback(() => {
    if(doneRef.current)return
    const x=rnd(8,88); const bid=idRef.current++
    const b={id:bid,x,y:0}; bentosRef.current.push(b)
    setBentos(prev=>[...prev,{...b}])
    const iv=setInterval(()=>{
      const found=bentosRef.current.find(bb=>bb.id===bid); if(!found)return
      found.y+=2.5; setBentos(prev=>prev.map(bb=>bb.id===bid?{...bb,y:found.y}:bb))
      if(found.y>98){bentosRef.current=bentosRef.current.filter(bb=>bb.id!==bid);setBentos(prev=>prev.filter(bb=>bb.id!==bid));clearInterval(iv)}
    },50); b.iv=iv
  }, [])

  const moveLoop = useCallback(() => {
    if(doneRef.current)return
    if(moveDirRef.current!==0){pxRef.current=Math.max(4,Math.min(88,pxRef.current+moveDirRef.current*3));setPlayerX(pxRef.current)}
    if(bentosRef.current.length>0){
      const cl=bentosRef.current.reduce((a,b)=>Math.abs(b.x-rxRef.current)<Math.abs(a.x-rxRef.current)?b:a)
      const dx=cl.x-rxRef.current; rxRef.current+=Math.sign(dx)*2.2; rxRef.current=Math.max(4,Math.min(88,rxRef.current)); setRivalX(rxRef.current)
    }
    for(let i=bentosRef.current.length-1;i>=0;i--){
      const b=bentosRef.current[i]; if((b.y||0)<65)continue
      if(Math.abs(b.x-pxRef.current)<9){
        scoreRef.current++; setScore(scoreRef.current)
        if(b.iv)clearInterval(b.iv); bentosRef.current.splice(i,1); setBentos(prev=>prev.filter(bb=>bb.id!==b.id))
        if(scoreRef.current>=3)endKashi(); return
      } else if(Math.abs(b.x-rxRef.current)<9){
        rivalRef.current++; setRival(rivalRef.current)
        if(b.iv)clearInterval(b.iv); bentosRef.current.splice(i,1); setBentos(prev=>prev.filter(bb=>bb.id!==b.id)); return
      }
    }
  }, [endKashi])

  const init = useCallback(() => {
    doneRef.current=false; moveDirRef.current=0; pxRef.current=40; rxRef.current=68; scoreRef.current=0; rivalRef.current=0
    clearInterval(moveIvRef.current); clearInterval(bentoIvRef.current)
    bentosRef.current.forEach(b=>{ if(b.iv)clearInterval(b.iv) }); bentosRef.current=[]
    setScore(0);setRival(0);setPlayerX(40);setRivalX(68);setBentos([]);setResult(null)
    start(); bentoIvRef.current=setInterval(spawnBento,1000); moveIvRef.current=setInterval(moveLoop,100)
  }, [start, spawnBento, moveLoop])

  useEffect(() => { init(); return()=>{doneRef.current=true;clearInterval(moveIvRef.current);clearInterval(bentoIvRef.current);bentosRef.current.forEach(b=>{if(b.iv)clearInterval(b.iv)})} }, []) // eslint-disable-line

  return (
    <div style={S.screen}>
      <GameHeader title="🍱 炊き出し争奪戦" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>◀▶で動いて弁当をキャッチ！3個で成功！</Instr>
        <div style={{display:'flex',gap:'.8rem',justifyContent:'center'}}>
          <StatBox label="🍱 あなた" val={score} style={{color:'#e8b84b'}}/><StatBox label="🧟 ライバル" val={rival}/>
        </div>
        <div style={{width:'100%',maxWidth:420,height:260,background:'linear-gradient(160deg,#1a1208,#0d0a05)',border:'2px solid #3d2e1a',borderRadius:14,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',bottom:10,left:`${playerX}%`,fontSize:'1.9rem',zIndex:10,transform:'translateX(-50%)'}}>🧍</div>
          <div style={{position:'absolute',bottom:10,left:`${rivalX}%`,fontSize:'1.9rem',zIndex:9,transform:'translateX(-50%)'}}>🧟</div>
          {bentos.map(b=><div key={b.id} className="bento-el" style={{left:`${b.x}%`,top:`${b.y}%`,transform:'translateX(-50%)'}}>🍱</div>)}
        </div>
        <div style={{display:'flex',gap:'.8rem'}}>
          <button onPointerDown={()=>moveDirRef.current=-1} onPointerUp={()=>moveDirRef.current=0} onTouchStart={e=>{e.preventDefault();moveDirRef.current=-1}} onTouchEnd={()=>moveDirRef.current=0}
            style={{flex:1,background:'#241a0e',border:'2px solid #5a4228',borderRadius:12,color:'#d4c4a0',font:"700 1.4rem 'Noto Sans JP',sans-serif",padding:'.55rem',cursor:'pointer',userSelect:'none'}}>◀</button>
          <button onPointerDown={()=>moveDirRef.current=1} onPointerUp={()=>moveDirRef.current=0} onTouchStart={e=>{e.preventDefault();moveDirRef.current=1}} onTouchEnd={()=>moveDirRef.current=0}
            style={{flex:1,background:'#241a0e',border:'2px solid #5a4228',borderRadius:12,color:'#d4c4a0',font:"700 1.4rem 'Noto Sans JP',sans-serif",padding:'.55rem',cursor:'pointer',userSelect:'none'}}>▶</button>
        </div>
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G11: 路上○×ゲーム
════════════════════════════════════════ */
function OXOGame({ pts, addPts, subPts, onBack }) {
  const [phase, setPhase] = useState('bet')
  const [board, setBoard] = useState(Array(9).fill(''))
  const [bet, setBet] = useState(0)
  const [status, setStatus] = useState('あなた(○) の番')
  const [result, setResult] = useState(null)
  const boardRef = useRef(Array(9).fill(''))
  const doneRef = useRef(false)
  const { time, start, stop } = useTimer(5, () => {
    if(!doneRef.current){ const mv=boardRef.current.findIndex(c=>!c); if(mv>=0) doMove(mv) }
  })

  const checkWin = (b) => {
    const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for(const[a,bc,c] of lines){ if(b[a]&&b[a]===b[bc]&&b[bc]===b[c]) return b[a] }
    if(b.every(c=>c)) return 'draw'; return null
  }
  const findBest=(who,b)=>{
    const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for(const[a,bc,c] of lines){
      if(b[a]===who&&b[bc]===who&&!b[c])return c
      if(b[a]===who&&!b[bc]&&b[c]===who)return bc
      if(!b[a]&&b[bc]===who&&b[c]===who)return a
    }; return null
  }

  const endOXO = useCallback((res) => {
    if(doneRef.current)return; doneRef.current=true; stop()
    if(res==='win'){addPts(bet*2);setResult({win:true,icon:'○',main:'あなたの勝ち！',sub:`賭け${bet}P → 2倍`,pts:bet*2})}
    else if(res==='draw'){setResult({win:false,icon:'🤝',main:'引き分け',sub:`賭け${bet}P 返還`,pts:0})}
    else{subPts(bet);setResult({win:false,icon:'×',main:'CPUの勝ち…',sub:`賭け${bet}P 没収`,pts:0})}
  }, [stop, addPts, subPts, bet])

  const doMove = useCallback((idx) => {
    if(doneRef.current) return; stop()
    const nb=[...boardRef.current]; nb[idx]='p'; boardRef.current=nb; setBoard([...nb])
    const r=checkWin(nb); if(r){endOXO(r==='p'?'win':r);return}
    setStatus('CPU(×) の番…')
    setTimeout(()=>{
      const b2=[...boardRef.current]
      const mv=findBest('c',b2)||findBest('p',b2)||(!b2[4]?4:null)||b2.findIndex(c=>!c)
      if(mv==null){endOXO('draw');return}
      b2[mv]='c'; boardRef.current=b2; setBoard([...b2])
      const r2=checkWin(b2); if(r2){endOXO(r2==='c'?'lose':'draw');return}
      setStatus('あなた(○) の番 — 5秒！')
      start()
    },600)
  }, [stop, endOXO, start])

  const selectBet = (n) => {
    if(G_pts<n){alert('Pが足りない！');return}
    setBet(n); setPhase('game'); boardRef.current=Array(9).fill(''); setBoard(Array(9).fill('')); doneRef.current=false; setResult(null)
    setStatus('あなた(○) の番 — 5秒！'); start()
  }

  const init = () => {
    doneRef.current=false; setBet(0); setPhase('bet'); setBoard(Array(9).fill('')); boardRef.current=Array(9).fill(''); setResult(null); setStatus('あなた(○) の番'); stop()
  }

  const G_pts = pts // closure for selectBet

  return (
    <div style={S.screen}>
      <GameHeader title="♟️ 路上○×" pts={pts} timer={phase==='game'&&!result?time:null} onBack={onBack}/>
      <div style={S.body}>
        <Instr>CPUに勝てばP倍増！5秒以内に手を打て！</Instr>
        {phase==='bet' && !result && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'.88rem',color:'#7a6a4a',marginBottom:'.5rem'}}>賭けPを選べ</div>
            <div style={{display:'flex',gap:'.55rem',flexWrap:'wrap',justifyContent:'center'}}>
              {[3,5,8,10].map(n=><button key={n} onClick={()=>selectBet(n)} style={{background:'#241a0e',border:'2px solid #3d2e1a',borderRadius:8,color:'#d4c4a0',font:"700 .9rem 'Noto Sans JP',sans-serif",padding:'.4rem 1rem',cursor:'pointer'}}>{n}P</button>)}
            </div>
          </div>
        )}
        {phase==='game' && !result && (
          <>
            <div style={{fontWeight:700,color:'#f0e8d0',textAlign:'center',fontSize:'.95rem'}}>{status}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.45rem',width:230}}>
              {board.map((cell,i)=>(
                <div key={i} onClick={()=>!doneRef.current&&cell===''&&status.includes('あなた')&&doMove(i)} style={{
                  height:72,background:'#241a0e',border:`2px solid ${cell?'#5a4228':'#5a4228'}`,borderRadius:10,
                  cursor:!cell&&!doneRef.current&&status.includes('あなた')?'pointer':'default',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.4rem',fontWeight:900,
                  color:cell==='p'?'#e8b84b':cell==='c'?'#b52e1e':'transparent',transition:'background .15s'
                }}>{cell==='p'?'○':cell==='c'?'×':''}</div>
              ))}
            </div>
          </>
        )}
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G12: 段ボールパズル
════════════════════════════════════════ */
const TET_COLS=6,TET_ROWS=10
const TET_WS=[1,2,2,3,1,2]
const TET_COLORS=['#c97b2a','#4e8539','#2a5a8a','#8a3a2a','#6a4a8a','#3a6a5a']

function TetrisGame({ pts, addPts, onBack }) {
  const [board, setBoard] = useState(()=>Array.from({length:TET_ROWS},()=>Array(TET_COLS).fill(null)))
  const [cleared, setCleared] = useState(0)
  const [pieceX, setPieceX] = useState(0)
  const [pieceW, setPieceW] = useState(2)
  const [pieceColor, setPieceColor] = useState(TET_COLORS[0])
  const [result, setResult] = useState(null)
  const boardRef = useRef(Array.from({length:TET_ROWS},()=>Array(TET_COLS).fill(null)))
  const pxRef = useRef(0)
  const pwRef = useRef(2)
  const posRef = useRef(0)
  const dirRef = useRef(1)
  const clearedRef = useRef(0)
  const doneRef = useRef(false)
  const rafRef = useRef(null)
  const colorRef = useRef(TET_COLORS[0])
  const { time, start, stop } = useTimer(10, () => {
    if(!doneRef.current){ doneRef.current=true; cancelAnimationFrame(rafRef.current); const p=clearedRef.current*4; if(p>0)addPts(p); setResult({win:clearedRef.current>=2,icon:clearedRef.current>=2?'🏠':'💀',main:clearedRef.current>=2?`2段クリア成功！`:`${clearedRef.current}段しかクリアできなかった…`,pts:p}) }
  })

  const slideTick = useCallback(() => {
    if(doneRef.current)return
    const max=TET_COLS-pwRef.current
    posRef.current+=0.06*dirRef.current
    if(posRef.current>=max){posRef.current=max;dirRef.current=-1}
    if(posRef.current<=0){posRef.current=0;dirRef.current=1}
    pxRef.current=Math.floor(posRef.current); setPieceX(pxRef.current)
    rafRef.current=requestAnimationFrame(slideTick)
  }, [])

  const newPiece = useCallback(() => {
    const pi=rnd(0,TET_WS.length-1); pwRef.current=TET_WS[pi]; colorRef.current=TET_COLORS[pi]
    posRef.current=0; dirRef.current=1; pxRef.current=0
    setPieceW(TET_WS[pi]); setPieceColor(TET_COLORS[pi]); setPieceX(0)
  }, [])

  const tetDrop = useCallback(() => {
    if(doneRef.current)return
    const b=boardRef.current.map(r=>[...r])
    let land=-1; for(let r=TET_ROWS-1;r>=0;r--){let ok=true;for(let c=pxRef.current;c<pxRef.current+pwRef.current;c++)if(b[r][c]){ok=false;break};if(ok){land=r;break}}
    if(land<0)return
    for(let c=pxRef.current;c<pxRef.current+pwRef.current;c++) b[land][c]=colorRef.current
    let cl=0; for(let r=TET_ROWS-1;r>=0;r--){if(b[r].every(c=>c!==null)){b.splice(r,1);b.unshift(Array(TET_COLS).fill(null));cl++;r++}}
    clearedRef.current+=cl; boardRef.current=b; setBoard(b.map(r=>[...r])); setCleared(clearedRef.current)
    if(clearedRef.current>=2){ doneRef.current=true; cancelAnimationFrame(rafRef.current); stop(); const p=clearedRef.current*4; addPts(p); setResult({win:true,icon:'🏠',main:'2段クリア成功！',sub:'ダンボールハウスが建った！',pts:p}); return }
    if(b[0].some(c=>c!==null)){ doneRef.current=true; cancelAnimationFrame(rafRef.current); stop(); const p=clearedRef.current*4; if(p>0)addPts(p); setResult({win:false,icon:'💀',main:'積みすぎた！',sub:`${clearedRef.current}段クリア`,pts:p}); return }
    newPiece()
  }, [stop, addPts, newPiece])

  const tetMove = (d) => {
    if(doneRef.current)return
    posRef.current=Math.max(0,Math.min(TET_COLS-pwRef.current,pxRef.current+d)); pxRef.current=Math.floor(posRef.current); setPieceX(pxRef.current)
  }

  const init = useCallback(() => {
    doneRef.current=false; clearedRef.current=0; posRef.current=0; dirRef.current=1
    cancelAnimationFrame(rafRef.current)
    const b=Array.from({length:TET_ROWS},()=>Array(TET_COLS).fill(null)); boardRef.current=b
    setBoard(b.map(r=>[...r])); setCleared(0); setResult(null)
    newPiece(); start(); rafRef.current=requestAnimationFrame(slideTick)
  }, [start, slideTick, newPiece])

  useEffect(() => { init(); return()=>{doneRef.current=true;cancelAnimationFrame(rafRef.current)} }, []) // eslint-disable-line

  return (
    <div style={S.screen}>
      <GameHeader title="📦 段ボールパズル" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>パーツが左右に動く！◀▶で列を選んでDROPで落とせ！2段クリアで成功！</Instr>
        <StatBox label="クリア段数" val={`${cleared} / 2`}/>
        {/* Piece preview */}
        <div style={{display:'flex',gap:2,padding:'6px 8px',background:'#241a0e',border:`2px solid ${doneRef.current?'#3d2e1a':'#c97b2a'}`,borderRadius:10,width:'fit-content',minHeight:50,alignItems:'center'}}>
          {Array.from({length:TET_COLS}).map((_,c)=>(
            <div key={c} style={{width:36,height:36,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',flexShrink:0,background:c>=pieceX&&c<pieceX+pieceW?pieceColor:'#0a0a0a',border:`2px solid ${c>=pieceX&&c<pieceX+pieceW?'rgba(255,255,255,.4)':'#222'}`,transition:'background .05s'}}>
              {c>=pieceX&&c<pieceX+pieceW?'📦':''}
            </div>
          ))}
        </div>
        <div style={{background:'#1a1309',border:'3px solid #5a4228',borderRadius:12,padding:'.6rem',display:'inline-block'}}>
          <div style={{display:'grid',gridTemplateColumns:`repeat(${TET_COLS},36px)`,gridTemplateRows:`repeat(${TET_ROWS},28px)`,gap:2}}>
            {board.map((row,r)=>row.map((cell,c)=>(
              <div key={`${r}-${c}`} style={{borderRadius:3,background:cell||'#0f0f0f',border:`1px solid ${cell?'rgba(255,255,255,.15)':'#1a1a1a'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem'}}>{cell?'📦':''}</div>
            )))}
          </div>
        </div>
        <div style={{display:'flex',gap:'.55rem',justifyContent:'center'}}>
          <button onClick={()=>tetMove(-1)} style={{background:'#241a0e',border:'2px solid #3d2e1a',borderRadius:8,color:'#f0e8d0',font:"700 .9rem 'Noto Sans JP',sans-serif",padding:'.45rem .9rem',cursor:'pointer'}}>◀ 左</button>
          <button onClick={tetDrop} style={{background:'#c97b2a',border:'2px solid #e8b84b',borderRadius:8,color:'#000',font:"700 .9rem 'Noto Sans JP',sans-serif",padding:'.45rem .9rem',cursor:'pointer',fontWeight:900}}>⬇ DROP</button>
          <button onClick={()=>tetMove(1)} style={{background:'#241a0e',border:'2px solid #3d2e1a',borderRadius:8,color:'#f0e8d0',font:"700 .9rem 'Noto Sans JP',sans-serif",padding:'.45rem .9rem',cursor:'pointer'}}>右 ▶</button>
        </div>
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G13: ネズミ追い払い
════════════════════════════════════════ */
function RatGame({ pts, addPts, subPts, onBack }) {
  const [hitCount, setHitCount] = useState(0)
  const [stolen, setStolen] = useState(0)
  const [rats, setRats] = useState([])
  const [fxList, setFxList] = useState([])
  const [result, setResult] = useState(null)
  const ratsRef = useRef([])
  const hitRef = useRef(0)
  const stolenRef = useRef(0)
  const doneRef = useRef(false)
  const moveIvRef = useRef(null)
  const arenaRef = useRef(null)
  const idRef = useRef(0)
  const { time, start, stop } = useTimer(10, () => { if(!doneRef.current) endRat() })

  const endRat = useCallback(() => {
    if(doneRef.current)return; doneRef.current=true; stop(); clearInterval(moveIvRef.current)
    const win=stolenRef.current<=3; const p=win?Math.max(0,hitRef.current*2-stolenRef.current):0; if(p>0)addPts(p)
    setResult({win,icon:win?'🐀':'💀',main:win?'ネズミを撃退成功！':'盗まれすぎた…',sub:`撃退${hitRef.current}匹 / 盗まれ${stolenRef.current}P`,pts:p})
  }, [stop, addPts])

  const spawnRat = useCallback((rid) => {
    if(!arenaRef.current)return
    const W=arenaRef.current.offsetWidth, H=arenaRef.current.offsetHeight
    const edge=rnd(0,3); let x,y
    if(edge===0){x=rnd(0,W);y=5}else if(edge===1){x=W-5;y=rnd(0,H)}else if(edge===2){x=rnd(0,W);y=H-5}else{x=5;y=rnd(0,H)}
    const r={id:rid,x,y,alive:true,speed:rnd(9,16)/10}
    ratsRef.current.push(r); setRats(prev=>[...prev,{id:rid,x,y}])
  }, [])

  const hitRat = useCallback((rid) => {
    const r=ratsRef.current.find(x=>x.id===rid); if(!r||!r.alive)return
    r.alive=false; hitRef.current++; setHitCount(hitRef.current)
    const id=Date.now(); setFxList(prev=>[...prev,{id,x:r.x,y:r.y,t:'💥',c:'#e8b84b'}])
    setTimeout(()=>setFxList(prev=>prev.filter(f=>f.id!==id)),400)
    ratsRef.current=ratsRef.current.filter(x=>x.id!==rid); setRats(prev=>prev.filter(x=>x.id!==rid))
    setTimeout(()=>{ if(!doneRef.current) spawnRat(rid) },1000)
  }, [spawnRat])

  useEffect(() => {
    const moveLoop=setInterval(()=>{
      if(doneRef.current||!arenaRef.current)return
      const cx=arenaRef.current.offsetWidth/2, cy=arenaRef.current.offsetHeight/2
      ratsRef.current.forEach(r=>{
        if(!r.alive)return
        const dx=cx-r.x,dy=cy-r.y,dist=Math.hypot(dx,dy)
        if(dist<22){
          r.alive=false; stolenRef.current+=2; subPts(2); setStolen(stolenRef.current)
          const fid=Date.now(); setFxList(prev=>[...prev,{id:fid,x:cx,y:cy,t:'-2P',c:'#b52e1e'}])
          setTimeout(()=>setFxList(prev=>prev.filter(f=>f.id!==fid)),500)
          ratsRef.current=ratsRef.current.filter(x=>x.id!==r.id); setRats(prev=>prev.filter(x=>x.id!==r.id))
          setTimeout(()=>{ if(!doneRef.current) spawnRat(r.id) },1200); return
        }
        r.x+=dx/dist*r.speed; r.y+=dy/dist*r.speed
      })
      setRats(ratsRef.current.filter(r=>r.alive).map(r=>({id:r.id,x:r.x,y:r.y,flip:r.vx<0})))
    },80)
    moveIvRef.current=moveLoop
    return()=>clearInterval(moveLoop)
  }, [subPts, spawnRat])

  const init = useCallback(() => {
    doneRef.current=false; hitRef.current=0; stolenRef.current=0
    ratsRef.current=[]; setRats([]); setHitCount(0); setStolen(0); setFxList([]); setResult(null)
    for(let i=0;i<4;i++) setTimeout(()=>spawnRat(idRef.current++),i*100)
    start()
  }, [start, spawnRat])

  useEffect(() => { init(); return()=>{ doneRef.current=true } }, []) // eslint-disable-line

  return (
    <div style={S.screen}>
      <GameHeader title="🐀 ネズミ追い払い" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>荷物💰を狙うネズミをタップ！盗まれ3P以下で成功！</Instr>
        <div style={{display:'flex',gap:'.8rem',justifyContent:'center'}}>
          <StatBox label="🐀 撃退" val={hitCount}/><StatBox label="💰 損失" val={`${stolen}P`} style={{color:'#b52e1e'}}/>
        </div>
        <div ref={arenaRef} style={{width:'100%',maxWidth:420,height:280,background:'linear-gradient(160deg,#1a1208,#0d0a05)',border:'2px solid #3d2e1a',borderRadius:14,position:'relative',overflow:'hidden',cursor:'crosshair'}}>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:65,height:65,background:'rgba(201,123,42,.1)',border:'2px solid rgba(201,123,42,.4)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.7rem',zIndex:5,pointerEvents:'none'}}>💰</div>
          {rats.map(r=><div key={r.id} className="rat-el" style={{left:r.x,top:r.y}} onClick={()=>hitRat(r.id)}>🐀</div>)}
          {fxList.map(f=><div key={f.id} className="rat-fx" style={{left:f.x,top:f.y,color:f.c}}>{f.t}</div>)}
        </div>
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G14: 酔っ払いバランス
════════════════════════════════════════ */
function DrunkGame({ pts, addPts, onBack }) {
  const [bal, setBal] = useState(50)
  const [keep, setKeep] = useState(0)
  const [result, setResult] = useState(null)
  const balRef = useRef(50)
  const driftRef = useRef(0)
  const keepRef = useRef(0)
  const doneRef = useRef(false)
  const driftIvRef = useRef(null)
  const keepIvRef = useRef(null)
  const { time, start, stop } = useTimer(10, () => { if(!doneRef.current) endDrunk(true) })

  const endDrunk = useCallback((timeUp) => {
    if(doneRef.current)return; doneRef.current=true; stop(); clearInterval(driftIvRef.current); clearInterval(keepIvRef.current)
    const ok=timeUp&&keepRef.current>=6; const p=ok?Math.floor(keepRef.current*1.5):0; if(p>0)addPts(p)
    setResult({win:ok,icon:ok?'🎉':'🌀',main:ok?`${keepRef.current}秒キープ成功！`:timeUp?`${keepRef.current}秒しかキープできなかった…`:'倒れた！',sub:`緑ゾーン内${keepRef.current}秒 / 6秒以上で成功`,pts:p})
  }, [stop, addPts])

  const tap = useCallback((d) => {
    if(doneRef.current)return
    balRef.current=Math.max(0,Math.min(100,balRef.current-d*15)); driftRef.current-=d*1.5; setBal(balRef.current)
  }, [])

  const init = useCallback(() => {
    doneRef.current=false; balRef.current=50; driftRef.current=0; keepRef.current=0
    clearInterval(driftIvRef.current); clearInterval(keepIvRef.current)
    setBal(50); setKeep(0); setResult(null)
    start()
    driftIvRef.current=setInterval(()=>{
      if(doneRef.current)return
      driftRef.current+=(Math.random()-.5)*3.5; driftRef.current=Math.max(-5.5,Math.min(5.5,driftRef.current))
      balRef.current=Math.max(0,Math.min(100,balRef.current+driftRef.current)); setBal(balRef.current)
      if(balRef.current<=0||balRef.current>=100)endDrunk(false)
    },250)
    keepIvRef.current=setInterval(()=>{
      if(!doneRef.current&&balRef.current>=35&&balRef.current<=65){keepRef.current++;setKeep(keepRef.current)}
    },1000)
  }, [start, endDrunk])

  useEffect(() => { init(); return()=>{ doneRef.current=true; clearInterval(driftIvRef.current); clearInterval(keepIvRef.current) } }, []) // eslint-disable-line

  const rot = (bal-50)/4

  return (
    <div style={S.screen}>
      <GameHeader title="🍺 酔っ払いバランス" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>緑ゾーンを6秒以上キープで成功！<br/>左に傾いたら右タップ、右なら左タップ！</Instr>
        <StatBox label="✅ ゾーン内" val={`${keep}秒`} style={{color:'#4e8539'}}/>
        <div style={{fontSize:'4.5rem',textAlign:'center',transform:`rotate(${rot}deg)`,transition:'transform .1s'}}>🧔</div>
        <div style={{width:'100%'}}>
          <div style={{fontSize:'.75rem',color:'#7a6a4a',textAlign:'center',marginBottom:'.3rem'}}>← 左タップ　　　右タップ →</div>
          <div style={{width:'100%',height:26,background:'#2e2213',borderRadius:13,border:'2px solid #5a4228',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:3,background:'rgba(255,255,255,.15)',transform:'translateX(-50%)'}}/>
            <div style={{position:'absolute',top:0,bottom:0,left:'35%',width:'30%',background:'rgba(78,133,57,.2)',borderLeft:'2px solid rgba(78,133,57,.5)',borderRight:'2px solid rgba(78,133,57,.5)'}}/>
            <div style={{position:'absolute',top:3,bottom:3,width:20,background:'#e8b84b',borderRadius:10,left:`${bal}%`,transform:'translateX(-50%)',transition:'left .1s ease'}}/>
          </div>
        </div>
        <div style={{display:'flex',gap:'.5rem',width:'100%'}}>
          <div onClick={()=>tap(-1)} style={{flex:1,height:75,borderRadius:12,border:'2px solid #2a5a8a',background:'rgba(42,90,138,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',cursor:'pointer',userSelect:'none'}}>← 左</div>
          <div onClick={()=>tap(1)} style={{flex:1,height:75,borderRadius:12,border:'2px solid #8a2a2a',background:'rgba(138,42,42,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',cursor:'pointer',userSelect:'none'}}>右 →</div>
        </div>
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G15: 路上ライブ音ゲー
════════════════════════════════════════ */
const NOTE_SEQ=[{l:0,t:.2},{l:1,t:.7},{l:2,t:1.2},{l:0,t:1.6},{l:1,t:2.0},{l:2,t:2.4},{l:0,t:2.7},{l:1,t:3.1},{l:2,t:3.5},{l:0,t:3.8},{l:1,t:4.2},{l:2,t:4.6},{l:0,t:4.9},{l:1,t:5.3},{l:2,t:5.7},{l:0,t:6.0}]
const NOTE_COLORS=['#c97b2a','#4e8539','#2a5a8a']
const FALL_DUR=1.5

function MusicGame({ pts, addPts, onBack }) {
  const [started, setStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [judge, setJudge] = useState({txt:'',col:'#fff',vis:false})
  const [result, setResult] = useState(null)
  const [notePositions, setNotePositions] = useState([])
  const arenaRef = useRef(null)
  const notesRef = useRef([])
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const doneRef = useRef(false)
  const rafRef = useRef(null)
  const t0Ref = useRef(0)
  const judgeTimerRef = useRef(null)
  const { time, start, stop } = useTimer(10, () => { if(!doneRef.current) endMusic() })

  const showJudge = useCallback((txt,col) => {
    setJudge({txt,col,vis:true}); clearTimeout(judgeTimerRef.current)
    judgeTimerRef.current=setTimeout(()=>setJudge(j=>({...j,vis:false})),350)
  }, [])

  const endMusic = useCallback(() => {
    if(doneRef.current)return; doneRef.current=true; stop(); cancelAnimationFrame(rafRef.current)
    const total=NOTE_SEQ.length, hit=notesRef.current.filter(n=>n.hit).length
    const pct=Math.round(hit/total*100), win=pct>=60
    const p=win?Math.round(scoreRef.current/5):0; if(p>0)addPts(p)
    const rank=pct>=90?'S':pct>=75?'A':pct>=60?'B':'C'
    setResult({win,icon:win?'🎸':'😔',main:win?`ランク ${rank}！${pct}%成功！`:`ランク ${rank}…${pct}%しか合わなかった`,sub:`ヒット ${hit}/${total}`,pts:p})
    setNotePositions([])
  }, [stop, addPts])

  const tick = useCallback(() => {
    if(doneRef.current)return
    const now=performance.now()/1000-t0Ref.current
    const arena=arenaRef.current; if(!arena)return
    const H=arena.offsetHeight, hitY=H-60, laneW=arena.offsetWidth/3

    // spawn
    notesRef.current.forEach(n=>{
      if(!n.spawned&&!n.hit&&!n.missed&&now>=n.spawnT){
        n.spawned=true; n.spawnedAt=now; n.y=-40
      }
    })
    // move
    notesRef.current.forEach(n=>{
      if(!n.spawned||n.hit||n.missed)return
      const elapsed=now-n.spawnedAt
      n.y=-40+elapsed/FALL_DUR*(H+60)
      if(n.y>hitY+40&&!n.hit){ n.missed=true; comboRef.current=0; setCombo(0); showJudge('MISS','#ff6060') }
    })
    // update positions for render
    setNotePositions(notesRef.current.filter(n=>n.spawned&&!n.hit&&!n.missed).map(n=>({id:n.id,lane:n.lane,y:n.y,laneW})))
    if(notesRef.current.every(n=>n.hit||n.missed)){ cancelAnimationFrame(rafRef.current); setTimeout(()=>endMusic(),300); return }
    rafRef.current=requestAnimationFrame(tick)
  }, [endMusic, showJudge])

  const tapLane = useCallback((lane) => {
    if(!doneRef.current&&started){
      const arena=arenaRef.current; if(!arena)return
      const H=arena.offsetHeight, hitY=H-60
      let best=null,bd=Infinity
      notesRef.current.forEach(n=>{ if(n.lane===lane&&n.spawned&&!n.hit&&!n.missed){ const d=Math.abs(n.y-hitY); if(d<bd){bd=d;best=n} } })
      if(!best||bd>65){showJudge('MISS','#ff6060');comboRef.current=0;setCombo(0);beep(220,.1);return}
      let pts=0,lbl='',col=''
      if(bd<22){lbl='PERFECT';col='#ffd166';pts=10}else if(bd<50){lbl='GOOD';col='#4e8539';pts=5}
      else{showJudge('MISS','#ff6060');comboRef.current=0;setCombo(0);beep(220,.1);return}
      best.hit=true; scoreRef.current+=pts; setScore(scoreRef.current); comboRef.current++; setCombo(comboRef.current)
      showJudge(lbl,col); beep(lbl==='PERFECT'?660:440,.1)
    }
  }, [started, showJudge])

  const startMusic = useCallback(() => {
    setStarted(true); t0Ref.current=performance.now()/1000
    notesRef.current=NOTE_SEQ.map((n,i)=>({...n,id:i,spawned:false,hit:false,missed:false,y:-40,spawnedAt:-1}))
    scoreRef.current=0; comboRef.current=0; setScore(0); setCombo(0)
    start(); rafRef.current=requestAnimationFrame(tick)
  }, [start, tick])

  const init = useCallback(() => {
    doneRef.current=false; setStarted(false); setScore(0); setCombo(0); setResult(null); setNotePositions([]); cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => { init(); return()=>{ doneRef.current=true; cancelAnimationFrame(rafRef.current) } }, []) // eslint-disable-line

  const LANE_ICONS=['🎸','🥁','🎹']
  const LANE_BG=['rgba(201,123,42,.18)','rgba(78,133,57,.18)','rgba(42,90,138,.18)']

  return (
    <div style={S.screen}>
      <GameHeader title="🎸 路上ライブ" pts={pts} timer={started&&!result?time:null} onBack={onBack}/>
      <div style={S.body}>
        <Instr>ノーツがラインに来たらタップ！60%以上ヒットで成功！</Instr>
        <div style={{fontSize:'.95rem',color:'#e8b84b',fontWeight:700,textAlign:'center'}}>スコア: {score} / コンボ: {combo}</div>
        <div ref={arenaRef} style={{width:'100%',maxWidth:380,height:300,background:'linear-gradient(to bottom,#080608,#180e08)',border:'2px solid #3d2e1a',borderRadius:14,position:'relative',overflow:'hidden'}}>
          {[0,1].map(i=><div key={i} style={{position:'absolute',top:0,bottom:60,width:1,background:'rgba(255,255,255,.06)',left:`${(i+1)*33.33}%`}}/>)}
          <div style={{position:'absolute',left:0,right:0,bottom:60,height:3,background:'rgba(232,184,75,.5)'}}/>
          <div style={{position:'absolute',top:'30%',width:'100%',textAlign:'center',fontSize:'1.4rem',fontWeight:900,pointerEvents:'none',color:judge.col,opacity:judge.vis?1:0,transition:'opacity .08s'}}>{judge.txt}</div>
          {notePositions.map(n=>(
            <div key={n.id} className="music-note" style={{left:`${n.lane*n.laneW+n.laneW*.08}px`,width:`${n.laneW*.84}px`,top:`${n.y}px`,background:`${NOTE_COLORS[n.lane]}28`,borderColor:NOTE_COLORS[n.lane],color:NOTE_COLORS[n.lane]}}>
              {LANE_ICONS[n.lane]}
            </div>
          ))}
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:58,display:'flex',gap:2,padding:4}}>
            {[0,1,2].map(i=>(
              <button key={i} onClick={()=>tapLane(i)} style={{flex:1,borderRadius:8,border:`2px solid ${NOTE_COLORS[i]}`,background:LANE_BG[i],color:NOTE_COLORS[i],fontSize:'1.3rem',cursor:'pointer',userSelect:'none',WebkitTapHighlightColor:'transparent'}}>
                {LANE_ICONS[i]}
              </button>
            ))}
          </div>
        </div>
        {!started && !result && <div style={{textAlign:'center'}}><BtnPrim onClick={startMusic}>🎸 演奏スタート！</BtnPrim></div>}
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   G16: 闇市交渉ゲーム
════════════════════════════════════════ */
const NEGO_ITEMS=[{e:'🥫',name:'缶詰セット×5',desc:'拾い集めた缶詰',max:20},{e:'🔧',name:'謎の工具',desc:'使えるかわからない工具',max:15},{e:'📱',name:'拾ったスマホ',desc:'画面割れ・充電切れ',max:30},{e:'🧥',name:'ブランドコート',desc:'少し汚れているが本物',max:40},{e:'📦',name:'段ボール特大',desc:'高品質な大きい箱',max:8},{e:'🪙',name:'古銭コレクション',desc:'価値不明の古いコイン',max:25}]
const NEGO_NPCS=['🧔','🧑‍🦱','👩‍🦳','🧑‍🦲']

function NegoGame({ pts, addPts, onBack }) {
  const [items, setItems] = useState([])
  const [idx, setIdx] = useState(0)
  const [total, setTotal] = useState(0)
  const [history, setHistory] = useState([])
  const [npc, setNpc] = useState('🧔')
  const [npcText, setNpcText] = useState('交渉相手を呼んでいる…')
  const [offers, setOffers] = useState([])
  const [result, setResult] = useState(null)
  const totalRef = useRef(0)
  const idxRef = useRef(0)
  const doneRef = useRef(false)
  const itemsRef = useRef([])
  const { time, start, stop } = useTimer(10, () => { if(!doneRef.current) endNego() })

  const endNego = useCallback(() => {
    if(doneRef.current)return; doneRef.current=true; stop()
    const win=totalRef.current>=15; const p=win?totalRef.current:0; if(p>0)addPts(p)
    setResult({win,icon:win?'💰':'😔',main:win?`合計${totalRef.current}P 交渉成功！`:`合計${totalRef.current}P 稼ぎが足りなかった`,sub:`15P以上で成功`,pts:p})
  }, [stop, addPts])

  const showItem = useCallback((i, its) => {
    if(doneRef.current)return
    const item=its[i]; const n=NEGO_NPCS[rnd(0,NEGO_NPCS.length-1)]
    setNpc(n); setNpcText(`「${item.name}？…で、いくらで売る？」`)
    setIdx(i)
    const o=[Math.floor(item.max*.35),Math.floor(item.max*.6),Math.floor(item.max*1.3)].sort(()=>Math.random()-.5)
    setOffers(o.map(v=>({v,item,npc:n})))
  }, [])

  const makeOffer = useCallback(({v, item, npc: n}) => {
    setOffers([])
    const accepted=v<=item.max; const gain=accepted?v:0; totalRef.current+=gain; setTotal(totalRef.current)
    setNpcText(accepted?`「${v}P か…わかった！」✅ 成立！`:`「${v}P！？高すぎる！」❌ 交渉決裂`)
    setHistory(prev=>[...prev,`${item.e}→${gain>0?'+'+gain:'✗'}P`])
    const next=idxRef.current+1; idxRef.current=next
    if(next>=3){setTimeout(()=>endNego(),1000)}
    else{setTimeout(()=>showItem(next,itemsRef.current),1200)}
  }, [endNego, showItem])

  const init = useCallback(() => {
    doneRef.current=false; totalRef.current=0; idxRef.current=0
    const its=[...NEGO_ITEMS].sort(()=>Math.random()-.5).slice(0,3)
    itemsRef.current=its; setItems(its); setIdx(0); setTotal(0); setHistory([]); setResult(null)
    start(); showItem(0,its)
  }, [start, showItem])

  useEffect(() => { init() }, []) // eslint-disable-line

  const item = items[idx]

  return (
    <div style={S.screen}>
      <GameHeader title="💬 闇市交渉" pts={pts} timer={time} onBack={onBack}/>
      <div style={S.body}>
        <Instr>アイテムを最高値で売れ！相手の上限を超えると失敗！3アイテムで15P以上稼げば成功！</Instr>
        <StatBox label="アイテム" val={`${Math.min(idx+1,3)} / 3`}/>
        {item && <div style={{background:'#241a0e',border:'2px solid #5a4228',borderRadius:14,padding:'.9rem',textAlign:'center',width:'100%'}}>
          <div style={{fontSize:'3rem'}}>{item.e}</div>
          <div style={{fontSize:'.95rem',fontWeight:700,color:'#f0e8d0',marginTop:'.25rem'}}>{item.name}</div>
          <div style={{fontSize:'.72rem',color:'#7a6a4a',marginTop:'.15rem'}}>{item.desc}</div>
        </div>}
        <div style={{background:'rgba(0,0,0,.4)',borderLeft:'3px solid #c97b2a',borderRadius:'0 8px 8px 0',padding:'.45rem .75rem',fontSize:'.82rem',color:'#d4c4a0',width:'100%'}}>
          <span style={{marginRight:'.5rem'}}>{npc}</span>{npcText}
        </div>
        {history.length>0 && <div style={{fontSize:'.75rem',color:'#7a6a4a',textAlign:'center'}}>{history.join(' | ')}</div>}
        {offers.length>0 && <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',justifyContent:'center'}}>
          {offers.map((o,i)=><button key={i} onClick={()=>makeOffer(o)} style={{background:'#241a0e',border:'2px solid #3d2e1a',borderRadius:10,color:'#f0e8d0',font:"700 .9rem 'Noto Sans JP',sans-serif",padding:'.55rem 1rem',cursor:'pointer'}}>{o.v}P</button>)}
        </div>}
        <ResultBox result={result}/>
        {result && <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   TITLE SCREEN
════════════════════════════════════════ */
const ALL_GAMES=[
  {id:'box',icon:'📦',name:'箱選びゲーム',desc:'10秒で当たりの箱を選べ！',reward:'最大+10P'},
  {id:'vend',icon:'🏧',name:'ボロ自販機ガチャ',desc:'3台から当たり1台を選べ！',reward:'最大+15P'},
  {id:'hl',icon:'🃏',name:'ハイ＆ロー',desc:'10秒で連続正解を重ねろ！',reward:'最大+25P'},
  {id:'slot',icon:'🎰',name:'路上スロット',desc:'10秒以内に全リールを止めろ',reward:'最大+50P'},
  {id:'fly',icon:'🪰',name:'ハエ捕まえ',desc:'10秒で3匹捕まえろ！',reward:'最大+15P'},
  {id:'scratch',icon:'🪙',name:'スクラッチくじ',desc:'10秒で3マス削れ！',reward:'最大+20P'},
  {id:'trash',icon:'🗑️',name:'ゴミ箱あさり',desc:'10秒！危険なゴミ箱に注意',reward:'最大+15P'},
  {id:'beg',icon:'🙏',name:'物乞いゲーム',desc:'10秒で通行人に物乞い！',reward:'最大+20P'},
  {id:'rain',icon:'☔',name:'雨宿りダッシュ',desc:'10秒で障害物を越えろ！',reward:'最大+12P'},
  {id:'kashi',icon:'🍱',name:'炊き出し争奪戦',desc:'10秒で弁当を3個キャッチ！',reward:'最大+15P'},
  {id:'oxo',icon:'♟️',name:'路上○×ゲーム',desc:'5秒制限！CPUに勝て！',reward:'賭けP×2'},
  {id:'tetris',icon:'📦',name:'段ボールパズル',desc:'10秒でパーツを落とせ！',reward:'最大+20P'},
  {id:'rat',icon:'🐀',name:'ネズミ追い払い',desc:'10秒！荷物を守れ！',reward:'最大+12P'},
  {id:'drunk',icon:'🍺',name:'酔っ払いバランス',desc:'10秒間バランスを保て！',reward:'最大+15P'},
  {id:'music',icon:'🎸',name:'路上ライブ音ゲー',desc:'10秒ライブで投げ銭！',reward:'最大+20P'},
  {id:'nego',icon:'💬',name:'闇市交渉ゲーム',desc:'3アイテムを最高値で売れ！',reward:'最大+25P'},
]

function TitleScreen({ pts, onSelect }) {
  return (
    <div style={{...S.screen, background:'radial-gradient(ellipse 120% 80% at 50% 20%,#2a1a08 0%,#0c0a07 65%)',justifyContent:'flex-start',paddingBottom:'2rem'}}>
      <p style={{marginTop:'1.5rem',fontSize:'.7rem',letterSpacing:'.3em',color:'#7a6a4a'}}>脱・ホームレスサバイバルシティ</p>
      <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'clamp(2.5rem,9vw,5rem)',lineHeight:.9,color:'#c97b2a',textShadow:'0 0 40px rgba(201,123,42,.4),4px 4px 0 #000',textAlign:'center',margin:'.5rem 0'}}>路上<br/>ミニゲーム</h1>
      <div style={{width:200,height:2,background:'linear-gradient(90deg,transparent,#c97b2a,transparent)',margin:'.7rem auto'}}/>
      <div style={{background:'#241a0e',border:'1px solid #5a4228',borderRadius:50,padding:'.4rem 1.4rem',fontSize:'1rem',color:'#e8b84b',fontWeight:700,marginBottom:'1.2rem',boxShadow:'0 0 15px rgba(232,184,75,.15)'}}>💰 所持P: {pts}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'.65rem',padding:'0 .8rem',width:'100%',maxWidth:500}}>
        {ALL_GAMES.map(g=>(
          <div key={g.id} onClick={()=>onSelect(g.id)} style={{background:'#1a1309',border:'1px solid #3d2e1a',borderRadius:13,padding:'1rem .8rem',cursor:'pointer',textAlign:'center',userSelect:'none',transition:'transform .18s cubic-bezier(.34,1.56,.64,1)'}}>
            <span style={{fontSize:'2rem',display:'block',marginBottom:'.3rem'}}>{g.icon}</span>
            <div style={{fontSize:'.88rem',fontWeight:700,color:'#f0e8d0',marginBottom:'.15rem'}}>{g.name}</div>
            <div style={{fontSize:'.65rem',color:'#7a6a4a',lineHeight:1.5}}>{g.desc}</div>
            <div style={{fontSize:'.62rem',color:'#c97b2a',marginTop:'.25rem',fontWeight:700}}>{g.reward}</div>
          </div>
        ))}
      </div>
      <div style={{height:'1rem'}}/>
      <button
        onClick={() => useGameStore.setState({ gamePhase: 'mode_select' })}
        style={{
            marginTop: '10px', padding: '10px 20px', borderRadius: '8px',
            background: '#241a0e', border: '1px solid #5a4228', color: '#d4c4a0',
            cursor: 'pointer', fontWeight: 'bold'
        }}
      >← モード選択へ戻る</button>
      <div style={{height:'2rem'}}/>
    </div>
  )
}

/* ════════════════════════════════════════
   ROOT APP (Zustand 連携版)
════════════════════════════════════════ */
export default function MinigamesApp() {
  const { gachaPoints, addGachaAssets } = useUserStore()
  const [screen, setScreen] = useState(null)

  const addPts = useCallback(async (n) => { 
    if(n > 0) {
      addGachaAssets(0, n);
      await syncGachaData();
    }
  }, [addGachaAssets])

  const subPts = useCallback(async (n) => { 
    addGachaAssets(0, -n);
    await syncGachaData();
  }, [addGachaAssets])

  const goTitle = useCallback(() => setScreen(null), [])
  const goGame = useCallback((id) => setScreen(id), [])

  const gameProps = { pts: gachaPoints, addPts, subPts, onBack: goTitle }

  const GameComponent = {
    box: BoxGame, vend: VendGame, hl: HLGame, slot: SlotGame,
    fly: FlyGame, scratch: ScratchGame, trash: TrashGame, beg: BegGame,
    rain: RainGame, kashi: KashiGame, oxo: OXOGame, tetris: TetrisGame,
    rat: RatGame, drunk: DrunkGame, music: MusicGame, nego: NegoGame
  }[screen]

  return (
    <>
      <GlobalStyles/>
      {!screen && <TitleScreen pts={gachaPoints} onSelect={goGame}/>}
      {screen && GameComponent && <GameComponent key={screen} {...gameProps}/>}
    </>
  )
}