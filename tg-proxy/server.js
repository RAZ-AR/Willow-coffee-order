import express from "express";
import fetch from "node-fetch";

const app = express();

// ВАЖНО: читаем сырое тело как текст, чтобы не испортить JSON Telegram
app.use(express.text({ type: "*/*" }));

app.get("/", (req, res) => {
  res.status(200).send("ok");
});

app.post("/webhook", (req, res) => {
  const gasUrl = process.env.GAS_URL;
  if (!gasUrl) {
    // отвечаем мгновенно, чтобы Telegram не ретраил
    res.status(200).json({ ok: true });
    return;
  }

  // отдать 200 немедленно
  res.status(200).json({ ok: true });

  // а дальше переслать в GAS асинхронно (fire-and-forget)
  fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: req.body || "{}",
  }).catch((e) => console.error("proxy->GAS error", e));
});

// Render слушает PORT из env
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("tg-proxy listening on", PORT);
});
