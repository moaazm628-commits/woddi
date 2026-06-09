"use client";
import { useRouter } from "next/navigation";
import { Game } from "@/lib/types";

interface GameCardProps {
  game: Game;
  comingSoon?: boolean;
}

export default function GameCard({ game, comingSoon = false }: GameCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => { if (!comingSoon) router.push(`/games/${game.id}`); }}
      style={{
        background: "var(--night2)",
        border: "0.5px solid var(--border)",
        borderRadius: 16,
        padding: "1.125rem 1rem 1rem",
        cursor: comingSoon ? "default" : "pointer",
        opacity: comingSoon ? 0.45 : 1,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s, border-color 0.2s",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
      }}
      onTouchStart={(e) => {
        if (!comingSoon)(e.currentTarget as HTMLDivElement).style.transform = "scale(0.97)";
      }}
      onTouchEnd={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
      }}
      onMouseEnter={(e) => {
        if (comingSoon) return;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.18)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
      }}
    >
      {/* top accent bar */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 3,
        borderRadius: "16px 16px 0 0",
        background: comingSoon ? "var(--border)" : game.accentColor,
      }} />

      {/* badge */}
      <span style={{
        position: "absolute",
        top: 10, right: 10,
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 8,
        background: comingSoon ? "rgba(255,255,255,0.06)" : `${game.accentColor}22`,
        color: comingSoon ? "var(--muted)" : game.accentColor,
      }}>
        {comingSoon ? "Soon" : game.badgeLabel}
      </span>

      <div style={{ fontSize: 40, marginBottom: "0.625rem", lineHeight: 1 }}>
        {comingSoon ? "🎮" : game.icon}
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>
        {comingSoon ? "More Games" : game.titleEn}
      </div>
      <div className="ar" style={{ fontSize: 12, color: "var(--muted)", marginBottom: "0.5rem" }}>
        {comingSoon ? "قريباً" : game.titleAr}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
        👥 {comingSoon ? "Stay tuned" : `${game.players} players`}
      </div>
    </div>
  );
}