/**
 * Flashcard Mini-Site Application
 * Handles flashcard creation, storage, and quiz functionality
 */

// DOM Elements
const modeSwitcher = document.querySelector('.flashcard-app__mode-switcher');
const modeButtons = document.querySelectorAll('.flashcard-app__mode-btn');
const reviewContent = document.querySelector('.flashcard-app__content[data-mode="review"]');
const quizContent = document.querySelector('.flashcard-app__content[data-mode="quiz"]');
const wordInput = document.getElementById('word-input');
const definitionInput = document.getElementById('definition-input');
const addButton = document.getElementById('add-btn');
const flashcardsList = document.getElementById('flashcards-list');
const quizContainer = document.getElementById('quiz-container');
const themeToggle = document.getElementById('theme-toggle');
const langToggle = document.getElementById('lang-toggle');

// Language translations
const i18n = {
    en_US: {
        title: "Flashcard Mini-Site",
        reviewMode: "Review Mode",
        quizMode: "Quiz Mode",
        add: "Add",
        delete: "Delete",
        wordPlaceholder: "Word",
        definitionPlaceholder: "Definition",
        noFlashcards: "No flashcards yet. Add some to get started!",
        noQuizCards: "No flashcards available for quiz. Add some first!",
        correct: "Correct!",
        incorrect: "Incorrect. The correct answer is: ",
        quizComplete: "Quiz Complete!",
        score: "You scored {score} out of {total} ({percentage}%)",
        restartQuiz: "Restart Quiz",
        langToggle: "中文"
    },
    zh_TW: {
        title: "閃卡學習網站",
        reviewMode: "溫習模式",
        quizMode: "測驗模式",
        add: "新增",
        delete: "刪除",
        wordPlaceholder: "單字",
        definitionPlaceholder: "解釋",
        noFlashcards: "尚未添加閃卡，請新增一些閃卡開始學習！",
        noQuizCards: "沒有可用的閃卡進行測驗，請先新增閃卡！",
        correct: "正確！",
        incorrect: "錯誤。正確答案是：",
        quizComplete: "測驗完成！",
        score: "你的得分：{score}/{total} ({percentage}%)",
        restartQuiz: "重新測驗",
        langToggle: "English"
    }
};

// Application State
let currentMode = 'review';
let flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

/**
 * Initialize the application
 */
function init() {
    loadFlashcards();
    setupEventListeners();
    renderFlashcards();
    applySavedTheme();
    applySavedLanguage();
}

/**
 * Set up event listeners for UI interactions
 */
function setupEventListeners() {
    // Mode switching
    modeSwitcher.addEventListener('click', (e) => {
        if (e.target.classList.contains('flashcard-app__mode-btn')) {
            switchMode(e.target.dataset.mode);
        }
    });

    // Add new flashcard
    addButton.addEventListener('click', addFlashcard);
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addFlashcard();
    });
    definitionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addFlashcard();
    });

    // Delete flashcard (delegated)
    flashcardsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('flashcard-app__delete-btn')) {
            const cardId = e.target.closest('.flashcard-app__card').dataset.id;
            deleteFlashcard(cardId);
        }
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Language toggle
    langToggle.addEventListener('click', toggleLanguage);
}

/**
 * Switch between review and quiz modes
 * @param {string} mode - The mode to switch to ('review' or 'quiz')
 */
function switchMode(mode) {
    if (mode === currentMode) return;

    currentMode = mode;
    
    // Update active button
    modeButtons.forEach(btn => {
        btn.classList.toggle('flashcard-app__mode-btn--active', btn.dataset.mode === mode);
    });

    // Show/hide content
    if (mode === 'review') {
        reviewContent.classList.remove('flashcard-app__content--hidden');
        quizContent.classList.add('flashcard-app__content--hidden');
        renderFlashcards();
    } else {
        reviewContent.classList.add('flashcard-app__content--hidden');
        quizContent.classList.remove('flashcard-app__content--hidden');
        startQuiz();
    }
}

/**
 * Load flashcards from localStorage
 */
function loadFlashcards() {
    const storedFlashcards = localStorage.getItem('flashcards');
    if (storedFlashcards) {
        flashcards = JSON.parse(storedFlashcards);
    }
}

/**
 * Save flashcards to localStorage
 */
function saveFlashcards() {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
}

/**
 * Toggle between dark and light theme
 */
function toggleTheme() {
    const isDark = document.body.classList.toggle('theme-dark');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

/**
 * Apply saved theme preference
 */
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('theme-dark');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('theme-dark');
        themeToggle.textContent = '🌙';
    }
}

/**
 * Toggle between English and Chinese
 */
function toggleLanguage() {
    const currentLang = localStorage.getItem('lang') || 'en_US';
    const newLang = currentLang === 'en_US' ? 'zh_TW' : 'en_US';
    localStorage.setItem('lang', newLang);
    applyLanguage(newLang);
}

/**
 * Apply language to all UI elements
 */
function applyLanguage(lang = null) {
    const currentLang = lang || localStorage.getItem('lang') || 'en_US';
    const translations = i18n[currentLang];
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });

    // Update input placeholders
    wordInput.placeholder = translations.wordPlaceholder;
    definitionInput.placeholder = translations.definitionPlaceholder;

    // Update language toggle button
    langToggle.textContent = translations.langToggle;

    // Re-render flashcards to update any translated text
    renderFlashcards();
}

/**
 * Apply saved language preference
 */
function applySavedLanguage() {
    const savedLang = localStorage.getItem('lang') || 'en_US';
    applyLanguage(savedLang);
}

/**
 * Add a new flashcard
 */
function addFlashcard() {
    const word = wordInput.value.trim();
    const definition = definitionInput.value.trim();

    if (!word || !definition) return;

    const newFlashcard = {
        id: Date.now().toString(),
        word,
        definition
    };

    flashcards.push(newFlashcard);
    saveFlashcards();
    renderFlashcards();

    // Clear inputs
    wordInput.value = '';
    definitionInput.value = '';
    wordInput.focus();
}

/**
 * Delete a flashcard
 * @param {string} id - The ID of the flashcard to delete
 */
function deleteFlashcard(id) {
    flashcards = flashcards.filter(card => card.id !== id);
    saveFlashcards();
    renderFlashcards();
}

/**
 * Render all flashcards in review mode
 */
function renderFlashcards() {
    const currentLang = localStorage.getItem('lang') || 'en_US';
    const translations = i18n[currentLang];
    
    if (flashcards.length === 0) {
        flashcardsList.innerHTML = `<p class="flashcard-app__empty">${translations.noFlashcards}</p>`;
        return;
    }

    flashcardsList.innerHTML = flashcards.map(card => `
        <div class="flashcard-app__card" data-id="${card.id}">
            <button class="flashcard-app__delete-btn" aria-label="Delete flashcard">✕</button>
            <div class="flashcard-app__word">${card.word}</div>
            <div class="flashcard-app__definition">${card.definition}</div>
        </div>
    `).join('');
}

/**
 * Start a new quiz session
 */
function startQuiz() {
    const currentLang = localStorage.getItem('lang') || 'en_US';
    const translations = i18n[currentLang];
    
    if (flashcards.length === 0) {
        quizContainer.innerHTML = `<p class="flashcard-app__empty">${translations.noQuizCards}</p>`;
        return;
    }

    // Get up to 100 random questions
    quizQuestions = [...flashcards]
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(100, flashcards.length));
    
    currentQuestionIndex = 0;
    score = 0;
    showNextQuestion();
}

/**
 * Show the next quiz question or results if finished
 */
function showNextQuestion() {
    if (currentQuestionIndex >= quizQuestions.length) {
        showQuizResults();
        return;
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    quizContainer.innerHTML = `
        <div class="flashcard-app__question">
            <div class="flashcard-app__question-text">${currentQuestion.definition}</div>
            <input type="text" class="flashcard-app__answer-input" placeholder="Enter the word">
            <button class="flashcard-app__submit-btn">Submit</button>
            <div class="flashcard-app__feedback"></div>
        </div>
    `;

    const answerInput = quizContainer.querySelector('.flashcard-app__answer-input');
    const submitButton = quizContainer.querySelector('.flashcard-app__submit-btn');
    const feedback = quizContainer.querySelector('.flashcard-app__feedback');

    submitButton.addEventListener('click', () => checkAnswer(answerInput, feedback, currentQuestion));
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer(answerInput, feedback, currentQuestion);
    });
}

/**
 * Check the user's answer against the correct answer
 * @param {HTMLInputElement} input - The input element containing the user's answer
 * @param {HTMLElement} feedback - The feedback element to display results
 * @param {Object} question - The current question object
 */
function checkAnswer(input, feedback, question) {
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = question.word.toLowerCase();

    const currentLang = localStorage.getItem('lang') || 'en_US';
    const translations = i18n[currentLang];
    
    if (userAnswer === correctAnswer) {
        feedback.textContent = translations.correct;
        feedback.className = 'flashcard-app__feedback flashcard-app__feedback--correct';
        score++;
    } else {
        feedback.textContent = translations.incorrect + question.word;
        feedback.className = 'flashcard-app__feedback flashcard-app__feedback--incorrect';
    }

    input.disabled = true;
    setTimeout(() => {
        currentQuestionIndex++;
        showNextQuestion();
    }, 1500);
}

/**
 * Show the quiz results
 */
function showQuizResults() {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const currentLang = localStorage.getItem('lang') || 'en_US';
    const translations = i18n[currentLang];
    
    quizContainer.innerHTML = `
        <div class="flashcard-app__results">
            <h2>${translations.quizComplete}</h2>
            <p>${translations.score.replace('{score}', score).replace('{total}', quizQuestions.length).replace('{percentage}', percentage)}</p>
            <button class="flashcard-app__restart-btn" data-i18n="restartQuiz">${translations.restartQuiz}</button>
        </div>
    `;

    quizContainer.querySelector('.flashcard-app__restart-btn').addEventListener('click', startQuiz);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
