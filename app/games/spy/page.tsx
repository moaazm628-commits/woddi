"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Stars from "@/components/ui/Stars";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import { SPY_CATEGORIES, SpyCategory, SpyLocation } from "@/lib/gameData";

const MOCK_PLAYERS = ["أحمد", "سارة", "محمد", "نورة"];
const COLORS = ["var(--gold)", "var(--blue)", "var(--green)", "var(--red)"];

export default function SpyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"pick-category" | "playing">("pick-category");
  const [selectedCategory, setSelectedCategory] = useState<SpyCategory | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SpyLocation | null>(null);
  const [totalSecs, setTotalSecs] = useState(480);
  const [running, setRunning] = useState(false);
  const maxSecs = 480;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTotalSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const pct = Math.round((totalSecs / maxSecs) * 100);

  const pickRandomLocation = (cat: SpyCategory) => {
    const loc = cat.locations[Math.floor(Math.random() * cat.locations.length)];
    setSelectedCategory(cat);
    setSelectedLocation(loc);
    setPhase("playing");
    setRunning(true);
  };

  if (phase === "pick-category") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Spy Game 🕵️</h2>
            <p className="ar" style={{ fontSize: 12, color: "var(--muted)", marginBottom: "1.25rem" }}>اختر فئة الأماكن</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {SPY_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => pickRandomLocation(cat)}
                  style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 16, padding: "1.25rem 1rem", textAlign: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent", minHeight: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onTouchStart={(e) => (e.currentTarget.style.background = "var(--night3)")}
                  onTouchEnd={(e) => (e.currentTarget.style.background = "var(--night2)")}
                >
                  <div style={{ fontSize: 36 }}>{cat.emoji}</div>
                  <div className="ar" style={{ fontSize: 15, fontWeight: 700 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{cat.locations.length} أماكن</div>
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

  return (
    <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
      <Stars />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <div style={{ padding: "1.25rem var(--px) 2rem" }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>لعبة الجاسوس</h2>
              <p className="ar" style={{ fontSize: 11, color: "var(--muted)" }}>{selectedCategory?.emoji} {selectedCategory?.name}</p>
            </div>
            <button
              onClick={() => { setPhase("pick-category"); setRunning(false); setTotalSecs(480); }}
              style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 10, padding: "7px 12px", fontSize: 12, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-en)" }}
            >
              New Round
            </button>
          </div>

          {/* Role cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
            <div style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 14, padding: "1.125rem", textAlign: "center" }}>
              <div className="ar" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 600 }}>المكان</div>
              <div className="ar" style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>{selectedLocation?.name}</div>
              <div className="ar" style={{ fontSize: 10, color: "var(--muted)" }}>يعرفه الجميع عدا الجاسوس</div>
            </div>
            <div style={{ background: "rgba(247,79,106,0.08)", border: "0.5px solid rgba(247,79,106,0.25)", borderRadius: 14, padding: "1.125rem", textAlign: "center" }}>
              <div className="ar" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "1px", marginBottom: "0.5rem", fontWeight: 600 }}>دورك</div>
              <div className="ar" style={{ fontSize: 19, fontWeight: 700, color: "var(--red)", marginBottom: 4 }}>🕵️ جاسوس</div>
              <div className="ar" style={{ fontSize: 10, color: "rgba(247,79,106,0.6)" }}>أنت الجاسوس!</div>
            </div>
          </div>

          {/* Timer */}
          <div style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 14, padding: "0.875rem 1.125rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: totalSecs < 60 ? "var(--red)" : "var(--gold)", minWidth: 60, fontVariantNumeric: "tabular-nums" }}>
              {mins}:{String(secs).padStart(2, "0")}
            </div>
            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: totalSecs < 60 ? "var(--red)" : "var(--gold)", width: `${pct}%`, transition: "width 1s linear" }} />
            </div>
            <button
              onClick={() => setRunning((r) => !r)}
              style={{ background: "transparent", color: "var(--text)", border: "0.5px solid rgba(255,255,255,0.2)", padding: "8px 14px", borderRadius: 10, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-en)", minHeight: 40, WebkitTapHighlightColor: "transparent" }}
            >
              {running ? "Pause" : "Resume"}
            </button>
          </div>

          {/* Players */}
          <div className="ar" style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", marginBottom: "0.625rem", letterSpacing: "1px" }}>اللاعبون في هذه الجولة</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {MOCK_PLAYERS.map((p, i) => (
              <div key={p} style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, WebkitTapHighlightColor: "transparent" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i], display: "inline-block", flexShrink: 0 }} />
                <span className="ar">{p}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="primary" fullWidth>تصويت — Vote</Button>
            <Button variant="secondary" style={{ padding: "14px 16px", fontSize: 13 }}>أماكن</Button>
          </div>
        </div>
      </div>
    </div>
  );
}