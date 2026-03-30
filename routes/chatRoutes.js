const express = require("express");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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

async function getGeminiReply(prompt) {
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function getOpenRouterReply(prompt) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct",
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

  return response.data?.choices?.[0]?.message?.content || "No response";
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
You are KrushiSetu assistant for farmers and customers.

Available vegetables: ${vegetables.map((v) => v.name).join(", ")}
Total orders: ${orders.length}

User question: ${message}
`;

    if (process.env.GEMINI_API_KEY) {
      const reply = await getGeminiReply(prompt);
      return res.json({
        reply,
        source: "gemini"
      });
    }

    if (process.env.OPENROUTER_API_KEY) {
      const reply = await getOpenRouterReply(prompt);
      return res.json({
        reply,
        source: "openrouter"
      });
    }

    return res.status(503).json({
      message: "AI service is not configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY in backend .env",
      reply: buildFallbackReply(message, vegetables, orders),
      source: "fallback"
    });
  } catch (error) {
    const status = error.response?.status;
    const providerError = error.response?.data || error.message;
    console.log("Chat provider error:", providerError);

    if (status === 401 || status === 403) {
      return res.status(502).json({
        message: "AI provider authentication failed. Update GEMINI_API_KEY or OPENROUTER_API_KEY in backend .env.",
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
    if (process.env.GEMINI_API_KEY) {
      const reply = await getGeminiReply("Reply with a short hello from KrushiSetu AI.");
      return res.send(`Gemini working: ${reply}`);
    }

    if (process.env.OPENROUTER_API_KEY) {
      const reply = await getOpenRouterReply("Reply with a short hello from KrushiSetu AI.");
      return res.send(`OpenRouter working: ${reply}`);
    }

    return res.status(503).send("Missing GEMINI_API_KEY or OPENROUTER_API_KEY in backend .env");
  } catch (error) {
    console.log("AI test error:", error.response?.data || error.message);

    const status = error.response?.status || 500;
    if (status === 401 || status === 403) {
      return res.status(502).send("AI auth failed: invalid or expired API key.");
    }

    return res.status(500).send("AI provider failed.");
  }
});

module.exports = router;
