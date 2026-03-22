const express = require("express");
const axios = require("axios");

const Vegetable = require("../models/Vegetable");
const Order = require("../models/Order");

const router = express.Router();

function buildFallbackReply(message, vegetables, orders) {
  const lowered = String(message || "").toLowerCase();
  const vegetableNames = vegetables.map((v) => v.name).filter(Boolean);

  if (lowered.includes("vegetable") || lowered.includes("available") || lowered.includes("seasonal")) {
    if (!vegetableNames.length) {
      return "I could not find active vegetables right now. Please ask the farmer to add or update inventory.";
    }

    return `Currently available vegetables: ${vegetableNames.join(", ")}.`;
  }

  if (lowered.includes("order")) {
    return `Total orders in the system right now: ${orders.length}. You can place a new order from the product listing page.`;
  }

  return "Live AI response is temporarily unavailable. I can still help with available vegetables, order count, and how to use KrushiSetu features.";
}

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message required" });
    }

    const [vegetables, orders] = await Promise.all([
      Vegetable.find({ isActive: true }).lean(),
      Order.find().lean()
    ]);

    const prompt = `
You are KrushiSetu assistant.

Available vegetables: ${vegetables.map((v) => v.name).join(", ")}
Total orders: ${orders.length}

User question: ${message}
`;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({
        message: "AI service is not configured. Set OPENROUTER_API_KEY in backend .env",
        reply: buildFallbackReply(message, vegetables, orders),
        source: "fallback"
      });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: "You are a helpful assistant for farmers and customers." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "KrushiSetu"
        },
        timeout: 20000
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content || "No response";

    return res.json({
      reply,
      source: "openrouter"
    });
  } catch (error) {
    const status = error.response?.status;
    const providerError = error.response?.data || error.message;
    console.log("Chat provider error:", providerError);

    if (status === 401 || status === 403) {
      return res.status(502).json({
        message: "AI provider authentication failed. Update OPENROUTER_API_KEY in backend .env.",
        reply: "AI provider auth failed. Please contact admin to update API key.",
        source: "fallback"
      });
    }

    if (status === 429) {
      return res.status(429).json({
        message: "AI rate limit reached. Please retry in a moment.",
        reply: "AI is busy right now. Please try again shortly.",
        source: "fallback"
      });
    }

    return res.status(502).json({
      message: "AI service temporarily unavailable.",
      reply: "AI is temporarily unavailable. Please try again in a moment.",
      source: "fallback"
    });
  }
});

router.get("/test", async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).send("OPENROUTER_API_KEY missing in backend .env");
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: "Hello" }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "KrushiSetu"
        },
        timeout: 20000
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content || "";
    return res.send(`OpenRouter working: ${reply}`);
  } catch (error) {
    console.log("OpenRouter test error:", error.response?.data || error.message);

    const status = error.response?.status || 500;
    if (status === 401 || status === 403) {
      return res.status(502).send("OpenRouter auth failed: invalid or expired API key.");
    }

    return res.status(500).send("OpenRouter failed.");
  }
});

module.exports = router;
