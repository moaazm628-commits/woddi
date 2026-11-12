"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Stars from "@/components/ui/Stars";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import { HEADSUP_CATEGORIES, HeadsUpCategory, HeadsUpWord } from "@/lib/gameData";

type Phase = "pick-category" | "setup-teams" | "pick-timer" | "countdown" | "playing" | "round-result" | "final";

interface Team {
  name: string;
  score: number;
}

const MIX_CATEGORY: HeadsUpCategory = {
  id: "mix",
  name: "مزيج",
  emoji: "🎲",
  color: "#a78bfa",
  words: [],
};

// Shows its children in landscape. If the phone is still in portrait,
// the content is rotated 90° so it still reads as landscape.
function LandscapeShell({ background, children }: { background: string; children: React.ReactNode }) {
  const [vp, setVp] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const portrait = vp.h > vp.w;

  return (
    <div style={{ position: "fixed", inset: 0, background, overflow: "hidden" }}>
      <div
        style={
          portrait
            ? { position: "absolute", top: 0, left: 0, width: vp.h, height: vp.w, transformOrigin: "top left", transform: "rotate(90deg) translateY(-100%)" }
            : { position: "absolute", inset: 0 }
        }
      >
        {children}
      </div>
    </div>
  );
}

export default function HeadsUpPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("pick-category");
  const [selectedCategory, setSelectedCategory] = useState<HeadsUpCategory | null>(null);
  const [teams, setTeams] = useState<Team[]>([{ name: "", score: 0 }, { name: "", score: 0 }]);
  const [timerDuration, setTimerDuration] = useState(60);
  const [words, setWords] = useState<HeadsUpWord[]>([]);
  const [idx, setIdx] = useState(0);
  const [got, setGot] = useState(0);
  const [passed, setPassed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [currentTeam, setCurrentTeam] = useState(0);
  const [roundScoreInput, setRoundScoreInput] = useState("");
  const [round, setRound] = useState(1);
  const [count, setCount] = useState(3);
  const [flash, setFlash] = useState<"correct" | "pass" | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const nextRef = useRef<(correct: boolean) => void>(() => {});
  // words already SHOWN to a team, per category (so the other team never sees them)
  const usedRef = useRef<Record<string, Set<string>>>({});

  // ── Sound ──
  const beep = (freq: number, dur = 0.12, type: OscillatorType = "sine") => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  };

  const vibrate = (ms: number) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  };

  // ── Landscape lock (works on Android; iPhone uses the rotate fallback) ──
  const lockLandscape = () => {
    try {
      const el = document.documentElement;
      const fs = el.requestFullscreen ? el.requestFullscreen() : Promise.resolve();
      fs.catch(() => {})
        .then(() => {
          const o = screen.orientation as unknown as { lock?: (t: string) => Promise<void> };
          return o.lock?.("landscape");
        })
        .catch(() => {});
    } catch {}
  };

  const unlockLandscape = () => {
    try {
      const o = screen.orientation as unknown as { unlock?: () => void };
      o.unlock?.();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch {}
  };

  useEffect(() => {
    if (phase !== "countdown" && phase !== "playing") unlockLandscape();
  }, [phase]);

  // ── Round timer ──
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          beep(180, 0.6, "sawtooth");
          vibrate(300);
          setPhase("round-result");
          return 0;
        }
        if (s <= 6) beep(700, 0.08);
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  // ── Countdown 3-2-1 ──
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) {
      beep(1000, 0.3, "square");
      setTimeLeft(timerDuration);
      setRunning(true);
      setPhase("playing");
      return;
    }
    beep(600, 0.1);
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  // ── Remember every word that gets shown ──
  useEffect(() => {
    if (phase !== "playing" || !selectedCategory) return;
    const w = words[idx];
    if (!w) return;
    if (!usedRef.current[selectedCategory.id]) usedRef.current[selectedCategory.id] = new Set();
    usedRef.current[selectedCategory.id].add(w.word);
  }, [phase, idx, words]);

  // ── Tilt detection ──
  // z = how much the screen faces the ceiling (+1) or the floor (-1).
  useEffect(() => {
    if (phase !== "playing") return;

    let armed = false;
    const NEUTRAL = 0.35;
    const TRIGGER = 0.65;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      const b = (e.beta * Math.PI) / 180;
      const g = (e.gamma * Math.PI) / 180;
      const z = Math.cos(b) * Math.cos(g);

      if (!armed) {
        if (Math.abs(z) < NEUTRAL) armed = true;
        return;
      }
      if (z <= -TRIGGER) {
        armed = false;
        nextRef.current(true);
      } else if (z >= TRIGGER) {
        armed = false;
        nextRef.current(false);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [phase]);

  // ── Build the word list for a round (never repeats between teams) ──
  const beginCountdown = () => {
    const cat = selectedCategory!;
    const pool: HeadsUpWord[] =
      cat.id === "mix" ? HEADSUP_CATEGORIES.flatMap((c) => c.words) : cat.words;

    if (!usedRef.current[cat.id]) usedRef.current[cat.id] = new Set();
    const used = usedRef.current[cat.id];

    let fresh = pool.filter((w) => !used.has(w.word));
    if (fresh.length < 15) {
      used.clear();
      fresh = [...pool];
    }

    const wordPool = [...fresh].sort(() => Math.random() - 0.5).slice(0, 80);

    setWords(wordPool);
    setIdx(0);
    setGot(0);
    setPassed(0);
    setCount(3);
    setPhase("countdown");
  };

  // Runs inside a tap, so audio, fullscreen and motion permission are allowed
  const startWithPermissions = () => {
    lockLandscape();

    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioRef.current) audioRef.current = new Ctor();
      audioRef.current.resume();
    } catch {}

    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof DOE.requestPermission === "function") {
      DOE.requestPermission().finally(beginCountdown);
    } else {
      beginCountdown();
    }
  };

  const next = (correct: boolean) => {
    if (phase !== "playing") return;
    if (correct) {
      setGot((g) => g + 1);
      beep(880, 0.15);
      vibrate(60);
    } else {
      setPassed((p) => p + 1);
      beep(260, 0.18, "triangle");
    }
    setFlash(correct ? "correct" : "pass");
    setTimeout(() => setFlash(null), 450);

    if (idx + 1 >= words.length) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setPhase("round-result");
    } else {
      setIdx((i) => i + 1);
    }
  };
  nextRef.current = next;

  const confirmRoundScore = () => {
    const score = parseInt(roundScoreInput) || got;
    setTeams((prev) => prev.map((t, i) => (i === currentTeam ? { ...t, score: t.score + score } : t)));
    setRoundScoreInput("");
    setCurrentTeam((t) => (t + 1) % 2);
    setRound((r) => r + 1);
    setPhase("pick-category");
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const word = words[idx];
  const allCategories = [...HEADSUP_CATEGORIES, MIX_CATEGORY];
  const accent = selectedCategory?.color || "#f5c842";

  const animations = `
    @keyframes pop { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
    @keyframes flashOut { 0% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes countPop { 0% { transform: scale(2.2); opacity: 0; } 40% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.4; } }
  `;

  // ── Pick Category ──
  if (phase === "pick-category") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            {round > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
                {teams.map((t, i) => (
                  <div key={i} style={{ background: i === currentTeam ? "rgba(245,200,66,0.1)" : "var(--night2)", border: `0.5px solid ${i === currentTeam ? "var(--gold)" : "var(--border)"}`, borderRadius: 14, padding: "0.875rem", textAlign: "center" }}>
                    <div className="ar" style={{ fontSize: 12, color: i === currentTeam ? "var(--gold)" : "var(--muted)", fontWeight: 600, marginBottom: 4 }}>
                      {t.name} {i === currentTeam ? "← دورك" : ""}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: i === currentTeam ? "var(--gold)" : "var(--text)" }}>{t.score}</div>
                  </div>
                ))}
              </div>
            )}

            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Heads Up 🙌</h2>
            <p className="ar" style={{ fontSize: 12, color: "var(--muted)", marginBottom: "1.25rem" }}>
              {round > 1 ? `الجولة ${round} — دور ${teams[currentTeam].name}` : "اختر فئة للعب"}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
              {allCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat); setPhase(round === 1 ? "setup-teams" : "pick-timer"); }}
                  style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 16, padding: "1rem", textAlign: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent", position: "relative", overflow: "hidden", minHeight: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}
                  onTouchStart={(e) => (e.currentTarget.style.background = "var(--night3)")}
                  onTouchEnd={(e) => (e.currentTarget.style.background = "var(--night2)")}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cat.color, borderRadius: "16px 16px 0 0" }} />
                  <div style={{ fontSize: 28 }}>{cat.emoji}</div>
                  <div className="ar" style={{ fontSize: 13, fontWeight: 700 }}>{cat.name}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{cat.id === "mix" ? "كل الفئات" : `${cat.words.length} كلمة`}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {round > 1 && <Button variant="danger" fullWidth onClick={() => setPhase("final")}>إنهاء اللعبة</Button>}
              <Button variant="secondary" fullWidth onClick={() => router.push("/")}>← رجوع</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Setup Teams ──
  if (phase === "setup-teams") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>أسماء الفرق</h2>
            <p className="ar" style={{ fontSize: 12, color: "var(--muted)", marginBottom: "2rem" }}>أدخل اسم كل فريق</p>

            {[0, 1].map((i) => (
              <div key={i} style={{ marginBottom: "1.25rem" }}>
                <label className="ar" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 8, fontWeight: 600 }}>
                  {i === 0 ? "🔵 الفريق الأول" : "🔴 الفريق الثاني"}
                </label>
                <input
                  value={teams[i].name}
                  onChange={(e) => setTeams((prev) => prev.map((t, k) => (k === i ? { ...t, name: e.target.value } : t)))}
                  placeholder={i === 0 ? "الفريق الأول..." : "الفريق الثاني..."}
                  className="ar"
                  style={{ width: "100%", background: "var(--night2)", border: `0.5px solid ${i === 0 ? "rgba(79,142,247,0.3)" : "rgba(247,79,106,0.3)"}`, borderRadius: 12, padding: "14px 16px", color: "var(--text)", fontFamily: "var(--font-ar)", fontSize: 16, direction: "rtl", outline: "none", textAlign: "right", minHeight: 52 }}
                />
              </div>
            ))}

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="primary" fullWidth onClick={() => {
                setTeams((prev) => prev.map((t, i) => ({ ...t, name: t.name.trim() || (i === 0 ? "الفريق الأول" : "الفريق الثاني") })));
                setPhase("pick-timer");
              }}>
                التالي →
              </Button>
              <Button variant="secondary" style={{ padding: "14px 18px" }} onClick={() => setPhase("pick-category")}>←</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pick Timer ──
  if (phase === "pick-timer") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>مدة الجولة</h2>
            <p className="ar" style={{ fontSize: 12, color: "var(--muted)", marginBottom: "2rem" }}>
              دور: {teams[currentTeam].name} | الفئة: {selectedCategory?.emoji} {selectedCategory?.name}
            </p>

            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ fontSize: 80, fontWeight: 900, color: "var(--gold)", lineHeight: 1, marginBottom: 4 }}>{timerDuration}</div>
              <div className="ar" style={{ fontSize: 14, color: "var(--muted)" }}>ثانية</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: "1.5rem" }}>
              {[30, 60, 90, 120].map((t) => (
                <div key={t} onClick={() => setTimerDuration(t)} style={{ background: timerDuration === t ? "var(--gold)" : "var(--night2)", color: timerDuration === t ? "#0d0f1a" : "var(--text)", border: `0.5px solid ${timerDuration === t ? "var(--gold)" : "var(--border)"}`, borderRadius: 12, padding: "14px 8px", textAlign: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, WebkitTapHighlightColor: "transparent" }}>
                  {t}s
                </div>
              ))}
            </div>

            <div className="ar" style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 14, padding: "1rem", marginBottom: "1.5rem", fontSize: 13, lineHeight: 1.8, color: "var(--muted)" }}>
              📱 عند الضغط على ابدأ تتحول الشاشة لوضع أفقي تلقائياً<br />
              🔄 إذا بقيت عمودية أدِر هاتفك لليسار<br />
              ⬇️ أمِل الشاشة للأرض = صح<br />
              ⬆️ أمِل الشاشة للسقف = تخطي<br />
              ↩️ ارجع للوضع المستقيم قبل الكلمة التالية
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="primary" fullWidth onClick={startWithPermissions}>ابدأ الجولة! 🚀</Button>
              <Button variant="secondary" style={{ padding: "14px 18px" }} onClick={() => setPhase(round === 1 ? "setup-teams" : "pick-category")}>←</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Countdown (landscape) ──
  if (phase === "countdown") {
    return (
      <LandscapeShell background={accent}>
        <style>{animations}</style>
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div className="ar" style={{ fontSize: 20, fontWeight: 700, color: "rgba(13,15,26,0.7)" }}>
            استعد! ضع الهاتف على جبهتك
          </div>
          <div key={count} style={{ fontSize: 140, fontWeight: 900, color: "#0d0f1a", lineHeight: 1, animation: "countPop 1s ease-out" }}>
            {count > 0 ? count : "🚀"}
          </div>
        </div>
      </LandscapeShell>
    );
  }

  // ── Playing (landscape) ──
  if (phase === "playing") {
    return (
      <LandscapeShell background={accent}>
        <style>{animations}</style>
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", color: "#0d0f1a" }}>
            <div style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: timeLeft <= 10 ? "#b00020" : "#0d0f1a" }}>
              {mins}:{String(secs).padStart(2, "0")}
            </div>
            <div className="ar" style={{ fontSize: 14, fontWeight: 700, opacity: 0.7 }}>
              {selectedCategory?.emoji} {teams[currentTeam].name}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>✓ {got}</div>
          </div>

          {/* Word */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
            <div key={idx} className="ar" style={{ fontSize: 68, fontWeight: 900, color: "#0d0f1a", lineHeight: 1.15, animation: "pop 0.28s ease-out" }}>
              {word?.word}
            </div>
            {word?.hint && (
              <div className="ar" style={{ fontSize: 16, color: "rgba(13,15,26,0.55)", marginTop: 8 }}>{word.hint}</div>
            )}
          </div>

          {/* Backup buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px 14px" }}>
            <button onClick={() => next(false)} style={{ background: "rgba(13,15,26,0.15)", color: "#0d0f1a", border: "none", padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)", WebkitTapHighlightColor: "transparent" }}>
              ⬆️ تخطي
            </button>
            <button onClick={() => next(true)} style={{ background: "#0d0f1a", color: "#fff", border: "none", padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)", WebkitTapHighlightColor: "transparent" }}>
              ⬇️ صح
            </button>
          </div>

          {/* Flash overlay */}
          {flash && (
            <div style={{ position: "absolute", inset: 0, background: flash === "correct" ? "#3dd68c" : "#f74f6a", display: "flex", alignItems: "center", justifyContent: "center", animation: "flashOut 0.45s ease-out forwards", pointerEvents: "none" }}>
              <div className="ar" style={{ fontSize: 70, fontWeight: 900, color: "#0d0f1a" }}>
                {flash === "correct" ? "صح ✓" : "تخطي"}
              </div>
            </div>
          )}
        </div>
      </LandscapeShell>
    );
  }

  // ── Round Result ──
  if (phase === "round-result") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 56, marginBottom: "0.75rem" }}>⏰</div>
              <h2 className="ar" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>انتهى الوقت!</h2>
              <p className="ar" style={{ fontSize: 13, color: "var(--muted)" }}>دور: {teams[currentTeam].name}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.5rem" }}>
              <div style={{ background: "rgba(61,214,140,0.08)", border: "0.5px solid rgba(61,214,140,0.2)", borderRadius: 14, padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: "var(--green)" }}>{got}</div>
                <div className="ar" style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>✓ صح</div>
              </div>
              <div style={{ background: "rgba(247,79,106,0.08)", border: "0.5px solid rgba(247,79,106,0.2)", borderRadius: 14, padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: "var(--red)" }}>{passed}</div>
                <div className="ar" style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>→ تخطي</div>
              </div>
            </div>

            <div style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 14, padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div className="ar" style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
                كم نقطة تحسب لـ {teams[currentTeam].name}؟
              </div>
              <input
                type="number"
                value={roundScoreInput}
                onChange={(e) => setRoundScoreInput(e.target.value)}
                placeholder={String(got)}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 16px", color: "var(--text)", fontSize: 24, fontWeight: 700, textAlign: "center", outline: "none", fontFamily: "var(--font-en)" }}
              />
              <div className="ar" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>اتركه فارغاً لاستخدام العدد التلقائي ({got})</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
              {teams.map((t, i) => (
                <div key={i} style={{ background: i === currentTeam ? "rgba(245,200,66,0.08)" : "var(--night2)", border: `0.5px solid ${i === currentTeam ? "rgba(245,200,66,0.2)" : "var(--border)"}`, borderRadius: 12, padding: "0.875rem", textAlign: "center" }}>
                  <div className="ar" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: i === currentTeam ? "var(--gold)" : "var(--text)" }}>
                    {i === currentTeam ? t.score + (parseInt(roundScoreInput) || got) : t.score}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="primary" fullWidth onClick={confirmRoundScore}>
                التالي — دور {teams[(currentTeam + 1) % 2].name} →
              </Button>
              <Button variant="danger" style={{ padding: "14px 18px" }} onClick={() => { confirmRoundScore(); setPhase("final"); }}>إنهاء</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Final ──
  return (
    <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
      <Stars />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <div style={{ padding: "1.25rem var(--px) 2rem", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: "0.75rem" }}>🏆</div>
          <h2 className="ar" style={{ fontSize: 24, fontWeight: 900, marginBottom: "0.5rem" }}>
            {teams[0].score === teams[1].score ? "تعادل!" : `${teams[0].score > teams[1].score ? teams[0].name : teams[1].name} فاز!`}
          </h2>
          <p className="ar" style={{ fontSize: 13, color: "var(--muted)", marginBottom: "2rem" }}>{round - 1} جولة</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "2rem" }}>
            {teams.map((t, i) => (
              <div key={i} style={{ background: i === (teams[0].score >= teams[1].score ? 0 : 1) ? "rgba(245,200,66,0.1)" : "var(--night2)", border: `0.5px solid ${i === (teams[0].score >= teams[1].score ? 0 : 1) ? "rgba(245,200,66,0.3)" : "var(--border)"}`, borderRadius: 16, padding: "1.5rem", textAlign: "center" }}>
                {i === (teams[0].score > teams[1].score ? 0 : 1) && <div style={{ fontSize: 24, marginBottom: 8 }}>👑</div>}
                <div className="ar" style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t.name}</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: "var(--gold)" }}>{t.score}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="primary" fullWidth onClick={() => {
              setTeams([{ name: teams[0].name, score: 0 }, { name: teams[1].name, score: 0 }]);
              setRound(1);
              setCurrentTeam(0);
              usedRef.current = {};
              setPhase("pick-category");
            }}>
              لعبة جديدة 🔄
            </Button>
            <Button variant="secondary" onClick={() => router.push("/")}>← رجوع</Button>
          </div>
        </div>
      </div>
    </div>
  );
}