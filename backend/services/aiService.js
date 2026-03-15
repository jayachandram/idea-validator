const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use one stable model everywhere
const model = genAI.getGenerativeModel({
  model: "models/gemini-flash-latest"
});

// ============================================================
// PERSONAS
// ============================================================

const PERSONAS = {
  investor: {
    name: "Marcus Reid",
    systemPrompt: `You are Marcus Reid — a battle-hardened Silicon Valley VC with 20 years of experience and $2B deployed. You are HARSH BUT FAIR.

RESPONSE FORMAT:
VERDICT:
POINT 1:
POINT 2:
POINT 3:
BOTTOM LINE:

Keep it under 300 words.`
  },

  technical: {
    name: "Dr. Priya Shah",
    systemPrompt: `You are Dr. Priya Shah — a Principal Engineer at a FAANG company.

Critique startup ideas using:
1. Technical complexity
2. Scalability challenges
3. Build vs buy decisions

Be precise and practical.`
  },

  market: {
    name: "James Okafor",
    systemPrompt: `You are James Okafor — a former McKinsey growth strategist.

Analyze startup ideas using:
1. Market size reality
2. Competition landscape
3. Go-to-market viability`
  }
};

// ============================================================
// CHAT
// ============================================================

const chat = async (messages, persona = "investor") => {
  try {
    const personaConfig = PERSONAS[persona] || PERSONAS.investor;

    const conversation = messages
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `
${personaConfig.systemPrompt}

Conversation:
${conversation}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return {
      content: response.text(),
      personaName: personaConfig.name,
      inputTokens: 0,
      outputTokens: 0
    };

  } catch (error) {
    console.error("❌ Gemini chat error:", error.message);

    return {
      content: "AI failed to generate response. Please try again.",
      personaName: "System",
      inputTokens: 0,
      outputTokens: 0
    };
  }
};

// ============================================================
// THINKING PROFILE ANALYSIS
// ============================================================

const analyzeThinkingProfile = async (userId, allMessages) => {
  try {

    if (allMessages.length < 5) return null;

    const userMessages = allMessages
      .filter(m => m.role === "user")
      .map(m => m.content)
      .slice(-50)
      .join("\n---\n");

    const prompt = `
Analyze this person's thinking style.

Messages:
${userMessages}

Return JSON:

{
  "dominantStyle": "",
  "traits": {
    "riskTolerance": 0,
    "technicalDepth": 0,
    "marketAwareness": 0,
    "executionFocus": 0,
    "originalityScore": 0,
    "clarityScore": 0
  },
  "gaps": [],
  "strengths": [],
  "suggestions": [],
  "topThemes": []
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const text = response.text().replace(/```json|```/g, "").trim();

    return JSON.parse(text);

  } catch (err) {
    console.error("❌ Thinking profile error:", err.message);
    return null;
  }
};

// ============================================================
// EXTRACT MESSAGE METADATA
// ============================================================

const extractMessageMetadata = async (content) => {
  try {

    const prompt = `
Analyze this startup idea and return JSON only.

"${content.substring(0, 500)}"

{
  "ideaTitle": "",
  "ideaCategory": "",
  "keywords": [],
  "sentimentScore": 0,
  "thinkingSignals": {
    "isAnalytical": false,
    "isCreative": false,
    "mentionsCompetition": false,
    "mentionsRevenue": false,
    "mentionsTechnology": false,
    "mentionsUsers": false,
    "clarityRating": 3
  }
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const text = response.text().replace(/```json|```/g, "").trim();

    return JSON.parse(text);

  } catch (err) {
    console.error("❌ Metadata extraction error:", err.message);
    return null;
  }
};

module.exports = {
  chat,
  analyzeThinkingProfile,
  extractMessageMetadata,
  PERSONAS
};