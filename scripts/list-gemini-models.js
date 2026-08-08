const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env.local");
let apiKey = "";
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("Available Gemini Models for your key:");
  if (data.models) {
    data.models.forEach((m) => {
      if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- Name: "${m.name.replace('models/', '')}", DisplayName: "${m.displayName}"`);
      }
    });
  } else {
    console.log("API response:", JSON.stringify(data, null, 2));
  }
}

listModels().catch(console.error);
