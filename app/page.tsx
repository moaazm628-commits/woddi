"use client";
import { useRouter } from "next/navigation";
import Stars from "@/components/ui/Stars";
import Navbar from "@/components/ui/Navbar";
import GameCard from "@/components/ui/GameCard";
import Button from "@/components/ui/Button";
import { GAMES } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--night)", position: "relative" }}>
      <Stars />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />

        {/* Hero */}
       <div style={{ textAlign: "center", padding: "1.25rem var(--px) 1.25rem" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(245,200,66,0.12)",
            border: "0.5px solid rgba(245,200,66,0.3)",
            color: "var(--gold)",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: 20,
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}>
            Group Games
          </div>

         <h1 style={{
            fontSize: "clamp(22px, 7vw, 42px)",
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
            marginBottom: "0.5rem",
          }}>
            Play Together,{" "}
            <span style={{ color: "var(--gold)" }}>Win Together</span>
          </h1>

          <p style={{
            fontSize: "clamp(14px, 4vw, 17px)",
            fontWeight: 600,
            color: "var(--muted)",
            marginBottom: "0.3rem",
          }}>
            less boring{" "}
            <span style={{ color: "var(--gold)" }}>more playing</span>
          </p>

          <p className="ar" style={{
            fontSize: 13,
            color: "var(--muted)",
            marginBottom: "1.75rem",
          }}>
            العب مع أصدقائك وعائلتك في أي مكان
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Button
              variant="primary"
              style={{ padding: "13px 24px", fontSize: 14 }}
              onClick={() => router.push("/room?mode=create")}
            >
              Create Room
            </Button>
            <Button
              variant="secondary"
              style={{ padding: "13px 24px", fontSize: 14 }}
              onClick={() => router.push("/room?mode=join")}
            >
              Join Room
            </Button>
          </div>
        </div>

        {/* Games grid */}
        <div style={{ padding: "0 var(--px) 2rem" }}>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: "0.75rem",
          }}>
            Choose a game
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}>
            {GAMES.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
            <GameCard game={GAMES[0]} comingSoon />
          </div>
        </div>
      </div>
    </div>
  );
}