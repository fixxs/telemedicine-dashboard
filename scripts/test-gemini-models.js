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

const candidateModels = [
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-001",
];

async function testModels() {
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of candidateModels) {
    try {
      console.log(`Testing model: "${modelName}"...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });
      const res = await model.generateContent('Berikan JSON: {"status": "ok"}');
      console.log(`✅ SUCCESS! Working model found: "${modelName}"`);
      console.log("Response text:", res.response.text());
      return modelName;
    } catch (err) {
      console.error(`❌ Model "${modelName}" failed:`, err.message);
    }
  }
}

testModels();
