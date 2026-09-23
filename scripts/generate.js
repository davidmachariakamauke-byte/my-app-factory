import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Order models from highest quality (Gemini 3) down to high availability (Gemini 2.5)
const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash"];

async function generateWithFallback(contents, maxRetriesPerModel = 4) {
  for (const model of MODELS) {
    console.log(`\n🤖 Requesting code generation with model: ${model}...`);

    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`Calling API (${model} - Attempt ${attempt}/${maxRetriesPerModel})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
        });
        console.log(`✅ Success using ${model}`);
        return response;
      } catch (error) {
        const isTransient =
          error.status === 503 ||
          error.status === 429 ||
          (error.message && (
            error.message.includes("503") ||
            error.message.includes("429") ||
            error.message.includes("UNAVAILABLE") ||
            error.message.includes("RESOURCE_EXHAUSTED") ||
            error.message.includes("high demand")
          ));

        if (isTransient && attempt < maxRetriesPerModel) {
          const jitter = Math.floor(Math.random() * 2000);
          const waitTime = Math.pow(2, attempt - 1) * 4000 + jitter;
          console.warn(`⚠️ Model ${model} busy. Retrying in ${Math.round(waitTime / 1000)}s...`);
          await delay(waitTime);
        } else if (isTransient) {
          console.warn(`⚠️ ${model} exhausted retries due to high demand. Falling back to next model...`);
          break; // Exit retry loop for this model, try next model in MODELS
        } else {
          // Non-transient error (e.g. invalid auth)
          throw error;
        }
      }
    }
  }
  throw new Error("All Gemini models failed due to persistent server demand.");
}

async function main() {
  const issueBody = process.env.ISSUE_BODY || "Create a full KaziConnect app.";
  const indexPath = path.join(process.cwd(), "index.html");

  let existingReactCode = "No existing code. Build from scratch.";
  if (fs.existsSync(indexPath)) {
    const fullHtml = fs.readFileSync(indexPath, "utf8");
    const match = fullHtml.match(/<script type="text\/babel">\s*([\s\S]*?)\s*<\/script>/);
    if (match && match[1]) {
      existingReactCode = match[1].trim();
    }
  }

  const prompt = `
  You are a Principal UI/UX Architect and Lead React Engineer.
  USER REQUEST: "${issueBody}"
  
  CURRENT REACT CODE:
  \`\`\`javascript
  ${existingReactCode}
  \`\`\`
  
  CORE INSTRUCTIONS:
  1. Build a complete, production-grade, highly engaging web application using React and Tailwind CSS.
  2. If existing React code is provided above, cleanly extend/refactor it. Otherwise, build from scratch.
  3. Respond ONLY with raw React JavaScript code. Do not wrap in HTML tags, do not use backticks or markdown codeblocks in your response output.
  
  UI/UX & ARCHITECTURE QUALITY STANDARDS:
  - **Layout & Structure**: Responsive application shell with sidebar navigation, search bar, stat cards, interactive data tables or grid views, modal overlays, and toast notifications.
  - **State Management**: Full interactivity using React hooks (\`useState\`, \`useMemo\`, \`useEffect\`). Support dynamic filters, tabs, sorting, search inputs, item creation/editing, and status toggles.
  - **Design Tokens**: Modern Tailwind CSS design system with subtle gradients, soft shadows (\`shadow-sm\` / \`shadow-md\`), rounded cards (\`rounded-2xl\`), badges, clean typography, hover transitions, and micro-interactions.
  - **Icons**: Inline SVG icons (Lucide/Heroicons style) with appropriate sizing (\`w-5 h-5\`) and subtle colors.
  - **Data**: Include rich, real-world mock datasets (e.g. users, tasks, transactions, services, status tags) so the app looks populated and functional right out of the box.

  MANDATORY ENDING CODE:
  Your script MUST create an 'App' component and end strictly with:
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  `;

  const response = await generateWithFallback([prompt]);

  console.log("Processing AI output...");
  let aiReactCode = response.text
    .replace(/^```(javascript|js|jsx)?/i, "")
    .replace(/```$/, "")
    .trim();

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
    body { background-color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"; }
    /* Custom scrollbar for clean UI */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
  </style>
</head>
<body class="antialiased text-slate-800">
  <div id="root"></div>
  <script type="text/babel">
${aiReactCode}
  </script>
</body>
</html>`;

  fs.writeFileSync(indexPath, finalHtml, "utf8");
  console.log("✅ index.html generated successfully with enhanced application code.");
}

main().catch(err => {
  console.error("❌ Generation Error:", err);
  process.exit(1);
});
