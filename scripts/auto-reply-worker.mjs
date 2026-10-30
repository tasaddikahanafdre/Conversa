import fs from "fs";
import path from "path";

function syncLogoIfUpdated() {
  try {
    const rootLogo = path.join(process.cwd(), "logo", "logo.png");
    const publicLogoDir = path.join(process.cwd(), "public", "logo");
    const publicLogo = path.join(publicLogoDir, "logo.png");

    if (fs.existsSync(rootLogo)) {
      if (!fs.existsSync(publicLogoDir)) {
        fs.mkdirSync(publicLogoDir, { recursive: true });
      }
      const rootStat = fs.statSync(rootLogo);
      if (!fs.existsSync(publicLogo) || rootStat.mtimeMs > fs.statSync(publicLogo).mtimeMs) {
        fs.copyFileSync(rootLogo, publicLogo);
        console.log("[Worker] Synced new logo.png from /logo to /public/logo/logo.png");
      }
    }
  } catch (err) {
    // Ignore file sync errors
  }
}

async function runSync() {
  syncLogoIfUpdated();
  try {
    await fetch("http://localhost:3000/api/channels/facebook/sync", {
      method: "POST",
    });
  } catch (err) {
    // Ignore transient network errors
  }
}

console.log("[Worker] Conversa Facebook Auto-Reply & Logo Sync Worker started...");
setInterval(runSync, 15000);
runSync();
