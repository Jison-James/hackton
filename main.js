// 📦 Import all handlers + TTS from api.js
import {
  handleFoodAnalyzer,
  handlePalmReader,
  handleMotivator,
  handleRiddle,
  handleGeneralChat,
  handleFaceRoast,
  speakAnswer
} from './api.js';

// ⚡ Main trigger for all buttons
window.trigger = async function (type) {
  const file = document.getElementById("upload").files[0];
  const userText = document.getElementById("userText").value.trim();
  const responseEl = document.getElementById("response");

  responseEl.innerText = "Thinking... 🤔";

  try {
    let result;

    switch (type) {
      case "food":
        if (!file) {
          responseEl.innerText = "Upload a food image first! 🍱";
          return;
        }
        result = await handleFoodAnalyzer(file);
        break;

      case "face":
        if (!file) {
          responseEl.innerText = "Upload a face image first! 🧑";
          return;
        }
        result = await handleFaceRoast(file);
        console.log("Expression:", result.expression);
        console.log("Roast:", result.insult);
        break;

      case "maze":
        window.location.href = "MazeSolver.html";
        return;

      case "palm":
        if (!file) {
          responseEl.innerText = "Upload a palm image first! 🖐️";
          return;
        }
        result = await handlePalmReader(file);
        break;

      case "motivate":
        result = await handleMotivator();
        break;

      case "riddle":
        let riddleInput = userText;
        if (!riddleInput.toLowerCase().startsWith("riddle:")) {
          riddleInput = "riddle: " + riddleInput;
        }
        result = await handleRiddle(riddleInput);
        break;

      case "chat":
        if (!userText) {
          responseEl.innerText = "Type something dumb to chat 🤖";
          return;
        }
        result = await handleGeneralChat(userText);
        break;

      default:
        responseEl.innerText = "⚠️ Unknown action.";
        return;
    }

    // 🧠 Format and display result
    const text =
      result.roast ||
      result.insult ||
      result.answer ||
      result.prediction ||
      result.quote ||
      result.reply ||
      result.commentary ||
      "🤔 Nothing to say.";

    const emojiMap = {
      'rolls eyes': '🙄',
      'shrugs': '🤷',
      'facepalm': '🤦',
      '(pausing dramatically)': '😳',
      '(gazing intensely)': '🫣🔮',
      '(tapping on your palm)': '👉🖐️',
      '(pointing to a random spot)': '👉❓',
      '(leaning in closer)': '🤫',
      '(waving my hand mysteriously)': '🫴✨',
      '(shuddering)': '😨',
      '(tasting the air)': '👃👅',
      '(shaking my head)': '😔👎',
      '(pounding my fist on the table)': '✊💥',
      '(motions to a waiting client)': '🧙‍♂️➡️🧍',
      '(winking)': '😉'
    };

    const formattedText = text.replace(/\*(.*?)\*/g, (_, action) =>
      emojiMap[action.toLowerCase()] || `<em>${action}</em>`
    );

    responseEl.innerHTML = formattedText;

    // 🔊 Play voice (only if Voice Mode is ON in api.js)
    speakAnswer(text).catch(err => {
      console.warn("TTS playback error:", err);
    });

  } catch (err) {
    console.error("🔥 Frontend Error:", err);
    responseEl.innerText = "💥 Something broke. Try again later.";
  }
};
