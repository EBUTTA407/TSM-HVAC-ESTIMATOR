import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
console.log("API KEY PREFIX:", process.env.OPENAI_API_KEY?.substring(0,15));
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/estimate-search", async (req, res) => {
  try {
    const { job, equipment, model, stories, access } = req.body;

    const prompt = `
You are an HVAC estimating assistant for Tri State Mechanical in Arizona.

Estimate this job:
Scope: ${job}
Equipment: ${equipment}
Model: ${model || "Not provided"}
Building height: ${stories}
Roof access: ${access}

Return JSON only with:
{
  "partsLow": number,
  "partsHigh": number,
  "recommendedPartsCost": number,
  "laborLow": number,
  "laborHigh": number,
  "recommendedLaborHours": number,
  "craneRequired": true/false,
  "craneReason": "string",
  "notes": "string"
}

Rules:
- Use the highest realistic parts cost for recommendedPartsCost.
- Labor should include access and building height.
- 1 story is normal.
- 2-5 stories may add labor and lift/crane review.
- 5+ stories requires crane/lift review.
- Be conservative for commercial HVAC pricing.
- If the job involves a direct drive motor, always recommend adding a capacitor.
- If the job involves a condenser fan motor, include a note asking if the condenser fan blade needs replacement.
- If the unit is 3-5 years old, warn that the condenser fan blade may be rusted/seized to the motor shaft.
- If the motor is rusted, recommend adding a condenser fan blade because old blades often seize to the shaft and are difficult to remove without damage.
- Include capacitor and blade notes inside "notes".
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const text = completion.choices[0].message.content;

console.log("RAW RESPONSE:");
console.log(text);

let jsonText = text.trim();

if (jsonText.includes("```")) {
  jsonText = jsonText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

const data = JSON.parse(jsonText);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to search pricing and labor",
      details: err.message,
    });
  }
});

app.listen(process.env.PORT || 8787, () => {
  console.log(`HVAC estimator backend running on port ${process.env.PORT || 8787}`);
});