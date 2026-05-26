const OpenAI = require('openai');

function buildClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'sk-placeholder' || key.length < 20) return null;
  try {
    return new OpenAI({ apiKey: key });
  } catch (err) {
    console.error('[openai] Failed to init client:', err.message);
    return null;
  }
}

const client = buildClient();

function stripFences(text) {
  if (!text) return text;
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?/i, '').trim();
    if (t.endsWith('```')) t = t.slice(0, -3).trim();
  }
  return t;
}

async function generateRecommendations({ orderHistory, menuItems }) {
  if (!client) {
    throw new Error('OpenAI client unavailable (missing or placeholder key)');
  }

  const menuPayload = menuItems.map((m) => ({
    name: m.name,
    price: m.price,
    category: m.category,
    isVeg: m.isVeg,
    rating: m.rating,
  }));

  const systemPrompt =
    'You are a food recommendation engine. Respond ONLY with a valid JSON array. No explanation, no markdown.';
  const userPrompt = `A customer has ordered the following dishes multiple times: ${JSON.stringify(orderHistory)}.
From this restaurant menu: ${JSON.stringify(menuPayload)}.
Suggest 5 dishes they would enjoy that they haven't ordered recently.
Return exactly this JSON format:
[{"name": "...", "reason": "...", "price": 0, "category": "..."}]`;

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      const raw = completion.choices?.[0]?.message?.content || '';
      const cleaned = stripFences(raw);
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 5);
      throw new Error('Empty or invalid JSON array from model');
    } catch (err) {
      lastErr = err;
      console.error(`[openai] attempt ${attempt} failed:`, err.message);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw lastErr || new Error('OpenAI request failed');
}

module.exports = { generateRecommendations };
