"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Stars from "@/components/ui/Stars";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import { getSocket } from "@/lib/socket";
import { GAMES } from "@/lib/types";

function RoomContent() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode") || "create";

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedGame, setSelectedGame] = useState(GAMES[0].id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--night2)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: "14px 16px",
    color: "var(--text)",
    fontSize: 16,
    fontFamily: "var(--font-en)",
    outline: "none",
    marginBottom: "1rem",
    minHeight: 48,
    WebkitAppearance: "none",
  };

  const handleCreate = () => {
    if (!name.trim()) { setError("أدخل اسمك أولاً"); return; }
    setLoading(true);
    const socket = getSocket();
    socket.emit("create_room", { name: name.trim(), game: selectedGame });
    socket.once("room_created", ({ code, room }) => {
      localStorage.setItem("woddi_room", JSON.stringify({ code, room, myId: socket.id, myName: name.trim() }));
      router.push(`/lobby?code=${code}`);
    });
  };

  const handleJoin = () => {
    if (!name.trim()) { setError("أدخل اسمك أولاً"); return; }
    if (!code.trim()) { setError("أدخل كود الغرفة"); return; }
    setLoading(true);
    const socket = getSocket();
    socket.emit("join_room", { name: name.trim(), code: code.trim().toUpperCase() });
    socket.once("room_joined", ({ code: roomCode, room }) => {
      localStorage.setItem("woddi_room", JSON.stringify({ code: roomCode, room, myId: socket.id, myName: name.trim() }));
      router.push(`/lobby?code=${roomCode}`);
    });
    socket.once("error", ({ message }) => {
      setError(message);
      setLoading(false);
    });
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
      <Stars />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <div style={{ padding: "1.25rem var(--px) 2rem" }}>

          {/* Mode toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
            {[
              { id: "create", icon: "🏠", en: "Create Room", ar: "أنشئ غرفة" },
              { id: "join",   icon: "🚪", en: "Join Room",   ar: "انضم لغرفة" },
            ].map((opt) => (
              <div
                key={opt.id}
                onClick={() => router.push(`/room?mode=${opt.id}`)}
                style={{
                  background: "var(--night2)",
                  border: `0.5px solid ${mode === opt.id ? "var(--gold)" : "var(--border)"}`,
                  borderRadius: 14,
                  padding: "1.125rem 1rem",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div style={{ fontSize: 30, marginBottom: "0.5rem" }}>{opt.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{opt.en}</div>
                <div className="ar" style={{ fontSize: 12, color: "var(--muted)" }}>{opt.ar}</div>
              </div>
            ))}
          </div>

          {/* Name */}
          <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Name</label>
          <input
            style={inputStyle}
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            autoCapitalize="words"
          />

          {/* Game picker — create only */}
          {mode === "create" && (
            <>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pick a Game</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: "1.25rem" }}>
                {GAMES.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGame(g.id)}
                    style={{
                      background: selectedGame === g.id ? "var(--night3)" : "var(--night2)",
                      border: `0.5px solid ${selectedGame === g.id ? g.accentColor : "var(--border)"}`,
                      borderRadius: 12,
                      padding: "0.875rem 0.5rem",
                      cursor: "pointer",
                      textAlign: "center",
                      WebkitTapHighlightColor: "transparent",
                      minHeight: 80,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{g.icon}</div>
                    <div className="ar" style={{ fontSize: 11, fontWeight: 600 }}>{g.titleAr}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Code input — join only */}
          {mode === "join" && (
            <>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Room Code</label>
              <input
                style={{ ...inputStyle, fontSize: 24, fontWeight: 700, letterSpacing: "8px", textAlign: "center", textTransform: "uppercase" }}
                placeholder="XXXXXX"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoComplete="off"
                autoCapitalize="characters"
              />
            </>
          )}

          {/* Error */}
          {error && (
            <div className="ar" style={{ color: "var(--red)", fontSize: 13, marginBottom: "1rem", padding: "10px 14px", background: "rgba(247,79,106,0.08)", borderRadius: 10, border: "0.5px solid rgba(247,79,106,0.2)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="primary" fullWidth onClick={mode === "create" ? handleCreate : handleJoin} disabled={loading}>
              {loading ? "..." : mode === "create" ? "Create Room →" : "Join Room →"}
            </Button>
            <Button variant="secondary" style={{ padding: "14px 18px" }} onClick={() => router.push("/")}>←</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomPage() {
  return <Suspense><RoomContent /></Suspense>;
}