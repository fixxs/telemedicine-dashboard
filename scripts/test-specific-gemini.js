const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env.local");
let apiKey = "";
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

async function testSpecific() {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTest = [
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-2.5-pro",
  ];

  for (const m of modelsToTest) {
    try {
      console.log(`Testing "${m}"...`);
      const model = genAI.getGenerativeModel({
        model: m,
        generationConfig: { responseMimeType: "application/json" },
      });
      const res = await model.generateContent('{"ping": "hello"}');
      console.log(`✅ SUCCESS for "${m}":`, res.response.text());
    } catch (err) {
      console.error(`❌ FAILED for "${m}":`, err.message);
    }
  }
}

testSpecific();
