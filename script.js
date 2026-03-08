// ================================================
//  WORDQUEST 11+ — script.js
// ================================================

// ================================================
// SECTION 1: APP STATE
// ================================================
const state = {
  currentScreen: 'dashboard',
  selectedDifficulty: 'easy',
  currentStory: null,
  currentDefinitions: {},
  quizWords: [],
  quizIndex: 0,
  quizStep: 1,
  quizCorrect: 0,
  quizTotal: 0,
  vocabFilter: 'all',
  reviewMode: false,
};

// ================================================
// SECTION 2: VOCABULARY DATABASE
// ================================================
const DEFAULT_VOCAB = [
  // Easy
  { word: "benevolent",   difficulty: "easy" },
  { word: "diligent",     difficulty: "easy" },
  { word: "exultant",     difficulty: "easy" },
  { word: "resolute",     difficulty: "easy" },
  { word: "empathetic",   difficulty: "easy" },
  { word: "astute",       difficulty: "easy" },
  { word: "prudent",      difficulty: "easy" },
  { word: "eloquent",     difficulty: "easy" },
  { word: "tenacious",    difficulty: "easy" },
  { word: "vivacious",    difficulty: "easy" },
  { word: "inquisitive",  difficulty: "easy" },
  { word: "whimsical",    difficulty: "easy" },
  { word: "audacious",    difficulty: "easy" },
  { word: "candid",       difficulty: "easy" },
  { word: "jubilant",     difficulty: "easy" },
  { word: "serene",       difficulty: "easy" },
  { word: "voracious",    difficulty: "easy" },
  { word: "meticulous",   difficulty: "easy" },
  { word: "tranquil",     difficulty: "easy" },
  { word: "buoyant",      difficulty: "easy" },
  // Hard
  { word: "aberration",      difficulty: "hard" },
  { word: "circumspect",     difficulty: "hard" },
  { word: "conspicuous",     difficulty: "hard" },
  { word: "fastidious",      difficulty: "hard" },
  { word: "idiosyncratic",   difficulty: "hard" },
  { word: "juxtaposition",   difficulty: "hard" },
  { word: "nefarious",       difficulty: "hard" },
  { word: "ostentatious",    difficulty: "hard" },
  { word: "perspicacious",   difficulty: "hard" },
  { word: "sycophantic",     difficulty: "hard" },
  { word: "supercilious",    difficulty: "hard" },
  { word: "magnanimous",     difficulty: "hard" },
  { word: "loquacious",      difficulty: "hard" },
  { word: "obsequious",      difficulty: "hard" },
  { word: "perfidious",      difficulty: "hard" },
  { word: "vociferous",      difficulty: "hard" },
  { word: "ingenuous",       difficulty: "hard" },
  { word: "recalcitrant",    difficulty: "hard" },
  { word: "intransigent",    difficulty: "hard" },
  { word: "truculent",       difficulty: "hard" },
  // Extreme
  { word: "sesquipedalian",   difficulty: "extreme" },
  { word: "grandiloquent",    difficulty: "extreme" },
  { word: "pusillanimous",    difficulty: "extreme" },
  { word: "verisimilitude",   difficulty: "extreme" },
  { word: "perspicacity",     difficulty: "extreme" },
  { word: "nugatory",         difficulty: "extreme" },
  { word: "apotheosis",       difficulty: "extreme" },
  { word: "phantasmagorical", difficulty: "extreme" },
  { word: "consanguineous",   difficulty: "extreme" },
  { word: "floccinaucinihilipilification", difficulty: "extreme" },
  { word: "antediluvian",     difficulty: "extreme" },
  { word: "ebullient",        difficulty: "extreme" },
  { word: "mellifluous",      difficulty: "extreme" },
  { word: "sanguine",         difficulty: "extreme" },
  { word: "ineffable",        difficulty: "extreme" },
  { word: "recondite",        difficulty: "extreme" },
  { word: "abstruse",         difficulty: "extreme" },
  { word: "esoteric",         difficulty: "extreme" },
  { word: "inscrutable",      difficulty: "extreme" },
  { word: "lugubrious",       difficulty: "extreme" },
];

// ================================================
// SECTION 3: LOCAL STORAGE
// ================================================
function loadVocab() {
  const saved = localStorage.getItem('wq_vocab');
  if (saved) return JSON.parse(saved);
  const initial = DEFAULT_VOCAB.map(v => ({
    ...v,
    reviewLevel: 0,
    nextReviewDate: todayStr(),
    timesCorrect: 0,
    timesWrong: 0,
    addedDate: todayStr(),
  }));
  saveVocab(initial);
  return initial;
}
function saveVocab(vocab) { localStorage.setItem('wq_vocab', JSON.stringify(vocab)); }

function loadProgress() {
  const saved = localStorage.getItem('wq_progress');
  if (saved) return JSON.parse(saved);
  return {
    xp: 0, streak: 0, storiesCompleted: 0, wordsLearned: 0,
    quizzesCompleted: 0, totalQuestions: 0, correctAnswers: 0,
    lastActiveDate: todayStr(), apiKey: '', activity: {},
  };
}
function saveProgress(p) { localStorage.setItem('wq_progress', JSON.stringify(p)); }

let vocab = loadVocab();
let progress = loadProgress();

function todayStr() { return new Date().toISOString().split('T')[0]; }

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// ================================================
// SECTION 4: STREAK & XP
// ================================================
function updateStreak() {
  const today = todayStr();
  const last = progress.lastActiveDate;
  if (last === today) return;
  const diff = (new Date(today) - new Date(last)) / 86400000;
  if (diff === 1) {
    progress.streak += 1;
  } else if (diff > 1) {
    progress.streak = 1;
  }
  progress.lastActiveDate = today;
  progress.activity[today] = (progress.activity[today] || 0) + 1;
  saveProgress(progress);
}
function awardXP(amount) {
  progress.xp += amount;
  progress.activity[todayStr()] = (progress.activity[todayStr()] || 0) + 1;
  saveProgress(progress);
  updateNavBar();
  // floating xp animation
  const pill = document.getElementById('xpPill');
  pill.style.transform = 'scale(1.4)';
  setTimeout(() => { pill.style.transform = 'scale(1)'; }, 300);
}

// ================================================
// SECTION 5: NAV BAR UPDATE
// ================================================
function updateNavBar() {
  document.getElementById('streakVal').textContent = progress.streak;
  document.getElementById('xpVal').textContent = progress.xp;
  const learned = vocab.filter(v => v.reviewLevel >= 3).length;
  progress.wordsLearned = learned;
  document.getElementById('wordsLearnedVal').textContent = learned;
  const pct = Math.min(100, (progress.xp % 500) / 5);
  document.getElementById('navProgressFill').style.width = pct + '%';
}

// ================================================
// SECTION 6: SCREEN SWITCHING
// ================================================
function switchScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.querySelectorAll('.bottom-nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === name);
  });
  state.currentScreen = name;
  if (name === 'dashboard') renderDashboard();
  if (name === 'vocab') renderVocabList();
  if (name === 'stats') renderStats();
  if (name === 'generate') previewSelectedWords();
}

// ================================================
// SECTION 7: DASHBOARD RENDERING
// ================================================
function renderDashboard() {
  const today = todayStr();
  const due = vocab.filter(v => v.nextReviewDate <= today);
  const badge = document.getElementById('reviewBadge');
  if (due.length > 0) {
    badge.style.display = 'flex';
    badge.textContent = due.length;
  } else {
    badge.style.display = 'none';
  }
  const container = document.getElementById('dueWordsList');
  if (due.length === 0) {
    container.innerHTML = '<p style="color:var(--mid);font-size:0.88rem;font-weight:600">🎉 All caught up! No words due today.</p>';
  } else {
    container.innerHTML = due.slice(0, 8).map(v =>
      `<div class="due-word-chip" onclick="showWordPopup('${v.word}')">${v.word}</div>`
    ).join('');
  }

  const achievements = [];
  if (progress.xp >= 100)  achievements.push({ icon: '⭐', label: '100 XP' });
  if (progress.xp >= 500)  achievements.push({ icon: '🌟', label: '500 XP' });
  if (progress.streak >= 3) achievements.push({ icon: '🔥', label: `${progress.streak} day streak` });
  if (progress.storiesCompleted >= 1) achievements.push({ icon: '📖', label: 'First Story' });
  if (progress.wordsLearned >= 5)    achievements.push({ icon: '🏅', label: '5 Words Mastered' });
  if (progress.quizzesCompleted >= 1) achievements.push({ icon: '🎯', label: 'First Quiz' });
  const ach = document.getElementById('achievementsList');
  ach.innerHTML = achievements.length
    ? achievements.map(a => `<div class="achievement-badge">${a.icon} ${a.label}</div>`).join('')
    : '<p style="color:var(--mid);font-size:0.88rem;font-weight:600">Complete stories and quizzes to earn achievements!</p>';
}

// ================================================
// SECTION 8: DIFFICULTY SELECTION
// ================================================
function selectDifficulty(diff) {
  state.selectedDifficulty = diff;
  document.querySelectorAll('.diff-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.diff === diff);
  });
  previewSelectedWords();
}

function previewSelectedWords() {
  const pool = vocab.filter(v => v.difficulty === state.selectedDifficulty);
  const sample = shuffleArray([...pool]).slice(0, 10);
  const container = document.getElementById('selectedWordsPreview');
  container.innerHTML = sample.map(v => `<div class="preview-chip">${v.word}</div>`).join('');
}

// ================================================
// SECTION 9: API KEY MANAGEMENT
// ================================================
function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) return;
  progress.apiKey = key;
  saveProgress(progress);
  document.getElementById('apiKeyCard').style.opacity = '0.6';
  document.getElementById('apiKeyInput').value = '••••••••' + key.slice(-4);
}
function getApiKey() { return progress.apiKey || document.getElementById('apiKeyInput').value.trim(); }

// ================================================
// SECTION 10: STORY GENERATION (API CALL)
// ================================================
async function generateStory() {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.startsWith('PASTE')) {
    showError('Please enter your OpenAI API key above first.');
    return;
  }
  const pool = vocab.filter(v => v.difficulty === state.selectedDifficulty);
  if (pool.length < 5) {
    showError(`Not enough ${state.selectedDifficulty} words. Add more words or switch difficulty.`);
    return;
  }
  const chosen = shuffleArray([...pool]).slice(0, Math.min(10, pool.length));
  const wordList = chosen.map(v => v.word).join(', ');

  showLoading(true);
  hideError();

  const systemPrompt = `You are a creative children's story writer for ages 9-11. Always respond with valid JSON only.`;
  const userPrompt = `Write a creative, fun and adventurous story for a child aged 9-11.
The story MUST contain ALL of these vocabulary words: ${wordList}

Requirements:
- story length 300-500 words
- fun and adventurous tone
- wrap each vocabulary word EXACTLY like this: <span class="vocab-highlight" data-word="WORD">WORD</span>
- each word must appear at least once wrapped in that span

Also return definitions and example sentences for each word.

Respond ONLY with valid JSON in this exact format:
{
  "story": "...html story with wrapped vocabulary words...",
  "definitions": {
    "word": { "definition": "...", "example": "..." }
  }
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response from OpenAI.');

    // Parse JSON — strip markdown code fences if present
    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    state.currentStory = parsed.story;
    state.currentDefinitions = parsed.definitions || {};
    state.quizWords = chosen;

    progress.storiesCompleted += 1;
    saveProgress(progress);
    awardXP(20);

    showLoading(false);
    renderStory();
    switchScreen('story');

  } catch (e) {
    showLoading(false);
    showError(`Error: ${e.message}. Check your API key and try again.`);
  }
}

function showLoading(v) { document.getElementById('loadingSpinner').style.display = v ? 'block' : 'none'; }
function showError(msg) {
  const el = document.getElementById('errorMessage');
  el.style.display = 'block';
  el.textContent = '⚠️ ' + msg;
}
function hideError() { document.getElementById('errorMessage').style.display = 'none'; }

// ================================================
// SECTION 11: STORY RENDERING
// ================================================
function renderStory() {
  const storyEl = document.getElementById('storyContent');
  storyEl.innerHTML = state.currentStory;

  // Make vocab highlights interactive
  storyEl.querySelectorAll('.vocab-highlight').forEach(el => {
    el.addEventListener('click', () => showWordPopup(el.dataset.word));
  });

  // Word chips bar
  const chipsEl = document.getElementById('storyWordChips');
  chipsEl.innerHTML = state.quizWords.map(v =>
    `<div class="preview-chip" style="cursor:pointer" onclick="showWordPopup('${v.word}')">${v.word}</div>`
  ).join('');
}

// ================================================
// SECTION 12: WORD POPUP
// ================================================
function showWordPopup(word) {
  const def = state.currentDefinitions[word] || state.currentDefinitions[word.toLowerCase()] || {};
  const wordObj = vocab.find(v => v.word.toLowerCase() === word.toLowerCase());
  const diff = wordObj?.difficulty || 'easy';

  document.getElementById('popupWord').textContent = word;
  const badge = document.getElementById('popupDiff');
  badge.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
  badge.className = `popup-badge diff-${diff}`;

  document.getElementById('popupDef').textContent = def.definition || 'Definition not available. Check your dictionary!';
  document.getElementById('popupEx').textContent = def.example || '';

  const overlay = document.getElementById('popupOverlay');
  overlay.classList.add('open');
}
function closePopup() { document.getElementById('popupOverlay').classList.remove('open'); }

// ================================================
// SECTION 13: QUIZ SYSTEM
// ================================================
function startQuiz() {
  if (!state.quizWords || state.quizWords.length === 0) {
    alert('Generate a story first!');
    return;
  }
  state.quizIndex = 0;
  state.quizStep = 1;
  state.quizCorrect = 0;
  state.quizTotal = state.quizWords.length * 2; // 2 steps per word
  switchScreen('quiz');
  document.getElementById('quizComplete').style.display = 'none';
  document.getElementById('quizContainer').style.display = 'block';
  renderQuizStep();
}

function renderQuizStep() {
  const word = state.quizWords[state.quizIndex];
  updateQuizProgress();

  document.getElementById('quizStep1').style.display = 'none';
  document.getElementById('quizStep2').style.display = 'none';

  if (state.quizStep === 1) {
    document.getElementById('quizWord').textContent = word.word;
    document.getElementById('defInput').value = '';
    document.getElementById('defFeedback').style.display = 'none';
    document.getElementById('defSubmitBtn').disabled = false;
    document.getElementById('quizStep1').style.display = 'block';
  } else {
    document.getElementById('quizWord2').textContent = word.word;
    document.getElementById('sentInput').value = '';
    document.getElementById('sentFeedback').style.display = 'none';
    document.getElementById('sentSubmitBtn').disabled = false;
    document.getElementById('quizStep2').style.display = 'block';
  }
}

function updateQuizProgress() {
  const total = state.quizWords.length;
  const pct = (state.quizIndex / total) * 100;
  document.getElementById('quizProgressFill').style.width = pct + '%';
  document.getElementById('quizCounter').textContent = `${state.quizIndex + 1} / ${total}`;
}

function submitDefinition() {
  const word = state.quizWords[state.quizIndex];
  const input = document.getElementById('defInput').value.trim().toLowerCase();
  const def = (state.currentDefinitions[word.word]?.definition || '').toLowerCase();
  const feedback = document.getElementById('defFeedback');

  if (input.length < 3) {
    showFeedback(feedback, 'wrong', '✖ Please write a definition!');
    return;
  }

  const score = similarity(input, def);
  document.getElementById('defSubmitBtn').disabled = true;

  if (score > 0.45 || keyWordsMatch(input, def)) {
    showFeedback(feedback, 'correct', '✔ Great definition! Well done!');
    state.quizCorrect++;
    progress.correctAnswers++;
    awardXP(10);
    setTimeout(() => nextQuizStep(), 1200);
  } else if (score > 0.2 || input.length > 5) {
    showFeedback(feedback, 'almost', '⚠ Almost! ' + (def ? `The definition is: "${def}"` : 'Good try!'));
    progress.correctAnswers += 0.5;
    awardXP(5);
    setTimeout(() => nextQuizStep(), 2000);
  } else {
    showFeedback(feedback, 'wrong', '✖ Not quite. ' + (def ? `The definition is: "${def}"` : 'Try your best!'));
    setTimeout(() => nextQuizStep(), 2000);
  }
  progress.totalQuestions++;
  saveProgress(progress);
}

function submitSentence() {
  const word = state.quizWords[state.quizIndex];
  const input = document.getElementById('sentInput').value.trim().toLowerCase();
  const story = (state.currentStory || '').toLowerCase();
  const feedback = document.getElementById('sentFeedback');

  if (!input.includes(word.word.toLowerCase())) {
    showFeedback(feedback, 'wrong', `✖ Your sentence must include the word "${word.word}"!`);
    return;
  }
  if (input.length < 10) {
    showFeedback(feedback, 'wrong', '✖ Write a complete sentence please!');
    return;
  }

  document.getElementById('sentSubmitBtn').disabled = true;

  // Check not copied from story
  const storySnippet = extractSentenceWith(story, word.word.toLowerCase());
  const isCopied = storySnippet && similarity(input, storySnippet) > 0.7;

  if (isCopied) {
    showFeedback(feedback, 'almost', "⚠ Don't copy from the story! But good effort.");
    awardXP(3);
  } else {
    showFeedback(feedback, 'correct', '✔ Excellent sentence! You used the word perfectly!');
    state.quizCorrect++;
    progress.correctAnswers++;
    awardXP(15);
    updateSpacedRepetition(word.word);
  }
  progress.totalQuestions++;
  saveProgress(progress);
  setTimeout(() => nextQuizStep(), 1500);
}

function nextQuizStep() {
  if (state.quizStep === 1) {
    state.quizStep = 2;
    renderQuizStep();
  } else {
    state.quizIndex++;
    state.quizStep = 1;
    if (state.quizIndex >= state.quizWords.length) {
      finishQuiz();
    } else {
      renderQuizStep();
    }
  }
}

function finishQuiz() {
  progress.quizzesCompleted++;
  saveProgress(progress);
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('quizComplete').style.display = 'flex';
  document.getElementById('quizProgressFill').style.width = '100%';

  const score = state.quizCorrect;
  const total = state.quizWords.length * 2;
  const pct = Math.round((score / total) * 100);

  document.getElementById('completeEmoji').textContent = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';
  document.getElementById('completeScore').textContent = `You got ${score} / ${total} correct (${pct}%)`;
  document.getElementById('completeXP').textContent = `+${progress.xp} XP Total`;

  launchConfetti();
  updateNavBar();
}

function showFeedback(el, type, msg) {
  el.style.display = 'block';
  el.className = 'quiz-feedback feedback-' + type;
  el.textContent = msg;
}

// ================================================
// SECTION 14: SPACED REPETITION
// ================================================
const SRS_INTERVALS = [1, 3, 7, 14, 30];

function updateSpacedRepetition(wordStr) {
  const w = vocab.find(v => v.word === wordStr);
  if (!w) return;
  w.reviewLevel = Math.min((w.reviewLevel || 0) + 1, 5);
  w.timesCorrect = (w.timesCorrect || 0) + 1;
  const days = SRS_INTERVALS[w.reviewLevel - 1] || 30;
  w.nextReviewDate = addDays(todayStr(), days);
  saveVocab(vocab);
}

function startDailyReview() {
  const today = todayStr();
  const due = vocab.filter(v => v.nextReviewDate <= today);
  if (due.length === 0) {
    alert('🎉 No words due for review today! Come back tomorrow.');
    return;
  }
  state.quizWords = due.slice(0, 10);
  state.reviewMode = true;
  startQuiz();
}

// ================================================
// SECTION 15: VOCABULARY MANAGER
// ================================================
let currentFilter = 'all';

function filterVocab(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === f);
  });
  renderVocabList();
}

function renderVocabList() {
  const search = (document.getElementById('vocabSearch')?.value || '').toLowerCase();
  const list = vocab.filter(v => {
    const matchFilter = currentFilter === 'all' || v.difficulty === currentFilter;
    const matchSearch = v.word.toLowerCase().includes(search);
    return matchFilter && matchSearch;
  });

  const container = document.getElementById('vocabList');
  if (list.length === 0) {
    container.innerHTML = '<p style="color:var(--mid);font-weight:600;text-align:center;padding:2rem">No words found.</p>';
    return;
  }
  container.innerHTML = list.map((v, i) => `
    <div class="vocab-item">
      <div class="vocab-item-word">${v.word}</div>
      <div class="vocab-item-diff diff-${v.difficulty}">${v.difficulty}</div>
      <div class="vocab-item-level">Lvl ${v.reviewLevel || 0}</div>
      <button class="vocab-delete-btn" onclick="deleteWord('${v.word}')">🗑</button>
    </div>
  `).join('');
}

function deleteWord(wordStr) {
  if (!confirm(`Delete "${wordStr}"?`)) return;
  vocab = vocab.filter(v => v.word !== wordStr);
  saveVocab(vocab);
  renderVocabList();
}

function addCustomWord() {
  const input = document.getElementById('newWordInput');
  const diff = document.getElementById('newWordDiff').value;
  let word = input.value.trim().toLowerCase();
  if (!word) { alert('Please type a word!'); return; }

  if (vocab.find(v => v.word === word)) {
    alert(`"${word}" is already in your list!`);
    return;
  }
  vocab.push({
    word, difficulty: diff,
    reviewLevel: 0, nextReviewDate: todayStr(),
    timesCorrect: 0, timesWrong: 0, addedDate: todayStr(),
  });
  saveVocab(vocab);
  input.value = '';
  document.getElementById('autocorrectSuggestion').style.display = 'none';
  renderVocabList();
  awardXP(5);
}

// ================================================
// SECTION 16: AUTOCORRECT (LEVENSHTEIN)
// ================================================
function levenshteinDistance(s, t) {
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const arr = [];
  for (let i = 0; i <= t.length; i++) {
    arr[i] = [i];
    for (let j = 1; j <= s.length; j++) {
      arr[i][j] = i === 0 ? j : Math.min(
        arr[i - 1][j] + 1,
        arr[i][j - 1] + 1,
        arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
      );
    }
  }
  return arr[t.length][s.length];
}

// List of known correctly-spelled vocabulary words for autocorrect
const KNOWN_WORDS = DEFAULT_VOCAB.map(v => v.word);

function checkAutocorrect() {
  const input = document.getElementById('newWordInput').value.trim().toLowerCase();
  const suggestion = document.getElementById('autocorrectSuggestion');
  if (input.length < 4) { suggestion.style.display = 'none'; return; }

  // Skip if exact match exists
  if (KNOWN_WORDS.includes(input)) { suggestion.style.display = 'none'; return; }

  let best = null, bestDist = Infinity;
  for (const w of KNOWN_WORDS) {
    const d = levenshteinDistance(input, w);
    if (d < bestDist && d <= 3) { bestDist = d; best = w; }
  }
  if (best && best !== input) {
    suggestion.style.display = 'flex';
    suggestion.innerHTML = `💡 Did you mean <strong style="margin:0 4px">"${best}"</strong>?
      <button class="accept-btn" onclick="acceptSuggestion('${best}')">Use it</button>`;
  } else {
    suggestion.style.display = 'none';
  }
}

function acceptSuggestion(word) {
  document.getElementById('newWordInput').value = word;
  document.getElementById('autocorrectSuggestion').style.display = 'none';
}

// ================================================
// SECTION 17: STATISTICS
// ================================================
function renderStats() {
  document.getElementById('statStreak').textContent = progress.streak;
  document.getElementById('statXP').textContent = progress.xp;
  document.getElementById('statStories').textContent = progress.storiesCompleted;
  document.getElementById('statWords').textContent = progress.wordsLearned;
  const acc = progress.totalQuestions > 0
    ? Math.round((progress.correctAnswers / progress.totalQuestions) * 100) + '%'
    : '0%';
  document.getElementById('statAccuracy').textContent = acc;
  document.getElementById('statQuizzes').textContent = progress.quizzesCompleted;

  // Mastery breakdown
  const levels = [0,1,2,3,4,5];
  const levelLabels = ['New','Lvl 1','Lvl 2','Lvl 3','Lvl 4','Max'];
  const masteryEl = document.getElementById('masteryBreakdown');
  masteryEl.innerHTML = levels.map((l, i) => {
    const count = vocab.filter(v => (v.reviewLevel || 0) === l).length;
    const pct = vocab.length > 0 ? (count / vocab.length) * 100 : 0;
    return `<div class="mastery-row">
      <div class="mastery-label">${levelLabels[i]}</div>
      <div class="mastery-bar-track"><div class="mastery-bar-fill" style="width:${pct}%"></div></div>
      <div class="mastery-count">${count}</div>
    </div>`;
  }).join('');

  // Activity chart (last 7 days)
  const actEl = document.getElementById('activityChart');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  const maxAct = Math.max(1, ...days.map(d => progress.activity[d] || 0));
  actEl.innerHTML = days.map(d => {
    const acts = progress.activity[d] || 0;
    const h = Math.max(10, (acts / maxAct) * 80);
    const dayName = new Date(d).toLocaleDateString('en-GB', { weekday: 'short' });
    return `<div class="activity-bar-wrap">
      <div class="activity-bar ${acts > 0 ? 'has-activity' : ''}" style="height:${h}px"></div>
      <div class="activity-day">${dayName}</div>
    </div>`;
  }).join('');
}

// ================================================
// SECTION 18: CONFETTI
// ================================================
function launchConfetti() {
  const colors = ['#ff4fa3','#ff85c2','#ffe6f2','#ffdd00','#5fe6a0','#6eb5ff'];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.8}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

// ================================================
// SECTION 19: UTILITY FUNCTIONS
// ================================================
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

function keyWordsMatch(input, definition) {
  const stopWords = new Set(['a','an','the','is','are','was','were','be','to','of','in','that','it','with','as','for','on','by']);
  const defWords = definition.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
  const inputWords = input.split(/\W+/);
  let matches = 0;
  for (const dw of defWords) {
    if (inputWords.some(iw => similarity(iw, dw) > 0.8)) matches++;
  }
  return defWords.length > 0 && (matches / defWords.length) > 0.25;
}

function extractSentenceWith(text, word) {
  const sentences = text.split(/[.!?]/);
  return sentences.find(s => s.includes(word)) || '';
}

// ================================================
// SECTION 20: INITIALISATION
// ================================================
function init() {
  updateStreak();
  updateNavBar();
  renderDashboard();
  previewSelectedWords();

  // Restore API key display
  if (progress.apiKey) {
    const k = progress.apiKey;
    document.getElementById('apiKeyInput').value = '••••••••' + k.slice(-4);
    document.getElementById('apiKeyCard').style.opacity = '0.6';
  }
}

document.addEventListener('DOMContentLoaded', init);
