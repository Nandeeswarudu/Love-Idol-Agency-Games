const levelsData = [
  {
    id: 1,
    clue: "I'm the beginning",
    hint: "You're looking at me",
    answer: "URL",
  },
  {
    id: 2,
    clue: "Soft and bubbly",
    hint: "Something to have in a hot summer",
    answer: "SODA",
  },
  {
    id: 3,
    clue: "Companions are good to have",
    hint: "Companion",
    answer: "RIKKA",
  },
  {
    id: 4,
    clue: "Not all are equal",
    hint: "Some stand above the rest",
    answer: "RARE",
  },
  {
    id: 5,
    clue: "I'm the end",
    hint: "The last digit",
    answer: "1500",
  },
];

const levelsHost = document.getElementById("levels");
const phaseOne = document.getElementById("phaseOne");
const phaseTwo = document.getElementById("phaseTwo");
const encodedInput = document.getElementById("encodedInput");
const decodeBtn = document.getElementById("decodeBtn");
const attemptFeedback = document.getElementById("attemptFeedback");
const successPanel = document.getElementById("successPanel");
const finalResult = document.getElementById("finalResult");
const hintPopup = document.getElementById("hintPopup");
const hintDialogueText = document.getElementById("hintDialogueText");
const hintCloseBtn = document.getElementById("hintCloseBtn");

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
    hintToggle.textContent = "Show Hint";
  }
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
    <p class="progress-line">Progress: Level ${level.id} of ${levelsData.length}</p>
    <div class="level-head">
      <h3>Level ${level.id}</h3>
      <span class="pill active">Active</span>
    </div>
    <p class="question-line"><strong>Question:</strong> ${level.clue}</p>
    <div class="answer-row">
      <input class="answer-input" id="answer-${level.id}" type="text" placeholder="Enter answer" autocomplete="off" />
      <button class="check-btn" id="check-${level.id}" type="button">Check</button>
    </div>
    <div class="hint-row">
      <button class="hint-toggle-btn" id="hint-toggle-${level.id}" type="button">Show Hint</button>
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
    feedback.textContent = "Correct. Level cleared.";
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

  feedback.textContent = "Not correct yet. Check the clue and hint, then try again.";
  feedback.classList.remove("ok");
}

function runDecryption() {
  if (!allSolved()) {
    return;
  }

  const attempt = normalize(encodedInput.value);
  if (!attempt) {
    attemptFeedback.textContent = "Enter encoded text first.";
    attemptFeedback.classList.remove("ok");
    successPanel.classList.add("hidden");
    return;
  }

  const shift = Number(solvedAnswers[5]) % 26;
  const shifted = caesarShift(attempt, -shift);
  const targetPlain = "THECAFEISOPEN";

  if (shifted === targetPlain) {
    finalResult.textContent = "Congratulations on finding the hidden message: THE CAFE IS OPEN";
    attemptFeedback.textContent = "Correct.";
    attemptFeedback.classList.add("ok");
    successPanel.classList.remove("hidden");
    return;
  }

  attemptFeedback.textContent = "Wrong, try again.";
  attemptFeedback.classList.remove("ok");
  successPanel.classList.add("hidden");
}

decodeBtn.addEventListener("click", runDecryption);
hintCloseBtn.addEventListener("click", closeHintPopup);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && hintPopup.classList.contains("show")) {
    closeHintPopup();
  }
});
encodedInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    runDecryption();
  }
});

renderLevels();
