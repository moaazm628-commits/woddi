import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.875rem var(--px)",
        borderBottom: "0.5px solid var(--border)",
        position: "sticky",
        top: 0,
        background: "var(--night)",
        zIndex: 20,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <span
          className="ar"
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: "var(--gold)",
            letterSpacing: "-0.5px",
          }}
        >
          ودّي
        </span>
      </Link>
      <span
        className="ar"
        style={{
          fontSize: 12,
          color: "var(--muted)",
        }}
      >
        العاب جماعية
      </span>
    </nav>
  );
}