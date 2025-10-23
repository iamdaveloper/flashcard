// Application state
const appState = {
  mode: 'review', // 'review' or 'quiz'
  cards: [],
  currentCardIndex: 0,
  quizQuestions: [],
  currentQuizIndex: 0,
  quizAnswers: []
};

// DOM elements
const elements = {
  modeSwitcher: document.querySelector('.mode-switcher input[type="radio"]'),
  flashcardContainer: document.getElementById('review-container'),
  quizContainer: document.getElementById('quiz-container'),
  cardQuestion: document.getElementById('card-question'),
  cardAnswer: document.getElementById('card-answer'),
  currentCardDisplay: document.getElementById('current-card'),
  totalCardsDisplay: document.getElementById('total-cards'),
  refreshBtn: document.getElementById('refresh-btn')
};

// Initialize application
function init() {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker 註冊成功:', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker 註冊失敗:', err);
      });
  }

  // First setup event listeners
  setupEventListeners();
  
  // Load data then sort and render
  loadVocabData();

  // Handle PWA install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Can show custom install button here
  });
}

// CSV parsing function
function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      // Use regex to properly parse quoted CSV
      const values = line.match(/("[^"]*"|[^,]+)/g);
      return {
        id: parseInt(values[0]),
        q: values[1].replace(/^"|"$/g, '').trim(), // Remove surrounding quotes
        a: values[2].replace(/^"|"$/g, '').trim(),
        status: parseInt(values[3])
      };
    });
}

// Load vocabulary data
function loadVocabData() {
  fetch('vocab.csv')
    .then(response => response.text())
    .then(csvData => {
      appState.cards = parseCSV(csvData)
        .filter(card => card.status === 1);
      // Reset mode after loading to trigger sorting
      resetMode();
      render();
    })
    .catch(err => {
      console.error('載入失敗:', err);
      appState.cards = [{id:1, q:"犬", a:"いぬ", status:1}];
      resetMode();
      render();
    });
}

// Check for data updates
async function checkForUpdates() {
  try {
    const response = await fetch('vocab.csv?t=' + Date.now(), {
      cache: 'no-store'
    });
    const etag = response.headers.get('ETag');
    const cachedResponse = await caches.match('vocab.csv');
    
    if (!cachedResponse || 
        etag !== cachedResponse.headers.get('ETag')) {
      // Has update, reload data
      await loadVocabData();
      // Update cache
      const cache = await caches.open('flashcard-v1');
      await cache.put('vocab.csv', response.clone());
      alert('單字庫已更新！');
    } else {
      alert('已經是最新版本');
    }
  } catch (err) {
    console.error('檢查更新失敗:', err);
    alert('檢查更新失敗，請檢查網路連線');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Refresh button
  elements.refreshBtn.addEventListener('click', checkForUpdates);

  // Mode switching
  document.querySelectorAll('.mode-switcher input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      appState.mode = e.target.value;
      resetMode();
      render();
    });
  });

  // Card click to flip
  document.querySelector('.flashcard').addEventListener('click', () => {
    document.querySelector('.flashcard').classList.toggle('flipped');
  });

  // Arrow navigation
  document.querySelectorAll('.nav-arrow').forEach(arrow => {
    arrow.addEventListener('click', (e) => {
      if (e.target.textContent === '←') {
        appState.currentCardIndex = (appState.currentCardIndex - 1 + appState.cards.length) % appState.cards.length;
      } else {
        appState.currentCardIndex = (appState.currentCardIndex + 1) % appState.cards.length;
      }
      document.querySelector('.flashcard').classList.remove('flipped');
      render();
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (appState.mode === 'review') {
      if (e.key === 'ArrowLeft') {
        document.querySelector('.nav-arrow').click(); // Trigger left arrow
      } else if (e.key === 'ArrowRight') {
        document.querySelectorAll('.nav-arrow')[1].click(); // Trigger right arrow
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        document.querySelector('.flashcard').click(); // Trigger card flip
      }
    } else if (appState.mode === 'quiz' && e.key === 'Enter') {
      document.getElementById('submit-answer').click();
    }
  });

  // Quiz answer submission
  document.getElementById('submit-answer').addEventListener('click', handleQuizSubmit);
}

// Show quiz results
function showQuizResults() {
  const correctCount = appState.quizAnswers.filter(a => a.isCorrect).length;
  const totalQuestions = appState.quizQuestions.length;
  
  elements.quizContainer.innerHTML = `
    <h2>測驗完成！</h2>
    <p>得分: ${correctCount} / ${totalQuestions}</p>
    <button id="review-wrong">檢視錯題</button>
    <button id="restart-quiz">重新測驗</button>
    <div id="wrong-answers" style="display:none; margin-top:20px;"></div>
  `;

  document.getElementById('review-wrong').addEventListener('click', () => {
    const wrongAnswers = appState.quizAnswers.filter(a => !a.isCorrect);
    const wrongAnswersContainer = document.getElementById('wrong-answers');
    
    if (wrongAnswersContainer.style.display === 'none') {
      wrongAnswersContainer.innerHTML = wrongAnswers.map(a => `
        <div class="wrong-answer">
          <p><strong>問題:</strong> ${a.question}</p>
          <p><strong>你的答案:</strong> ${a.userAnswer}</p>
          <p><strong>正確答案:</strong> ${a.correctAnswer}</p>
        </div>
      `).join('');
      wrongAnswersContainer.style.display = 'block';
    } else {
      wrongAnswersContainer.style.display = 'none';
    }
  });

  document.getElementById('restart-quiz').addEventListener('click', () => {
    resetMode();
    render();
  });
}

// Handle quiz submission
function handleQuizSubmit() {
  const userAnswer = document.getElementById('quiz-answer').value.trim();
  const currentQuestion = appState.quizQuestions[appState.currentQuizIndex];
  const isCorrect = userAnswer === currentQuestion.a;
  
  appState.quizAnswers.push({
    question: currentQuestion.q,
    userAnswer,
    correctAnswer: currentQuestion.a,
    isCorrect
  });

  // Show feedback
  const feedback = document.getElementById('quiz-feedback');
  feedback.textContent = isCorrect ? '正確！' : `錯誤！正確答案是: ${currentQuestion.a}`;
  feedback.className = isCorrect ? 'correct' : 'incorrect';
  feedback.style.display = 'block';

  // Auto next question or show results
  setTimeout(() => {
    if (appState.currentQuizIndex < appState.quizQuestions.length - 1) {
      appState.currentQuizIndex++;
      render();
    } else {
      showQuizResults();
    }
  }, 1500);
}

// Reset mode state
function resetMode() {
  if (appState.mode === 'review') {
    // Review mode random sorting
    appState.cards = [...appState.cards].sort(() => 0.5 - Math.random());
    appState.currentCardIndex = 0;
  } else {
    // Rebuild quiz container
    elements.quizContainer.innerHTML = `
      <div class="progress">
        題目 <span id="current-quiz">1</span> / <span id="total-quiz">20</span>
      </div>
      <div class="quiz-input-group">
        <div class="quiz-question" id="quiz-question"></div>
        <input type="text" class="quiz-answer" id="quiz-answer" placeholder="輸入答案">
        <button id="submit-answer">✓</button>
      </div>
      <div class="quiz-feedback" id="quiz-feedback" style="display: none;"></div>
    `;
    
    // Rebind events
    document.getElementById('submit-answer').addEventListener('click', handleQuizSubmit);
    
    // Initialize quiz
    appState.quizQuestions = getRandomQuestions(20);
    appState.currentQuizIndex = 0;
    appState.quizAnswers = [];
  }
}

// Get random quiz questions
function getRandomQuestions(count) {
  const shuffled = [...appState.cards].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, appState.cards.length));
}

// Render current view
function render() {
  if (appState.mode === 'review') {
    renderReviewMode();
  } else {
    renderQuizMode();
  }
}

// Render review mode
function renderReviewMode() {
  elements.flashcardContainer.style.display = 'block';
  elements.quizContainer.style.display = 'none';

  // Safety check
  if (!appState.cards || !appState.cards[appState.currentCardIndex]) {
    elements.cardQuestion.textContent = "載入中...";
    elements.cardAnswer.textContent = "";
    elements.currentCardDisplay.textContent = "0";
    elements.totalCardsDisplay.textContent = "0";
    return;
  }
  
  const currentCard = appState.cards[appState.currentCardIndex];
  elements.cardQuestion.textContent = currentCard.q;
  elements.cardAnswer.textContent = currentCard.a;
  elements.currentCardDisplay.textContent = appState.currentCardIndex + 1;
  elements.totalCardsDisplay.textContent = appState.cards.length;
  
  // Reset card state
  document.querySelector('.flashcard').classList.remove('flipped');
}

// Render quiz mode
function renderQuizMode() {
  elements.flashcardContainer.style.display = 'none';
  elements.quizContainer.style.display = 'block';

  if (appState.quizQuestions.length === 0) {
    resetMode();
  }

  const currentQuestion = appState.quizQuestions[appState.currentQuizIndex];
  document.getElementById('quiz-question').textContent = currentQuestion.q;
  document.getElementById('current-quiz').textContent = appState.currentQuizIndex + 1;
  document.getElementById('total-quiz').textContent = appState.quizQuestions.length;
  document.getElementById('quiz-answer').value = '';
  document.getElementById('quiz-feedback').style.display = 'none';
}

// Start application
document.addEventListener('DOMContentLoaded', init);
