import "dotenv/config";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURATION ---
const INPUT_FILE = path.resolve("src/analysis.json");
const OUTPUT_FILE = path.resolve("src/personas.json"); // The final "Character Sheets"
const MODEL_NAME = "gemini-3-flash-preview";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLEAI_API_KEY });

const NumberModelMap = {
  1: "Gemini",
  2: "ChatGPT",
  3: "Claude",
  4: "Deepseek",
};
// --- 1. PARSING LOGIC ---
// Extracts bullet points from the raw analysis string and groups them by Model Name
function aggregateModelFeedback(analysisData) {
  const modelAggregates = {};

  analysisData.forEach((entry) => {
    const text = entry.analysis;
    if (!text) return;

    // Split by the model header tag
    // This assumes the format: [MODEL: Name] ... content ...
    const sections = text.split(/\[MODEL[:\s]+/i);

    sections.forEach((section) => {
      if (!section.trim()) return; // Skip empty splits

      // Extract Name (everything up to the closing bracket)
      const endBracketIndex = section.indexOf("]");
      if (endBracketIndex === -1) return;

      const modelName = section.substring(0, endBracketIndex).trim();
      const content = section.substring(endBracketIndex + 1).trim();

      // Initialize array if new model
      if (!modelAggregates[modelName]) {
        modelAggregates[modelName] = [];
      }

      // Extract bullet points (lines starting with * or -)
      const lines = content.split("\n");
      const bullets = lines
        .map((l) => l.trim())
        .filter((l) => l.startsWith("*") || l.startsWith("-"))
        .map((l) => l.replace(/^[\*\-]\s*/, "")); // Remove the bullet char

      // Add to the big pile
      modelAggregates[modelName].push(...bullets);
    });
  });

  return modelAggregates;
}

// --- 2. SYNTHESIS LOGIC ---
async function synthesizePersonas() {
  console.log("Reading analysis data...");

  if (!fs.existsSync(INPUT_FILE)) {
    console.error("No analysis.json found.");
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
  const aggregatedData = aggregateModelFeedback(rawData);
  const models = Object.keys(aggregatedData);

  console.log(`Identified models: ${models.join(", ")}`);

  const personas = {};

  for (const model of models) {
    const observations = aggregatedData[model];

    // Skip if too little data
    if (observations.length < 5) {
      console.log(`[SKIP] ${model}: Not enough data points.`);
      continue;
    }

    console.log(
      `\n--- Synthesizing Persona for: ${model} (${observations.length} points) ---`,
    );

    // We join the first ~1000 points (to fit context) into a massive text block
    // Gemini 1.5 Pro has a huge context window, so we can likely dump it all in.
    const evidenceText = observations.join("\n");
    // console.log(evidenceText.substring(0, 5000) + "...");
    const prompt = `
      You are a Pattern Recognition AI.
      
      I have analyzed hundreds of responses from an AI Model named "${model}".
      Below is a raw list of bullet points observing its specific behaviors, tone, formatting, and quirks across many different tasks.

      RAW OBSERVATIONS:
      """
      ${evidenceText}
      """

      ---
      TASK:
      Synthesize these observations into a coherent "Character Persona" for ${model}.
      Ignore outliers; look for the patterns that appear most frequently.

      Output a JSON object (no markdown formatting) with these keys:
      {
        "model_name": "${NumberModelMap[model]}",
        "core_identity": "A 1-sentence summary of their vibe (e.g. 'The Enthusiastic Tutor' or 'The Concise Robot')",
        "common_structure": "How they typically organize answers (e.g. 'Intro + Bullets + Summary')",
        "writing_quirks": ["List of 3-5 specific habits, e.g. 'Uses emojis often', 'Starts with Alright', 'Overuses bolding'"],
        "weaknesses": "What they tend to mess up (e.g. 'Too wordy', 'Refuses to be creative')",
        "telltale_signs": "The #1 dead giveaway that this text was written by this model."
      }
    `;

    try {
      await new Promise((r) => setTimeout(r, 2000)); // Rate limit pause

      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        generationConfig: { responseMimeType: "application/json" }, // Force JSON
      });

      const responseText = result.text;
      const persona = JSON.parse(responseText);

      personas[model] = persona;

      // Save progress incrementally
      fs.writeFileSync(
        OUTPUT_FILE,
        JSON.stringify(Object.values(personas), null, 2),
      );
      console.log(`   -> Persona generated for ${model}`);
      console.log(persona);
    } catch (error) {
      console.error(
        `   -> Error generating persona for ${model}:`,
        error.message,
      );
    }
  }

  console.log(`\nDone! Personas saved to ${OUTPUT_FILE}`);
}

synthesizePersonas();
