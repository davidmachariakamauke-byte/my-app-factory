import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// 1. Create fallback files immediately so Remotion doesn't crash Webpack if the AI fails
fs.mkdirSync(path.join(process.cwd(), "src"), { recursive: true });
const fallbackScript = {
  title: "Error Video",
  scenes: [{ durationInFrames: 90, heading: "AI Error", subtext: "The AI failed to generate the app. Check Actions logs." }]
};
fs.writeFileSync(path.join(process.cwd(), "src/videoScript.json"), JSON.stringify(fallbackScript, null, 2), "utf8");
fs.writeFileSync(path.join(process.cwd(), "src/App.jsx"), "export default function App() { return <div>Error</div> }", "utf8");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

  console.log("Calling Gemini API...");
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: contents,
  });

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
