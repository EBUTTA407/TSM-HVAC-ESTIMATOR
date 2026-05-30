import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("TSM HVAC Estimator API is running");
});

app.post("/api/estimate-search", async (req, res) => {
  try {
    const { job, equipment, model, stories, access } = req.body;

    const prompt = `
You are the Tri State Mechanical HVAC estimating search engine.

YOU MUST SEARCH THE WEB for live/current pricing before answering.

Goal:
Find parts pricing from public websites and use the HIGHEST realistic parts price found.

Job:
- Scope: ${job}
- Equipment: ${equipment}
- Model: ${model || "Not provided"}
- Building height: ${stories}
- Roof access: ${access}

Search instructions:
- Search public web sources for the model number and repair part.
- Look for OEM parts, aftermarket parts, supplier pages, replacement parts, motors, capacitors, blades, boards, pressure switches, thermostat wire, drain parts, etc.
- Sources can include Grainger, SupplyHouse, RepairClinic, PartsTown, United Refrigeration, Johnstone public pages, HVACPartsShop, Amazon Business/public listings, eBay only if no better source, manufacturer parts pages, and other HVAC supplier pages.
- If exact model-specific pricing is not found, search the repair type plus equipment type and use the highest realistic comparable price.
- Do NOT invent that you searched if no prices are found.
- If no real pricing is found, set pricingConfidence to "low" and explain.
- Use highest realistic parts price found as recommendedPartsCost.
- Include source URLs and prices found.
- Labor must include building height/access difficulty.
- 1 story is normal.
- 2-5 stories add time.
- 5+ stories requires crane/lift review.
- If condenser fan motor or direct-drive motor, include capacitor note.
- If condenser fan motor, include condenser fan blade review note.
- If rust/age risk applies, mention blade may be seized to shaft.

Return JSON only:
{
  "partsLow": number,
  "partsHigh": number,
  "recommendedPartsCost": number,
  "pricingConfidence": "high" | "medium" | "low",
  "priceSources": [
    {
      "part": "string",
      "price": number,
      "source": "string",
      "url": "string"
    }
  ],
  "laborLow": number,
  "laborHigh": number,
  "recommendedLaborHours": number,
  "craneRequired": true,
  "craneReason": "string",
  "notes": "string"
}
`;

    const response = await openai.responses.create({
      model: "gpt-5.5",
      tools: [{ type: "web_search" }],
      input: prompt,
    });

    let text = response.output_text || "";

    console.log("RAW WEB SEARCH RESPONSE:");
    console.log(text);

    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const data = JSON.parse(text);

    res.json(data);
  } catch (err) {
    console.error("ESTIMATE SEARCH ERROR:", err);

    res.status(500).json({
      error: "Failed to search live pricing and labor",
      details: err.message,
    });
  }
});

app.listen(process.env.PORT || 8787, "0.0.0.0", () => {
  console.log(`TSM HVAC estimator backend running on port ${process.env.PORT || 8787}`);
});
