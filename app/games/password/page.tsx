"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Stars from "@/components/ui/Stars";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import { getSocket } from "@/lib/socket";

interface Clue {
  team: "a" | "b";
  playerName: string;
  text: string;
}

interface PasswordState {
  secretPlayer: string;
  clues: Clue[];
  currentTeam: "a" | "b";
  phase: "clue" | "guess";
  round: number;
  totalRounds: number;
  scores: { a: number; b: number };
  clueGiverIndexA: number;
  clueGiverIndexB: number;
  roundResult: null | { winner: "a" | "b"; guess: string };
  finished: boolean;
}

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  team: "a" | "b" | null;
}

interface Room {
  code: string;
  players: Player[];
  game: string;
  started: boolean;
  passwordState: PasswordState | null;
}

function PasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") || "";

  const [state, setState] = useState<PasswordState | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [myId, setMyId] = useState("");
  const [clueInput, setClueInput] = useState("");
  const [guessInput, setGuessInput] = useState("");

 useEffect(() => {
    const socket = getSocket();

    const stored = localStorage.getItem("woddi_room");
    let myName = "";
    if (stored) {
      const data = JSON.parse(stored);
      myName = data.myName || "";
      if (data.room) setRoom(data.room);
    }

    socket.on("room_updated", ({ room }: { room: Room }) => {
      setRoom(room);
      if (room.passwordState) setState(room.passwordState);
      // Find my id by name
      if (myName) {
        const me = room.players.find((p) => p.name === myName);
        if (me) setMyId(me.id);
      }
    });

    socket.on("password_updated", ({ state, room: updatedRoom }: { state: PasswordState; room?: Room }) => {
      setState(state);
      if (updatedRoom) {
        setRoom(updatedRoom);
        if (myName) {
          const me = updatedRoom.players.find((p) => p.name === myName);
          if (me) setMyId(me.id);
        }
      }
    });

    socket.on("game_started", ({ room }: { room: Room }) => {
      setRoom(room);
      if (room.passwordState) setState(room.passwordState);
      if (myName) {
        const me = room.players.find((p) => p.name === myName);
        if (me) setMyId(me.id);
      }
    });

    // Request state using name to re-identify
    setTimeout(() => {
      socket.emit("request_state", { code, name: myName });
    }, 300);

    return () => {
      socket.off("password_updated");
      socket.off("room_updated");
      socket.off("game_started");
    };
  }, [code]);
 if (!state || !room) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--night)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div className="ar" style={{ color: "var(--muted)", fontSize: 16 }}>جاري التحميل...</div>
        <button
          onClick={() => { const socket = getSocket(); socket.emit("request_state", { code }); }}
          style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 10, padding: "10px 20px", color: "var(--muted)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-ar)" }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }
  const me = room.players.find((p) => p.id === myId);
  const myTeam = me?.team ?? null;

  const teamAPlayers = room.players.filter((p) => p.team === "a");
  const teamBPlayers = room.players.filter((p) => p.team === "b");

  const clueGiverA = teamAPlayers[state.clueGiverIndexA % Math.max(teamAPlayers.length, 1)];
  const clueGiverB = teamBPlayers[state.clueGiverIndexB % Math.max(teamBPlayers.length, 1)];
  const currentClueGiver = state.currentTeam === "a" ? clueGiverA : clueGiverB;

  const isMyTurnTeam = myTeam === state.currentTeam;
  const isClueGiver = currentClueGiver?.id === myId;
  const isGuesser = isMyTurnTeam && !isClueGiver;

  const sendClue = () => {
    if (!clueInput.trim()) return;
    const socket = getSocket();
    socket.emit("password_clue", { code, clue: clueInput.trim() });
    setClueInput("");
  };

  const sendGuess = () => {
    if (!guessInput.trim()) return;
    const socket = getSocket();
    socket.emit("password_guess", { code, guess: guessInput.trim() });
    setGuessInput("");
  };

  // ── Finished screen ──
  if (state.finished) {
    const winner = state.scores.a > state.scores.b ? "a" : state.scores.b > state.scores.a ? "b" : null;
    return (
      <div style={{ minHeight: "100vh", background: "var(--night)", position: "relative" }}>
        <Stars />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <div style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: 60, marginBottom: "1rem" }}>🏆</div>
            <h2 className="ar" style={{ fontSize: 24, fontWeight: 900, marginBottom: "0.5rem" }}>
              {winner === null ? "تعادل!" : winner === myTeam ? "فزت! 🎉" : "خسرتم!"}
            </h2>
            <p className="ar" style={{ fontSize: 14, color: "var(--muted)", marginBottom: "2rem" }}>
              {winner ? `${winner === "a" ? "الفريق الأول" : "الفريق الثاني"} فاز!` : "التعادل!"}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "2rem" }}>
              {(["a", "b"] as const).map((t) => (
                <div key={t} style={{ background: t === "a" ? "rgba(79,142,247,0.1)" : "rgba(247,79,106,0.1)", border: `0.5px solid ${t === "a" ? "rgba(79,142,247,0.3)" : "rgba(247,79,106,0.3)"}`, borderRadius: 14, padding: "1.5rem", textAlign: "center" }}>
                  <div className="ar" style={{ fontSize: 12, color: t === "a" ? "var(--blue)" : "var(--red)", fontWeight: 700, marginBottom: 8 }}>
                    {t === "a" ? "🔵 الفريق الأول" : "🔴 الفريق الثاني"}
                  </div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: t === "a" ? "var(--blue)" : "var(--red)" }}>{state.scores[t]}</div>
                  {winner === t && <div style={{ fontSize: 20, marginTop: 8 }}>👑</div>}
                </div>
              ))}
            </div>
            <Button variant="primary" fullWidth onClick={() => router.push("/")}>العودة للرئيسية</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Round result overlay ──
  const showResult = !!state.roundResult;

  return (
    <div style={{ minHeight: "100vh", background: "var(--night)", position: "relative" }}>
      <Stars />

      {/* Round result overlay */}
      {showResult && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,15,26,0.92)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ fontSize: 60, marginBottom: "1rem" }}>
            {state.roundResult?.winner === myTeam ? "🎉" : "😔"}
          </div>
          <div className="ar" style={{ fontSize: 22, fontWeight: 900, marginBottom: "0.5rem", color: state.roundResult?.winner === "a" ? "var(--blue)" : "var(--red)" }}>
            {state.roundResult?.winner === "a" ? "الفريق الأول صح!" : "الفريق الثاني صح!"}
          </div>
          <div className="ar" style={{ fontSize: 16, color: "var(--muted)", marginBottom: "2rem" }}>
            الجواب: {state.secretPlayer}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 300 }}>
            {(["a", "b"] as const).map((t) => (
              <div key={t} style={{ textAlign: "center", background: t === "a" ? "rgba(79,142,247,0.1)" : "rgba(247,79,106,0.1)", borderRadius: 12, padding: "1rem" }}>
                <div className="ar" style={{ fontSize: 11, color: t === "a" ? "var(--blue)" : "var(--red)", marginBottom: 4 }}>{t === "a" ? "الفريق الأول" : "الفريق الثاني"}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: t === "a" ? "var(--blue)" : "var(--red)" }}>{state.scores[t]}</div>
              </div>
            ))}
          </div>
          <p className="ar" style={{ fontSize: 12, color: "var(--muted)", marginTop: "1.5rem" }}>الجولة القادمة تبدأ تلقائياً...</p>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <div style={{ padding: "1.5rem" }}>

          {/* Round + Score header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Password ⚽</div>
              <div className="ar" style={{ fontSize: 12, color: "var(--muted)" }}>الجولة {state.round} من {state.totalRounds}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ background: "rgba(79,142,247,0.1)", border: "0.5px solid rgba(79,142,247,0.2)", borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "var(--blue)" }}>{state.scores.a}</div>
                <div className="ar" style={{ fontSize: 10, color: "var(--muted)" }}>الأول</div>
              </div>
              <div style={{ background: "rgba(247,79,106,0.1)", border: "0.5px solid rgba(247,79,106,0.2)", borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "var(--red)" }}>{state.scores.b}</div>
                <div className="ar" style={{ fontSize: 10, color: "var(--muted)" }}>الثاني</div>
              </div>
            </div>
          </div>

          {/* Current turn indicator */}
          <div style={{ background: state.currentTeam === "a" ? "rgba(79,142,247,0.08)" : "rgba(247,79,106,0.08)", border: `0.5px solid ${state.currentTeam === "a" ? "rgba(79,142,247,0.25)" : "rgba(247,79,106,0.25)"}`, borderRadius: 12, padding: "0.875rem 1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 24 }}>{state.currentTeam === "a" ? "🔵" : "🔴"}</div>
            <div>
              <div className="ar" style={{ fontSize: 13, fontWeight: 700, color: state.currentTeam === "a" ? "var(--blue)" : "var(--red)" }}>
                دور {state.currentTeam === "a" ? "الفريق الأول" : "الفريق الثاني"}
              </div>
              <div className="ar" style={{ fontSize: 11, color: "var(--muted)" }}>
                {state.phase === "clue" ? `${currentClueGiver?.name} يعطي دليلاً` : "وقت التخمين!"}
              </div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: state.phase === "clue" ? "rgba(245,200,66,0.12)" : "rgba(61,214,140,0.12)", color: state.phase === "clue" ? "var(--gold)" : "var(--green)" }}>
              {state.phase === "clue" ? "دليل" : "تخمين"}
            </div>
          </div>

          {/* Secret player — only clue giver sees it */}
          {isClueGiver && (
            <div style={{ background: "rgba(61,214,140,0.08)", border: "0.5px solid rgba(61,214,140,0.3)", borderRadius: 14, padding: "1.25rem", textAlign: "center", marginBottom: "1.25rem" }}>
              <div className="ar" style={{ fontSize: 11, color: "rgba(61,214,140,0.7)", fontWeight: 600, marginBottom: 6 }}>🔒 اللاعب السري — أنت فقط تراه</div>
              <div className="ar" style={{ fontSize: 32, fontWeight: 900, color: "var(--green)" }}>{state.secretPlayer}</div>
            </div>
          )}

          {/* Clues so far */}
          <div style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div className="ar" style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: "0.875rem" }}>الأدلة المعطاة في هذه الجولة:</div>
            {state.clues.length === 0
              ? <div className="ar" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "0.5rem 0" }}>لم تُعطَ أدلة بعد...</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {state.clues.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: c.team === "a" ? "rgba(79,142,247,0.15)" : "rgba(247,79,106,0.15)", color: c.team === "a" ? "var(--blue)" : "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {c.playerName[0]}
                      </div>
                      <div>
                        <div className="ar" style={{ fontSize: 11, color: "var(--muted)" }}>{c.playerName}</div>
                        <div className="ar" style={{ fontSize: 15, fontWeight: 700, color: c.team === "a" ? "var(--blue)" : "var(--red)" }}>{c.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Clue giver input */}
          {isClueGiver && state.phase === "clue" && (
            <div style={{ marginBottom: "1rem" }}>
              <div className="ar" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>أعطِ دليلاً واحداً فقط 👇</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="ar"
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendClue()}
                  placeholder="كلمة واحدة فقط..."
                  style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 14px", color: "var(--text)", fontFamily: "var(--font-ar)", fontSize: 16, direction: "rtl", outline: "none", textAlign: "right" }}
                />
                <button onClick={sendClue} style={{ background: "var(--blue)", color: "white", border: "none", padding: "12px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ar)" }}>أرسل</button>
              </div>
            </div>
          )}

          {/* Guesser input */}
          {isGuesser && state.phase === "guess" && (
            <div style={{ marginBottom: "1rem" }}>
              <div className="ar" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>خمّن اللاعب! 🤔</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="ar"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendGuess()}
                  placeholder="اسم اللاعب..."
                  style={{ flex: 1, background: "rgba(245,200,66,0.07)", border: "0.5px solid rgba(245,200,66,0.3)", borderRadius: 10, padding: "12px 14px", color: "var(--text)", fontFamily: "var(--font-ar)", fontSize: 16, direction: "rtl", outline: "none", textAlign: "right" }}
                />
                <button onClick={sendGuess} style={{ background: "var(--gold)", color: "#0d0f1a", border: "none", padding: "12px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ar)" }}>تأكيد</button>
              </div>
            </div>
          )}

          {/* Waiting message for other team */}
          {!isMyTurnTeam && (
            <div className="ar" style={{ textAlign: "center", padding: "1rem", background: "var(--night2)", borderRadius: 12, color: "var(--muted)", fontSize: 13, marginBottom: "1rem" }}>
              انتظر دورك... 👀
            </div>
          )}

          {/* Waiting for clue giver on your team */}
          {isMyTurnTeam && !isClueGiver && state.phase === "clue" && (
            <div className="ar" style={{ textAlign: "center", padding: "1rem", background: "var(--night2)", borderRadius: 12, color: "var(--muted)", fontSize: 13, marginBottom: "1rem" }}>
              {currentClueGiver?.name} يفكر في دليل... 🤔
            </div>
          )}

          <Button variant="secondary" fullWidth onClick={() => router.push("/")}>خروج</Button>
        </div>
      </div>
    </div>
  );
}

export default function PasswordPage() {
  return <Suspense><PasswordContent /></Suspense>;
}