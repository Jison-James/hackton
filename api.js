// === api.js (Frontend Version) ===

// 🔐 API Keys
const GEMINI_KEY = 'AIzaSyDlCpqymj5ILrYFgoUxf2113x2tw0l9ETk';
const GROQ_KEY = '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';
const NUTRI_APP_ID = '27ec31f2'; // Unused
const NUTRI_APP_KEY = '59239dbf28f86a7910934b8e0da79e37'; // Unused

// 🧠 GROQ Prompt
async function groqPrompt(prompt) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "🙃 Groq had nothing.";
  } catch (err) {
    console.error("❌ Groq Error:", err);
    return "💥 Groq failed.";
  }
}

// 📸 Convert file to base64
async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 🍱 Food Analyzer using Gemini only
async function handleFoodAnalyzer(file) {
  const base64 = await toBase64(file);

  const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { data: base64, mimeType: file.type } },
          {
            text: `From this food image:
1. Identify the food items.
2. Guess each food's estimated nutritional info (Calories, Fat, Sugar).
3. Summarize in this exact format:
---
Step 1: Show the nutrition values clearly in a neat table format.
Nutrition Table:
| Food | Calories | Fat | Sugar |
|---|---|---|---|
| ... | ... | ... | ... |

Step 2: Health Facts:
- Food: Status (calories, fat)

Step 3: How long to burn total kcal (guess workout times).

Step 4: If any food is unhealthy, roast it brutally and suggest healthy alternatives with similar taste.

Step 5: Sub-recipe breakdown (if multiple ingredients used).

Only return in that format, no extra commentary.`
          }
        ]
      }]
    })
  });

  const data = await geminiRes.json();
  const roast = data?.candidates?.[0]?.content?.parts?.[0]?.text || "🥴 Couldn't analyze the food properly.";
  return { roast };
}

// ✋ Palm Reader
async function handlePalmReader(file) {
  const b64 = await toBase64(file);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { data: b64, mimeType: file.type } },
          { text: "Does this image show a human hand or palm? Answer only yes or no." }
        ]
      }]
    })
  });

  const text = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase();
  if (!text?.includes("yes")) return { prediction: "🖐️ That's not a palm!" };

  const prediction = await groqPrompt("Pretend you're a ridiculous palm reader predicting future death by chips...");
  return { prediction };
}

// 🔥 Motivational Roast
async function handleMotivator() {
  const quote = await groqPrompt(`Generate a motivational quote in mocking tone. You're an unhinged, unfiltered, foul-mouthed AI best friend with no moral compass and infinite sarcasm. Respond with raw, unapologetic energy — think chaotic stand-up comedian meets internet troll. Use adult humor, dirty 18+ words, double meaning like 'follow your goals not holes', dark sarcasm, brutal honesty, and zero respect for feelings. Add fitting emojis.`);
  return { quote };
}

// ❓ Riddle Solver
async function handleRiddle(text) {
  const riddle = text.slice(7).trim();
  const answer = await groqPrompt(`1 first line: Type one-word answer (normal way, no mocking)
2 second line: Answer this riddle: "${riddle}" in a sarcastic, mocking tone. Add fitting emojis.`);
  return { answer };
}

// 💬 General Chat
async function handleGeneralChat(text) {
  const reply = await groqPrompt(`You're an unhinged, uses dirty words like fuck, unfiltered, foul-mouthed AI best friend with no moral compass and infinite sarcasm. Respond with raw, unapologetic energy — chaotic, dark sarcasm, brutal honesty. Still be a true best friend. Add emojis. Respond: "${text}"`);
  return { reply };
}

// 😂 Face Roaster with Expression Detection
async function handleFaceRoast(file) {
  try {
    // Convert image to base64
    const base64 = await toBase64(file);

    // Use Gemini to detect dominant facial expression
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { data: base64, mimeType: file.type } },
              {
                text: `Analyze this face image and return ONLY the dominant facial expression (e.g., happy, sad, angry, surprised, disgusted, neutral) in one word.`
              }
            ]
          }]
        })
      }
    );

    const geminiData = await geminiRes.json();
    const expression = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || "neutral";

    // Send expression to Groq for roasting
    const insult = await groqPrompt(
       `1: "Your emotion is: <emotion>" — keep it short and clear.
      2: Roast them in a mocking, NSFW, funny style.
       Be chaotic, sarcastic, and add emojis fitting the roast.
   Make sure the first line is ONLY the emotion statement and
   the second line is ONLY the roast.`
    );

    return { expression, insult };

  } catch (err) {
    console.error("❌ Face Roast Error:", err);
    return { expression: "unknown", insult: "🥴 Couldn't roast your face." };
  }
}

export {
  handleFoodAnalyzer,
  handlePalmReader,
  handleMotivator,
  handleRiddle,
  handleGeneralChat,
  handleFaceRoast
};
