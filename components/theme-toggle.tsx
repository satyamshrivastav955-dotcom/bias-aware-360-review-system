"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("review-theme");
    const next = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("review-theme", next ? "dark" : "light");
  }
  return <button type="button" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="theme-toggle"><span aria-hidden="true">{dark ? "☀" : "☾"}</span><span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span></button>;
}
