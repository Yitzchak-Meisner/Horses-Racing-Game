// Constants
const SCORE = {
    WIN: 100,
    LOSE: -100
};

const RACE_CONFIG = {
    FINISH_OFFSET: 70,
    MIN_SPEED: 15,
    MAX_SPEED: 45,
    UPDATE_INTERVAL: 50,
    CLEANUP_DELAY: 3000,
    CONFETTI_DURATION: 2000
};

const TOAST_CONFIG = {
    DURATION: 3000,
    TYPES: {
        SUCCESS: 'success',
        ERROR: 'error'
    },
    MESSAGES: {
        WIN: '🎉 Congratulations! Your horse won!',
        LOSE: '😢 Better luck next time!',
        GAME_OVER: '🏁 Game Over! Better luck next time!',
        SELECT_HORSE: 'Please select a horse first!'
    }
};

// State
let state = {
    finished: [],
    winner: null,
    userBet: null,
    currentUser: null,
    isRacing: false,
    activeIntervals: []
};

// DOM Elements
const elements = {
    horses: document.querySelectorAll('.horseDiv'),
    startButton: document.getElementById('start'),
    nameElement: document.getElementById('name'),
    scoreElement: document.getElementById('score'),
    winSound: document.getElementById('winSound')
};

// Toast System
function showToast(message, type, duration = TOAST_CONFIG.DURATION) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), duration);
}

// Horse Movement System
function moveHorse(horse, finishLine, speed) {
    let position = 0;
    horse.classList.add('moving');

    const interval = setInterval(() => {
        if (!state.isRacing) {
            clearInterval(interval);
            return;
        }

        position += speed;
        
        if (position >= finishLine) {
            finishHorse(horse, finishLine);
            clearInterval(interval);
            state.activeIntervals = state.activeIntervals.filter(i => i !== interval);
        } else {
            horse.style.left = `${position}px`;
        }
    }, RACE_CONFIG.UPDATE_INTERVAL);

    state.activeIntervals.push(interval);
}

function finishHorse(horse, finishLine) {
    horse.style.left = `${finishLine}px`;
    horse.classList.remove('moving');
    
    if (!state.finished.includes(horse)) {
        state.finished.push(horse);
        if (state.finished.length === 1) {
            state.winner = horse;
        }
    }
}

// Race Management
function startRace() {
    if (state.userBet === null) {
        showToast(TOAST_CONFIG.MESSAGES.SELECT_HORSE, TOAST_CONFIG.TYPES.ERROR);
        return;
    }

    if (state.isRacing) return;

    initializeRace();
    
    elements.horses.forEach(horse => {
        const finishLine = horse.parentElement.clientWidth - RACE_CONFIG.FINISH_OFFSET;
        const speed = Math.random() * (RACE_CONFIG.MAX_SPEED - RACE_CONFIG.MIN_SPEED) + RACE_CONFIG.MIN_SPEED;
        moveHorse(horse, finishLine, speed);
    });

    checkRaceCompletion();
}

function initializeRace() {
    state.isRacing = true;
    elements.startButton.disabled = true;
    clearRaceState(false);
}

function clearRaceState(clearSelection = true) {
    state.activeIntervals.forEach(interval => clearInterval(interval));
    state.activeIntervals = [];
    state.finished = [];
    state.winner = null;
    
    elements.horses.forEach(horse => {
        horse.style.left = '0px';
        horse.classList.remove('moving', 'winner');
        if (clearSelection) {
            horse.classList.remove('selected');
        }
    });
}

function checkRaceCompletion() {
    const checker = setInterval(() => {
        if (state.finished.length === elements.horses.length) {
            clearInterval(checker);
            handleRaceEnd();
        }
    }, RACE_CONFIG.UPDATE_INTERVAL);

    state.activeIntervals.push(checker);
}

function handleRaceEnd() {
    const winnerIndex = Array.from(elements.horses).indexOf(state.winner);
    const hasWon = state.userBet === winnerIndex;
    
    updateScore(hasWon ? SCORE.WIN : SCORE.LOSE);
    saveUserData();

    state.winner.classList.add('winner');

    if (state.currentUser.score <= 0) {
        handleGameOver();
    } else {
        showToast(
            hasWon ? TOAST_CONFIG.MESSAGES.WIN : TOAST_CONFIG.MESSAGES.LOSE,
            hasWon ? TOAST_CONFIG.TYPES.SUCCESS : TOAST_CONFIG.TYPES.ERROR
        );

        if (hasWon) {
            celebrateWin();
        }
    }

    cleanupRace();
}

// Winner Celebration
function celebrateWin() {
    const horse = state.winner;
    horse.classList.add('winner');
    elements.winSound?.play();
    createConfetti(horse);

    setTimeout(() => {
        horse.classList.remove('winner');
    }, RACE_CONFIG.CLEANUP_DELAY);
}

function createConfetti(element) {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.right) / 2 / window.innerWidth;
    const y = (rect.top + rect.height) / window.innerHeight;

    const confettiConfig = {
        particleCount: 100,
        spread: 70,
        colors: ['#FFD700', '#FFA500', '#FF4500', '#00FF00', '#87CEEB']
    };

    // Initial burst
    confetti({ ...confettiConfig, origin: { x, y } });

    // Side bursts
    setTimeout(() => {
        confetti({ ...confettiConfig, particleCount: 50, angle: 60, spread: 55, origin: { x: x - 0.05, y } });
        confetti({ ...confettiConfig, particleCount: 50, angle: 120, spread: 55, origin: { x: x + 0.05, y } });
    }, 500);
}

// Game Over
function handleGameOver() {
    showToast(TOAST_CONFIG.MESSAGES.GAME_OVER, TOAST_CONFIG.TYPES.ERROR);
    elements.startButton.disabled = true;
    
    setTimeout(() => {
        window.location.href = 'gamesMenu.html';
    }, TOAST_CONFIG.DURATION);
}

// User Data Management
function loadUserData() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const userID = localStorage.getItem('userID');
    
    state.currentUser = users[userID];
    
    if (!state.currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    updateUserDisplay();
}

function saveUserData() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const userID = localStorage.getItem('userID');
    
    users[userID].score = state.currentUser.score;
    localStorage.setItem('users', JSON.stringify(users));
}

function updateUserDisplay() {
    elements.nameElement.textContent = state.currentUser.fullname;
    elements.scoreElement.textContent = state.currentUser.score;
}

function updateScore(change) {
    state.currentUser.score += change;
    elements.scoreElement.textContent = state.currentUser.score;
}

// Betting System
function placeBet(horseIndex) {
    if (state.isRacing) return;

    state.userBet = horseIndex;
    elements.horses.forEach((horse, idx) => {
        horse.classList.toggle('selected', idx === horseIndex);
    });
}

// Race Cleanup
function cleanupRace() {
    state.userBet = null;
    state.isRacing = false;

    setTimeout(() => {
        clearRaceState();
        elements.startButton.disabled = false;
    }, RACE_CONFIG.CLEANUP_DELAY);
}

// Initialize Game
function initGame() {
    elements.horses.forEach((horse, index) => {
        horse.addEventListener('click', () => placeBet(index));
    });
    
    elements.startButton.addEventListener('click', startRace);
    loadUserData();
}

// Start the game
initGame();