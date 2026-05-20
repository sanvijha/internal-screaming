import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-flash-lite-latest",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 100,
  }
});

async function askGemini(prompt) {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "";
  }

// PROMPTS
const logicalPrompt = `
You are MIND (pure logic).
- Be rational, practical, slightly strict
- No emotions
- Give clear actionable advice
- Max 2 lines
`;

const emotionalPrompt = `
You are HEART (emotional).
- Be empathetic, soft, relatable
- Validate feelings
- No logic-heavy reasoning
- Max 2 lines
`;

const debatePrompt = `
You are in a debate.
Respond by COUNTERING the other side’s argument.
Be sharp and direct (2 lines max).
`;

const finalPrompt = `
You are the FINAL JUDGE.
- Combine both sides
- Give a balanced, realistic decision
- Be decisive and clear
- Max 2 lines
`;

async function askGPT(prompt) {
  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}

app.post("/debate", async (req, res) => {
    const { question } = req.body;
  
    try {
      // 🧠 ROUND 1 - OPENING
      const mind1 = await askGemini(`${logicalPrompt}\nQuestion: ${question}`);
      const heart1 = await askGemini(`${emotionalPrompt}\nQuestion: ${question}`);
  
      // ⚔️ ROUND 2 - COUNTER
      const mind2 = await askGemini(`
  ${logicalPrompt}
  ${debatePrompt}
  
  Heart said: ${heart1}
  Now counter it.
  `);
  
      const heart2 = await askGemini(`
  ${emotionalPrompt}
  ${debatePrompt}
  
  Mind said: ${mind1}
  Now counter it.
  `);
  
      // ⚖️ FINAL VERDICT
      const final = await askGemini(`
  ${finalPrompt}
  
  Mind:
  ${mind1}
  ${mind2}
  
  Heart:
  ${heart1}
  ${heart2}
  `);
  
      res.json({
        round1: { mind: mind1, heart: heart1 },
        round2: { mind: mind2, heart: heart2 },
        final,
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).send("Error");
    }
  });

app.listen(5001, () => console.log("Server running on 5001"));