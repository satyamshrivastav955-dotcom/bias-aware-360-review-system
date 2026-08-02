"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Overview" },
  { href: "/drafts", label: "Drafts" },
  { href: "/submissions", label: "Submissions" },
  { href: "/submit", label: "Submit Feedback" },
  { href: "/reviewers", label: "Reviewers" },
  { href: "/audit-reports", label: "Audit reports" },
  { href: "/evaluation", label: "Evaluation" },
  { href: "/governance", label: "Governance" },
];

// A review or audit page is a draft opened, so Drafts stays lit while you are
// inside one — otherwise nothing in the bar marks where you are.
const DRAFT_ROUTES = ["/drafts", "/review/", "/audit/"];

export function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) =>
    href === "/drafts"
      ? DRAFT_ROUTES.some((r) => pathname.startsWith(r))
      : href === "/"
        ? pathname === "/"
        : pathname.startsWith(href);

  return (
    <header className="app-header">
      <div className="app-header-main">
        <Link href="/" className="app-brand" onClick={() => setOpen(false)}>
          Bias-Aware Review
        </Link>
        <nav className="app-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={active(link.href) ? "app-nav-link active" : "app-nav-link"}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="app-actions">
          <ThemeToggle />
          <span className="avatar" aria-label="Manager profile">M</span>
          <button className={open ? "hamburger open" : "hamburger"} aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
      {/* The stylesheet's 220px cap was sized for the old split drawer; seven
          links need more room or the last two are unreachable on mobile. */}
      <div className={open ? "mobile-drawer open" : "mobile-drawer"} style={open ? { maxHeight: "360px" } : undefined}>
        <nav aria-label="Mobile navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={active(link.href) ? "mobile-nav-link active" : "mobile-nav-link"} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/cycle-archive" className={pathname.startsWith("/cycle-archive") ? "mobile-nav-link active" : "mobile-nav-link"} onClick={() => setOpen(false)}>
            Cycle archive
          </Link>
        </nav>
      </div>
      <button className={open ? "drawer-backdrop open" : "drawer-backdrop"} aria-label="Close navigation" onClick={() => setOpen(false)} />
    </header>
  );
}
