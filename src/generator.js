import "dotenv/config";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { questions } from "./questions.js";

// --- CONFIGURATION ---
const CONCURRENCY_LIMIT = 8;
const DATA_FILE_PATH = path.resolve("src/data.json");

// --- CLIENTS (Auto-retries disabled to see raw errors) ---
const googleAI = new GoogleGenAI({ apiKey: process.env.GOOGLEAI_API_KEY });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 0,
});
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 0,
});
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
  maxRetries: 0,
});

// --- PROVIDERS WRAPPER ---
const providers = [
  {
    name: "Gemini",
    color: "\x1b[34m", // Blue
    enabled: true,
    generate: async (prompt) => {
      const res = await googleAI.models.generateContent({
        model: "gemini-3-flash-preview", // Your model
        contents: prompt,
      });
      return res.text;
    },
  },
  {
    name: "ChatGPT",
    color: "\x1b[32m", // Green
    enabled: true,
    generate: async (prompt) => {
      const res = await openai.chat.completions.create({
        model: "gpt-5-mini", // Your model
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content;
    },
  },
  {
    name: "Claude",
    color: "\x1b[33m", // Yellow
    enabled: true,
    generate: async (prompt) => {
      const res = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929", // Your model
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });
      return res.content[0].text;
    },
  },
  {
    name: "Deepseek",
    color: "\x1b[35m", // Magenta
    enabled: true,
    generate: async (prompt) => {
      const res = await deepseek.chat.completions.create({
        model: "deepseek-chat", // Your model
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content;
    },
  },
];

// --- HELPER: Visual Logger ---
const startTime = Date.now();
function log(msg) {
  const diff = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[${diff}s] ${msg}`);
}

// --- MAIN QUEUE ---
async function main() {
  // 1. Load Data
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE_PATH, "utf-8"));
  } catch (e) {}

  // 2. Build Job List
  const jobs = [];
  questions.forEach((q) => {
    providers.forEach((p) => {
      if (!p.enabled) return;
      const exists = data.find(
        (i) => i.prompt === q.prompt && i.model === p.name,
      );
      if (!exists) jobs.push({ q, p });
    });
  });

  console.log(
    `Queue size: ${jobs.length} items. Processing ${CONCURRENCY_LIMIT} at a time...`,
  );

  // 3. Queue Logic
  let active = 0;
  let index = 0;

  return new Promise((resolve) => {
    const next = () => {
      if (index >= jobs.length && active === 0) {
        resolve();
        return;
      }

      while (active < CONCURRENCY_LIMIT && index < jobs.length) {
        const job = jobs[index++];
        run(job);
      }
    };

    const run = async ({ q, p }) => {
      active++;
      const idStr = `ID:${q.id} [${p.name}]`;

      log(`${p.color}➤ START ${idStr}\x1b[0m`);

      try {
        const answer = await p.generate(q.prompt + " Write 150-300 words.");

        data.push({
          id: Date.now(),
          category: q.category,
          prompt: q.prompt,
          response: answer.trim(),
          model: p.name,
          options: ["Gemini", "ChatGPT", "Claude", "Deepseek"],
        });

        // Quick save every time (since FS is fast)
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));

        log(`${p.color}✓ DONE  ${idStr}\x1b[0m`);
      } catch (err) {
        log(`\x1b[31m✖ FAIL  ${idStr} -> ${err.message}\x1b[0m`);
      } finally {
        active--;
        next();
      }
    };

    next();
  });
}

main();
