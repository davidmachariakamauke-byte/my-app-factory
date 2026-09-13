import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// 1. Instantly write fallback files to prevent pipeline crashes
fs.mkdirSync(path.join(process.cwd(), "src"), { recursive: true });
const fallbackScript = {
  title: "Error Video",
  scenes: [{ durationInFrames: 90, heading: "AI Error", subtext: "The AI failed to generate the app. Check Actions logs." }]
};
fs.writeFileSync(path.join(process.cwd(), "src/videoScript.json"), JSON.stringify(fallbackScript, null, 2), "utf8");
fs.writeFileSync(path.join(process.cwd(), "src/App.jsx"), "export default function App() { return <div>Error</div> }", "utf8");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 2. Exponential Backoff function for autonomous retries
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(contents, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Calling Gemini API (Attempt ${attempt}/${maxRetries})...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: contents,
      });
      return response;
    } catch (error) {
      if (error.status === 503 || (error.message && error.message.includes("503"))) {
        console.warn(`⚠️ Google API overloaded (503). Retrying in ${attempt * 5} seconds...`);
        if (attempt === maxRetries) throw error;
        await delay(attempt * 5000);
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  const issueBody = process.env.ISSUE_BODY || "Create a simple React app.";

  let contents = [];
  contents.push(`User Prompt: ${issueBody}`);
  contents.push(`
    Return ONLY a single valid JSON object. No markdown formatting, no code blocks, no backticks.
    {
      "appCode": "export default function App() { return <div>Hello</div>; }",
      "videoScript": {
        "title": "App Tutorial",
        "scenes": [
          { "durationInFrames": 90, "heading": "Welcome", "subtext": "How to use this app" }
        ]
      }
    }
  `);

  const response = await fetchWithRetry(contents);

  console.log("Parsing response...");
  let rawText = response.text;
  rawText = rawText.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
  
  const parsed = JSON.parse(rawText);

  // Overwrite fallbacks with generated code
  fs.writeFileSync(path.join(process.cwd(), "src/App.jsx"), parsed.appCode, "utf8");
  fs.writeFileSync(path.join(process.cwd(), "src/videoScript.json"), JSON.stringify(parsed.videoScript, null, 2), "utf8");
  
  console.log("✅ Files generated successfully.");
}

main().catch(err => {
  console.error("❌ CRITICAL ERROR IN AI GENERATION:");
  console.error(err);
  process.exit(1); 
});
