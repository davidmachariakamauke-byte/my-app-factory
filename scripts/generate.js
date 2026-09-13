import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(contents, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Calling Gemini API (Attempt ${attempt}/${maxRetries})...`);
      return await ai.models.generateContent({
        // 1.5-flash is much stronger at coding than lite, without the Pro tier 404 block
        model: "gemini-1.5-flash",
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
  const issueBody = process.env.ISSUE_BODY || "Create a beautiful KaziConnect dashboard.";
  const indexPath = path.join(process.cwd(), "index.html");

  // Read existing React code so the AI can iterate and improve upon it
  let existingReactCode = "No existing code. Build from scratch.";
  if (fs.existsSync(indexPath)) {
    const fullHtml = fs.readFileSync(indexPath, "utf8");
    const match = fullHtml.match(/<script type="text\/babel">\s*([\s\S]*?)\s*<\/script>/);
    if (match && match[1]) {
      existingReactCode = match[1].trim();
    }
  }

  const prompt = `
  You are an elite Staff Frontend Engineer and UI/UX Designer.
  USER REQUEST: "${issueBody}"
  
  CURRENT REACT CODE:
  \`\`\`javascript
  ${existingReactCode}
  \`\`\`
  
  YOUR DIRECTIVES:
  1. If CURRENT REACT CODE exists, surgically update it. If not, build the app.
  2. Write ONLY the raw React JavaScript code. DO NOT write any HTML. DO NOT wrap it in <script> tags. 
  3. PROFESSIONAL UI/UX RULES:
     - Use a modern, clean design system.
     - Implement generous padding, subtle borders (border-slate-200), soft shadows, and rounded corners (rounded-xl).
     - Ensure perfect mobile responsiveness using Tailwind (sm:, md:, lg:).
     - Use raw inline SVGs for all icons.
  4. Your code must define a main 'App' component and end with this exact line:
     ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  5. RETURN FORMAT: Return ONLY raw JavaScript code. No markdown formatting, no backticks.
  `;

  const response = await fetchWithRetry([prompt]);

  console.log("Processing AI output...");
  let aiReactCode = response.text.replace(/^\s*```(javascript|js|jsx)?/, "").replace(/```\s*$/, "").trim();

  // The Bulletproof Wrapper: Hardcoded so the AI can never break the core infrastructure
  const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KaziConnect</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { background-color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
${aiReactCode}
  </script>
</body>
</html>`;

  fs.writeFileSync(indexPath, finalHtml, "utf8");
  console.log("✅ index.html securely assembled and updated.");
}

main().catch(err => {
  console.error("❌ Generation Error:", err);
  process.exit(1);
});
