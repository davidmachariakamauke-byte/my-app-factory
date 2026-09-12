import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// 1. Create fallback files immediately so Remotion doesn't crash if the AI completely fails
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

async function fetchWithRetry(contents, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Calling Gemini API (Attempt ${attempt}/${maxRetries})...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contents,
      });
      return response;
    } catch (error) {
      // Catch the 503 overload error and wait before trying again
      if (error.status === 503 || (error.message && error.message.includes("503"))) {
        console.warn(`⚠️ Google API overloaded (503). Retrying in ${attempt * 5} seconds...`);
        if (attempt === maxRetries) throw error;
        await delay(attempt * 5000); // Waits 5s, then 10s, then fails if the 3rd attempt drops
      } else {
        throw error; // Fail immediately if the error is a 400 (bad request) or 401 (bad API key)
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

  // Call the new retry function instead of the direct API call
  const response = await fetchWithRetry(contents);

  console.log("Parsing response...");
  let rawText = response.text;
  rawText = rawText.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
  
  const parsed = JSON.parse(rawText);

  // Overwrite fallbacks with actual generated code
  fs.writeFileSync(path.join(process.cwd(), "src/App.jsx"), parsed.appCode, "utf8");
  fs.writeFileSync(path.join(process.cwd(), "src/videoScript.json"), JSON.stringify(parsed.videoScript, null, 2), "utf8");
  
  console.log("✅ Files generated successfully.");
}

main().catch(err => {
  console.error("❌ CRITICAL ERROR IN AI GENERATION:");
  console.error(err);
  process.exit(1); 
});
