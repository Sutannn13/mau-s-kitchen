import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standaloneRoot = join(root, ".next", "standalone");

// No-op bila output standalone tidak ada (mis. build lewat OpenNext Cloudflare
// yang memakai direktori `.open-next`). postbuild tetap aman dipanggil.
if (!existsSync(join(standaloneRoot, "server.js"))) {
  console.log("Output standalone tidak ditemukan — melewati postbuild (OpenNext?).");
  process.exit(0);
}

const publicSource = join(root, "public");
const publicTarget = join(standaloneRoot, "public");
if (existsSync(publicSource)) {
  mkdirSync(publicTarget, { recursive: true });
  cpSync(publicSource, publicTarget, { recursive: true, force: true });
}

const staticSource = join(root, ".next", "static");
const staticTarget = join(standaloneRoot, ".next", "static");
mkdirSync(staticTarget, { recursive: true });
cpSync(staticSource, staticTarget, { recursive: true, force: true });

console.log("Aset public dan static siap untuk output standalone.");
