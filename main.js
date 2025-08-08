// 📦 Import all handlers from api.js
import {
  handleFoodAnalyzer,
  handlePalmReader,
  handleMotivator,
  handleRiddle,
  handleGeneralChat,
  handleFaceRoast
} from './api.js';

// 🎥 Camera control variables
let cameraStream = null;

// 📷 Start camera
window.startCamera = async function () {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const videoEl = document.getElementById("camera");
    videoEl.srcObject = cameraStream;
    videoEl.style.display = "block";

    document.getElementById("takePhotoBtn").style.display = "inline-block";
    document.getElementById("stopCameraBtn").style.display = "inline-block";
    document.getElementById("startCameraBtn").style.display = "none";
    document.getElementById("upload").style.display = "none"; // Hide file picker while camera is on
  } catch (err) {
    alert("⚠️ Unable to access camera. Please check permissions.");
    console.error(err);
  }
};

// 📸 Capture photo
window.takePhoto = function () {
  const videoEl = document.getElementById("camera");
  const canvas = document.getElementById("snapshotCanvas");
  const context = canvas.getContext("2d");

  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  context.drawImage(videoEl, 0, 0);

  canvas.toBlob((blob) => {
    const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });

    // Create DataTransfer to mimic file upload
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    document.getElementById("upload").files = dataTransfer.files;

    alert("✅ Photo captured! Now click a feature button.");
  }, "image/jpeg");
};

// ❌ Stop camera
window.stopCamera = function () {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
  }
  document.getElementById("camera").style.display = "none";
  document.getElementById("takePhotoBtn").style.display = "none";
  document.getElementById("stopCameraBtn").style.display = "none";
  document.getElementById("startCameraBtn").style.display = "inline-block";
  document.getElementById("upload").style.display = "inline-block"; // Show file picker again
};

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
          responseEl.innerText = "Upload or capture a food image first! 🍱";
          return;
        }
        result = await handleFoodAnalyzer(file);
        break;

      case "face":
        if (!file) {
          responseEl.innerText = "Upload or capture a face image first! 🧑";
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
          responseEl.innerText = "Upload or capture a palm image first! 🖐️";
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

  } catch (err) {
    console.error("🔥 Frontend Error:", err);
    responseEl.innerText = "💥 Something broke. Try again later.";
  }
};
