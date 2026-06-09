"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Stars from "@/components/ui/Stars";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import { HEADSUP_CATEGORIES, HeadsUpCategory, HeadsUpWord } from "@/lib/gameData";

export default function HeadsUpPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"pick" | "playing" | "result">("pick");
  const [selectedCategory, setSelectedCategory] = useState<HeadsUpCategory | null>(null);
  const [words, setWords] = useState<HeadsUpWord[]>([]);
  const [idx, setIdx] = useState(0);
  const [got, setGot] = useState(0);
  const [passed, setPassed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { setRunning(false); setPhase("result"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, timeLeft]);

  const startGame = (cat: HeadsUpCategory) => {
    const shuffled = [...cat.words].sort(() => Math.random() - 0.5);
    setSelectedCategory(cat);
    setWords(shuffled);
    setIdx(0);
    setGot(0);
    setPassed(0);
    setTimeLeft(60);
    setRunning(true);
    setPhase("playing");
  };

  const next = (correct: boolean) => {
    if (correct) setGot((g) => g + 1);
    else setPassed((p) => p + 1);
    if (idx + 1 >= words.length) { setRunning(false); setPhase("result"); }
    else setIdx((i) => i + 1);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const word = words[idx];

  // ── Category Picker ──
  if (phase === "pick") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Heads Up 🙌</h2>
            <p className="ar" style={{ fontSize: 12, color: "var(--muted)", marginBottom: "1.25rem" }}>اختر فئة للعب</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {HEADSUP_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => startGame(cat)}
                  style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 16, padding: "1.125rem 1rem", textAlign: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent", position: "relative", overflow: "hidden", minHeight: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}
                  onTouchStart={(e) => (e.currentTarget.style.background = "var(--night3)")}
                  onTouchEnd={(e) => (e.currentTarget.style.background = "var(--night2)")}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cat.color, borderRadius: "16px 16px 0 0" }} />
                  <div style={{ fontSize: 30 }}>{cat.emoji}</div>
                  <div className="ar" style={{ fontSize: 13, fontWeight: 700 }}>{cat.name}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{cat.words.length} كلمة</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Button variant="secondary" fullWidth onClick={() => router.push("/lobby")}>← رجوع</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Result ──
  if (phase === "result") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ fontSize: 64, marginBottom: "0.75rem" }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>انتهى الوقت!</h2>
              <p className="ar" style={{ fontSize: 13, color: "var(--muted)" }}>{selectedCategory?.name}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "2rem" }}>
              <div style={{ background: "rgba(61,214,140,0.08)", border: "0.5px solid rgba(61,214,140,0.2)", borderRadius: 16, padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: "var(--green)" }}>{got}</div>
                <div className="ar" style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>✓ صح</div>
              </div>
              <div style={{ background: "rgba(247,79,106,0.08)", border: "0.5px solid rgba(247,79,106,0.2)", borderRadius: 16, padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: "var(--red)" }}>{passed}</div>
                <div className="ar" style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>→ تخطي</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="primary" fullWidth onClick={() => selectedCategory && startGame(selectedCategory)}>العب مجدداً</Button>
              <Button variant="secondary" onClick={() => setPhase("pick")}>فئة جديدة</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing ──
  return (
    <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
      <Stars />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <div style={{ padding: "1.25rem var(--px) 2rem" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.125rem" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{selectedCategory?.emoji} {selectedCategory?.name}</h2>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{idx + 1} / {words.length}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: timeLeft <= 10 ? "var(--red)" : "var(--gold)", fontVariantNumeric: "tabular-nums" }}>
              {mins}:{String(secs).padStart(2, "0")}
            </div>
          </div>

          {/* Main card */}
          <div style={{ background: selectedCategory?.color || "var(--gold)", borderRadius: 24, padding: "2.5rem 1.5rem", textAlign: "center", marginBottom: "1rem", position: "relative", minHeight: "38vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", top: 14, fontSize: 11, color: "rgba(13,15,26,0.5)", fontWeight: 600 }}>
              ↕ مائل للتخطي أو الإجابة
            </div>
            <div className="ar" style={{ fontSize: "clamp(32px, 10vw, 48px)", fontWeight: 900, color: "#0d0f1a", letterSpacing: "-1px", marginBottom: 10 }}>
              {word?.word}
            </div>
            {word?.hint && (
              <div className="ar" style={{ fontSize: 13, color: "rgba(13,15,26,0.55)", marginBottom: "0.5rem" }}>
                {word.hint}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1rem" }}>
            <button
              onClick={() => next(true)}
              style={{ background: "var(--green)", color: "#0d0f1a", border: "none", padding: "18px 16px", borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-en)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minHeight: 70, WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            >
              <span>✓ Got it!</span>
              <span className="ar" style={{ fontSize: 12, opacity: 0.7 }}>صح</span>
            </button>
            <button
              onClick={() => next(false)}
              style={{ background: "rgba(247,79,106,0.15)", color: "var(--red)", border: "0.5px solid rgba(247,79,106,0.3)", padding: "18px 16px", borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-en)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minHeight: 70, WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            >
              <span>→ Pass</span>
              <span className="ar" style={{ fontSize: 12, opacity: 0.7 }}>تخطي</span>
            </button>
          </div>

          {/* Stats */}
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