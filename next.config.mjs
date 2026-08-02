import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
export default {
  outputFileTracingRoot: projectRoot,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Turbopack watches the module graph rather than the directory tree, so the
  // screenshots shot.mjs writes into shots/ mid-run no longer trigger a reload
  // and the webpack watchOptions that used to suppress that are gone with it.
  turbopack: {},
};
