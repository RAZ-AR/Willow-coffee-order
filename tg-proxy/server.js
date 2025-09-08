import express from "express";
import fetch from "node-fetch";

const app = express();

// ВАЖНО: читаем сырое тело как текст, чтобы не испортить JSON Telegram
app.use(express.text({ type: "*/*" }));

app.get("/", (req, res) => {
  res.status(200).send("ok");
});

app.post("/webhook", async (req, res) => {
  try {
    const gasUrl = process.env.GAS_URL; // зададим в Render env
    if (!gasUrl) {
      return res.status(500).json({ ok: false, error: "GAS_URL not set" });
    }

    // Проксируем тело как есть, с "простым" заголовком — GAS это любит
    const r = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: req.body || "{}",
    });

    // Возвращаем клиенту (Telegram) всегда 200, чтобы он не «обижался»
    const text = await r.text();
    // Telegram ждёт JSON; если GAS вернул не JSON, всё равно шлём текст как JSON-строку
    res.status(200).type("application/json").send(text);
  } catch (e) {
    console.error("proxy error:", e);
    // даже при ошибке отвечаем 200, чтобы Telegram не ддосил повторными ретраями
    res.status(200).json({ ok: true });
  }
});

// Render слушает PORT из env
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("tg-proxy listening on", PORT);
});