"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Overview" },
  { href: "/submissions", label: "Submissions" },
  { href: "/reviewers", label: "Reviewers" },
  { href: "/governance", label: "Governance" },
];

const deskLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/drafts", label: "Pending drafts" },
  { href: "/audit-reports", label: "Audit reports" },
  { href: "/cycle-archive", label: "Cycle archive" },
];

export function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => pathname === href;

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
          <button className="icon-button desktop-only" aria-label="Notifications">●</button>
          <button className="icon-button desktop-only" aria-label="Settings">⚙</button>
          <span className="avatar" aria-label="Manager profile">M</span>
          <button className={open ? "hamburger open" : "hamburger"} aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
      <div className={open ? "mobile-drawer open" : "mobile-drawer"}>
        <nav aria-label="Mobile navigation">
          <p className="drawer-label">Review desk</p>
          {deskLinks.map((link) => (
            <Link key={link.href} href={link.href} className={active(link.href) ? "mobile-nav-link active" : "mobile-nav-link"} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <p className="drawer-label drawer-divider">Explore</p>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={active(link.href) ? "mobile-nav-link active" : "mobile-nav-link"} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <button className={open ? "drawer-backdrop open" : "drawer-backdrop"} aria-label="Close navigation" onClick={() => setOpen(false)} />
    </header>
  );
}
