"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Stars from "@/components/ui/Stars";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import { SPY_CATEGORIES, SpyCategory } from "@/lib/gameData";

type Phase = "pick-category" | "pick-players" | "enter-names" | "show-cards" | "playing";

interface PlayerCard {
  name: string;
  isSpy: boolean;
  location: string;
  revealed: boolean;
}

export default function SpyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("pick-category");
  const [selectedCategory, setSelectedCategory] = useState<SpyCategory | null>(null);
  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [currentNameInput, setCurrentNameInput] = useState("");
  const [cards, setCards] = useState<PlayerCard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showingRole, setShowingRole] = useState(false);
  const [totalSecs, setTotalSecs] = useState(480);
  const [running, setRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [showVote, setShowVote] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [votes, setVotes] = useState<string[]>([]);
  const [myVote, setMyVote] = useState("");
  const [voteResult, setVoteResult] = useState<{ accused: string; wasRight: boolean } | null>(null);

  const startTimer = () => {
    const interval = setInterval(() => {
      setTotalSecs((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    setTimerInterval(interval);
    setRunning(true);
  };

  const toggleTimer = () => {
    if (running) {
      if (timerInterval) clearInterval(timerInterval);
      setRunning(false);
    } else {
      startTimer();
    }
  };

  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const pct = Math.round((totalSecs / 480) * 100);
  const spyPlayer = cards.find((c) => c.isSpy);
  const location = cards.find((c) => !c.isSpy)?.location;
  const COLORS = ["var(--gold)", "var(--blue)", "var(--green)", "var(--red)", "#a78bfa", "#f97316", "#ec4899", "#14b8a6", "#84cc16", "#06b6d4"];

  const resetGame = () => {
    if (timerInterval) clearInterval(timerInterval);
    setPhase("pick-category");
    setVotes([]);
    setMyVote("");
    setVoteResult(null);
    setShowVote(false);
    setShowLocations(false);
    setRunning(false);
    setTotalSecs(480);
  };

  // ── Step 1: Pick category ──
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
                  onClick={() => { setSelectedCategory(cat); setPhase("pick-players"); }}
                  style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 16, padding: "1.25rem 1rem", textAlign: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent", minHeight: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onTouchStart={(e) => (e.currentTarget.style.background = "var(--night3)")}
                  onTouchEnd={(e) => (e.currentTarget.style.background = "var(--night2)")}
                >
                  <div style={{ fontSize: 36 }}>{cat.emoji}</div>
                  <div className="ar" style={{ fontSize: 15, fontWeight: 700 }}>{cat.name}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Button variant="secondary" fullWidth onClick={() => router.push("/")}>← رجوع</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Pick number of players ──
  if (phase === "pick-players") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>كم عدد اللاعبين؟</h2>
            <p className="ar" style={{ fontSize: 12, color: "var(--muted)", marginBottom: "2rem" }}>
              الفئة: {selectedCategory?.emoji} {selectedCategory?.name}
            </p>

            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ fontSize: 96, fontWeight: 900, color: "var(--gold)", lineHeight: 1, marginBottom: "0.5rem" }}>{playerCount}</div>
              <div className="ar" style={{ fontSize: 14, color: "var(--muted)" }}>لاعبين</div>
            </div>

            <div style={{ marginBottom: "1.5rem", padding: "0 0.5rem" }}>
              <input
                type="range" min={3} max={10} value={playerCount}
                onChange={(e) => setPlayerCount(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--gold)", height: 6, cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>3</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>10</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: "2rem" }}>
              {[3,4,5,6,7,8,9,10].map((n) => (
                <div key={n} onClick={() => setPlayerCount(n)} style={{ background: playerCount === n ? "var(--gold)" : "var(--night2)", color: playerCount === n ? "#0d0f1a" : "var(--text)", border: `0.5px solid ${playerCount === n ? "var(--gold)" : "var(--border)"}`, borderRadius: 12, padding: "12px 8px", textAlign: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, WebkitTapHighlightColor: "transparent" }}>
                  {n}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="primary" fullWidth onClick={() => { setPlayerNames([]); setPhase("enter-names"); }}>التالي →</Button>
              <Button variant="secondary" style={{ padding: "14px 18px" }} onClick={() => setPhase("pick-category")}>←</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Enter player names ──
  if (phase === "enter-names") {
    const currentPlayerNum = playerNames.length + 1;
    const isLast = currentPlayerNum === playerCount;

    const addName = () => {
      if (!currentNameInput.trim()) return;
      const newNames = [...playerNames, currentNameInput.trim()];
      setCurrentNameInput("");
      if (newNames.length === playerCount) {
        const loc = selectedCategory!.locations[Math.floor(Math.random() * selectedCategory!.locations.length)];
        const spyIndex = Math.floor(Math.random() * playerCount);
        const generatedCards: PlayerCard[] = newNames.map((name, i) => ({
          name, isSpy: i === spyIndex, location: loc.name, revealed: false,
        }));
        setCards(generatedCards);
        setCurrentCardIdx(0);
        setShowingRole(false);
        setPhase("show-cards");
      } else {
        setPlayerNames(newNames);
      }
    };

    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>أدخل الأسماء</h2>
                <p className="ar" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>اللاعب {currentPlayerNum} من {playerCount}</p>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "var(--gold)" }}>{currentPlayerNum}/{playerCount}</div>
            </div>

            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: "2rem", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--gold)", borderRadius: 2, width: `${((currentPlayerNum - 1) / playerCount) * 100}%`, transition: "width 0.3s ease" }} />
            </div>

            {playerNames.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.5rem" }}>
                {playerNames.map((n, i) => (
                  <div key={i} style={{ background: "rgba(61,214,140,0.1)", border: "0.5px solid rgba(61,214,140,0.2)", borderRadius: 20, padding: "5px 12px", fontSize: 13, fontWeight: 600, color: "var(--green)" }}>✓ {n}</div>
                ))}
              </div>
            )}

            <div className="ar" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>اسم اللاعب {currentPlayerNum}</div>
            <input
              autoFocus value={currentNameInput}
              onChange={(e) => setCurrentNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addName()}
              placeholder={`اللاعب ${currentPlayerNum}...`}
              className="ar"
              style={{ width: "100%", background: "var(--night2)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "16px", color: "var(--text)", fontFamily: "var(--font-ar)", fontSize: 18, direction: "rtl", outline: "none", textAlign: "right", marginBottom: "1.5rem", minHeight: 56 }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="primary" fullWidth onClick={addName}>{isLast ? "ابدأ اللعبة! 🎮" : "التالي →"}</Button>
              <Button variant="secondary" style={{ padding: "14px 18px" }} onClick={() => { setPlayerNames([]); setPhase("pick-players"); }}>←</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 4: Show cards ──
  if (phase === "show-cards") {
    if (currentCardIdx >= cards.length) {
      setTotalSecs(480);
      setRunning(false);
      setPhase("playing");
      return null;
    }

    const card = cards[currentCardIdx];

    return (
      <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.25rem var(--px) 2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>توزيع الأدوار</h2>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{currentCardIdx + 1} / {cards.length}</div>
            </div>

            {!showingRole ? (
              <div onClick={() => setShowingRole(true)} style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 24, padding: "3rem 1.5rem", textAlign: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent", minHeight: "55vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <div style={{ fontSize: 48 }}>👤</div>
                <div className="ar" style={{ fontSize: 32, fontWeight: 900 }}>{card.name}</div>
                <div style={{ marginTop: "1rem", background: "var(--gold)", color: "#0d0f1a", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 700 }}>اضغط لكشف دورك</div>
                <div className="ar" style={{ fontSize: 12, color: "var(--muted)" }}>تأكد أن أحداً لا يرى شاشتك</div>
              </div>
            ) : (
              <div style={{ minHeight: "55vh", display: "flex", flexDirection: "column" }}>
                {card.isSpy ? (
                  <div style={{ background: "rgba(247,79,106,0.08)", border: "0.5px solid rgba(247,79,106,0.3)", borderRadius: 24, padding: "3rem 1.5rem", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <div style={{ fontSize: 64 }}>🕵️</div>
                    <div className="ar" style={{ fontSize: 28, fontWeight: 900, color: "var(--red)" }}>أنت الجاسوس!</div>
                    <div className="ar" style={{ fontSize: 14, color: "rgba(247,79,106,0.6)", marginTop: 8 }}>لا تعرف المكان — حاول أن تندمج!</div>
                  </div>
                ) : (
                  <div style={{ background: "rgba(61,214,140,0.08)", border: "0.5px solid rgba(61,214,140,0.3)", borderRadius: 24, padding: "3rem 1.5rem", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <div style={{ fontSize: 64 }}>📍</div>
                    <div className="ar" style={{ fontSize: 16, color: "rgba(61,214,140,0.7)", fontWeight: 600 }}>المكان هو</div>
                    <div className="ar" style={{ fontSize: 32, fontWeight: 900, color: "var(--green)" }}>{card.location}</div>
                    <div className="ar" style={{ fontSize: 13, color: "rgba(61,214,140,0.5)", marginTop: 8 }}>لا تقل المكان لأحد!</div>
                  </div>
                )}
                <button
                  onClick={() => { setShowingRole(false); setCurrentCardIdx((i) => i + 1); }}
                  style={{ marginTop: "1.5rem", background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 14, padding: "16px", fontSize: 15, fontWeight: 700, color: "var(--text)", cursor: "pointer", width: "100%", fontFamily: "var(--font-ar)", WebkitTapHighlightColor: "transparent" }}
                >
                  {currentCardIdx + 1 < cards.length ? "فهمت — اللاعب التالي →" : "ابدأ اللعبة! 🎮"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 5: Playing ──
  return (
    <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
      <Stars />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <div style={{ padding: "1.25rem var(--px) 2rem" }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>اللعبة جارية! 🕵️</h2>
              <p className="ar" style={{ fontSize: 11, color: "var(--muted)" }}>{selectedCategory?.emoji} {selectedCategory?.name}</p>
            </div>
            <button onClick={resetGame} style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 10, padding: "7px 12px", fontSize: 11, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-ar)" }}>
              جولة جديدة
            </button>
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
              onClick={toggleTimer}
              style={{ background: running ? "rgba(247,79,106,0.15)" : "var(--gold)", color: running ? "var(--red)" : "#0d0f1a", border: `0.5px solid ${running ? "rgba(247,79,106,0.3)" : "var(--gold)"}`, padding: "8px 14px", borderRadius: 10, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-ar)", minHeight: 40, WebkitTapHighlightColor: "transparent" }}
            >
              {running ? "إيقاف" : "ابدأ"}
            </button>
          </div>

          {/* Players */}
          <div className="ar" style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", marginBottom: "0.625rem" }}>اللاعبون</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {cards.map((card, i) => (
              <div key={i} style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block", flexShrink: 0 }} />
                <span className="ar">{card.name}</span>
              </div>
            ))}
          </div>

          {/* Locations list */}
          {showLocations && (
            <div style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 14, padding: "1rem", marginBottom: "1rem" }}>
              <div className="ar" style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: "0.75rem" }}>كل الأماكن في هذه الفئة:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selectedCategory?.locations.map((loc, i) => (
                  <div key={i} className="ar" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>
                    {loc.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vote screen */}
          {showVote && (
            <div style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 14, padding: "1.25rem", marginBottom: "1rem" }}>
              <div className="ar" style={{ fontSize: 14, fontWeight: 700, marginBottom: "1rem", textAlign: "center" }}>من هو الجاسوس؟ 🕵️</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1rem" }}>
                {cards.map((card, i) => {
                  const voteCount = votes.filter((v) => v === card.name).length;
                  return (
                    <div
                      key={i}
                      onClick={() => { if (myVote) return; setVotes((v) => [...v, card.name]); setMyVote(card.name); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, background: myVote === card.name ? "rgba(245,200,66,0.1)" : "rgba(255,255,255,0.03)", border: `0.5px solid ${myVote === card.name ? "var(--gold)" : "var(--border)"}`, borderRadius: 12, padding: "0.875rem 1rem", cursor: myVote ? "default" : "pointer", WebkitTapHighlightColor: "transparent" }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${COLORS[i % COLORS.length]}22`, color: COLORS[i % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {card.name[0]}
                      </div>
                      <div className="ar" style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{card.name}</div>
                      {voteCount > 0 && (
                        <div style={{ background: "rgba(245,200,66,0.15)", color: "var(--gold)", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                          {voteCount} 🗳️
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reveal result button */}
              {votes.length > 0 && !voteResult && (
                <button
                  onClick={() => {
                    const voteCounts: Record<string, number> = {};
                    votes.forEach((v) => { voteCounts[v] = (voteCounts[v] || 0) + 1; });
                    const accused = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0][0];
                    const wasRight = accused === spyPlayer?.name;
                    setVoteResult({ accused, wasRight });
                    if (timerInterval) clearInterval(timerInterval);
                    setRunning(false);
                  }}
                  style={{ width: "100%", background: "var(--gold)", color: "#0d0f1a", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ar)" }}
                >
                  كشف النتيجة! 🎭
                </button>
              )}

              {/* Result */}
              {voteResult && (
                <div style={{ textAlign: "center", padding: "1.25rem", background: voteResult.wasRight ? "rgba(61,214,140,0.1)" : "rgba(247,79,106,0.1)", border: `0.5px solid ${voteResult.wasRight ? "rgba(61,214,140,0.3)" : "rgba(247,79,106,0.3)"}`, borderRadius: 12 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{voteResult.wasRight ? "🎉" : "😈"}</div>
                  <div className="ar" style={{ fontSize: 16, fontWeight: 700, color: voteResult.wasRight ? "var(--green)" : "var(--red)", marginBottom: 8 }}>
                    {voteResult.wasRight ? `صح! الجاسوس هو ${voteResult.accused}` : `خطأ! ${voteResult.accused} ليس الجاسوس`}
                  </div>
                  <div className="ar" style={{ fontSize: 13, color: "var(--muted)", marginBottom: "1rem" }}>
                    الجاسوس الحقيقي: {spyPlayer?.name} | المكان: {location}
                  </div>
                  <button
                    onClick={resetGame}
                    style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "var(--text)", cursor: "pointer", fontFamily: "var(--font-ar)" }}
                  >
                    جولة جديدة 🔄
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="primary" fullWidth onClick={() => { setShowVote((v) => !v); setMyVote(""); setVotes([]); setVoteResult(null); }}>
              {showVote ? "إخفاء التصويت" : "تصويت 🗳️"}
            </Button>
            <Button variant="secondary" style={{ padding: "14px 16px", fontSize: 13 }} onClick={() => setShowLocations((v) => !v)}>
              {showLocations ? "إخفاء" : "أماكن"}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}