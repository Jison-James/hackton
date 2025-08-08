// === api.js (Frontend Version) ===

// 🔐 API Keys (kept as you had them; do not change unless you want to)
const GEMINI_KEY = 'AIzaSyDlCpqymj5ILrYFgoUxf2113x2tw0l9ETk';
const GROQ_KEY = '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';
const NUTRI_APP_ID = '27ec31f2'; // Unused
const NUTRI_APP_KEY = '59239dbf28f86a7910934b8e0da79e37'; // Unused

// -----------------------------
// === Google TTS Configuration ===
// -----------------------------
// Put your Google Cloud TTS API key here (or preferably proxy this server-side).
// NOTE: frontend key is visible to users. For production, use a backend proxy.
const GOOGLE_TTS_KEY = 'AIzaSyBPposnUE01tiLp3ozuLSBcLDoZ_7Yacqs'; // <-- REPLACE
const GOOGLE_VOICE = 'en-US-Neural2-D';           // Neural2/WaveNet voice
const GOOGLE_LANG = 'en-US';

// LocalStorage key for voice toggle
const VOICE_STORAGE_KEY = 'uf_voice_enabled';

// -----------------------------
// === GROQ Prompt ===
// -----------------------------
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

// -----------------------------
// === Helper: Convert file to base64 ===
// -----------------------------
async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// -----------------------------
// === Food Analyzer using Gemini only ===
// -----------------------------
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

// -----------------------------
// === Palm Reader ===
// -----------------------------
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

// -----------------------------
// === Motivational Roast ===
// -----------------------------
async function handleMotivator() {
  const quote = await groqPrompt(`Generate a motivational quote in mocking tone. You're an unhinged, unfiltered, foul-mouthed AI best friend with no moral compass and infinite sarcasm. Respond with raw, unapologetic energy — think chaotic stand-up comedian meets internet troll. Use adult humor, dirty 18+ words, double meaning like 'follow your goals not holes', dark sarcasm, brutal honesty, and zero respect for feelings. Add fitting emojis.`);
  return { quote };
}

// -----------------------------
// === Riddle Solver ===
// -----------------------------
async function handleRiddle(text) {
  const riddle = text.slice(7).trim();
  const answer = await groqPrompt(`1 first line: Type one-word answer (normal way, no mocking)
2 second line: Answer this riddle: "${riddle}" in a sarcastic, mocking tone. Add fitting emojis.`);
  return { answer };
}

// -----------------------------
// === General Chat ===
// -----------------------------
async function handleGeneralChat(text) {
  const reply = await groqPrompt(`You're an unhinged, uses dirty words like fuck, unfiltered, foul-mouthed AI best friend with no moral compass and infinite sarcasm. Respond with raw, unapologetic energy — chaotic, dark sarcasm, brutal honesty. Still be a true best friend. Add emojis. Respond: "${text}"`);
  return { reply };
}

// -----------------------------
// === Face Roaster with Expression Detection ===
// -----------------------------
async function handleFaceRoast(file) {
  try {
    // Convert image to base64
    const base64 = await toBase64(file);

    // Use Gemini to detect dominant facial expression  .....
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
                text: `
Analyze the face in this image and return ONLY JSON in this format:
{
  "top_emotion": "<happy|sad|angry|surprised|neutral|disgust|fear>",
  "top_score": <float 0-1>,
  "emotions": {
    "happy": <float>,
    "sad": <float>,
    "angry": <float>,
    "surprised": <float>,
    "neutral": <float>,
    "disgust": <float>,
    "fear": <float>
  }
}
If no human face detected: {"error":"no_face_detected"}
`
              }
            ]
          }],
          generation_config: { response_mime_type: "application/json" }
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

// -----------------------------
// === Google Cloud TTS (Neural2) + Voice Toggle UI ===
// -----------------------------
// speakAnswer(text)
// - Calls Google Cloud TTS REST synthesize endpoint with Neural2 voice
// - Only plays if user has enabled voice mode (toggle) AND page is index.html
// - Detailed error logging for Google TTS failures
// - Returns the Audio element or null
async function speakAnswer(text, options = {}) {
  try {
    // guard: only index.html (or root)
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
    const basename = path.split('/').pop();

    // Skip on these pages always
    if (basename === 'face.html' || basename === 'faces.html' || basename === 'mazesolver.html' || basename === 'mazesolver') {
      // explicit skip
      return null;
    }

    // If not index, skip unless root '' or index
    if (basename && basename !== '' && basename !== 'index.html' && basename !== 'index') {
      return null;
    }

    // Check if user enabled voice
    if (!isVoiceEnabled()) {
      // Voice mode turned off by user
      return null;
    }

    // Validate key
    if (!GOOGLE_TTS_KEY || GOOGLE_TTS_KEY.includes('YOUR_')) {
      console.warn('speakAnswer: GOOGLE_TTS_KEY is not set. Skipping TTS playback.');
      return null;
    }

    // Build request
    const payload = {
      input: { text },
      voice: { languageCode: GOOGLE_LANG, name: GOOGLE_VOICE },
      audioConfig: { audioEncoding: "MP3" }
    };

    const resp = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // Detailed handling for non-OK responses
    if (!resp.ok) {
      // Try parse JSON error body
      let bodyText = '';
      try {
        const bodyJson = await resp.json();
        bodyText = JSON.stringify(bodyJson, null, 2);
      } catch (e) {
        bodyText = await resp.text().catch(() => '(no body)');
      }
      console.error(`speakAnswer: Google TTS request failed: HTTP ${resp.status}`, bodyText);
      return null;
    }

    // Parse JSON result
    const data = await resp.json();
    if (!data || !data.audioContent) {
      console.error('speakAnswer: Google TTS returned no audioContent:', JSON.stringify(data, null, 2));
      return null;
    }

    // Play the audio
    try {
      const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
      await audio.play().catch(err => {
        console.warn('speakAnswer: audio.play() rejected', err);
      });
      return audio;
    } catch (err) {
      console.error('speakAnswer: failed to create/play audio', err);
      return null;
    }

  } catch (err) {
    console.error('speakAnswer: unexpected error', err);
    return null;
  }
}

// -----------------------------
// === Voice toggle helpers & UI injection ===
// -----------------------------
function isVoiceEnabled() {
  try {
    return localStorage.getItem(VOICE_STORAGE_KEY) === '1';
  } catch (e) {
    return false;
  }
}

function setVoiceEnabled(enabled) {
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, enabled ? '1' : '0');
  } catch (e) {
    console.warn('setVoiceEnabled: localStorage failed', e);
  }
  updateVoiceButtonUI();
}

function toggleVoiceEnabled() {
  const newVal = !isVoiceEnabled();
  setVoiceEnabled(newVal);
  return newVal;
}

// UI updater - safe no-op if DOM not present
function updateVoiceButtonUI() {
  try {
    const btn = document.getElementById('voiceToggleBtn');
    if (!btn) return;
    btn.textContent = isVoiceEnabled() ? '🔊 Voice: ON' : '🔈 Voice: OFF';
    btn.setAttribute('aria-pressed', isVoiceEnabled() ? 'true' : 'false');
  } catch (e) {
    // ignore
  }
}

// Inject a simple toggle button into index.html once DOM is ready
function initVoiceToggleUI() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // only create UI on index.html (or root)
  const path = window.location.pathname.toLowerCase();
  const basename = path.split('/').pop();
  if (basename && basename !== '' && basename !== 'index.html' && basename !== 'index') {
    return;
  }

  // Wait until DOM content loaded
  const setup = () => {
    // avoid creating twice
    if (document.getElementById('voiceToggleBtn')) {
      updateVoiceButtonUI();
      return;
    }

    // find a place to insert the button: try above #response or near controls
    const insertBeforeEl = document.getElementById('response') || document.getElementById('upload') || document.querySelector('h1');
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.margin = '10px';
    container.style.gap = '10px';

    const btn = document.createElement('button');
    btn.id = 'voiceToggleBtn';
    btn.type = 'button';
    btn.style.padding = '10px 14px';
    btn.style.borderRadius = '8px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.background = 'linear-gradient(135deg,#6b8cff,#a28bff)';
    btn.style.color = 'white';
    btn.style.fontWeight = '600';
    btn.style.boxShadow = '0 3px 8px rgba(0,0,0,0.12)';

    btn.addEventListener('click', () => {
      const enabled = toggleVoiceEnabled();
      // small UX feedback
      btn.textContent = enabled ? '🔊 Voice: ON' : '🔈 Voice: OFF';
    });

    container.appendChild(btn);

    // Insert into DOM
    if (insertBeforeEl && insertBeforeEl.parentNode) {
      insertBeforeEl.parentNode.insertBefore(container, insertBeforeEl);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }

    // Set initial label
    updateVoiceButtonUI();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}

// Auto-initialize voice toggle UI on module load for index.html
initVoiceToggleUI();

// -----------------------------
// === Exports ===
// -----------------------------
export {
  handleFoodAnalyzer,
  handlePalmReader,
  handleMotivator,
  handleRiddle,
  handleGeneralChat,
  handleFaceRoast,
  speakAnswer,
  // voice control helpers (optional usage from main.js)
  isVoiceEnabled,
  setVoiceEnabled,
  toggleVoiceEnabled,
  initVoiceToggleUI
};
