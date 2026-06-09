"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Stars from "@/components/ui/Stars";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import { getSocket } from "@/lib/socket";
import { GAMES, AVATAR_COLORS } from "@/lib/types";

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
  game: string | null;
  started: boolean;
}

function LobbyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") || "";

  const [room, setRoom] = useState<Room | null>(null);
  const [myId, setMyId] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const stored = localStorage.getItem("woddi_room");
    if (stored) {
      const data = JSON.parse(stored);
      setRoom(data.room);
      setMyId(data.myId || socket.id);
    }

    socket.on("room_updated", ({ room }: { room: Room }) => setRoom(room));
    socket.on("player_joined", ({ room }: { room: Room }) => setRoom(room));
    socket.on("game_started", ({ game, room }: { game: string; room: Room }) => {
      const stored = localStorage.getItem("woddi_room");
      if (stored) {
        const data = JSON.parse(stored);
        data.room = room;
        localStorage.setItem("woddi_room", JSON.stringify(data));
      }
      router.push(`/games/${game}?code=${code}`);
    });

    return () => {
      socket.off("room_updated");
      socket.off("player_joined");
      socket.off("game_started");
    };
  }, [router, code]);

  const me = room?.players.find((p) => p.id === myId);
  const isHost = me?.isHost ?? false;
  const isPasswordGame = room?.game === "password";

  const teamA = room?.players.filter((p) => p.team === "a") || [];
  const teamB = room?.players.filter((p) => p.team === "b") || [];
  const noTeam = room?.players.filter((p) => p.team === null) || [];

  const handleChooseTeam = (team: "a" | "b") => {
    getSocket().emit("choose_team", { code, team });
  };

  const handleChangeGame = (gameId: string) => {
    getSocket().emit("change_game", { code, game: gameId });
    setShowPicker(false);
  };

  const handleStart = () => {
    if (isPasswordGame && (teamA.length < 2 || teamB.length < 2)) {
      alert("كل فريق يحتاج لاعبين على الأقل!");
      return;
    }
    getSocket().emit("start_game", { code });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedGame = GAMES.find((g) => g.id === room?.game) || GAMES[0];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
      <Stars />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />

        {/* Header */}
        <div style={{ textAlign: "center", padding: "1.25rem var(--px) 1rem" }}>
          <div
            onClick={copyCode}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "8px 16px", fontSize: 13, color: "var(--muted)", marginBottom: "0.875rem", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
          >
            <span>Room Code:</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--gold)", letterSpacing: "4px" }}>{code}</span>
            <span style={{ color: "var(--gold)", fontSize: 16 }}>{copied ? "✓" : "📋"}</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
            {room?.players.length === 1 ? "Waiting for players..." : `${room?.players.length} players joined!`}
          </h2>
          <p className="ar" style={{ fontSize: 12, color: "var(--muted)" }}>في انتظار اللاعبين</p>
        </div>

        {/* Team selection — password only */}
        {isPasswordGame ? (
          <div style={{ padding: "0 var(--px)", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.75rem" }}>اختر فريقك</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "0.75rem" }}>
              {(["a", "b"] as const).map((t) => (
                <div
                  key={t}
                  onClick={() => handleChooseTeam(t)}
                  style={{
                    background: me?.team === t ? (t === "a" ? "rgba(79,142,247,0.15)" : "rgba(247,79,106,0.15)") : (t === "a" ? "rgba(79,142,247,0.05)" : "rgba(247,79,106,0.05)"),
                    border: `0.5px solid ${me?.team === t ? (t === "a" ? "var(--blue)" : "var(--red)") : (t === "a" ? "rgba(79,142,247,0.2)" : "rgba(247,79,106,0.2)")}`,
                    borderRadius: 14,
                    padding: "1rem",
                    cursor: "pointer",
                    minHeight: 80,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: t === "a" ? "var(--blue)" : "var(--red)", marginBottom: "0.625rem", textAlign: "center" }}>
                    {t === "a" ? "🔵 الفريق الأول" : "🔴 الفريق الثاني"} {me?.team === t && "✓"}
                  </div>
                  {(t === "a" ? teamA : teamB).map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: t === "a" ? "rgba(79,142,247,0.2)" : "rgba(247,79,106,0.2)", color: t === "a" ? "var(--blue)" : "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {p.name[0].toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      {p.isHost && <span style={{ fontSize: 9, color: "var(--gold)", marginLeft: "auto" }}>HOST</span>}
                    </div>
                  ))}
                  {(t === "a" ? teamA : teamB).length === 0 && (
                    <div className="ar" style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>لا أحد بعد</div>
                  )}
                </div>
              ))}
            </div>
            {noTeam.length > 0 && (
              <div style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "0.75rem 1rem" }}>
                <div className="ar" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>لم يختاروا فريقاً بعد:</div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {noTeam.map((p) => (
                    <div key={p.id} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: "0 var(--px)", marginBottom: "1.25rem" }}>
            {room?.players.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0, background: AVATAR_COLORS[i % AVATAR_COLORS.length].bg, color: AVATAR_COLORS[i % AVATAR_COLORS.length].fg }}>
                  {p.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  {p.id === myId && <div style={{ fontSize: 10, color: "var(--muted)" }}>أنت</div>}
                </div>
                <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, ...(p.isHost ? { color: "var(--gold)", background: "rgba(245,200,66,0.1)" } : p.isReady ? { color: "var(--green)", background: "rgba(61,214,140,0.1)" } : { color: "var(--muted)", background: "rgba(255,255,255,0.05)" }) }}>
                  {p.isHost ? "HOST" : p.isReady ? "READY" : "WAITING"}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--night2)", border: "0.5px dashed var(--border)", borderRadius: 12, padding: "0.75rem 1rem", opacity: 0.45 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: "rgba(255,255,255,0.04)", color: "var(--muted)" }}>+</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Waiting for player...</div>
            </div>
          </div>
        )}

        {/* Game selector */}
        <div style={{ padding: "0 var(--px) 2rem" }}>
          {!showPicker ? (
            <div style={{ background: "var(--night2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "0.875rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26 }}>{selectedGame.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedGame.titleEn}</div>
                <div className="ar" style={{ fontSize: 11, color: "var(--muted)" }}>{selectedGame.titleAr}</div>
              </div>
              {isHost && <span onClick={() => setShowPicker(true)} style={{ fontSize: 12, color: "var(--blue)", cursor: "pointer", textDecoration: "underline", WebkitTapHighlightColor: "transparent" }}>Change</span>}
            </div>
          ) : (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {GAMES.map((g) => (
                  <div key={g.id} onClick={() => handleChangeGame(g.id)} style={{ background: "var(--night2)", border: `0.5px solid ${selectedGame.id === g.id ? g.accentColor : "var(--border)"}`, borderRadius: 12, padding: "0.875rem 0.5rem", cursor: "pointer", textAlign: "center", WebkitTapHighlightColor: "transparent" }}>
                    <div style={{ fontSize: 26, marginBottom: 4 }}>{g.icon}</div>
                    <div className="ar" style={{ fontSize: 11, fontWeight: 600 }}>{g.titleAr}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            {isHost ? (
              <Button variant="primary" fullWidth onClick={handleStart}>Start Game — ابدأ</Button>
            ) : (
              <Button variant="primary" fullWidth onClick={() => getSocket().emit("player_ready", { code })}>Ready — جاهز ✓</Button>
            )}
            <Button variant="secondary" style={{ padding: "14px 18px" }} onClick={() => router.push("/")}>←</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LobbyPage() {
  return <Suspense><LobbyContent /></Suspense>;
}