const express = require("express");
const axios = require("axios");

const Vegetable = require("../models/Vegetable");
const Order = require("../models/Order");

const router = express.Router();

// ---------------- CHAT ROUTE ----------------

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // Fetch DB data
    const [vegetables, orders] = await Promise.all([
      Vegetable.find({ isActive: true }).lean(),
      Order.find().lean()
    ]);

    const prompt = `
You are KrushiSetu assistant.

Available vegetables: ${vegetables.map(v => v.name).join(", ")}
Total orders: ${orders.length}

User question: ${message}
`;

    // ✅ OPENROUTER API CALL (WORKING MODEL)
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct", // 🔥 WORKING MODEL
        messages: [
          { role: "system", content: "You are a helpful assistant for farmers and customers." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "No response";

    res.json({
      reply,
      source: "openrouter"
    });

  } catch (error) {
    console.log("ERROR 👉", error.response?.data || error.message);

    res.json({
      reply: "AI not working",
      source: "fallback"
    });
  }
});

// ---------------- TEST ROUTE ----------------

router.get("/test", async (req, res) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "user", content: "Hello" }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "";

    res.send("OpenRouter working ✅ " + reply);

  } catch (error) {
    console.log("ERROR 👉", error.response?.data || error.message);
    res.send("OpenRouter failed ❌");
  }
});

module.exports = router;