const quizState = {
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    timerInterval: null,
    timeRemaining: 30,
    settings: {
        shuffleQuestions: false,
        shuffleOptions: false,
        enableTimer: false
    }
};

const elements = {
    welcomeScreen: document.getElementById('welcomeScreen'),
    quizScreen: document.getElementById('quizScreen'),
    resultsScreen: document.getElementById('resultsScreen'),
    startQuizBtn: document.getElementById('startQuizBtn'),
    loadingText: document.getElementById('loadingText'),
    shuffleQuestionsCheckbox: document.getElementById('shuffleQuestions'),
    shuffleOptionsCheckbox: document.getElementById('shuffleOptions'),
    enableTimerCheckbox: document.getElementById('enableTimer'),
    questionNumber: document.getElementById('questionNumber'),
    progressFill: document.getElementById('progressFill'),
    questionText: document.getElementById('questionText'),
    optionsContainer: document.getElementById('optionsContainer'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    submitBtn: document.getElementById('submitBtn'),
    timerContainer: document.getElementById('timerContainer'),
    timerText: document.getElementById('timerText'),
    timerProgress: document.getElementById('timerProgress'),
    totalQuestions: document.getElementById('totalQuestions'),
    correctAnswers: document.getElementById('correctAnswers'),
    wrongAnswers: document.getElementById('wrongAnswers'),
    percentageScore: document.getElementById('percentageScore'),
    performanceMessage: document.getElementById('performanceMessage'),
    restartBtn: document.getElementById('restartBtn')
};

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function switchScreen(hideScreen, showScreen) {
    hideScreen.classList.remove('active');
    setTimeout(() => {
        showScreen.classList.add('active');
    }, 100);
}

async function loadQuestions() {
    try {
        elements.loadingText.style.display = 'block';
        elements.startQuizBtn.disabled = true;

        const response = await fetch('questions.json');

        if (!response.ok) {
            throw new Error('Failed to load questions');
        }

        const data = await response.json();
        quizState.questions = data.questions;

        if (quizState.settings.shuffleQuestions) {
            quizState.questions = shuffleArray(quizState.questions);
        }

        quizState.userAnswers = new Array(quizState.questions.length).fill(null);

        elements.loadingText.style.display = 'none';
        elements.startQuizBtn.disabled = false;

        return true;
    } catch (error) {
        console.error('Error loading questions:', error);
        elements.loadingText.textContent = 'Error loading questions. Please refresh the page.';
        elements.loadingText.style.color = 'red';
        return false;
    }
}

function startTimer() {
    if (!quizState.settings.enableTimer) return;

    stopTimer();
    quizState.timeRemaining = 30;
    updateTimerDisplay();

    quizState.timerInterval = setInterval(() => {
        quizState.timeRemaining--;
        updateTimerDisplay();

        if (quizState.timeRemaining <= 10) {
            elements.timerContainer.classList.add('warning');
        }

        if (quizState.timeRemaining <= 0) {
            stopTimer();
            handleNext();
        }
    }, 1000);
}

function stopTimer() {
    if (quizState.timerInterval) {
        clearInterval(quizState.timerInterval);
        quizState.timerInterval = null;
    }
    elements.timerContainer.classList.remove('warning');
}

function updateTimerDisplay() {
    elements.timerText.textContent = quizState.timeRemaining;
    const progress = (quizState.timeRemaining / 30) * 100;
    elements.timerProgress.style.strokeDashoffset = 100 - progress;
}

function displayQuestion() {
    const question = quizState.questions[quizState.currentQuestionIndex];

    elements.questionNumber.textContent = `Question ${quizState.currentQuestionIndex + 1} of ${quizState.questions.length}`;
    const progressPercentage = ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100;
    elements.progressFill.style.width = `${progressPercentage}%`;

    elements.questionText.textContent = question.question;

    let options = [...question.options];
    if (quizState.settings.shuffleOptions) {
        options = shuffleArray(options);
    }

    elements.optionsContainer.innerHTML = '';

    options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.dataset.value = option;

        if (quizState.userAnswers[quizState.currentQuestionIndex] === option) {
            optionElement.classList.add('selected');
        }

        optionElement.addEventListener('click', () => selectOption(optionElement, option));

        elements.optionsContainer.appendChild(optionElement);
    });

    updateNavigationButtons();

    startTimer();
}

function selectOption(selectedElement, value) {
    const allOptions = elements.optionsContainer.querySelectorAll('.option');
    allOptions.forEach(opt => opt.classList.remove('selected'));

    selectedElement.classList.add('selected');

    quizState.userAnswers[quizState.currentQuestionIndex] = value;

    updateNavigationButtons();
}

function updateNavigationButtons() {
    const isFirstQuestion = quizState.currentQuestionIndex === 0;
    const isLastQuestion = quizState.currentQuestionIndex === quizState.questions.length - 1;
    const hasAnswer = quizState.userAnswers[quizState.currentQuestionIndex] !== null;

    elements.prevBtn.disabled = isFirstQuestion;

    if (isLastQuestion) {
        elements.nextBtn.style.display = 'none';
        elements.submitBtn.style.display = 'inline-block';
        elements.submitBtn.disabled = !hasAnswer;
    } else {
        elements.nextBtn.style.display = 'inline-block';
        elements.submitBtn.style.display = 'none';
        elements.nextBtn.disabled = !hasAnswer;
    }
}

function handlePrevious() {
    if (quizState.currentQuestionIndex > 0) {
        stopTimer();
        quizState.currentQuestionIndex--;
        displayQuestion();
    }
}

function handleNext() {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
        stopTimer();
        quizState.currentQuestionIndex++;
        displayQuestion();
    }
}

function handleSubmit() {
    stopTimer();
    calculateResults();
    switchScreen(elements.quizScreen, elements.resultsScreen);
}

function calculateResults() {
    let correct = 0;
    let wrong = 0;

    quizState.questions.forEach((question, index) => {
        if (quizState.userAnswers[index] === question.answer) {
            correct++;
        } else if (quizState.userAnswers[index] !== null) {
            wrong++;
        }
    });

    const total = quizState.questions.length;
    const percentage = ((correct / total) * 100).toFixed(1);

    elements.totalQuestions.textContent = total;
    elements.correctAnswers.textContent = correct;
    elements.wrongAnswers.textContent = wrong;
    elements.percentageScore.textContent = `${percentage}%`;

    let message = '';
    if (percentage >= 90) {
        message = 'Outstanding! You have an excellent vocabulary!';
    } else if (percentage >= 75) {
        message = 'Great job! Your vocabulary knowledge is impressive!';
    } else if (percentage >= 60) {
        message = 'Good work! Keep practicing to improve further.';
    } else if (percentage >= 40) {
        message = 'Not bad! There\'s room for improvement.';
    } else {
        message = 'Keep learning! Practice makes perfect.';
    }

    elements.performanceMessage.textContent = message;
}

function resetQuiz() {
    stopTimer();
    quizState.currentQuestionIndex = 0;
    quizState.userAnswers = [];
    quizState.timeRemaining = 30;

    switchScreen(elements.resultsScreen, elements.welcomeScreen);
}

async function startQuiz() {
    quizState.settings.shuffleQuestions = elements.shuffleQuestionsCheckbox.checked;
    quizState.settings.shuffleOptions = elements.shuffleOptionsCheckbox.checked;
    quizState.settings.enableTimer = elements.enableTimerCheckbox.checked;

    elements.timerContainer.style.display = quizState.settings.enableTimer ? 'block' : 'none';

    if (quizState.questions.length === 0) {
        const loaded = await loadQuestions();
        if (!loaded) return;
    } else if (quizState.settings.shuffleQuestions) {
        quizState.questions = shuffleArray(quizState.questions);
        quizState.userAnswers = new Array(quizState.questions.length).fill(null);
    }

    quizState.currentQuestionIndex = 0;
    quizState.userAnswers = new Array(quizState.questions.length).fill(null);

    switchScreen(elements.welcomeScreen, elements.quizScreen);
    displayQuestion();
}

elements.startQuizBtn.addEventListener('click', startQuiz);
elements.prevBtn.addEventListener('click', handlePrevious);
elements.nextBtn.addEventListener('click', handleNext);
elements.submitBtn.addEventListener('click', handleSubmit);
elements.restartBtn.addEventListener('click', resetQuiz);

document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
});

window.addEventListener('beforeunload', (e) => {
    if (elements.quizScreen.classList.contains('active')) {
        e.preventDefault();
        e.returnValue = '';
    }
});

