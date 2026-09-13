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
        // 1. UPGRADE TO PRO MODEL: Much stronger reasoning for complex, beautiful UIs
        model: "gemini-1.5-pro",
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
  const issueBody = process.env.ISSUE_BODY || "Create a full KaziConnect app.";
  const indexPath = path.join(process.cwd(), "index.html");

  // 2. ADD MEMORY: Read the current website so Gemini can edit it iteratively
  let existingApp = "No existing code. Build from scratch.";
  if (fs.existsSync(indexPath)) {
    existingApp = fs.readFileSync(indexPath, "utf8");
  }

  // 3. THE MASTER UI SYSTEM PROMPT: Forces professional design standards
  const prompt = `
  You are an elite Staff Frontend Engineer and UI/UX Designer, equivalent to the AI behind Lovable or v0.dev.
  
  USER REQUEST: "${issueBody}"
  
  CURRENT APP CODE:
  \`\`\`html
  ${existingApp}
  \`\`\`
  
  YOUR DIRECTIVES:
  1. ITERATIVE EDITING: If "CURRENT APP CODE" exists and is a valid app, DO NOT rewrite it from scratch. Surgically update it to fulfill the USER REQUEST while preserving existing features and data.
  2. ARCHITECTURE: Output a single-file HTML app. Include Tailwind CSS and React/Babel via CDN.
  3. PROFESSIONAL UI/UX RULES:
     - Use a modern, clean design system inspired by Stripe or Vercel.
     - Implement generous padding, subtle borders (border-slate-200), soft shadows (shadow-sm, shadow-md), and rounded corners (rounded-xl).
     - Use a professional color palette (e.g., slate-900 for text, minimal vibrant accents for primary buttons).
     - Ensure perfect mobile responsiveness using Tailwind's sm:, md:, lg: prefixes.
     - Build empty states, loading states, and smooth interactive hover effects (transition-all duration-200).
     - Use raw inline SVGs for all icons.
  4. RETURN FORMAT: 
     - Return ONLY the raw HTML code starting with <!DOCTYPE html>.
     - Do not include markdown formatting, backticks, or conversational text.
  `;

  const response = await fetchWithRetry([prompt]);

  console.log("Processing output...");
  let rawHtml = response.text;
  
  // Clean up any stray markdown formatting the model might try to inject
  rawHtml = rawHtml.replace(/^\s*```html/, "").replace(/^\s*```/, "").replace(/```\s*$/, "").trim();

  fs.writeFileSync(indexPath, rawHtml, "utf8");
  console.log("✅ index.html updated successfully with Lovable-tier UI.");
}

main().catch(err => {
  console.error("❌ Generation Error:", err);
  process.exit(1);
});
