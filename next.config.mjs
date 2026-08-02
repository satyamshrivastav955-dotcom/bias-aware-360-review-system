import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
export default {
  outputFileTracingRoot: projectRoot,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // shot.mjs writes screenshots into shots/ while a 40s generate is
  // in flight. The dev watcher treats that as a source change, full-reloads the
  // page, and the report never lands. Neither dir feeds the bundle.
  webpack(config) {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**", "**/shots/**", "**/.tmp/**"],
    };
    return config;
  },
};
