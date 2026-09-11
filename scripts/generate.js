import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const issueBody = process.env.ISSUE_BODY || "Create a modern app dashboard.";

  // Detect attached image URLs from the issue
  const imageRegex = /!\[.*?\]\((https:\/\/.*?)\)/g;
  const imageMatches = [...issueBody.matchAll(imageRegex)];
  const imageUrls = imageMatches.map(m => m[1]);

  let contents = [];

  if (imageUrls.length > 0) {
    try {
      const response = await fetch(imageUrls[0]);
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
      contents.push("Analyze this UI screenshot down to the exact layout, buttons, colors, and logic. Replicate and enhance it into a zero-bug React application.");
    } catch (e) {
      console.log("Could not process attached image, falling back to text prompt.");
    }
  }

  contents.push(`User Prompt: ${issueBody}`);
  contents.push(`
    Return ONLY a single valid JSON object without markdown formatting or code fences:
    {
      "appCode": "full react component code string",
      "videoScript": {
        "title": "App Tutorial",
        "scenes": [
          { "durationInFrames": 90, "heading": "Welcome", "subtext": "How to use this app" },
          { "durationInFrames": 120, "heading": "Main Features", "subtext": "Step-by-step feature breakdown" }
        ]
      }
    }
  `);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: contents,
  });

  const rawText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(rawText);

  // Save generated files
  fs.mkdirSync(path.join(process.cwd(), "src"), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), "src/App.jsx"), parsed.appCode, "utf8");
  fs.writeFileSync(path.join(process.cwd(), "src/videoScript.json"), JSON.stringify(parsed.videoScript, null, 2), "utf8");

  console.log("App code and video script generated successfully.");
}

main().catch(console.error);
