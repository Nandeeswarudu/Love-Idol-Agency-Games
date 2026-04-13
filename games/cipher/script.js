if ((window.location.protocol === "http:" || window.location.protocol === "https:")
  && window.location.pathname.endsWith("/index.html")) {
  const cleanedPath = window.location.pathname.replace(/index\.html$/, "");
  window.history.replaceState({}, "", `${cleanedPath}${window.location.search}${window.location.hash}`);
}

const levelsData = [
  {
    id: 1,
    clue: "The very first key is where your journey began.",
    hint: "Use the full domain shown in your browser for this project. No https:// and no extra slash.",
    answer: "love-idol-agency-games.vercel.app",
  },
  {
    id: 2,
    clue: "In summer heat, this fizzy companion comes in a can with a hiss.",
    hint: "A four-letter sparkling drink.",
    answer: "SODA",
  },
  {
    id: 3,
    clue: "A funny and trusted companion dances on her shoulder.",
    hint: "This companion is tied to Guns & Roses lore. It is a five-letter name: R _ _ _ _.",
    answer: "RIKKA",
  },
  {
    id: 4,
    clue: "Not every drop has equal value. What tier rises above common?",
    hint: "A four-letter rarity rank often seen in games and collectibles.",
    answer: "RARE",
  },
  {
    id: 5,
    clue: "The final lock is a number and is the last digit.",
    hint: "It is four digits and ends with 00. This number powers the final shift.",
    answer: "1500",
  },
];

const levelsHost = document.getElementById("levels");
const phaseOne = document.getElementById("phaseOne");
const phaseTwo = document.getElementById("phaseTwo");
const encodedInput = document.getElementById("encodedInput");
const decodeBtn = document.getElementById("decodeBtn");
const attemptFeedback = document.getElementById("attemptFeedback");
const hintPopup = document.getElementById("hintPopup");
const hintDialogueText = document.getElementById("hintDialogueText");
const hintCloseBtn = document.getElementById("hintCloseBtn");
const successPopup = document.getElementById("successPopup");
const successMessageText = document.getElementById("successMessageText");

const solvedAnswers = {};
let unlockedLevel = 1;
let isTransitioning = false;
let hintTypewriterTimer = null;

function normalize(value) {
  return value.trim().toUpperCase();
}

function runHintTypewriter(text) {
  if (hintTypewriterTimer) {
    window.clearInterval(hintTypewriterTimer);
    hintTypewriterTimer = null;
  }

  hintDialogueText.textContent = "";
  let cursor = 0;
  hintTypewriterTimer = window.setInterval(() => {
    hintDialogueText.textContent += text[cursor];
    cursor += 1;
    if (cursor >= text.length) {
      window.clearInterval(hintTypewriterTimer);
      hintTypewriterTimer = null;
    }
  }, 24);
}

function closeHintPopup() {
  if (hintTypewriterTimer) {
    window.clearInterval(hintTypewriterTimer);
    hintTypewriterTimer = null;
  }
  hintPopup.classList.remove("show");
  hintPopup.setAttribute("aria-hidden", "true");
  const hintToggle = document.querySelector(".hint-toggle-btn");
  if (hintToggle) {
    hintToggle.textContent = "Invoke Hint";
  }
}

function closeSuccessPopup() {
  successPopup.classList.remove("show");
  successPopup.setAttribute("aria-hidden", "true");
}

function openSuccessPopup(message) {
  successMessageText.textContent = message;
  successPopup.classList.add("show");
  successPopup.setAttribute("aria-hidden", "false");
}

function openHintPopup(level) {
  runHintTypewriter(level.hint);
  hintPopup.classList.add("show");
  hintPopup.setAttribute("aria-hidden", "false");
  const hintToggle = document.querySelector(".hint-toggle-btn");
  if (hintToggle) {
    hintToggle.textContent = "Hide Hint";
  }
}

function caesarShift(text, shift) {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + shift + 26) % 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + shift + 26) % 26) + 97);
      }
      return char;
    })
    .join("");
}

function allSolved() {
  return Object.keys(solvedAnswers).length === levelsData.length;
}

function updatePhaseTwo() {
  if (!allSolved()) {
    phaseOne.classList.remove("hidden");
    phaseTwo.classList.add("hidden");
    return;
  }

  closeHintPopup();
  closeSuccessPopup();
  phaseOne.classList.add("hidden");
  phaseTwo.classList.remove("hidden");
  encodedInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderLevels() {
  levelsHost.innerHTML = "";

  if (unlockedLevel > levelsData.length) {
    levelsHost.innerHTML = "";
    return;
  }

  const level = levelsData[unlockedLevel - 1];
  const card = document.createElement("article");
  card.className = "level-card";

  card.innerHTML = `
    <p class="progress-line">Cipher Sequence: ${level.id} / ${levelsData.length}</p>
    <div class="level-head">
      <h3>Node ${level.id}</h3>
      <span class="pill active">Active</span>
    </div>
    <p class="question-line"><strong>Prompt:</strong> ${level.clue}</p>
    <div class="answer-row">
      <input class="answer-input" id="answer-${level.id}" type="text" placeholder="Enter key fragment..." autocomplete="off" />
      <button class="check-btn" id="check-${level.id}" type="button">Decrypt</button>
    </div>
    <div class="hint-row">
      <button class="hint-toggle-btn" id="hint-toggle-${level.id}" type="button">Invoke Hint</button>
    </div>
    <p class="feedback" id="feedback-${level.id}"></p>
  `;

  levelsHost.appendChild(card);

  const button = document.getElementById(`check-${level.id}`);
  const input = document.getElementById(`answer-${level.id}`);
  const hintToggle = document.getElementById(`hint-toggle-${level.id}`);
  button.addEventListener("click", () => checkLevel(level));
  hintToggle.addEventListener("click", () => {
    if (hintPopup.classList.contains("show")) {
      closeHintPopup();
      return;
    }
    openHintPopup(level);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkLevel(level);
    }
  });
  input.focus();
}

function checkLevel(level) {
  if (level.id !== unlockedLevel || isTransitioning) {
    return;
  }

  const input = document.getElementById(`answer-${level.id}`);
  const feedback = document.getElementById(`feedback-${level.id}`);
  const attempt = normalize(input.value);

  if (attempt === normalize(level.answer)) {
    solvedAnswers[level.id] = normalize(level.answer);
    feedback.textContent = "Key fragment accepted. Node unlocked.";
    feedback.classList.add("ok");
    isTransitioning = true;
    window.setTimeout(() => {
      unlockedLevel += 1;
      isTransitioning = false;
      renderLevels();
      updatePhaseTwo();
    }, 700);
    return;
  }

  feedback.textContent = "Mismatch detected. Re-check the prompt and hint.";
  feedback.classList.remove("ok");
}

function runDecryption() {
  if (!allSolved()) {
    return;
  }

  const attempt = normalize(encodedInput.value);
  if (!attempt) {
    attemptFeedback.textContent = "No input detected. Enter an encrypted sequence.";
    attemptFeedback.classList.remove("ok");
    closeSuccessPopup();
    return;
  }

  const shift = Number(solvedAnswers[5]) % 26;
  const shifted = caesarShift(attempt, -shift);
  const targetPlain = "THECAFEISOPEN";

  if (shifted === targetPlain) {
    const winMessage = "Congratulations on finding the hidden message: THE CAFE IS OPEN";
    attemptFeedback.textContent = "Verification successful.";
    attemptFeedback.classList.add("ok");
    openSuccessPopup(winMessage);
    return;
  }

  attemptFeedback.textContent = "Verification failed. Wrong sequence, try again.";
  attemptFeedback.classList.remove("ok");
  closeSuccessPopup();
}

decodeBtn.addEventListener("click", runDecryption);
hintCloseBtn.addEventListener("click", closeHintPopup);
successPopup.addEventListener("click", (event) => {
  if (event.target === successPopup) {
    closeSuccessPopup();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (hintPopup.classList.contains("show")) {
      closeHintPopup();
    }
    if (successPopup.classList.contains("show")) {
      closeSuccessPopup();
    }
  }
});
encodedInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    runDecryption();
  }
});

renderLevels();
