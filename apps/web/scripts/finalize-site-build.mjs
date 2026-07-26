import { copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const openNextDirectory = path.join(appRoot, ".open-next");
const bundledDirectory = path.join(openNextDirectory, "bundled");

await copyFile(
  path.join(bundledDirectory, "worker.js"),
  path.join(openNextDirectory, "worker.js"),
);
await rm(bundledDirectory, { recursive: true, force: true });
