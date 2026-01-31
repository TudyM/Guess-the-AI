import "dotenv/config";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { questions } from "./questions.js";

// ==========================================
// 1. CONFIGURATION & SETUP
// ==========================================
const DATA_FILE_PATH = path.resolve("src/data.json");

// --- CLIENTS ---
// 1. Google (Gemini)
const googleAI = new GoogleGenAI({ apiKey: process.env.GOOGLEAI_API_KEY });

// 2. OpenAI (ChatGPT)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 3. Anthropic (Claude)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 4. DeepSeek (Uses OpenAI SDK with custom URL)
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

// ==========================================
// 2. PROVIDERS STRATEGY
// ==========================================
const providers = [
  {
    name: "Gemini",
    enabled: true,
    generate: async (prompt) => {
      const response = await googleAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      return response.text;
    },
  },
  {
    name: "ChatGPT",
    enabled: true,
    generate: async (prompt) => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0].message.content;
    },
  },
  {
    name: "Claude",
    enabled: true,
    generate: async (prompt) => {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929", // Latest stable model
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });
      return response.content[0].text;
    },
  },
  {
    name: "Deepseek", // <--- NEW PROVIDER
    enabled: true,
    generate: async (prompt) => {
      const response = await deepseek.chat.completions.create({
        model: "deepseek-chat", // V3 (Use 'deepseek-reasoner' for R1/Logic)
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0].message.content;
    },
  },
];

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================
function loadData() {
  if (!fs.existsSync(DATA_FILE_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE_PATH, "utf-8"));
  } catch (e) {
    return [];
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ==========================================
// 4. MAIN LOOP
// ==========================================
async function main() {
  let data = loadData();
  console.log(
    `Loaded ${questions.length} questions. Checking against ${data.length} existing responses.`,
  );

  for (const q of questions) {
    console.log(`\n--- ID ${q.id}: "${q.prompt.substring(0, 30)}..." ---`);

    for (const provider of providers) {
      if (!provider.enabled) continue;

      // Check for duplicates
      const exists = data.find(
        (item) => item.prompt === q.prompt && item.model === provider.name,
      );

      if (exists) {
        console.log(`   [${provider.name}] Already done.`);
        continue;
      }

      try {
        console.log(`   [${provider.name}] Generating...`);
        await sleep(1000); // 1s delay to be safe

        const answer = await provider.generate(
          q.prompt + "Be short. Write at most 70 words.",
        );
        if (!answer) throw new Error("Empty response");

        data.push({
          id: Date.now(),
          category: q.category,
          prompt: q.prompt,
          response: answer.trim(),
          model: provider.name,
          options: ["Gemini", "ChatGPT", "Claude", "Grok", "Deepseek"],
        });

        saveData(data);
        console.log(`   -> Saved!`);
      } catch (error) {
        console.error(`   -> X ERROR [${provider.name}]:`, error.message);
      }
    }
  }
  console.log("\nDone! All providers processed.");
}

main();
