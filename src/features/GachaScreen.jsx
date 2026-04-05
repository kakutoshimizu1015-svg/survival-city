import React, { useState, useCallback, useEffect } from "react";
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';

/* ── スキンデータ（生成画像に対応したSSRを登録） ───────────────────────────────── */
const SKINS = [
  // ── SSR ──────────────────────────────────────────
  { id:"ssr_hacker_cyber", name:"サイバーハッカー", rarity:"SSR", emoji:"💻", pieceColor:"#00FF00", ring:"#005500", desc:"ネットワークの深淵を覗く者。" },
  { id:"ssr_yankee_boss", name:"特攻服の鬼", rarity:"SSR", emoji:"👊", pieceColor:"#FF0000", ring:"#550000", desc:"夜の街を牛耳る最強の不良。" },
  { id:"ssr_1", name:"伝説のホームレス王",   rarity:"SSR", emoji:"👑", pieceColor:"#7A5C00", ring:"#FFD700", desc:"全てを失い、全てを得た者。" },
  { id:"ssr_2", name:"億万長者（変装）",     rarity:"SSR", emoji:"💎", pieceColor:"#4A1A80", ring:"#DA70D6", desc:"実は億万長者だったホームレス。" },
  { id:"ssr_3", name:"路上の神様",           rarity:"SSR", emoji:"🌟", pieceColor:"#005F6B", ring:"#80DEEA", desc:"すべての路上生活者を見守る神。" },

  // ── SR ──────────────────────────────────────────
  { id:"sr_1",  name:"忍者ホームレス",       rarity:"SR",  emoji:"🥷", pieceColor:"#1A0D40", ring:"#9B59B6", desc:"闇夜に溶け込む路上の影。" },
  { id:"sr_2",  name:"ダンボール将軍",       rarity:"SR",  emoji:"📦", pieceColor:"#5C2A14", ring:"#C17B50", desc:"ダンボール鎧を纏う路上の戦士。" },
  { id:"sr_3",  name:"ゴミ神",              rarity:"SR",  emoji:"♻️", pieceColor:"#003D33", ring:"#4DB6AC", desc:"全てのゴミに感謝する神聖な駒。" },
  { id:"sr_4",  name:"元力士",              rarity:"SR",  emoji:"🤼", pieceColor:"#4A2800", ring:"#FF8A65", desc:"土俵を失った巨漢の駒。" },
  { id:"sr_5",  name:"海賊ホームレス",       rarity:"SR",  emoji:"🏴‍☠️", pieceColor:"#0D2B52", ring:"#4FC3F7", desc:"海を渡り路上に流れ着いた駒。" },

  // ── R ──────────────────────────────────────────
  { id:"r_1",   name:"ヤンキー",             rarity:"R",   emoji:"😤", pieceColor:"#0A3070", ring:"#64B5F6", desc:"ツッパリ路上デビューの駒。" },
  { id:"r_2",   name:"シェフ見習い",         rarity:"R",   emoji:"👨‍🍳", pieceColor:"#14421A", ring:"#81C784", desc:"廃棄食材でグルメ飯を作る駒。" },
  { id:"r_3",   name:"元警備員",             rarity:"R",   emoji:"💂", pieceColor:"#263238", ring:"#78909C", desc:"守るべき場所を失った男。" },
  { id:"r_4",   name:"バイカー",             rarity:"R",   emoji:"🏍️", pieceColor:"#5C0000", ring:"#EF5350", desc:"自由を求めて走り続ける駒。" },
  { id:"r_5",   name:"釣り師",               rarity:"R",   emoji:"🎣", pieceColor:"#01579B", ring:"#81D4FA", desc:"川魚で生き延びる職人の駒。" },

  // ── N ──────────────────────────────────────────
  { id:"n_1",   name:"サラリーマン（元）",   rarity:"N",   emoji:"👔", pieceColor:"#37474F", ring:"#9E9E9E", desc:"リストラされた普通の男の駒。" },
  { id:"n_2",   name:"学生（元）",           rarity:"N",   emoji:"🎒", pieceColor:"#3E2723", ring:"#8D6E63", desc:"夢破れた若者の駒。" },
  { id:"n_3",   name:"おじいちゃん",         rarity:"N",   emoji:"👴", pieceColor:"#424242", ring:"#BDBDBD", desc:"年金が出なかった老人の駒。" },
  { id:"n_4",   name:"ギャンブラー",         rarity:"N",   emoji:"🎰", pieceColor:"#1A237E", ring:"#7986CB", desc:"全財産を溶かした男の駒。" },
  { id:"n_5",   name:"アーティスト",         rarity:"N",   emoji:"🎨", pieceColor:"#004D40", ring:"#4DD0E1", desc:"路上パフォーマーの夢追い人。" },
];

const RARITY_CFG = {
  SSR: { label:"SSR", gold:"#FFD700", bg:"#3D1500", border:"#FFD700", rate:3,  glow:"#FF8C00" },
  SR:  { label:"SR",  gold:"#DA70D6", bg:"#1A0040", border:"#CE93D8", rate:12, glow:"#9B59B6" },
  R:   { label:"R",   gold:"#64B5F6", bg:"#001A4A", border:"#4FC3F7", rate:30, glow:"#2196F3" },
  N:   { label:"N",   gold:"#B0BEC5", bg:"#1A1A1A", border:"#78909C", rate:55, glow:"#607D8B" },
};

const PULL_PHRASES = ["ジャラジャラ…","ガコン！","ガラガラ…","ゴトゴト…","ジャキン！"];
const PARTICLE_EMOJIS = ["🥫","🗑️","📰","📦","🧤","🪣","🔩","🪝","🧣"];

/* ── ユーティリティ ──────────────────────────────────── */
function rollRarity() {
  const r = Math.random() * 100;
  if (r < 3)  return "SSR";
  if (r < 15) return "SR";
  if (r < 45) return "R";
  return "N";
}
function pullSkins(count) {
  return Array.from({ length: count }, () => {
    const rarity = rollRarity();
    const pool   = SKINS.filter(s => s.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  });
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(a, b) { return a + Math.random() * (b - a); }

/* ── 空き缶パーティクル ─────────────────────────────── */
function CanParticle({ trigger, count = 18 }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const items = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji: PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)],
      x: rand(5, 95),
      delay: rand(0, 0.5),
      dur: rand(1.0, 2.2),
      size: rand(14, 28),
      drift: rand(-30, 30),
    }));
    setParticles(items);
    const t = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:200, overflow:"hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left:`${p.x}%`, bottom:"-5%",
          fontSize:p.size,
          animation:`canFly ${p.dur}s ease-out ${p.delay}s both`,
          "--drift": `${p.drift}px`,
        }}>{p.emoji}</div>
      ))}
    </div>
  );
}

/* ── 焚き火バレルガチャ台 ────────────────────────────── */
function BarrelMachine({ phase }) {
  const isShaking = phase === "shaking";
  return (
    <div style={{ position:"relative", width:240, margin:"0 auto" }}>

      <div style={{
        position:"absolute", inset:-20, borderRadius:20,
        background: isShaking
          ? "radial-gradient(ellipse at 50% 60%, rgba(255,80,0,0.18) 0%, transparent 70%)"
          : "radial-gradient(ellipse at 50% 60%, rgba(255,80,0,0.08) 0%, transparent 70%)",
        transition:"background 0.4s",
        pointerEvents:"none",
      }}/>

      <div style={{
        background:"#3E1F00", border:"3px solid #8B5E1A",
        borderRadius:"6px 6px 0 0", padding:"6px 0", textAlign:"center",
        position:"relative", overflow:"hidden",
      }}>
        {[8,20,32,44,56,68,80,92].map((l, i) => (
          <div key={i} style={{
            position:"absolute", bottom:3, left:`${l}%`,
            width:5, height:5, borderRadius:"50%",
            background: i % 2 === 0 ? "#FFD700" : "#FF6B00",
            animation:`bulbFlicker ${0.8+i*0.15}s ease-in-out infinite alternate`,
          }}/>
        ))}
        <div style={{
          fontSize:11, color:"#DEB887", letterSpacing:4,
          fontWeight:"bold", position:"relative", zIndex:1,
        }}>★ 路上ガチャ屋台 ★</div>
      </div>

      <div style={{
        display:"flex", gap:8, alignItems:"flex-end", justifyContent:"center",
        background:"#1A0900", border:"3px solid #5C3015", borderTop:"none",
        padding:"12px 12px 0",
      }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2, paddingBottom:20 }}>
          <div style={{ display:"flex", gap:2 }}>
            {["🥫","🥫"].map((e,i) => (
              <div key={i} style={{
                fontSize:16,
                animation: isShaking ? `canWiggle ${0.12+i*0.04}s ease-in-out infinite alternate` : "none",
              }}>{e}</div>
            ))}
          </div>
          <div style={{ display:"flex", gap:2 }}>
            {["🥫","🥫","🥫"].map((e,i) => (
              <div key={i} style={{
                fontSize:16,
                animation: isShaking ? `canWiggle ${0.15+i*0.03}s ease-in-out infinite alternate` : "none",
              }}>{e}</div>
            ))}
          </div>
          <div style={{ fontSize:12, color:"#5C3015", textAlign:"center" }}>缶の山</div>
        </div>

        <div style={{
          animation: isShaking ? "barrelShake 0.1s ease infinite" : "none",
          position:"relative",
        }}>
          <div style={{
            width:96, height:108,
            background:"#2D1800",
            border:"4px solid #5C3015",
            borderRadius:"6px 6px 14px 14px",
            position:"relative", overflow:"hidden",
          }}>
            {[18,52,86].map(y => (
              <div key={y} style={{
                position:"absolute", top:y, left:0, right:0,
                height:5, background:"#5C3015",
                borderTop:"1px solid #7A4020", borderBottom:"1px solid #3D1800",
              }}/>
            ))}
            <div style={{
              position:"absolute", inset:0,
              background: isShaking
                ? "radial-gradient(ellipse at 50% 20%, rgba(255,120,0,0.5) 0%, transparent 70%)"
                : "radial-gradient(ellipse at 50% 20%, rgba(255,80,0,0.22) 0%, transparent 70%)",
              transition:"background 0.25s",
            }}/>
            <div style={{
              position:"absolute", bottom:10, left:0, right:0,
              display:"flex", justifyContent:"center", gap:4, flexWrap:"wrap", padding:"0 10px",
            }}>
              {(isShaking
                ? ["🥫","🥫","🥫","🥫","🥫","🥫"]
                : ["🥫","📰","🗑️","🧤"]
              ).map((e,i) => (
                <div key={i} style={{
                  fontSize:11,
                  animation: isShaking
                    ? `canSpin ${0.25+i*0.06}s linear infinite`
                    : "none",
                }}>{e}</div>
              ))}
            </div>
          </div>
          <div style={{
            position:"absolute", top:-24, left:"50%", transform:"translateX(-50%)",
            fontSize: isShaking ? 38 : 28,
            filter:`drop-shadow(0 0 ${isShaking ? 12 : 6}px #FF4500)`,
            animation:"fireFlicker 0.2s ease-in-out infinite alternate",
            transition:"font-size 0.3s",
          }}>🔥</div>

          <div style={{
            width:100, height:10,
            background:"#1A0D00", border:"3px solid #4A2800",
            borderRadius:"0 0 10px 10px", borderTop:"none",
            margin:"0 auto",
          }}/>
          <div style={{
            width:58, margin:"6px auto 0",
            background:"#0D0500", border:"3px solid #4A2800",
            borderRadius:"0 0 8px 8px", borderTop:"none",
            height:22, display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {isShaking && <span style={{ fontSize:15, animation:"canBounce 0.3s ease infinite" }}>✨</span>}
            {phase === "done" && <span style={{ fontSize:15 }}>📦</span>}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:4, paddingBottom:20 }}>
          {["📰","🗑️","📦"].map((e,i) => (
            <div key={i} style={{
              fontSize:18, opacity:0.85,
              animation: isShaking ? `canWiggle ${0.18+i*0.05}s ease-in-out infinite alternate` : "none",
            }}>{e}</div>
          ))}
          <div style={{ fontSize:10, color:"#5C3015", textAlign:"center" }}>ゴミ</div>
        </div>
      </div>

      <div style={{
        height:10, background:"linear-gradient(180deg,#3D1F0A,#1A0900)",
        border:"3px solid #5C3015", borderTop:"none",
        borderRadius:"0 0 6px 6px",
      }}/>

      {isShaking && (
        <div style={{
          textAlign:"center", marginTop:12,
          fontSize:15, fontWeight:"bold", color:"#FF8C00",
          animation:"pulseText 0.35s ease-in-out infinite alternate",
          textShadow:"0 0 14px #FF4500",
          letterSpacing:2,
        }}>
          {PULL_PHRASES[Math.floor(Math.random() * PULL_PHRASES.length)]}
        </div>
      )}
    </div>
  );
}

/* ── ダンボール箱カード（リバール） ─────────────────── */
function CardboardReveal({ skin, revealed, onReveal, index }) {
  const cfg = RARITY_CFG[skin.rarity];
  const [opening, setOpening] = useState(false);

  const handleClick = () => {
    if (revealed || opening) return;
    setOpening(true);
    setTimeout(() => { onReveal(); setOpening(false); }, 480);
  };

  return (
    <div onClick={handleClick} style={{
      width:84,
      cursor: revealed ? "default" : "pointer",
      animation:`cardAppear 0.45s ease ${index * 0.06}s both`,
    }}>
      {!revealed ? (
        <div style={{
          height:122,
          background: opening
            ? "linear-gradient(135deg,#7A5400,#5C3D00)"
            : "linear-gradient(160deg,#6B4A1A,#3E2A0A)",
          border:`3px solid ${opening ? "#D4A017" : "#7A5228"}`,
          borderRadius:10,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:5,
          overflow:"hidden", position:"relative",
          transition:"all 0.2s",
          transform: opening ? "scale(0.94) rotate(-3deg)" : "scale(1)",
        }}>
          {[18,34,50,66,82,98,114].map(y => (
            <div key={y} style={{
              position:"absolute", top:y, left:0, right:0,
              height:1, background:"rgba(0,0,0,0.18)",
            }}/>
          ))}
          <div style={{
            position:"absolute", top:0, bottom:0, left:"50%", width:10,
            background:"rgba(160,115,15,0.3)", transform:"translateX(-50%)",
          }}/>
          <div style={{
            position:"absolute", top:"50%", left:0, right:0, height:10,
            background:"rgba(160,115,15,0.3)", transform:"translateY(-50%)",
          }}/>
          <div style={{
            position:"absolute", top:28, left:0, right:0, height:2,
            background:"rgba(0,0,0,0.28)",
          }}/>
          <div style={{ fontSize:28, position:"relative", zIndex:1 }}>📦</div>
          <div style={{
            fontSize:8, color: opening ? "#FFD700" : "#C4962A",
            fontWeight:"bold", position:"relative", zIndex:1, textAlign:"center",
          }}>{opening ? "開封中…" : "タップで開封"}</div>
        </div>
      ) : (
        <div style={{
          height:122, position:"relative",
          background:`linear-gradient(145deg, ${cfg.bg}, ${cfg.bg}ee)`,
          border:`2px solid ${cfg.border}`,
          borderRadius:10,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:4,
          padding:"6px 4px",
          boxShadow:`0 0 16px ${cfg.glow}55`,
          animation:"revealPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>
          {(skin.rarity === "SSR" || skin.rarity === "SR") && (
            <div style={{
              position:"absolute", inset:0, borderRadius:8,
              background:`radial-gradient(ellipse at 50% 0%, ${cfg.glow}38 0%, transparent 70%)`,
              animation:"shimmer 2s ease-in-out infinite",
            }}/>
          )}
          <div style={{
            background:cfg.gold, color:"#000",
            fontSize:8, fontWeight:"bold",
            padding:"1px 10px", borderRadius:20,
            position:"relative", zIndex:1,
          }}>{skin.rarity}</div>
          <div style={{
            width:46, height:46, borderRadius:"50%",
            background:skin.pieceColor,
            border:`3px solid ${skin.ring}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:21, position:"relative", zIndex:1,
            boxShadow:`0 3px 10px #0008, inset 0 3px 6px #ffffff20`,
            overflow:"hidden",
          }}>
            <div style={{
              position:"absolute", top:"8%", left:"12%",
              width:"38%", height:"28%", borderRadius:"50%",
              background:"rgba(255,255,255,0.2)", transform:"rotate(-25deg)",
            }}/>
            <span style={{ position:"relative" }}>{skin.emoji}</span>
          </div>
          <div style={{
            fontSize:8, fontWeight:"bold", textAlign:"center",
            color:cfg.gold, lineHeight:1.3, padding:"0 2px",
            position:"relative", zIndex:1,
          }}>{skin.name}</div>
        </div>
      )}
    </div>
  );
}

/* ── 10連シネマティック ───────────────────────────────── */
function CinematicReveal({ skins, onDone }) {
  const [step,    setStep]    = useState(0);
  const [shown,   setShown]   = useState([]);
  const [current, setCurrent] = useState(-1);
  const [best,    setBest]    = useState(null);

  useEffect(() => {
    const rankOf = r => ({SSR:3,SR:2,R:1,N:0})[r];
    const topSkin = skins.reduce((b,s) => rankOf(s.rarity) > rankOf(b.rarity) ? s : b, skins[0]);
    setBest(topSkin);

    const run = async () => {
      await sleep(300);
      setStep(1);
      for (let i = 0; i < skins.length; i++) {
        await sleep(260);
        setCurrent(i);
        setShown(prev => [...prev, i]);
      }
      await sleep(700);
      setStep(2);
      await sleep(2200);
      onDone();
    };
    run();
  }, [skins, onDone]);

  const cfg = best ? RARITY_CFG[best.rarity] : null;

  return (
    <div
      onClick={step === 2 ? onDone : undefined}
      style={{
        position:"fixed", inset:0, zIndex:300,
        background:"rgba(0,0,0,0.97)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:18,
        cursor: step === 2 ? "pointer" : "default",
      }}
    >
      {step === 1 && (
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:3,
          background:"linear-gradient(90deg,transparent,#FF8C00,#FFD700,transparent)",
          animation:"scanLine 1.8s linear infinite",
        }}/>
      )}

      {step === 0 && (
        <div style={{ fontSize:26, color:"#D4A017", animation:"fadeIn 0.4s ease" }}>
          🔥 開封中…
        </div>
      )}

      {step >= 1 && (
        <>
          {step === 2 && best && (
            <div style={{
              textAlign:"center",
              animation:"zoomIn 0.6s cubic-bezier(0.34,1.56,0.64,1)",
              marginBottom:4,
            }}>
              <div style={{
                fontSize:11, color:cfg.gold,
                letterSpacing:5, marginBottom:8,
              }}>★ {cfg.label} 排出 ★</div>
              <div style={{
                width:78, height:78, borderRadius:"50%",
                background:best.pieceColor,
                border:`4px solid ${best.ring}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:34, margin:"0 auto 10px",
                boxShadow:`0 0 28px ${cfg.glow}, 0 0 56px ${cfg.glow}55`,
              }}>{best.emoji}</div>
              <div style={{ fontSize:15, color:cfg.gold, fontWeight:"bold" }}>{best.name}</div>
            </div>
          )}

          <div style={{
            display:"flex", flexWrap:"wrap", gap:7,
            justifyContent:"center", maxWidth:320, padding:"0 14px",
          }}>
            {skins.map((s, i) => {
              const c   = RARITY_CFG[s.rarity];
              const vis = shown.includes(i);
              return (
                <div key={i} style={{
                  width:40, height:40, borderRadius:"50%",
                  background: vis ? s.pieceColor : "#111",
                  border:`2px solid ${vis ? c.border : "#333"}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:17,
                  transition:"all 0.22s",
                  transform: i === current && step === 1 ? "scale(1.35)" : "scale(1)",
                  boxShadow: vis ? `0 0 12px ${c.glow}77` : "none",
                  opacity: vis ? 1 : 0.2,
                }}>{vis ? s.emoji : "?"}</div>
              );
            })}
          </div>

          {step === 2 && (
            <div style={{
              color:"#666", fontSize:11,
              animation:"fadeIn 0.5s ease 0.6s both",
            }}>タップして続ける</div>
          )}
        </>
      )}
    </div>
  );
}

/* ── メインコンポーネント ────────────────────────────── */
export default function GachaScreen() {
  const { gachaCans, gachaPoints, unlockedSkins, addGachaAssets, unlockMultipleSkins } = useUserStore();

  const [currency,    setCurrency]    = useState("can"); // "can" | "p"
  const [phase,       setPhase]       = useState("idle");
  const [results,     setResults]     = useState([]);
  const [revealed,    setRevealed]    = useState(new Set());
  const [view,        setView]        = useState("machine");
  const [totalPulls,  setTotalPulls]  = useState(0);
  const [notif,       setNotif]       = useState(null);
  const [canTick,     setCanTick]     = useState(0);
  const [showCinema,  setShowCinema]  = useState(false);
  const [pendingRes,  setPendingRes]  = useState([]);

  // unlockedSkins からコレクション状態を生成
  const collection = {};
  SKINS.forEach(s => {
      collection[s.id] = unlockedSkins.filter(id => id === s.id).length;
  });

  const notify = useCallback((msg, type="ok") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 2600);
  }, []);

  const doPull = useCallback(async (count) => {
    const canCost = count === 1 ? 5 : 45;
    const pCost   = count === 1 ? 50 : 450;
    
    if (currency === "can") {
      if (gachaCans < canCost) { notify("空き缶が足りない！ゲームで集めよう！", "err"); return; }
    } else {
      if (gachaPoints < pCost) { notify("Pが足りない！ゲームで稼ごう！", "err"); return; }
    }
    
    setPhase("shaking");
    if (currency === "can") addGachaAssets(-canCost, 0);
    else addGachaAssets(0, -pCost);
    
    await sleep(350);
    setCanTick(p => p + 1);
    await sleep(1300);
    
    const pulled = pullSkins(count);
    const pulledIds = pulled.map(s => s.id);
    unlockMultipleSkins(pulledIds);

    setPhase("done");
    setTotalPulls(t => t + count);
    
    if (count >= 10) {
      setPendingRes(pulled);
      setShowCinema(true);
    } else {
      setResults(pulled);
      setRevealed(new Set());
      setView("results");
      setPhase("idle");
    }
  }, [gachaCans, gachaPoints, currency, notify, addGachaAssets, unlockMultipleSkins]);

  const onCinemaDone = useCallback(() => {
    setShowCinema(false);
    setResults(pendingRes);
    setRevealed(new Set());
    setView("results");
    setPhase("idle");
  }, [pendingRes]);

  const revealOne = useCallback((i) =>
    setRevealed(prev => new Set([...prev, i])), []);
  const revealAll = useCallback(() => {
    setRevealed(new Set(results.map((_, i) => i)));
    if (results.some(s => s.rarity==="SSR"||s.rarity==="SR")) setCanTick(p=>p+1);
  }, [results]);

  const owned  = Object.values(collection).filter(v=>v>0).length;
  const allRev = results.length > 0 && revealed.size === results.length;

  const BG    = "#0C0600";
  const PANEL = "#1E0E00";
  const BORD  = "#5C3015";
  const LIGHT = "#EDE0C4";
  const MUTED = "#7A5A35";
  const GOLD  = "#D4A017";
  const ACC   = "#FF6600";

  const tabStyle = (active) => ({
    flex:1, padding:"10px 2px", textAlign:"center",
    fontSize:10, fontWeight:active?"bold":"normal",
    color:active?GOLD:MUTED,
    background:active?"#3D1A08":"transparent",
    border:"none", cursor:"pointer",
    borderBottom:`3px solid ${active?GOLD:"transparent"}`,
    transition:"all 0.2s",
    letterSpacing:0.3,
  });

  const pullBtnBase = (disabled, color, bcolor) => ({
    flex:1, padding:"15px 0", borderRadius:12,
    background: disabled ? "#150800" : color,
    border:`2px solid ${disabled?BORD:bcolor}`,
    color: disabled ? MUTED : "#fff",
    fontSize:13, fontWeight:"bold",
    cursor:disabled?"not-allowed":"pointer",
    transition:"all 0.18s",
    textShadow: disabled?"none":"0 1px 4px #0009",
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000,
      background:BG, overflowY: 'auto',
      fontFamily:'"Noto Sans JP","Hiragino Kaku Gothic Pro","Yu Gothic",sans-serif',
      color:LIGHT, display:"flex", flexDirection:"column",
      userSelect:"none",
    }}>
      <style>{`
        @keyframes canFly     { 0%{transform:translateY(0) translateX(0) rotate(0);opacity:1} 100%{transform:translateY(-105vh) translateX(var(--drift,0px)) rotate(360deg);opacity:0} }
        @keyframes fireFlicker{ 0%{transform:translateX(-50%) scaleX(0.88)scaleY(0.92)} 100%{transform:translateX(-50%) scaleX(1.12)scaleY(1.06)} }
        @keyframes barrelShake{ 0%{transform:rotate(-5deg) translateX(-3px)} 50%{transform:rotate(4deg) translateX(3px)} 100%{transform:rotate(-5deg) translateX(-3px)} }
        @keyframes canWiggle  { 0%{transform:rotate(-10deg)} 100%{transform:rotate(10deg)} }
        @keyframes canSpin    { to{transform:rotate(360deg)} }
        @keyframes canBounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulseText  { 0%{opacity:.65;letter-spacing:1px} 100%{opacity:1;letter-spacing:4px} }
        @keyframes bulbFlicker{ 0%{opacity:.4;transform:scale(.85)} 100%{opacity:1;transform:scale(1.1)} }
        @keyframes cardAppear { from{opacity:0;transform:translateY(22px)scale(.78)} to{opacity:1;transform:translateY(0)scale(1)} }
        @keyframes revealPop  { from{transform:scale(.45)rotate(-12deg);opacity:0} to{transform:scale(1)rotate(0);opacity:1} }
        @keyframes shimmer    { 0%,100%{opacity:.45} 50%{opacity:1} }
        @keyframes scanLine   { from{top:0} to{top:100%} }
        @keyframes zoomIn     { from{transform:scale(.25);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes glowPulse  { 0%,100%{box-shadow:0 0 6px #FF600044} 50%{box-shadow:0 0 18px #FF6000AA} }
        @keyframes starTwinkle{ 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:.9;transform:scale(1.1)} }
        .gtab:hover{background:#3D1A08!important}
        .gpb:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-2px)!important}
        .gpb:active:not(:disabled){transform:translateY(1px)!important}
        .gcitem:hover{transform:translateY(-4px)!important;transition:transform .18s!important}
      `}</style>

      <CanParticle trigger={canTick} count={22}/>

      {showCinema && <CinematicReveal skins={pendingRes} onDone={onCinemaDone}/>}

      {notif && (
        <div style={{
          position:"fixed", top:14, left:"50%", transform:"translateX(-50%)",
          background: notif.type==="err" ? "#6B0000" : "#1E3A14",
          border:`2px solid ${notif.type==="err" ? "#EF5350" : "#66BB6A"}`,
          borderRadius:10, padding:"9px 22px",
          color:"#fff", fontWeight:"bold", fontSize:13,
          zIndex:400, animation:"fadeIn 0.3s ease", whiteSpace:"nowrap",
        }}>{notif.msg}</div>
      )}

      {/* ヘッダー */}
      <div style={{
        background:"#150800", borderBottom:`3px solid ${BORD}`,
        padding:"11px 16px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"relative", overflow:"hidden",
      }}>
        {[8,18,32,48,62,75,88,94].map((l,i) => (
          <div key={i} style={{
            position:"absolute", top:`${15+i%3*22}%`, left:`${l}%`,
            width:2, height:2, borderRadius:"50%", background:"#fff",
            animation:`starTwinkle ${1.4+i*0.2}s ease-in-out ${i*0.18}s infinite`,
          }}/>
        ))}
        
        <button 
          onClick={() => useGameStore.setState({ gamePhase: 'mode_select' })}
          style={{ 
            background: 'transparent', border: `1px solid ${BORD}`, borderRadius: 6, 
            padding: '4px 10px', color: LIGHT, fontSize: 12, cursor: 'pointer',
            position: "relative"
          }}
        >
          ◀ 戻る
        </button>

        <div style={{ fontSize:16, fontWeight:"bold", color:GOLD, position:"relative", marginLeft: 'auto', marginRight: '10px' }}>
          🔥 路上ガチャ屋台
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, position:"relative" }}>
          <div style={{
            background:"#150800", border:`2px solid ${currency==="p" ? "#7A9A00" : "#7A5400"}`,
            borderRadius:20, padding:"5px 12px",
            display:"flex", alignItems:"center", gap:5,
            fontSize:14, fontWeight:"bold",
            color: currency==="p" ? "#B8D44A" : GOLD,
            animation: (currency==="can"&&gachaCans<10)||(currency==="p"&&gachaPoints<50) ? "glowPulse 1.5s ease infinite" : "none",
          }}>
            {currency==="can" ? `🥫 ${gachaCans} 缶` : `💰 ${gachaPoints} P`}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", background:PANEL, borderBottom:`2px solid ${BORD}` }}>
        {[
          ["machine", `🔥 ガチャ`],
          ["results", `📦 結果${results.length>0?`(${results.length})`:""}`],
          ["collection", `🗂 コレクション(${owned}/${SKINS.length})`],
        ].map(([id, label]) => (
          <button key={id} className="gtab" onClick={() => setView(id)} style={tabStyle(view===id)}>{label}</button>
        ))}
      </div>

      {view === "machine" && (
        <div style={{
          flex:1, padding:"22px 16px",
          display:"flex", flexDirection:"column", alignItems:"center", gap:20,
          background:`radial-gradient(ellipse at 50% 10%, #2A0E00 0%, ${BG} 55%)`,
        }}>
          <BarrelMachine phase={phase}/>

          <div style={{
            width:"100%", maxWidth:330,
            background:PANEL, border:`2px solid ${BORD}`,
            borderRadius:12, padding:"10px 12px",
            display:"flex", flexDirection:"column", gap:8,
          }}>
            <div style={{ fontSize:10, color:MUTED, textAlign:"center" }}>💱 支払い方法</div>
            <div style={{
              display:"flex", borderRadius:10, overflow:"hidden",
              border:`2px solid ${BORD}`,
            }}>
              {[
                { id:"can", label:"🥫 空き缶", desc:`所持: ${gachaCans}缶`, active:"#5C2A00", activeBorder:"#FF6600", inactiveC:MUTED },
                { id:"p",   label:"💰 P",     desc:`所持: ${gachaPoints}P`, active:"#1A3D00", activeBorder:"#66BB6A", inactiveC:MUTED },
              ].map(({ id, label, desc, active, activeBorder }) => {
                const isActive = currency === id;
                return (
                  <button key={id} onClick={() => setCurrency(id)} style={{
                    flex:1, padding:"10px 6px", border:"none",
                    background: isActive ? active : "#150800",
                    color: isActive ? "#fff" : MUTED,
                    cursor:"pointer", transition:"all 0.2s",
                    borderRight: id==="can" ? `1px solid ${BORD}` : "none",
                    position:"relative",
                  }}>
                    {isActive && (
                      <div style={{
                        position:"absolute", top:0, left:0, right:0, height:2,
                        background: activeBorder,
                      }}/>
                    )}
                    <div style={{ fontSize:13, fontWeight:"bold" }}>{label}</div>
                    <div style={{ fontSize:9, opacity:0.7, marginTop:2 }}>{desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{
            width:"100%", maxWidth:330,
            background:PANEL, border:`2px solid ${BORD}`,
            borderRadius:12, padding:"12px 14px",
          }}>
            <div style={{ fontSize:10, color:MUTED, textAlign:"center", marginBottom:8 }}>
              📊 排出率
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
              {Object.entries(RARITY_CFG).map(([r, cfg]) => (
                <div key={r} style={{
                  flex:1, textAlign:"center", background:"#150800",
                  borderRadius:8, padding:"6px 4px",
                  border:`1px solid ${cfg.border}44`,
                }}>
                  <div style={{
                    background:cfg.gold, color:"#000",
                    borderRadius:4, padding:"1px 0",
                    fontSize:9, fontWeight:"bold", marginBottom:3,
                  }}>{r}</div>
                  <div style={{ fontSize:12, color:cfg.gold }}>{cfg.rate}%</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", gap:12, width:"100%", maxWidth:330 }}>
            {(() => {
              const cost1  = currency==="can" ? 5   : 50;
              const cost10 = currency==="can" ? 45  : 450;
              const unit   = currency==="can" ? "缶" : "P";
              const icon   = currency==="can" ? "🥫" : "💰";
              const bal    = currency==="can" ? gachaCans : gachaPoints;
              const dis1   = phase==="shaking"||bal<cost1;
              const dis10  = phase==="shaking"||bal<cost10;
              return (
                <>
                  <button className="gpb" disabled={dis1} onClick={() => doPull(1)}
                    style={pullBtnBase(dis1,"linear-gradient(135deg,#5C1A00,#8B2500)",ACC)}>
                    <div>1回引く</div>
                    <div style={{ fontSize:10, opacity:0.85, marginTop:2 }}>{icon} × {cost1}{unit}</div>
                  </button>
                  <button className="gpb" disabled={dis10} onClick={() => doPull(10)}
                    style={pullBtnBase(dis10,"linear-gradient(135deg,#1A4A00,#2D7A32)","#66BB6A")}>
                    <div>10回引く</div>
                    <div style={{ fontSize:10, opacity:0.85, marginTop:2 }}>{icon} × {cost10}{unit}</div>
                  </button>
                </>
              );
            })()}
          </div>

          <div style={{ display:"flex", gap:10, width:"100%", maxWidth:330 }}>
            {[["🎰 総排出数", totalPulls],["🗂 コレクション",`${owned}/${SKINS.length}`]].map(([l,v])=>(
              <div key={l} style={{
                flex:1, background:PANEL, border:`2px solid ${BORD}`,
                borderRadius:10, padding:"10px 6px", textAlign:"center",
              }}>
                <div style={{ fontSize:9, color:MUTED }}>{l}</div>
                <div style={{ fontSize:20, fontWeight:"bold" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "results" && (
        <div style={{
          flex:1, padding:16,
          background:`radial-gradient(ellipse at 50% 0%, #1E0A00, ${BG} 65%)`,
        }}>
          {results.length === 0 ? (
            <div style={{ textAlign:"center", padding:52, color:MUTED }}>
              <div style={{ fontSize:52, marginBottom:14 }}>📦</div>
              <div style={{ fontSize:14 }}>ダンボールが空だ…</div>
              <div style={{ fontSize:11, marginTop:6, color:"#5C3015" }}>
                バレルを回してスキンをゲット！
              </div>
              <button onClick={() => setView("machine")} style={{
                marginTop:18, background:"linear-gradient(135deg,#5C1A00,#8B2500)",
                border:`2px solid ${ACC}`, borderRadius:10,
                padding:"11px 28px", color:"#fff",
                fontWeight:"bold", cursor:"pointer", fontSize:13,
              }}>🔥 バレルを回す</button>
            </div>
          ) : (
            <>
              {results.some(s=>s.rarity==="SSR"||s.rarity==="SR") && (
                <div style={{
                  background:"linear-gradient(135deg,#3D1500,#7A3800)",
                  border:"2px solid #FFD700", borderRadius:12,
                  padding:"10px 16px", textAlign:"center", marginBottom:14,
                  animation:"shimmer 2s ease-in-out infinite",
                }}>
                  <div style={{ fontSize:16, fontWeight:"bold", color:"#FFD700" }}>
                    🔥 レアスキン排出！ 🔥
                  </div>
                </div>
              )}

              <div style={{
                display:"flex", flexWrap:"wrap", gap:9,
                justifyContent:"center", marginBottom:14,
              }}>
                {results.map((skin, i) => (
                  <CardboardReveal key={i} skin={skin} index={i}
                    revealed={revealed.has(i)}
                    onReveal={() => revealOne(i)}
                  />
                ))}
              </div>

              <div style={{ display:"flex", gap:10 }}>
                {!allRev && (
                  <button onClick={revealAll} style={{
                    flex:1, background:"#3D1F00",
                    border:`2px solid ${GOLD}`, borderRadius:10,
                    padding:"12px", color:GOLD,
                    fontWeight:"bold", fontSize:13, cursor:"pointer",
                  }}>📦 全て開封</button>
                )}
                <button onClick={() => setView("machine")} style={{
                  flex:1, background:"linear-gradient(135deg,#5C1A00,#8B2500)",
                  border:`2px solid ${ACC}`, borderRadius:10,
                  padding:"12px", color:"#fff",
                  fontWeight:"bold", fontSize:13, cursor:"pointer",
                }}>🔥 もう一度引く</button>
              </div>
            </>
          )}
        </div>
      )}

      {view === "collection" && (
        <div style={{ flex:1, padding:14, background:BG }}>
          {["SSR","SR","R","N"].map(rarity => {
            const cfg  = RARITY_CFG[rarity];
            const pool = SKINS.filter(s=>s.rarity===rarity);
            const got  = pool.filter(s=>collection[s.id]>0).length;
            return (
              <div key={rarity} style={{ marginBottom:18 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{
                    background:cfg.gold, color:"#000",
                    borderRadius:6, padding:"1px 10px",
                    fontSize:11, fontWeight:"bold",
                  }}>{rarity}</div>
                  <div style={{ flex:1, height:1, background:BORD }}/>
                  <div style={{ fontSize:10, color:MUTED }}>{got}/{pool.length}</div>
                </div>
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"repeat(auto-fill,minmax(104px,1fr))",
                  gap:8,
                }}>
                  {pool.map(skin => {
                    const count = collection[skin.id]||0;
                    const has   = count>0;
                    return (
                      <div key={skin.id} className="gcitem" style={{
                        background: has?PANEL:"#0C0600",
                        border:`2px solid ${has?cfg.border:"#2A1208"}`,
                        borderRadius:12, padding:10, textAlign:"center",
                        opacity: has?1:0.35, position:"relative",
                        boxShadow: has?`0 0 10px ${cfg.glow}33`:"none",
                      }}>
                        <div style={{ position:"relative", display:"inline-block", marginBottom:5 }}>
                          <div style={{
                            width:44, height:44, borderRadius:"50%",
                            background: has?skin.pieceColor:"#1A0A00",
                            border:`3px solid ${has?skin.ring:"#333"}`,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:19, margin:"0 auto", overflow:"hidden", position:"relative",
                            boxShadow: has?"0 2px 8px #0006, inset 0 3px 5px #ffffff14":"none",
                          }}>
                            {has&&<div style={{
                              position:"absolute", top:"8%", left:"12%",
                              width:"38%", height:"28%", borderRadius:"50%",
                              background:"rgba(255,255,255,0.18)", transform:"rotate(-25deg)",
                            }}/>}
                            <span style={{ position:"relative" }}>{has?skin.emoji:"?"}</span>
                          </div>
                          {count>1&&(
                            <div style={{
                              position:"absolute", top:-4, right:-4,
                              background:GOLD, color:"#000",
                              borderRadius:"50%", width:16, height:16,
                              fontSize:9, fontWeight:"bold",
                              display:"flex", alignItems:"center", justifyContent:"center",
                            }}>{count}</div>
                          )}
                        </div>
                        <div style={{ fontSize:8, color:cfg.gold, fontWeight:"bold", marginBottom:1 }}>{rarity}</div>
                        <div style={{
                          fontSize:8, color:has?LIGHT:MUTED,
                          lineHeight:1.3, fontWeight:has?"bold":"normal",
                        }}>{has?skin.name:"???"}</div>
                        {!has&&<div style={{ fontSize:8, color:"#3D1800", marginTop:1 }}>未取得</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}