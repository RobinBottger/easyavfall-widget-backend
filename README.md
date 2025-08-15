import express from "express";

const app = express();

// Healthcheck
app.get("/", (req, res) => {
  res.send("✅ Easyavfall Widget API is running. Try /widget/summary");
});

// Eksempel på mock endpoint
app.get("/widget/summary", (req, res) => {
  res.json({
    message: "Dette er en test. API kjører OK.",
    articles: req.query.articles || "Ingen artikler valgt"
  });
});

// Viktig for Vercel: eksportér app (ikke app.listen her)
export default app;
