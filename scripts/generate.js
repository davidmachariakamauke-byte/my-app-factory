import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// 1. Write an instant backup HTML page in case API fails
const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KaziConnect</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white flex items-center justify-center h-screen">
  <div class="text-center">
    <h1 class="text-3xl font-bold">KaziConnect</h1>
    <p class="text-gray-400 mt-2">Building application... check back in a moment.</p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(process.cwd(), "index.html"), fallbackHtml, "utf8");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(contents, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Calling Gemini API (Attempt ${attempt}/${maxRetries})...`);
      return await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: contents,
      });
    } catch (error) {
      if (error.status === 503 || (error.message && error.message.includes("503"))) {
        console.warn(`⚠️ Google API busy. Retrying in ${attempt * 5}s...`);
        if (attempt === maxRetries) throw error;
        await delay(attempt * 5000);
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  const issueBody = process.env.ISSUE_BODY || "Create a full KaziConnect app for construction workers in Kenya.";

  const prompt = `
  You are an expert frontend developer. Create a full, single-file HTML web application based on this request: "${issueBody}".
  
  REQUIREMENTS:
  - Return ONLY raw HTML code (starting with <!DOCTYPE html>). No markdown formatting, no code blocks, no backticks.
  - Include Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>).
  - Include React 18 & Babel via CDN so interactive React components work directly in browser.
  - Build a modern, mobile-responsive dashboard for KaziConnect (construction jobs, material marketplace, worker profiles, and contact/booking modals).
  - Use clean inline styling, standard emojis/SVG icons, and responsive layouts.
  `;

  const response = await fetchWithRetry([prompt]);

  console.log("Processing output...");
  let rawHtml = response.text;
  rawHtml = rawHtml.replace(/^\s*```html/, "").replace(/^\s*```/, "").replace(/```\s*$/, "").trim();

  fs.writeFileSync(path.join(process.cwd(), "index.html"), rawHtml, "utf8");
  console.log("✅ index.html created successfully.");
}

main().catch(err => {
  console.error("❌ Generation Error:", err);
  process.exit(1);
});
