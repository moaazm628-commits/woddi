"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Stars from "@/components/ui/Stars";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import { HEADSUP_CATEGORIES, HeadsUpCategory, HeadsUpWord } from "@/lib/gameData";

type Phase = "pick-category" | "setup-teams" | "pick-timer" | "playing" | "round-result" | "final";

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

export default function HeadsUpPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("pick-category");
  const [selectedCategory, setSelectedCategory] = useState<HeadsUpCategory | null>(null);
  const [teams, setTeams] = useState<Team[]>([{ name: "", score: 0 }, { name: "", score: 0 }]);
  const [timerDuration, setTimerDuration] = useState(60);
  const [words, setWords] = useState<HeadsUpWord[]>([]);
  const [usedWordsList, setUsedWordsList] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [got, setGot] = useState(0);
  const [passed, setPassed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [currentTeam, setCurrentTeam] = useState(0);
  const [roundScoreInput, setRoundScoreInput] = useState("");
  const [round, setRound] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          setPhase("round-result");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);
useEffect(() => {
    if (phase !== "playing") return;

    let lastTilt = 0;
    const TILT_THRESHOLD = 25;
    const COOLDOWN = 1200;

    const handleMotion = (e: DeviceMotionEvent) => {
      const tilt = e.accelerationIncludingGravity?.y ?? 0;
      const now = Date.now();
      if (now - lastTilt < COOLDOWN) return;

      if (tilt > TILT_THRESHOLD) {
        // Tilted up — Got it!
        lastTilt = now;
        next(true);
      } else if (tilt < -TILT_THRESHOLD) {
        // Tilted down — Pass
        lastTilt = now;
        next(false);
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [phase, running]);
  const getMixWords = (): HeadsUpWord[] => {
    const all = HEADSUP_CATEGORIES.flatMap((c) => c.words);
    const unused = all.filter((w) => !usedWordsList.includes(w.word));
    const pool = unused.length >= 10 ? unused : all;
    return pool.sort(() => Math.random() - 0.5).slice(0, 40);
  };

  const startRound = () => {
    const cat = selectedCategory!;
    let wordPool: HeadsUpWord[];
    if (cat.id === "mix") {
      wordPool = getMixWords();
    } else {
      const allWords = [...cat.words].sort(() => Math.random() - 0.5);
      const unused = allWords.filter((w) => !usedWordsList.includes(w.word));
      wordPool = unused.length >= 5 ? unused : allWords;
    }
    setUsedWordsList((prev) => [...prev, ...wordPool.map((w) => w.word)]);
    setWords(wordPool);
    setIdx(0);
    setGot(0);
    setPassed(0);
    setTimeLeft(timerDuration);
    setRunning(true);
    setPhase("playing");
  };

  const next = (correct: boolean) => {
    if (correct) setGot((g) => g + 1);
    else setPassed((p) => p + 1);
    if (idx + 1 >= words.length) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setPhase("round-result");
    } else {
      setIdx((i) => i + 1);
    }
  };

  const confirmRoundScore = () => {
    const score = parseInt(roundScoreInput) || got;
    setTeams((prev) => prev.map((t, i) => i === currentTeam ? { ...t, score: t.score + score } : t));
    setRoundScoreInput("");
    setCurrentTeam((t) => (t + 1) % 2);
    setRound((r) => r + 1);
    setPhase("pick-category");
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const word = words[idx];
  const allCategories = [...HEADSUP_CATEGORIES, MIX_CATEGORY];

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
                  onChange={(e) => setTeams((prev) => prev.map((t, idx) => idx === i ? { ...t, name: e.target.value } : t))}
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
              <div style={{ fontSize: 14, color: "var(--muted)" }}>ثانية</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: "2rem" }}>
              {[30, 60, 90, 120].map((t) => (
                <div key={t} onClick={() => setTimerDuration(t)} style={{ background: timerDuration === t ? "var(--gold)" : "var(--night2)", color: timerDuration === t ? "#0d0f1a" : "var(--text)", border: `0.5px solid ${timerDuration === t ? "var(--gold)" : "var(--border)"}`, borderRadius: 12, padding: "14px 8px", textAlign: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, WebkitTapHighlightColor: "transparent" }}>
                  {t}s
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="primary" fullWidth onClick={startRound}>ابدأ الجولة! 🚀</Button>
              <Button variant="secondary" style={{ padding: "14px 18px" }} onClick={() => setPhase(round === 1 ? "setup-teams" : "pick-category")}>←</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing ──
  if (phase === "playing") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>{selectedCategory?.emoji} {selectedCategory?.name}</h2>
                <div className="ar" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>دور: {teams[currentTeam].name}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: timeLeft <= 10 ? "var(--red)" : "var(--gold)", fontVariantNumeric: "tabular-nums" }}>
                {mins}:{String(secs).padStart(2, "0")}
              </div>
            </div>

            <div style={{ background: selectedCategory?.color || "var(--gold)", borderRadius: 24, padding: "2.5rem 1.5rem", textAlign: "center", marginBottom: "1rem", position: "relative", minHeight: "38vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", top: 14, fontSize: 11, color: "rgba(13,15,26,0.5)", fontWeight: 600 }}>↕ مائل للتخطي أو الإجابة</div>
              <div className="ar" style={{ fontSize: "clamp(30px, 10vw, 46px)", fontWeight: 900, color: "#0d0f1a", letterSpacing: "-1px", marginBottom: 10 }}>
                {word?.word}
              </div>
              {word?.hint && (
                <div className="ar" style={{ fontSize: 13, color: "rgba(13,15,26,0.55)" }}>{word.hint}</div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1rem" }}>
              <button onClick={() => next(true)} style={{ background: "var(--green)", color: "#0d0f1a", border: "none", padding: "18px 16px", borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-en)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minHeight: 70, WebkitTapHighlightColor: "transparent" }}>
                <span>✓ Got it!</span>
                <span className="ar" style={{ fontSize: 12, opacity: 0.7 }}>صح</span>
              </button>
              <button onClick={() => next(false)} style={{ background: "rgba(247,79,106,0.15)", color: "var(--red)", border: "0.5px solid rgba(247,79,106,0.3)", padding: "18px 16px", borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-en)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minHeight: 70, WebkitTapHighlightColor: "transparent" }}>
                <span>→ Pass</span>
                <span className="ar" style={{ fontSize: 12, opacity: 0.7 }}>تخطي</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[
                { num: got,    color: "var(--green)", label: "صح" },
                { num: passed, color: "var(--red)",   label: "تخطي" },
                { num: `${mins}:${String(secs).padStart(2,"0")}`, color: timeLeft <= 10 ? "var(--red)" : "var(--gold)", label: "باقي" },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 10, padding: "0.625rem", textAlign: "center" }}>
                  <div className="ar" style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.num}</div>
                  <div className="ar" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>انتهى الوقت!</h2>
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
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: "0.5rem" }}>
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
              setUsedWordsList([]);
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