async function runSync() {
  try {
    const res = await fetch("http://localhost:3000/api/channels/facebook/sync", {
      method: "POST",
    });
    const data = await res.json();
    if (data.repliesSent > 0) {
      console.log(`[Worker] Sent ${data.repliesSent} AI auto-replies to Messenger!`);
    }
  } catch (err) {
    // Ignore transient network errors
  }
}

console.log("[Worker] Conversa Facebook Auto-Reply Sync Worker started (polling every 6s)...");
setInterval(runSync, 6000);
runSync();
