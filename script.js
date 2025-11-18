// Global State
let currentSection = 'card-maker';
let soundEnabled = true;
let openedDoors = JSON.parse(localStorage.getItem('openedDoors') || '[]');
let quizAnswers = [];
let currentQuestion = 0;

// Stats Tracking - Removed localStorage, using in-memory only (or can be moved to Firebase later)
let userStats = {"cardsCreated": 0, "socksHung": 0, "doorsOpened": 0, "quizzesTaken": 0, "gamesPlayed": 0, "lastDate": "", "cardsToday": 0, "socksToday": 0};

// Music Player
let musicEnabled = false;
let currentMusic = null;
const christmasSongs = [
    { title: 'Jingle Bells', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { title: 'Silent Night', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { title: 'Deck the Halls', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
];
let currentSongIndex = 0;

// Decorations for Card Maker
const decorations = [
    '🎅', '🎄', '❄️', '🎁', '🦌', '🔔', '⭐', '🌟',
    '🎀', '🕯️', '🍪', '🥛', '🧦', '🎊', '🎈', '🎉',
    '⛄', '🕊️', '🎵', '🎶', '🎤', '🎸', '🎹', '🎺'
];

// ============================================
// Firebase Backend Integration (Global Sharing)
// ============================================

// Check if Firebase is available
function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && window.firebaseInitialized && window.db !== null;
}

// Firebase: Save Sock to Global Database
async function saveSockToFirebase(sockEntry) {
    if (!isFirebaseAvailable()) {
        console.log('Firebase not available, using localStorage only');
        return false;
    }

    try {
        await window.db.collection('socks').add({
            emoji: sockEntry.emoji,
            message: sockEntry.message || null,
            city: sockEntry.city,
            country: sockEntry.country,
            lat: sockEntry.lat,
            lng: sockEntry.lng,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        });
        console.log('Sock saved to Firebase');
        return true;
    } catch (error) {
        console.error('Error saving sock to Firebase:', error);
        return false;
    }
}

// Firebase: Load Global Socks
async function loadGlobalSocksFromFirebase(limit = 50) {
    if (!isFirebaseAvailable()) {
        return [];
    }

    try {
        const snapshot = await window.db.collection('socks')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const globalSocks = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            globalSocks.push({
                id: doc.id,
                emoji: data.emoji,
                message: data.message,
                city: data.city,
                country: data.country,
                lat: data.lat,
                lng: data.lng,
                timestamp: data.timestamp?.toDate() || new Date(data.createdAt)
            });
        });
        return globalSocks;
    } catch (error) {
        console.error('Error loading socks from Firebase:', error);
        return [];
    }
}

// Firebase: Save Christmas Share to Global Database
async function saveChristmasShareToFirebase(share) {
    if (!isFirebaseAvailable()) {
        console.log('Firebase not available, using localStorage only');
        showError('Firebase is not available. Please check your connection.');
        return false;
    }

    try {
        // Validate share data
        if (!share.image || share.image === '') {
            console.error('Cannot save: image is required');
            return false;
        }
        
        // Check image size (base64 can be large)
        const base64Size = share.image.length * 0.75; // Approximate size in bytes
        if (base64Size > 2 * 1024 * 1024) { // 2MB limit for mobile optimization
            showError('Image is too large. Please use a smaller image (max 2MB).');
            return false;
        }
        
        // Detect mobile for timeout adjustment
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const timeoutDuration = isMobile ? 20000 : 30000; // 20s for mobile, 30s for desktop
        
        // Add timeout for mobile networks
        const uploadPromise = window.db.collection('christmasShares').add({
            image: share.image,
            message: share.message || null,
            location: share.location || 'Unknown Location',
            date: share.date || new Date().toLocaleDateString(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        });
        
        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upload timeout. Please check your connection and try again.')), timeoutDuration);
        });
        
        const docRef = await Promise.race([uploadPromise, timeoutPromise]);
        
        console.log('Christmas share saved to Firebase with ID:', docRef.id);
        return true;
    } catch (error) {
        console.error('Error saving Christmas share to Firebase:', error);
        let errorMessage = 'Failed to upload. ';
        
        if (error.message && error.message.includes('timeout')) {
            errorMessage = 'Upload timed out. Please check your internet connection and try again.';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please check Firebase security rules.';
        } else if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
            errorMessage = 'Connection timeout. Please check your internet connection and try again.';
        } else if (error.code === 'failed-precondition') {
            errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Please check your connection and try again.';
        }
        
        showError(errorMessage);
        return false;
    }
}

// Firebase: Load Global Christmas Shares
async function loadGlobalChristmasSharesFromFirebase(limit = 100) {
    if (!isFirebaseAvailable()) {
        return [];
    }

    try {
        const snapshot = await window.db.collection('christmasShares')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const globalShares = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            globalShares.push({
                id: doc.id,
                image: data.image,
                message: data.message,
                location: data.location,
                date: data.date,
                timestamp: data.timestamp?.toDate() || new Date(data.createdAt)
            });
        });
        return globalShares;
    } catch (error) {
        console.error('Error loading Christmas shares from Firebase:', error);
        return [];
    }
}

// Firebase: Save Game Score to Global Leaderboard
async function saveGameScoreToFirebase(gameType, score, country) {
    if (!isFirebaseAvailable()) {
        console.log('Firebase not available, using localStorage only');
        return false;
    }

    try {
        await window.db.collection('leaderboards').doc(gameType).collection('scores').add({
            score: score,
            country: country,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        });
        console.log('Game score saved to Firebase');
        return true;
    } catch (error) {
        console.error('Error saving game score to Firebase:', error);
        return false;
    }
}

// Firebase: Load Global Leaderboard
async function loadGlobalLeaderboardFromFirebase(gameType, limit = 50, dailyOnly = false) {
    if (!isFirebaseAvailable()) {
        return [];
    }

    try {
        let query = window.db.collection('leaderboards').doc(gameType)
            .collection('scores');
        
        // Filter by today's date if dailyOnly is true
        if (dailyOnly) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Use Firestore Timestamp for date comparison
            const todayTimestamp = firebase.firestore.Timestamp.fromDate(today);
            const tomorrowTimestamp = firebase.firestore.Timestamp.fromDate(tomorrow);
            
            query = query.where('timestamp', '>=', todayTimestamp)
                        .where('timestamp', '<', tomorrowTimestamp)
                        .orderBy('timestamp', 'desc');
        } else {
            // Overall leaderboard - order by score
            query = query.orderBy('score', gameType === 'memory' || gameType === 'wordsearch' ? 'asc' : 'desc');
        }
        
        const snapshot = await query
            .limit(limit)
            .get();

        const scores = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const timestamp = data.timestamp?.toDate() || new Date(data.createdAt);
            scores.push({
                score: data.score,
                country: data.country,
                date: data.createdAt,
                timestamp: timestamp
            });
        });
        
        // If daily, sort by score after filtering
        if (dailyOnly) {
            scores.sort((a, b) => {
                if (gameType === 'memory' || gameType === 'wordsearch') {
                    return a.score - b.score;
                }
                return b.score - a.score;
            });
        }
        
        return scores;
    } catch (error) {
        console.error('Error loading leaderboard from Firebase:', error);
        return [];
    }
}

// Firebase: Real-time listener for socks (optional - for live updates)
function subscribeToGlobalSocks(callback) {
    if (!isFirebaseAvailable()) {
        return null;
    }

    try {
        return window.db.collection('socks')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                const globalSocks = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    globalSocks.push({
                        id: doc.id,
                        emoji: data.emoji,
                        message: data.message,
                        city: data.city,
                        country: data.country,
                        lat: data.lat,
                        lng: data.lng,
                        timestamp: data.timestamp?.toDate() || new Date(data.createdAt)
                    });
                });
                callback(globalSocks);
            });
    } catch (error) {
        console.error('Error subscribing to socks:', error);
        return null;
    }
}

// Advent Calendar Content
const adventContent = {
    1: { type: 'fact', content: '🎄 The tradition of Christmas trees originated in Germany in the 16th century!' },
    2: { type: 'joke', content: '🎅 What do you call a snowman with a suntan? A puddle!' },
    3: { type: 'tradition', content: '🕯️ The tradition of lighting candles dates back to ancient winter solstice celebrations.' },
    4: { type: 'fact', content: '🎁 The first Christmas card was created in 1843 by Sir Henry Cole!' },
    5: { type: 'joke', content: '🦌 What do reindeer hang on their Christmas trees? Horn-aments!' },
    6: { type: 'message', content: '✨ May your days be merry and bright, and may all your Christmases be white!' },
    7: { type: 'fact', content: '🔔 Jingle Bells was originally written for Thanksgiving, not Christmas!' },
    8: { type: 'joke', content: '❄️ Why did the snowman call his dog Frost? Because Frost bites!' },
    9: { type: 'tradition', content: '🎄 The first artificial Christmas tree was made in Germany using goose feathers!' },
    10: { type: 'message', content: '🌟 Wishing you peace, love, and joy this Christmas season!' },
    11: { type: 'fact', content: '🎅 Santa Claus is based on Saint Nicholas, a 4th-century Greek bishop!' },
    12: { type: 'joke', content: '🎁 What\'s the best Christmas present? A broken drum - you can\'t beat it!' },
    13: { type: 'tradition', content: '🕯️ The tradition of hanging stockings comes from the story of Saint Nicholas!' },
    14: { type: 'message', content: '🎄 May the spirit of Christmas bring you happiness and peace!' },
    15: { type: 'fact', content: '🦌 Reindeer are the only mammals that can see UV light!' },
    16: { type: 'joke', content: '⛄ What do you get if you cross a snowman with a vampire? Frostbite!' },
    17: { type: 'tradition', content: '🎊 The tradition of Christmas crackers started in England in the 1840s!' },
    18: { type: 'message', content: '✨ May your heart be light and your holidays be bright!' },
    19: { type: 'fact', content: '🎵 "Silent Night" has been translated into over 300 languages!' },
    20: { type: 'joke', content: '🎅 What do you call an elf who sings? A wrapper!' },
    21: { type: 'tradition', content: '🎄 The tradition of mistletoe dates back to ancient Celtic times!' },
    22: { type: 'message', content: '🌟 Wishing you a season filled with warmth and cheer!' },
    23: { type: 'fact', content: '🎁 The tradition of gift-giving comes from the Three Wise Men!' },
    24: { type: 'joke', content: '🦌 What do you call a reindeer with no eyes? No idea!' },
    25: { type: 'message', content: '🎄🎅 Merry Christmas! May this day be filled with love, laughter, and joy! 🎁✨' }
};

// Quiz Questions
const quizQuestions = [
    {
        question: 'What\'s your ideal Christmas morning?',
        options: [
            { text: 'Waking up early to open presents', character: 'santa' },
            { text: 'Helping prepare the Christmas feast', character: 'elf' },
            { text: 'Building a snowman in the yard', character: 'snowman' },
            { text: 'Going for a winter adventure', character: 'reindeer' }
        ]
    },
    {
        question: 'What\'s your favorite Christmas activity?',
        options: [
            { text: 'Giving gifts to loved ones', character: 'santa' },
            { text: 'Decorating the house', character: 'elf' },
            { text: 'Enjoying hot cocoa by the fire', character: 'snowman' },
            { text: 'Sledding or winter sports', character: 'reindeer' }
        ]
    },
    {
        question: 'What Christmas treat do you love most?',
        options: [
            { text: 'Cookies and milk', character: 'santa' },
            { text: 'Candy canes', character: 'elf' },
            { text: 'Gingerbread', character: 'snowman' },
            { text: 'Carrots (for the reindeer!)', character: 'reindeer' }
        ]
    },
    {
        question: 'How do you spread Christmas cheer?',
        options: [
            { text: 'By being generous and giving', character: 'santa' },
            { text: 'By making everything beautiful', character: 'elf' },
            { text: 'By being warm and welcoming', character: 'snowman' },
            { text: 'By being energetic and fun', character: 'reindeer' }
        ]
    },
    {
        question: 'What\'s your Christmas superpower?',
        options: [
            { text: 'Making wishes come true', character: 'santa' },
            { text: 'Creating magic and wonder', character: 'elf' },
            { text: 'Bringing peace and calm', character: 'snowman' },
            { text: 'Spreading joy and excitement', character: 'reindeer' }
        ]
    }
];

// Quiz Results
const quizResults = {
    santa: {
        icon: '🎅',
        title: 'You are Santa Claus!',
        description: 'You\'re generous, kind-hearted, and love spreading joy to others. Your giving spirit makes everyone around you feel special and loved!'
    },
    elf: {
        icon: '🧝',
        title: 'You are a Christmas Elf!',
        description: 'You\'re creative, hardworking, and love making everything beautiful. Your attention to detail and festive spirit brings magic to every celebration!'
    },
    snowman: {
        icon: '⛄',
        title: 'You are a Snowman!',
        description: 'You\'re calm, friendly, and bring a sense of peace to those around you. Your warm heart (even in the cold!) makes you a beloved friend!'
    },
    reindeer: {
        icon: '🦌',
        title: 'You are a Reindeer!',
        description: 'You\'re energetic, adventurous, and always ready for fun! Your playful spirit and loyalty make you the perfect companion for any Christmas adventure!'
    }
};

// EMERGENCY: Run cleanup immediately on script load (before DOM is ready)
// Simple one-time cleanup on page load to remove any existing modals
(function() {
    if (typeof document !== 'undefined' && document.body) {
        const modals = document.querySelectorAll('.sphere-image-modal');
        modals.forEach(m => {
            try { m.remove(); } catch(e) {}
        });
    }
})();

// Debug function to find blocking elements
window.findBlockingElements = function() {
    const allElements = document.querySelectorAll('*');
    const blocking = [];
    allElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const zIndex = parseInt(styles.zIndex) || 0;
        const position = styles.position;
        const pointerEvents = styles.pointerEvents;
        const display = styles.display;
        
        if ((position === 'fixed' || position === 'absolute') && 
            zIndex >= 1000 && 
            display !== 'none' &&
            pointerEvents !== 'none' &&
            el.offsetWidth > 0 && 
            el.offsetHeight > 0) {
            blocking.push({
                element: el,
                tag: el.tagName,
                class: el.className,
                zIndex: zIndex,
                position: position,
                pointerEvents: pointerEvents,
                width: el.offsetWidth,
                height: el.offsetHeight
            });
        }
    });
    console.log('Blocking elements:', blocking);
    return blocking;
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // One-time cleanup of any existing modals and blocking elements
    const existingModals = document.querySelectorAll('.sphere-image-modal');
    existingModals.forEach(modal => {
        try { 
            modal.style.cssText = 'display: none !important; pointer-events: none !important; z-index: -1 !important; visibility: hidden !important; opacity: 0 !important;';
            modal.remove(); 
        } catch(e) {}
    });
    
    // Force remove any elements with sphere-image-modal class
    setTimeout(() => {
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.classList && el.classList.contains('sphere-image-modal')) {
                try {
                    el.style.cssText = 'display: none !important; pointer-events: none !important; z-index: -1 !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important;';
                    if (el.parentNode) el.remove();
                } catch(e) {}
            }
        });
        
        // Also check for any fixed position elements covering the page
        const fixedElements = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
        fixedElements.forEach(el => {
            const styles = window.getComputedStyle(el);
            if (parseInt(styles.zIndex) >= 10000 && el.classList.contains('sphere-image-modal')) {
                try {
                    el.style.cssText = 'display: none !important; pointer-events: none !important; z-index: -1 !important;';
                    if (el.parentNode) el.remove();
                } catch(e) {}
            }
        });
    }, 100);
    
    try {
        initModernNavbar();
        initNavigation();
        initHeroSection();
        initFlowingMenu();
        initCardMaker();
        initAdventCalendar();
        initPersonalityQuiz();
        initSockHanging();
        initSnow();
        initSoundToggle();
        initCountdown();
        initStatsTracking();
        initMusicPlayer();
        initGiftExchange();
        initGames();
        initLeaderboard();
        enhanceSockHanging();
        enhanceAdventCalendar();
        initMobileOptimizations();
        initDarkMode();
        initSnowToggle();
        initControlMenu();
        initShareModal();
        initDailyChallenges();
        initImageSphere();
        initShareChristmas();
        initHowButton();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize. Please refresh the page.');
    }
});

// Initialize Share Modal
function initShareModal() {
    const shareModal = document.getElementById('shareModal');
    const closeBtn = document.getElementById('closeShareModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (shareModal) shareModal.style.display = 'none';
            if (soundEnabled) playSound('click');
        });
    }
    
    // Close on background click
    if (shareModal) {
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                shareModal.style.display = 'none';
            }
        });
    }
}

// Hero Section - Initialize Flowing Menu
function initFlowingMenu() {
    const flowingMenuBg = document.getElementById('flowingMenuBg');
    const heroButtons = document.querySelectorAll('.hero-btn');
    
    if (!flowingMenuBg || !heroButtons.length) return;
    
    // Activate flowing background on menu container hover
    const flowingMenu = document.querySelector('.flowing-menu');
    if (flowingMenu) {
        flowingMenu.addEventListener('mouseenter', () => {
            flowingMenuBg.classList.add('active');
        });
        
        flowingMenu.addEventListener('mouseleave', () => {
            flowingMenuBg.classList.remove('active');
        });
    }
    
    // Individual button hover effects
    heroButtons.forEach((btn, index) => {
        btn.addEventListener('mouseenter', (e) => {
            const rect = btn.getBoundingClientRect();
            const menuRect = flowingMenu.getBoundingClientRect();
            
            // Position flowing background behind hovered button
            const x = rect.left + rect.width / 2 - menuRect.left;
            const y = rect.top + rect.height / 2 - menuRect.top;
            
            flowingMenuBg.style.left = x + 'px';
            flowingMenuBg.style.top = y + 'px';
            flowingMenuBg.style.transform = 'translate(-50%, -50%)';
            flowingMenuBg.classList.add('active');
        });
        
        btn.addEventListener('mouseleave', () => {
            // Keep background active if still hovering menu
            if (!flowingMenu.matches(':hover')) {
                flowingMenuBg.classList.remove('active');
            }
        });
    });
}

// Create ripple effect on button click
function createRippleEffect(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        left: ${x}px;
        top: ${y}px;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 0;
    `;
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Hero Section - Initialize Curved Loop Animation
function initCurvedLoop() {
    const svg = document.querySelector('.curved-loop-svg');
    if (!svg) return;
    
    const textPath = document.getElementById('curvedTextPath');
    if (!textPath) return;
    
    // Get the text content to count segments
    const fullText = textPath.textContent.trim();
    const segment = "MERRY✦ CHRISTMAS ✦";
    const segments = (fullText.match(new RegExp(segment, 'g')) || []).length;
    
    // Calculate one segment's percentage (we have 16 segments, so 1/16 = 6.25%)
    const oneSegmentPercent = 100 / segments;
    
    // Create duplicate text element for seamless looping
    const textElement = textPath.parentElement;
    const duplicateText = textElement.cloneNode(true);
    duplicateText.classList.add('curved-text-2');
    const duplicatePath = duplicateText.querySelector('textPath');
    if (duplicatePath) {
        duplicatePath.setAttribute('id', 'curvedTextPath2');
        duplicatePath.setAttribute('startOffset', `${oneSegmentPercent}%`);
    }
    svg.appendChild(duplicateText);
    
    // Use JavaScript animation for seamless infinite loop
    let offset = 0;
    const speed = 0.25;
    
    function animate() {
        offset += speed;
        
        // Use modulo to create continuous loop without visible resets
        // When offset exceeds 100%, it wraps around seamlessly
        const offset1 = offset % 100;
        const offset2 = (offset + oneSegmentPercent) % 100;
        
        // Update both text paths
        textPath.setAttribute('startOffset', `${offset1}%`);
        if (duplicatePath) {
            duplicatePath.setAttribute('startOffset', `${offset2}%`);
        }
        
        requestAnimationFrame(animate);
    }
    
    // Start animation after SVG renders
    setTimeout(() => {
        animate();
    }, 200);
}

// Hero Section
function initHeroSection() {
    initCurvedLoop();
    
    // Initialize Lottie animation if player is available
    const lottiePlayer = document.getElementById('christmasTreeLottie');
    const treeContainer = document.querySelector('.christmas-tree-container');
    
    if (lottiePlayer) {
        // Ensure the path is correct (handle spaces in filename)
        const currentSrc = lottiePlayer.getAttribute('src');
        if (currentSrc && currentSrc.includes(' ')) {
            // URL encode spaces if needed
            const encodedSrc = currentSrc.replace(/ /g, '%20');
            lottiePlayer.setAttribute('src', encodedSrc);
        }
        
        // Wait for Lottie player to be ready
        lottiePlayer.addEventListener('ready', () => {
            console.log('Lottie animation loaded successfully');
        });
        
        // Handle errors
        lottiePlayer.addEventListener('error', (e) => {
            console.error('Lottie animation error:', e);
            // Try with original path if encoded failed
            const originalSrc = 'decorate/Merry XMas.json';
            if (lottiePlayer.getAttribute('src') !== originalSrc) {
                lottiePlayer.setAttribute('src', originalSrc);
            }
        });
    }
    
    // Make tree "look" at mouse cursor (rotate towards mouse)
    if (treeContainer) {
        let mouseX = 0;
        let mouseY = 0;
        let currentRotation = 0;
        const treeLottie = treeContainer.querySelector('.christmas-tree-lottie');
        
        // Calculate angle to mouse and rotate tree
        function updateTreeRotation() {
            // Get tree center position
            const treeRect = treeContainer.getBoundingClientRect();
            const treeCenterX = treeRect.left + treeRect.width / 2;
            const treeCenterY = treeRect.bottom - treeRect.height / 2;
            
            // Calculate angle from tree center to mouse
            const deltaX = mouseX - treeCenterX;
            const deltaY = mouseY - treeCenterY;
            const targetAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            
            // Smooth rotation (easing)
            const angleDiff = targetAngle - currentRotation;
            // Normalize angle difference to -180 to 180
            let normalizedDiff = ((angleDiff + 180) % 360) - 180;
            currentRotation += normalizedDiff * 0.1;
            
            // Apply rotation with slight tilt effect (like looking up/down)
            const tiltAmount = Math.min(Math.abs(deltaY) / 200, 15); // Max 15 degrees tilt
            const tiltDirection = deltaY < 0 ? -1 : 1;
            const finalRotation = currentRotation + (tiltAmount * tiltDirection * 0.3);
            
            // Apply transform to tree
            if (treeLottie) {
                treeLottie.style.transform = `rotate(${finalRotation}deg)`;
            } else {
                treeContainer.style.transform = `rotate(${finalRotation}deg)`;
            }
            
            requestAnimationFrame(updateTreeRotation);
        }
        
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Start rotation animation loop
        updateTreeRotation();
    }
    
    // Initialize Cats Lottie animation
    const catsLottiePlayer = document.getElementById('catsLottie');
    const catsContainer = document.querySelector('.cats-lottie-container');
    
    if (catsLottiePlayer) {
        // Ensure the path is correct (handle spaces in filename)
        const currentCatsSrc = catsLottiePlayer.getAttribute('src');
        if (currentCatsSrc && currentCatsSrc.includes(' ')) {
            // URL encode spaces if needed
            const encodedCatsSrc = currentCatsSrc.replace(/ /g, '%20');
            catsLottiePlayer.setAttribute('src', encodedCatsSrc);
        }
        
        // Wait for Lottie player to be ready
        catsLottiePlayer.addEventListener('ready', () => {
            console.log('Cats Lottie animation loaded successfully');
        });
        
        // Handle errors
        catsLottiePlayer.addEventListener('error', (e) => {
            console.error('Cats Lottie animation error:', e);
            // Try with original path if encoded failed
            const originalCatsSrc = 'decorate/Cats for new year and christmas.json';
            if (catsLottiePlayer.getAttribute('src') !== originalCatsSrc) {
                catsLottiePlayer.setAttribute('src', originalCatsSrc);
            }
        });
    }
    
    // Hero buttons - handle regular buttons
    const heroButtons = document.querySelectorAll('.glow-button:not(.games-btn-hero)');
    heroButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Create click ripple
            createRippleEffect(btn, e);
            
            const section = btn.dataset.section;
            if (section) {
            switchSection(section);
            
            // Update expandable tabs
            const expandableTabs = document.querySelectorAll('.expandable-tab');
            expandableTabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.section === section) {
                    tab.classList.add('active');
                }
            });
            
                // Hide hero (navbar is always visible now)
            document.getElementById('hero').style.display = 'none';
            
            // Initialize map if going to sock-hanging
            if (section === 'sock-hanging' && !map) {
                setTimeout(() => {
                    initMap();
                    loadSocksOnMap();
                }, 300);
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
    
    // Games dropdown for hero buttons
    const gamesDropdownHero = document.getElementById('gamesDropdownHero');
    const gamesBtnHero = gamesDropdownHero?.querySelector('.games-btn-hero');
    const gamesDropdownItemsHero = document.querySelectorAll('.games-dropdown-item-hero');
    const gamesDropdownMenu = gamesDropdownHero?.querySelector('.games-dropdown-menu-hero');
    
    // Update dropdown position on hover to ensure it's visible above other content
    if (gamesDropdownHero && gamesDropdownMenu) {
        gamesDropdownHero.addEventListener('mouseenter', () => {
            const btnRect = gamesBtnHero.getBoundingClientRect();
            gamesDropdownMenu.style.position = 'fixed';
            gamesDropdownMenu.style.top = `${btnRect.bottom + 12}px`;
            gamesDropdownMenu.style.left = `${btnRect.left + (btnRect.width / 2)}px`;
            gamesDropdownMenu.style.transform = 'translateX(-50%) translateY(0)';
        });
    }
    
    if (gamesBtnHero) {
        // Click on Games button - go to games section
        gamesBtnHero.addEventListener('click', (e) => {
            e.stopPropagation();
            createRippleEffect(gamesBtnHero, e);
            
            switchSection('games');
            
            // Update expandable tabs
            const expandableTabs = document.querySelectorAll('.expandable-tab');
            expandableTabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.section === 'games') {
                    tab.classList.add('active');
                }
            });
            
            // Hide hero and show nav
            document.getElementById('hero').style.display = 'none';
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            if (soundEnabled) playSound('click');
        });
        
        // Handle dropdown item clicks
        gamesDropdownItemsHero.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const game = item.dataset.game;
                if (game) {
                    // Go to games section first
                    switchSection('games');
                    
                    // Update expandable tabs
                    const expandableTabs = document.querySelectorAll('.expandable-tab');
                    expandableTabs.forEach(tab => {
                        tab.classList.remove('active');
                        if (tab.dataset.section === 'games') {
                            tab.classList.add('active');
                        }
                    });
                    
                    // Hide hero (modern navbar is always visible)
                    document.getElementById('hero').style.display = 'none';
                    // Then start the selected game
                    setTimeout(() => {
                        // Hide games grid
                        const gamesGrid = document.querySelector('.games-grid');
                        if (gamesGrid) gamesGrid.style.display = 'none';
                        
                        // Hide all game containers
                        document.querySelectorAll('.game-container').forEach(c => {
                            c.style.display = 'none';
                        });
                        
                        // Show selected game
                        if (game === 'trivia') {
                            initTrivia();
                            document.getElementById('triviaGame').style.display = 'block';
                        } else if (game === 'memory') {
                            initMemory();
                            document.getElementById('memoryGame').style.display = 'block';
                        } else if (game === 'wordsearch') {
                            initWordSearch();
                            document.getElementById('wordsearchGame').style.display = 'block';
                        } else if (game === 'wordle') {
                            initWordle();
                            document.getElementById('wordleGame').style.display = 'block';
                        }
                    }, 100);
                    
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    
                    if (soundEnabled) playSound('click');
                }
            });
        });
    }
}

// Christmas Countdown Timer
function initCountdown() {
    const updateCountdown = () => {
        try {
            const now = new Date();
            const currentYear = now.getFullYear();
            let christmas = new Date(currentYear, 11, 25, 0, 0, 0); // Dec 25
            
            // If Christmas has passed this year, set to next year
            if (now > christmas) {
                christmas = new Date(currentYear + 1, 11, 25, 0, 0, 0);
            }
            
            const diff = christmas - now;
            
            if (diff <= 0) {
                // It's Christmas!
                document.getElementById('countdownContainer').innerHTML = 
                    '<div class="countdown-message">🎄 Merry Christmas! 🎄</div>';
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = days;
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        } catch (error) {
            console.error('Countdown error:', error);
        }
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Stats Tracking System
function initStatsTracking() {
    checkDailyReset();
    updatePageStats();
}

function checkDailyReset() {
    const today = new Date().toDateString();
    if (userStats.lastDate !== today) {
        userStats.cardsToday = 0;
        userStats.socksToday = 0;
        userStats.christmasSharesToday = 0;
        userStats.lastDate = today;
        // Stats no longer saved to localStorage (removed)
    }
}

function updatePageStats() {
    try {
        // Card page stats
        const cardTotal = document.getElementById('cardTotal');
        const cardToday = document.getElementById('cardToday');
        if (cardTotal) cardTotal.textContent = userStats.cardsCreated || 0;
        if (cardToday) cardToday.textContent = userStats.cardsToday || 0;
        
        // Sock page stats
        const sockTotal = document.getElementById('sockTotal');
        const sockToday = document.getElementById('sockToday');
        if (sockTotal) sockTotal.textContent = userStats.socksHung || 0;
        if (sockToday) sockToday.textContent = userStats.socksToday || 0;
        
        // Share Christmas page stats (handled by updateShareChristmasStats)
        updateShareChristmasStats();
    } catch (error) {
        console.error('Stats display error:', error);
    }
}

function incrementStat(statName) {
    try {
        checkDailyReset();
        if (!userStats[statName]) userStats[statName] = 0;
        userStats[statName]++;
        
        // Track daily stats
        if (statName === 'cardsCreated') {
            userStats.cardsToday = (userStats.cardsToday || 0) + 1;
        } else if (statName === 'socksHung') {
            userStats.socksToday = (userStats.socksToday || 0) + 1;
        } else if (statName === 'christmasShares') {
            userStats.christmasSharesToday = (userStats.christmasSharesToday || 0) + 1;
        }
        
        // Stats no longer saved to localStorage (removed)
        updatePageStats();
    } catch (error) {
        console.error('Stat increment error:', error);
    }
}

// Error Handling
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

// Show Share Platform Options
function showShareOptions(gameType, shareText, blob, gameTitle) {
    const modal = document.getElementById('shareModal');
    const modalBody = document.getElementById('shareModalBody');
    
    if (!modal || !modalBody) {
        // Fallback to native share
        if (navigator.share && blob) {
            blob.arrayBuffer().then(buffer => {
                const file = new File([buffer], `christmas-${gameType}.png`, { type: 'image/png' });
                navigator.share({
                    title: gameTitle,
                    text: shareText,
                    files: [file]
                }).catch(() => {});
            }).catch(() => {});
        }
        return;
    }
    
    modalBody.innerHTML = `
        <h3>Share Your Result</h3>
        <p style="margin: 1rem 0; color: rgba(255,255,255,0.7);">${shareText}</p>
        <div class="share-platforms">
            <button class="share-platform-btn instagram-story-btn" id="instagramStoryBtn">
                <svg class="share-icon-line" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <circle cx="12" cy="12" r="3.5"></circle>
                    <circle cx="17.5" cy="6.5" r="1"></circle>
                </svg>
            </button>
            <button class="share-platform-btn" data-platform="twitter">
                <svg class="share-icon-line" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
            </button>
            <button class="share-platform-btn" data-platform="facebook">
                <svg class="share-icon-line" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
            </button>
            <button class="share-platform-btn" data-platform="whatsapp">
                <svg class="share-icon-line" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
            </button>
            <button class="share-platform-btn" data-platform="telegram">
                <svg class="share-icon-line" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 2L11 13"></path>
                    <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                </svg>
            </button>
            <button class="share-platform-btn" data-platform="email">
                <svg class="share-icon-line" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
            </button>
        </div>
        <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button class="share-copy-btn" id="copyShareText">
                <svg class="share-icon-line" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Text</span>
            </button>
            ${blob ? `
            <button class="share-copy-btn" id="downloadImageBtn">
                <svg class="share-icon-line" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download Image</span>
            </button>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Instagram Story button (special handling)
    const instagramBtn = modalBody.querySelector('#instagramStoryBtn');
    if (instagramBtn && blob) {
        instagramBtn.addEventListener('click', async () => {
            if (soundEnabled) playSound('click');
            await shareToInstagramStory(blob, shareText);
        });
    }
    
    // Platform buttons
    modalBody.querySelectorAll('.share-platform-btn:not(#instagramStoryBtn)').forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.dataset.platform;
            shareToPlatform(platform, shareText, window.location.href, blob);
            if (soundEnabled) playSound('click');
        });
    });
    
    // Download button
    const downloadBtn = modalBody.querySelector('#downloadImageBtn');
    if (downloadBtn && blob) {
        downloadBtn.addEventListener('click', () => {
            if (soundEnabled) playSound('click');
            downloadImageForSharing(blob);
            showSuccess('Image downloaded!');
        });
    }
    
    // Copy text button
    const copyBtn = modalBody.querySelector('#copyShareText');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            try {
                // Try modern clipboard API first
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(shareText);
                    showSuccess('Text copied to clipboard!');
                    if (soundEnabled) playSound('success');
                } else {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = shareText;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                        const successful = document.execCommand('copy');
                        if (successful) {
                            showSuccess('Text copied to clipboard!');
                            if (soundEnabled) playSound('success');
                        } else {
                            throw new Error('Copy command failed');
                        }
                    } catch (err) {
                        showError('Failed to copy text. Please select and copy manually.');
                    }
                    document.body.removeChild(textArea);
                }
            } catch (err) {
                console.error('Copy error:', err);
                // Show text in alert as last resort
                const textArea = document.createElement('textarea');
                textArea.value = shareText;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showSuccess('Text copied to clipboard!');
                    if (soundEnabled) playSound('success');
                } catch (e) {
                    showError('Failed to copy. Please select and copy manually.');
                }
                document.body.removeChild(textArea);
            }
        });
    }
    
    // Native share (mobile)
    if (navigator.share && blob) {
        const nativeShareBtn = document.createElement('button');
        nativeShareBtn.className = 'action-btn primary';
        nativeShareBtn.textContent = '📱 Native Share';
        nativeShareBtn.style.marginTop = '0.5rem';
        nativeShareBtn.addEventListener('click', () => {
            blob.arrayBuffer().then(buffer => {
                const file = new File([buffer], `christmas-${gameType}.png`, { type: 'image/png' });
                navigator.share({
                    title: gameTitle,
                    text: shareText,
                    files: [file]
                }).catch(() => {});
            }).catch(() => {});
        });
        modalBody.appendChild(nativeShareBtn);
    }
}

// Music Player
function initMusicPlayer() {
    try {
        const musicPlayer = document.getElementById('musicPlayer');
        const musicToggle = document.getElementById('musicToggle');
        const musicTitle = document.getElementById('musicTitle');
        
        if (!musicPlayer || !musicToggle) return;
        
        // Music player is optional - hide if not needed
        musicPlayer.style.display = 'none'; // Hidden by default since we don't have actual music files
        
        musicToggle.addEventListener('click', () => {
            if (!currentMusic) {
                showError('Music feature is coming soon!');
                return;
            }
            
            if (musicEnabled) {
                currentMusic.pause();
                musicEnabled = false;
                musicToggle.textContent = '🎵';
                musicToggle.classList.remove('playing');
            } else {
                try {
                    currentMusic.play().then(() => {
                        musicEnabled = true;
                        musicToggle.textContent = '⏸️';
                        musicToggle.classList.add('playing');
                        musicTitle.textContent = christmasSongs[currentSongIndex].title;
                    }).catch(() => {
                        showError('Music requires user interaction. Click again after interacting with the page.');
                    });
                } catch (error) {
                    showError('Music playback not available.');
                }
            }
        });
        
        if (currentMusic) {
            currentMusic.addEventListener('ended', () => {
                currentSongIndex = (currentSongIndex + 1) % christmasSongs.length;
                if (musicEnabled) {
                    musicTitle.textContent = christmasSongs[currentSongIndex].title;
                }
            });
        }
    } catch (error) {
        console.error('Music player error:', error);
    }
}

// Modern Navigation Bar
function initModernNavbar() {
    const modernNavbar = document.getElementById('modernNavbar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navbarLogoLink = document.getElementById('navbarLogoLink');
    const hero = document.getElementById('hero');
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            modernNavbar.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }
    
    // Logo click - go to home
    if (navbarLogoLink) {
        navbarLogoLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Hide all sections
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            // Reset game state
            document.querySelectorAll('.game-container').forEach(c => c.style.display = 'none');
            const gamesGrid = document.querySelector('.games-grid');
            if (gamesGrid) gamesGrid.style.display = 'grid';
            const leaderboard = document.getElementById('gamesLeaderboard');
            if (leaderboard) leaderboard.style.display = 'block';
            currentGame = null;
            if (gameKeyboardHandler) {
                document.removeEventListener('keydown', gameKeyboardHandler);
                gameKeyboardHandler = null;
            }
            
            // Show hero section
            if (hero) {
                hero.style.display = 'flex';
                hero.style.textAlign = 'center';
            }
            
            // Close mobile menu
            if (modernNavbar) modernNavbar.classList.remove('active');
            if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            if (soundEnabled) playSound('click');
        });
    }
    
    // Dropdown items click handlers
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const section = item.dataset.section;
            if (section) {
                switchSection(section);
                
                // Hide hero and show section
                if (hero) hero.style.display = 'none';
                
                // Close mobile menu
                if (modernNavbar) modernNavbar.classList.remove('active');
                if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
                
                // Close dropdown
                const dropdown = item.closest('.nav-item.dropdown');
                if (dropdown) dropdown.classList.remove('active');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                if (soundEnabled) playSound('click');
            }
        });
    });
    
    // Regular nav links (non-dropdown)
    const regularNavLinks = document.querySelectorAll('.nav-link[data-section]:not(.dropdown .nav-link)');
    regularNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) {
                switchSection(section);
                
                // Hide hero and show section
                if (hero) hero.style.display = 'none';
                
                // Close mobile menu
                if (modernNavbar) modernNavbar.classList.remove('active');
                if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                if (soundEnabled) playSound('click');
            }
        });
    });
    
    // CTA button
    const navCtaBtn = document.querySelector('.nav-cta-btn');
    if (navCtaBtn) {
        navCtaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const section = navCtaBtn.dataset.section;
            if (section) {
                switchSection(section);
                
                // Hide hero and show section
                if (hero) hero.style.display = 'none';
                
                // Close mobile menu
                if (modernNavbar) modernNavbar.classList.remove('active');
                if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                if (soundEnabled) playSound('click');
            }
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-item.dropdown')) {
            document.querySelectorAll('.nav-item.dropdown').forEach(item => {
                item.classList.remove('active');
            });
        }
    });
    
    // Handle dropdown toggle on mobile
    const dropdownButtons = document.querySelectorAll('.nav-item.dropdown .nav-link');
    dropdownButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (window.innerWidth <= 968) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = btn.closest('.nav-item.dropdown');
                const isActive = dropdown.classList.contains('active');
                
                // Close all other dropdowns
                document.querySelectorAll('.nav-item.dropdown').forEach(item => {
                    if (item !== dropdown) {
                        item.classList.remove('active');
                    }
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('active');
            }
        });
    });
    
    // Ensure dropdown menus are clickable
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
}

// Expandable Tabs Navigation
function initNavigation() {
    const expandableTabs = document.querySelectorAll('.expandable-tab');
    const homeTab = document.getElementById('homeTab');
    const howTab = document.getElementById('howTab');
    const expandableNav = document.getElementById('expandableTabsNav');
    const hero = document.getElementById('hero');
    
    // Home tab handler
    if (homeTab) {
        homeTab.addEventListener('click', () => {
            // Hide all sections
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            // Reset game state
            document.querySelectorAll('.game-container').forEach(c => c.style.display = 'none');
            const gamesGrid = document.querySelector('.games-grid');
            if (gamesGrid) gamesGrid.style.display = 'grid';
            const leaderboard = document.getElementById('gamesLeaderboard');
            if (leaderboard) leaderboard.style.display = 'block';
            currentGame = null;
            if (gameKeyboardHandler) {
                document.removeEventListener('keydown', gameKeyboardHandler);
                gameKeyboardHandler = null;
            }
            
            // Show hero section
            if (hero) {
                hero.style.display = 'flex';
                hero.style.textAlign = 'center';
            }
            
            // Hide navigation
            if (expandableNav) expandableNav.style.display = 'none';
            
            // Remove active from all tabs
            expandableTabs.forEach(t => t.classList.remove('active'));
            homeTab.classList.add('active');
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            if (soundEnabled) playSound('click');
        });
    }
    
    
    // Other tabs
    expandableTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Skip "Home" tab - it has its own handler
            if (tab.id === 'homeTab') return;
            
            const section = tab.dataset.section;
            if (section) {
                switchSection(section);
                
                expandableTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Hide hero section (modern navbar is always visible)
                if (hero) hero.style.display = 'none';
                
                if (soundEnabled) playSound('click');
            }
        });
    });
}

function switchSection(section) {
    try {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
            currentSection = section;
            
            // Update page stats when switching sections
            updatePageStats();
            
            // Show/hide leaderboard based on section
            const leaderboard = document.getElementById('gamesLeaderboard');
            const gamesGrid = document.querySelector('.games-grid');
            if (section === 'games') {
                // Show leaderboard when games section is active and games grid is visible
                if (gamesGrid && gamesGrid.style.display !== 'none') {
                    if (leaderboard) leaderboard.style.display = 'block';
                }
            } else {
                // Hide leaderboard for other sections
                if (leaderboard) leaderboard.style.display = 'none';
            }
            
            // Resize map if switching to sock-hanging section
            if (section === 'sock-hanging' && map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }
            
            if (soundEnabled) {
                playSound('click');
            }
        }
    } catch (error) {
        console.error('Section switch error:', error);
        showError('Failed to switch section. Please try again.');
    }
}

// Card Maker
function initCardMaker() {
    const cardPreview = document.getElementById('cardPreview');
    const cardMessage = document.getElementById('cardMessage');
    const cardContent = document.getElementById('cardContent');
    
    if (!cardPreview || !cardMessage || !cardContent) {
        console.error('Card maker elements not found');
        return;
    }
    
    let currentTemplate = 'classic';
    let currentColor = '#FF6B6B';
    let currentTextColor = '#FFFFFF';
    let decorationCount = 0;
    let cardHistory = [];
    let historyIndex = -1;
    // Frame variables removed - no frames in card maker
    let imagePosition = 'center';
    let imageOpacity = 100;
    let imageSize = 100;

    // Templates
    const postcardLayout = document.getElementById('postcardLayout');
    const regularCardLayout = document.getElementById('regularCardLayout');
    
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTemplate = btn.dataset.template;
            cardPreview.className = `card-preview template-${currentTemplate}`;
            
            // Show/hide layouts based on template
            if (currentTemplate === 'postcard') {
                if (postcardLayout) postcardLayout.style.display = 'flex';
                if (regularCardLayout) regularCardLayout.style.display = 'none';
                // Postcard uses white background, don't apply color
                cardPreview.style.background = '#FFFFFF';
                // Hide image container for postcard (image goes to stamp)
                if (uploadedImageContainer) {
                    uploadedImageContainer.style.display = 'none';
                }
            } else {
                if (postcardLayout) postcardLayout.style.display = 'none';
                if (regularCardLayout) regularCardLayout.style.display = 'block';
                updateCardColor(currentColor);
            }
            
            updateBackgroundColorVisibility();
            saveCardState();
            if (soundEnabled) playSound('click');
        });
    });

    // Background Colors
    const backgroundColorGroup = Array.from(document.querySelectorAll('.control-group')).find(group => 
        group.querySelector('.color-buttons')
    );
    document.querySelectorAll('[data-color]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentTemplate === 'postcard') {
                // Postcard doesn't use background colors
                return;
            }
            currentColor = btn.dataset.color;
            updateCardColor(currentColor);
            document.querySelectorAll('[data-color]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveCardState();
            if (soundEnabled) playSound('click');
        });
    });
    
    // Update background color visibility based on template
    function updateBackgroundColorVisibility() {
        const colorButtons = document.querySelectorAll('[data-color]');
        if (currentTemplate === 'postcard') {
            colorButtons.forEach(btn => {
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
                btn.style.cursor = 'not-allowed';
            });
            if (backgroundColorGroup) {
                backgroundColorGroup.style.opacity = '0.6';
            }
        } else {
            colorButtons.forEach(btn => {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.style.cursor = 'pointer';
            });
            if (backgroundColorGroup) {
                backgroundColorGroup.style.opacity = '1';
            }
        }
    }

    function updateCardColor(color) {
        if (currentTemplate === 'postcard') {
            // Postcard always uses white background
            cardPreview.style.background = '#FFFFFF';
        } else if (currentTemplate === 'classic') {
            cardPreview.style.background = `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -30)} 100%)`;
        } else if (currentTemplate === 'winter') {
            cardPreview.style.background = `linear-gradient(135deg, ${lightenColor(color, 40)} 0%, ${lightenColor(color, 20)} 100%)`;
        } else {
            cardPreview.style.background = `linear-gradient(135deg, ${darkenColor(color, 30)} 0%, ${darkenColor(color, 10)} 100%)`;
        }
    }

    // Text Size Slider
    const textSizeSlider = document.getElementById('textSizeSlider');
    const textSizeValue = document.getElementById('textSizeValue');
    
    textSizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        cardMessage.style.fontSize = size + 'rem';
        textSizeValue.textContent = size + 'rem';
        saveCardState();
        if (soundEnabled) playSound('click');
    });
    
    // Text Color
    document.querySelectorAll('[data-textcolor]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTextColor = btn.dataset.textcolor;
            cardMessage.style.color = currentTextColor;
            document.querySelectorAll('[data-textcolor]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveCardState();
            if (soundEnabled) playSound('click');
        });
    });
    
    // Text Alignment
    document.querySelectorAll('.align-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const align = btn.dataset.align;
            cardMessage.style.textAlign = align;
            document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveCardState();
            if (soundEnabled) playSound('click');
        });
    });
    
    // Font Selection
    const textFont = document.getElementById('textFont');
    if (textFont) {
        textFont.addEventListener('change', (e) => {
            const selectedFont = e.target.value;
            // Apply font to regular card
            cardMessage.style.fontFamily = selectedFont + (selectedFont.includes('Dancing') || selectedFont.includes('Kalam') ? ', cursive' : ', sans-serif');
            
            // Apply font to postcard fields
            const postcardMsg = document.getElementById('postcardMessage');
            const postcardSig = document.getElementById('postcardSignature');
            const postcardAddr = document.getElementById('postcardAddress');
            
            if (postcardMsg) {
                postcardMsg.style.fontFamily = selectedFont + (selectedFont.includes('Dancing') || selectedFont.includes('Kalam') ? ', cursive' : ', sans-serif');
            }
            if (postcardSig) {
                postcardSig.style.fontFamily = selectedFont + (selectedFont.includes('Dancing') || selectedFont.includes('Kalam') ? ', cursive' : ', sans-serif');
            }
            if (postcardAddr) {
                postcardAddr.style.fontFamily = selectedFont + (selectedFont.includes('Dancing') || selectedFont.includes('Kalam') ? ', cursive' : ', sans-serif');
            }
            
            saveCardState();
            if (soundEnabled) playSound('click');
        });
    }
    
    // Text Shadow Toggle
    const textShadow = document.getElementById('textShadow');
    const cardBorder = document.getElementById('cardBorder');
    
    if (textShadow) {
        textShadow.addEventListener('change', (e) => {
            if (e.target.checked) {
                cardMessage.style.textShadow = '2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.3)';
            } else {
                cardMessage.style.textShadow = 'none';
            }
            saveCardState();
        });
    }
    
    // Card Border Toggle - Always remove border
    if (cardBorder) {
        cardBorder.addEventListener('change', (e) => {
            // Always set border to none regardless of checkbox state
                cardPreview.style.border = 'none';
                cardPreview.style.boxShadow = 'none';
            saveCardState();
        });
    }
    
    // Ensure border is always removed on initialization
    if (cardPreview) {
        cardPreview.style.border = 'none';
        cardPreview.style.boxShadow = 'none';
    }
    
    // Share Card
    const shareCardBtn = document.getElementById('shareCard');
    if (shareCardBtn) {
        shareCardBtn.addEventListener('click', () => {
            shareCardImage();
            if (soundEnabled) playSound('success');
        });
    }
    
    // Reset Card
    const resetCardBtn = document.getElementById('resetCard');
    if (resetCardBtn) {
        resetCardBtn.addEventListener('click', () => {
            if (confirm('Reset card to default? This cannot be undone.')) {
                resetCard();
                if (soundEnabled) playSound('click');
            }
        });
    }
    
    // Save card state for undo/redo
    function saveCardState() {
        const postcardMessage = document.getElementById('postcardMessage');
        const postcardSignature = document.getElementById('postcardSignature');
        const postcardAddress = document.getElementById('postcardAddress');
        
        const state = {
            message: currentTemplate === 'postcard' ? (postcardMessage ? postcardMessage.value : '') : cardMessage.value,
            template: currentTemplate,
            color: currentColor,
            textColor: currentTextColor,
            fontSize: cardMessage.style.fontSize,
            textAlign: cardMessage.style.textAlign,
            fontFamily: cardMessage.style.fontFamily,
            textShadow: textShadow ? textShadow.checked : true,
            border: cardBorder ? cardBorder.checked : false,
            decorations: Array.from(cardContent.querySelectorAll('.decoration-item')).map(dec => ({
                emoji: dec.textContent,
                left: dec.style.left,
                top: dec.style.top
            })),
            // Postcard specific
            postcardMessage: postcardMessage ? postcardMessage.value : '',
            postcardSignature: postcardSignature ? postcardSignature.value : '',
            postcardAddress: postcardAddress ? postcardAddress.value : ''
        };
        
        // Remove any states after current index (for redo)
        cardHistory = cardHistory.slice(0, historyIndex + 1);
        cardHistory.push(state);
        historyIndex = cardHistory.length - 1;
        
        // Limit history to 20 states
        if (cardHistory.length > 20) {
            cardHistory.shift();
            historyIndex--;
        }
    }
    
    function resetCard() {
        cardMessage.value = 'Merry Christmas!';
        currentTemplate = 'classic';
        currentColor = '#C8102E';
        currentTextColor = '#FFFFFF';
        cardMessage.style.fontSize = '2.5rem';
        cardMessage.style.color = '#FFFFFF';
        cardMessage.style.textAlign = 'center';
        cardMessage.style.fontFamily = 'Poppins, sans-serif';
        cardMessage.style.textShadow = '2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.3)';
        
        // Reset postcard fields
        const postcardMessage = document.getElementById('postcardMessage');
        const postcardSignature = document.getElementById('postcardSignature');
        const postcardAddress = document.getElementById('postcardAddress');
        if (postcardMessage) {
            postcardMessage.value = 'Happy Holidays!\nWe just wanted to wish you guys a Merry Christmas and a happy new year.';
            postcardMessage.style.fontFamily = 'Poppins, sans-serif';
        }
        if (postcardSignature) {
            postcardSignature.value = 'Love, Johnny & Moira';
            postcardSignature.style.fontFamily = 'Poppins, sans-serif';
        }
        if (postcardAddress) {
            postcardAddress.value = 'Roland and Jocelyn Schitt\n4130 Concession Road\nSchitt\'s Creek, PA 24216';
            postcardAddress.style.fontFamily = 'Poppins, sans-serif';
        }
        
        // Reset font selector
        if (textFont) {
            textFont.value = 'Poppins';
        }
        
        document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.template-btn[data-template="classic"]').classList.add('active');
        cardPreview.className = 'card-preview template-classic';
        
        // Show/hide layouts
        if (postcardLayout) postcardLayout.style.display = 'none';
        if (regularCardLayout) regularCardLayout.style.display = 'block';
        
        updateCardColor(currentColor);
        textSizeSlider.value = 2.5;
        textSizeValue.textContent = '2.5rem';
        
        if (textShadow) textShadow.checked = true;
        if (cardBorder) cardBorder.checked = false;
        cardPreview.style.border = 'none';
        cardPreview.style.boxShadow = 'none';
        
        const decorations = cardContent.querySelectorAll('.decoration-item');
        decorations.forEach(dec => dec.remove());
        decorationCount = 0;
        
        cardHistory = [];
        historyIndex = -1;
        saveCardState();
    }
    
    // Complete daily challenge when card is created
    const cardCreated = () => {
        completeDailyChallenge('card');
    };
    
    function shareCardImage() {
        try {
            const cardPreview = document.getElementById('cardPreview');
            if (!cardPreview) {
                showError('Card preview not found');
                return;
            }
            
            // Load html2canvas if needed
            loadHtml2Canvas().then(() => {
                // Ensure all images are loaded before capturing
                const images = cardPreview.querySelectorAll('img');
                const imagePromises = Array.from(images).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        setTimeout(resolve, 1000); // Timeout after 1 second
                    });
                });
                
                return Promise.all(imagePromises);
            }).then(() => {
                // Ensure textarea content is visible (for regular cards)
                const cardMessage = document.getElementById('cardMessage');
                let originalOverflow = '';
                let originalHeight = '';
                if (cardMessage && currentTemplate !== 'postcard') {
                    originalOverflow = cardMessage.style.overflow;
                    originalHeight = cardMessage.style.height;
                    cardMessage.style.overflow = 'visible';
                    cardMessage.style.height = 'auto';
                }
                
                // Fix postcard textareas
                if (currentTemplate === 'postcard') {
                    const postcardMessage = document.getElementById('postcardMessage');
                    const postcardAddress = document.getElementById('postcardAddress');
                    if (postcardMessage) {
                        postcardMessage.style.overflow = 'visible';
                        postcardMessage.style.height = 'auto';
                    }
                    if (postcardAddress) {
                        postcardAddress.style.overflow = 'visible';
                        postcardAddress.style.height = 'auto';
                    }
                }
                
                // Small delay to ensure all styles are applied
                setTimeout(() => {
                    html2canvas(cardPreview, {
                        backgroundColor: null,
                        scale: 2,
                        useCORS: true,
                        allowTaint: false,
                        logging: false,
                        width: cardPreview.offsetWidth,
                        height: cardPreview.offsetHeight,
                        windowWidth: cardPreview.scrollWidth,
                        windowHeight: cardPreview.scrollHeight,
                        onclone: (clonedDoc) => {
                            // Remove unwanted shadows and effects from cloned card
                            const clonedCard = clonedDoc.querySelector('#cardPreview');
                            if (clonedCard) {
                                clonedCard.style.boxShadow = 'none';
                                clonedCard.style.filter = 'none';
                                clonedCard.style.transform = 'none';
                                clonedCard.style.outline = 'none';
                                // Remove border for postcard
                                if (currentTemplate === 'postcard') {
                                    clonedCard.style.border = 'none';
                                    clonedCard.style.borderRadius = '0';
                                }
                            }
                            
                            // Frame overlay removed - no frames in card maker
                            
                            // Fix textarea in cloned document - convert to div for better rendering
                            const clonedTextarea = clonedDoc.querySelector('#cardMessage');
                            if (clonedTextarea) {
                                // Create a div to replace textarea for better canvas rendering
                                const textDiv = clonedDoc.createElement('div');
                                textDiv.id = 'cardMessage';
                                textDiv.className = clonedTextarea.className;
                                textDiv.style.cssText = clonedTextarea.style.cssText;
                                textDiv.style.overflow = 'visible';
                                textDiv.style.height = 'auto';
                                textDiv.style.whiteSpace = 'pre-wrap';
                                textDiv.style.wordWrap = 'break-word';
                                textDiv.style.display = 'block';
                                textDiv.textContent = clonedTextarea.value || clonedTextarea.textContent;
                                
                                // Replace textarea with div
                                clonedTextarea.parentNode.replaceChild(textDiv, clonedTextarea);
                            }
                            
                            // Fix postcard layout visibility in clone
                            const clonedPostcardLayout = clonedDoc.querySelector('#postcardLayout');
                            const clonedRegularLayout = clonedDoc.querySelector('#regularCardLayout');
                            
                            if (currentTemplate === 'postcard') {
                                    // Ensure postcard layout is visible and properly styled
                                    if (clonedPostcardLayout) {
                                        clonedPostcardLayout.style.display = 'flex';
                                        clonedPostcardLayout.style.width = '100%';
                                        clonedPostcardLayout.style.height = '100%';
                                        clonedPostcardLayout.style.position = 'relative';
                                        clonedPostcardLayout.style.flexDirection = 'row';
                                        clonedPostcardLayout.style.border = 'none';
                                        clonedPostcardLayout.style.outline = 'none';
                                        clonedPostcardLayout.style.boxShadow = 'none';
                                    }
                                if (clonedRegularLayout) {
                                    clonedRegularLayout.style.display = 'none';
                                }
                                
                                // Ensure card content has no padding for postcard
                                const clonedCardContent = clonedDoc.querySelector('#cardContent');
                                if (clonedCardContent) {
                                    clonedCardContent.style.padding = '0';
                                    clonedCardContent.style.border = 'none';
                                    clonedCardContent.style.boxShadow = 'none';
                                    clonedCardContent.style.outline = 'none';
                                }
                                
                                // Fix postcard message side
                                const clonedMessageSide = clonedDoc.querySelector('.postcard-message-side');
                                if (clonedMessageSide) {
                                    clonedMessageSide.style.flex = '1';
                                    clonedMessageSide.style.padding = '2rem';
                                    clonedMessageSide.style.display = 'flex';
                                    clonedMessageSide.style.flexDirection = 'column';
                                    clonedMessageSide.style.justifyContent = 'space-between';
                                    clonedMessageSide.style.border = 'none';
                                    clonedMessageSide.style.outline = 'none';
                                    clonedMessageSide.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard divider
                                const clonedDivider = clonedDoc.querySelector('.postcard-divider');
                                if (clonedDivider) {
                                    clonedDivider.style.width = '1px';
                                    clonedDivider.style.height = 'auto';
                                    clonedDivider.style.background = '#1a1a1a';
                                    clonedDivider.style.margin = '1rem 0';
                                    clonedDivider.style.border = 'none';
                                    clonedDivider.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard address side
                                const clonedAddressSide = clonedDoc.querySelector('.postcard-address-side');
                                if (clonedAddressSide) {
                                    clonedAddressSide.style.flex = '1';
                                    clonedAddressSide.style.padding = '2rem';
                                    clonedAddressSide.style.display = 'flex';
                                    clonedAddressSide.style.flexDirection = 'column';
                                    clonedAddressSide.style.position = 'relative';
                                    clonedAddressSide.style.border = 'none';
                                    clonedAddressSide.style.outline = 'none';
                                    clonedAddressSide.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard stamp
                                const clonedStamp = clonedDoc.querySelector('#postcardStamp');
                                if (clonedStamp) {
                                    clonedStamp.style.position = 'absolute';
                                    clonedStamp.style.top = '1.5rem';
                                    clonedStamp.style.right = '1.5rem';
                                    clonedStamp.style.width = '80px';
                                    clonedStamp.style.height = '80px';
                                    clonedStamp.style.border = '2px dashed #999';
                                    clonedStamp.style.borderRadius = '4px';
                                    clonedStamp.style.display = 'flex';
                                    clonedStamp.style.flexDirection = 'column';
                                    clonedStamp.style.alignItems = 'center';
                                    clonedStamp.style.justifyContent = 'center';
                                    clonedStamp.style.background = '#f5f5f5';
                                    clonedStamp.style.padding = '0.5rem';
                                }
                                
                                // Fix postcard textareas - convert to divs
                                const clonedPostcardMessage = clonedDoc.querySelector('#postcardMessage');
                                if (clonedPostcardMessage) {
                                    const postcardDiv = clonedDoc.createElement('div');
                                    postcardDiv.id = 'postcardMessage';
                                    postcardDiv.className = clonedPostcardMessage.className;
                                    postcardDiv.style.cssText = clonedPostcardMessage.style.cssText;
                                    postcardDiv.style.flex = '1';
                                    postcardDiv.style.width = '100%';
                                    postcardDiv.style.overflow = 'visible';
                                    postcardDiv.style.height = 'auto';
                                    postcardDiv.style.whiteSpace = 'pre-wrap';
                                    postcardDiv.style.wordWrap = 'break-word';
                                    postcardDiv.style.display = 'block';
                                    postcardDiv.textContent = clonedPostcardMessage.value || clonedPostcardMessage.textContent;
                                    clonedPostcardMessage.parentNode.replaceChild(postcardDiv, clonedPostcardMessage);
                                }
                                
                                const clonedPostcardAddress = clonedDoc.querySelector('#postcardAddress');
                                if (clonedPostcardAddress) {
                                    const addressDiv = clonedDoc.createElement('div');
                                    addressDiv.id = 'postcardAddress';
                                    addressDiv.className = clonedPostcardAddress.className;
                                    addressDiv.style.cssText = clonedPostcardAddress.style.cssText;
                                    addressDiv.style.width = '100%';
                                    addressDiv.style.overflow = 'visible';
                                    addressDiv.style.height = 'auto';
                                    addressDiv.style.whiteSpace = 'pre-wrap';
                                    addressDiv.style.wordWrap = 'break-word';
                                    addressDiv.style.display = 'block';
                                    addressDiv.textContent = clonedPostcardAddress.value || clonedPostcardAddress.textContent;
                                    clonedPostcardAddress.parentNode.replaceChild(addressDiv, clonedPostcardAddress);
                                }
                                
                                const clonedSignature = clonedDoc.querySelector('#postcardSignature');
                                if (clonedSignature) {
                                    const signatureDiv = clonedDoc.createElement('div');
                                    signatureDiv.id = 'postcardSignature';
                                    signatureDiv.className = clonedSignature.className;
                                    signatureDiv.style.cssText = clonedSignature.style.cssText;
                                    signatureDiv.style.width = '100%';
                                    signatureDiv.style.display = 'block';
                                    signatureDiv.textContent = clonedSignature.value || clonedSignature.textContent;
                                    clonedSignature.parentNode.replaceChild(signatureDiv, clonedSignature);
                                }
                                
                                // Fix stamp image in postcard
                                const clonedStampImage = clonedDoc.querySelector('#stampImage');
                                const clonedStampLogo = clonedDoc.querySelector('#stampLogo');
                                if (clonedStampImage && clonedStampImage.src && clonedStampImage.src !== '' && clonedStampImage.src !== window.location.href) {
                                    clonedStampImage.style.display = 'block';
                                    clonedStampImage.style.width = '100%';
                                    clonedStampImage.style.height = 'auto';
                                    clonedStampImage.style.maxHeight = '50px';
                                    clonedStampImage.style.objectFit = 'contain';
                                    if (clonedStampLogo) {
                                        clonedStampLogo.style.display = 'none';
                                    }
                                } else if (clonedStampLogo) {
                                    clonedStampLogo.style.display = 'flex';
                                    if (clonedStampImage) {
                                        clonedStampImage.style.display = 'none';
                                    }
                                }
                            } else {
                                if (clonedPostcardLayout) {
                                    clonedPostcardLayout.style.display = 'none';
                                }
                                if (clonedRegularLayout) {
                                    clonedRegularLayout.style.display = 'block';
                                }
                                
                                // Fix regular card textarea
                                const clonedTextarea = clonedDoc.querySelector('#cardMessage');
                                if (clonedTextarea) {
                                    const textDiv = clonedDoc.createElement('div');
                                    textDiv.id = 'cardMessage';
                                    textDiv.className = clonedTextarea.className;
                                    textDiv.style.cssText = clonedTextarea.style.cssText;
                                    textDiv.style.overflow = 'visible';
                                    textDiv.style.height = 'auto';
                                    textDiv.style.whiteSpace = 'pre-wrap';
                                    textDiv.style.wordWrap = 'break-word';
                                    textDiv.style.display = 'block';
                                    textDiv.textContent = clonedTextarea.value || clonedTextarea.textContent;
                                    clonedTextarea.parentNode.replaceChild(textDiv, clonedTextarea);
                                }
                            }
                            
                            // Remove any unwanted shadows from decorations
                            const decorations = clonedDoc.querySelectorAll('.decoration-item');
                            decorations.forEach(dec => {
                                dec.style.filter = 'none';
                                dec.style.boxShadow = 'none';
                            });
                            
                            // Remove shadows from card content container
                            const clonedContent = clonedDoc.querySelector('#cardContent');
                            if (clonedContent) {
                                clonedContent.style.boxShadow = 'none';
                                clonedContent.style.filter = 'none';
                            }
                        }
                    }).then(canvas => {
                        // Restore original styles
                        if (cardMessage && currentTemplate !== 'postcard') {
                            cardMessage.style.overflow = originalOverflow;
                            cardMessage.style.height = originalHeight;
                        }
                        
                        canvas.toBlob(blob => {
                            if (!blob) {
                                showError('Failed to generate image');
                                return;
                            }
                            
                            // Show share options modal with Instagram Story
                            const shareText = 'Check out my Christmas card! 🎄';
                            showShareOptions('card', shareText, blob, 'My Christmas Card');
                            
                            showSuccess('Card image ready to share!');
                        }, 'image/png', 1.0);
                    }).catch(error => {
                        // Restore original styles on error
                        if (cardMessage && currentTemplate !== 'postcard') {
                            cardMessage.style.overflow = originalOverflow;
                            cardMessage.style.height = originalHeight;
                        }
                        console.error('Share error:', error);
                        showError('Failed to generate card image');
                    });
                }, 100);
            }).catch(() => {
                // Continue even if some images fail to load
                const cardMessage = document.getElementById('cardMessage');
                const originalOverflow = cardMessage.style.overflow;
                const originalHeight = cardMessage.style.height;
                cardMessage.style.overflow = 'visible';
                cardMessage.style.height = 'auto';
                
                setTimeout(() => {
                    html2canvas(cardPreview, {
                        backgroundColor: null,
                        scale: 2,
                        useCORS: true,
                        allowTaint: false,
                        logging: false,
                        onclone: (clonedDoc) => {
                            // Remove unwanted shadows and effects from cloned card
                            const clonedCard = clonedDoc.querySelector('#cardPreview');
                            if (clonedCard) {
                                clonedCard.style.boxShadow = 'none';
                                clonedCard.style.filter = 'none';
                                clonedCard.style.transform = 'none';
                                clonedCard.style.outline = 'none';
                                // Remove border for postcard
                                if (currentTemplate === 'postcard') {
                                    clonedCard.style.border = 'none';
                                    clonedCard.style.borderRadius = '0';
                                }
                            }
                            
                            // Frame overlay removed - no frames in card maker
                            
                            // Fix textarea in cloned document - convert to div for better rendering
                            const clonedTextarea = clonedDoc.querySelector('#cardMessage');
                            if (clonedTextarea) {
                                // Create a div to replace textarea for better canvas rendering
                                const textDiv = clonedDoc.createElement('div');
                                textDiv.id = 'cardMessage';
                                textDiv.className = clonedTextarea.className;
                                textDiv.style.cssText = clonedTextarea.style.cssText;
                                textDiv.style.overflow = 'visible';
                                textDiv.style.height = 'auto';
                                textDiv.style.whiteSpace = 'pre-wrap';
                                textDiv.style.wordWrap = 'break-word';
                                textDiv.style.display = 'block';
                                textDiv.textContent = clonedTextarea.value || clonedTextarea.textContent;
                                
                                // Replace textarea with div
                                clonedTextarea.parentNode.replaceChild(textDiv, clonedTextarea);
                            }
                            
                            // Fix postcard layout visibility in clone
                            const clonedPostcardLayout = clonedDoc.querySelector('#postcardLayout');
                            const clonedRegularLayout = clonedDoc.querySelector('#regularCardLayout');
                            
                            if (currentTemplate === 'postcard') {
                                    // Ensure postcard layout is visible and properly styled
                                    if (clonedPostcardLayout) {
                                        clonedPostcardLayout.style.display = 'flex';
                                        clonedPostcardLayout.style.width = '100%';
                                        clonedPostcardLayout.style.height = '100%';
                                        clonedPostcardLayout.style.position = 'relative';
                                        clonedPostcardLayout.style.flexDirection = 'row';
                                        clonedPostcardLayout.style.border = 'none';
                                        clonedPostcardLayout.style.outline = 'none';
                                        clonedPostcardLayout.style.boxShadow = 'none';
                                    }
                                if (clonedRegularLayout) {
                                    clonedRegularLayout.style.display = 'none';
                                }
                                
                                // Ensure card content has no padding for postcard
                                const clonedCardContent = clonedDoc.querySelector('#cardContent');
                                if (clonedCardContent) {
                                    clonedCardContent.style.padding = '0';
                                    clonedCardContent.style.border = 'none';
                                    clonedCardContent.style.boxShadow = 'none';
                                    clonedCardContent.style.outline = 'none';
                                }
                                
                                // Fix postcard message side
                                const clonedMessageSide = clonedDoc.querySelector('.postcard-message-side');
                                if (clonedMessageSide) {
                                    clonedMessageSide.style.flex = '1';
                                    clonedMessageSide.style.padding = '2rem';
                                    clonedMessageSide.style.display = 'flex';
                                    clonedMessageSide.style.flexDirection = 'column';
                                    clonedMessageSide.style.justifyContent = 'space-between';
                                    clonedMessageSide.style.border = 'none';
                                    clonedMessageSide.style.outline = 'none';
                                    clonedMessageSide.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard divider
                                const clonedDivider = clonedDoc.querySelector('.postcard-divider');
                                if (clonedDivider) {
                                    clonedDivider.style.width = '1px';
                                    clonedDivider.style.height = 'auto';
                                    clonedDivider.style.background = '#1a1a1a';
                                    clonedDivider.style.margin = '1rem 0';
                                    clonedDivider.style.border = 'none';
                                    clonedDivider.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard address side
                                const clonedAddressSide = clonedDoc.querySelector('.postcard-address-side');
                                if (clonedAddressSide) {
                                    clonedAddressSide.style.flex = '1';
                                    clonedAddressSide.style.padding = '2rem';
                                    clonedAddressSide.style.display = 'flex';
                                    clonedAddressSide.style.flexDirection = 'column';
                                    clonedAddressSide.style.position = 'relative';
                                    clonedAddressSide.style.border = 'none';
                                    clonedAddressSide.style.outline = 'none';
                                    clonedAddressSide.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard stamp
                                const clonedStamp = clonedDoc.querySelector('#postcardStamp');
                                if (clonedStamp) {
                                    clonedStamp.style.position = 'absolute';
                                    clonedStamp.style.top = '1.5rem';
                                    clonedStamp.style.right = '1.5rem';
                                    clonedStamp.style.width = '80px';
                                    clonedStamp.style.height = '80px';
                                    clonedStamp.style.border = '2px dashed #999';
                                    clonedStamp.style.borderRadius = '4px';
                                    clonedStamp.style.display = 'flex';
                                    clonedStamp.style.flexDirection = 'column';
                                    clonedStamp.style.alignItems = 'center';
                                    clonedStamp.style.justifyContent = 'center';
                                    clonedStamp.style.background = '#f5f5f5';
                                    clonedStamp.style.padding = '0.5rem';
                                }
                                
                                // Fix postcard textareas - convert to divs
                                const clonedPostcardMessage = clonedDoc.querySelector('#postcardMessage');
                                if (clonedPostcardMessage) {
                                    const postcardDiv = clonedDoc.createElement('div');
                                    postcardDiv.id = 'postcardMessage';
                                    postcardDiv.className = clonedPostcardMessage.className;
                                    postcardDiv.style.cssText = clonedPostcardMessage.style.cssText;
                                    postcardDiv.style.flex = '1';
                                    postcardDiv.style.width = '100%';
                                    postcardDiv.style.overflow = 'visible';
                                    postcardDiv.style.height = 'auto';
                                    postcardDiv.style.whiteSpace = 'pre-wrap';
                                    postcardDiv.style.wordWrap = 'break-word';
                                    postcardDiv.style.display = 'block';
                                    postcardDiv.textContent = clonedPostcardMessage.value || clonedPostcardMessage.textContent;
                                    clonedPostcardMessage.parentNode.replaceChild(postcardDiv, clonedPostcardMessage);
                                }
                                
                                const clonedPostcardAddress = clonedDoc.querySelector('#postcardAddress');
                                if (clonedPostcardAddress) {
                                    const addressDiv = clonedDoc.createElement('div');
                                    addressDiv.id = 'postcardAddress';
                                    addressDiv.className = clonedPostcardAddress.className;
                                    addressDiv.style.cssText = clonedPostcardAddress.style.cssText;
                                    addressDiv.style.width = '100%';
                                    addressDiv.style.overflow = 'visible';
                                    addressDiv.style.height = 'auto';
                                    addressDiv.style.whiteSpace = 'pre-wrap';
                                    addressDiv.style.wordWrap = 'break-word';
                                    addressDiv.style.display = 'block';
                                    addressDiv.textContent = clonedPostcardAddress.value || clonedPostcardAddress.textContent;
                                    clonedPostcardAddress.parentNode.replaceChild(addressDiv, clonedPostcardAddress);
                                }
                                
                                const clonedSignature = clonedDoc.querySelector('#postcardSignature');
                                if (clonedSignature) {
                                    const signatureDiv = clonedDoc.createElement('div');
                                    signatureDiv.id = 'postcardSignature';
                                    signatureDiv.className = clonedSignature.className;
                                    signatureDiv.style.cssText = clonedSignature.style.cssText;
                                    signatureDiv.style.width = '100%';
                                    signatureDiv.style.display = 'block';
                                    signatureDiv.textContent = clonedSignature.value || clonedSignature.textContent;
                                    clonedSignature.parentNode.replaceChild(signatureDiv, clonedSignature);
                                }
                                
                                // Fix stamp image in postcard
                                const clonedStampImage = clonedDoc.querySelector('#stampImage');
                                const clonedStampLogo = clonedDoc.querySelector('#stampLogo');
                                if (clonedStampImage && clonedStampImage.src && clonedStampImage.src !== '' && clonedStampImage.src !== window.location.href) {
                                    clonedStampImage.style.display = 'block';
                                    clonedStampImage.style.width = '100%';
                                    clonedStampImage.style.height = 'auto';
                                    clonedStampImage.style.maxHeight = '50px';
                                    clonedStampImage.style.objectFit = 'contain';
                                    if (clonedStampLogo) {
                                        clonedStampLogo.style.display = 'none';
                                    }
                                } else if (clonedStampLogo) {
                                    clonedStampLogo.style.display = 'flex';
                                    if (clonedStampImage) {
                                        clonedStampImage.style.display = 'none';
                                    }
                                }
                            } else {
                                if (clonedPostcardLayout) {
                                    clonedPostcardLayout.style.display = 'none';
                                }
                                if (clonedRegularLayout) {
                                    clonedRegularLayout.style.display = 'block';
                                }
                                
                                // Fix regular card textarea
                                const clonedTextarea = clonedDoc.querySelector('#cardMessage');
                                if (clonedTextarea) {
                                    const textDiv = clonedDoc.createElement('div');
                                    textDiv.id = 'cardMessage';
                                    textDiv.className = clonedTextarea.className;
                                    textDiv.style.cssText = clonedTextarea.style.cssText;
                                    textDiv.style.overflow = 'visible';
                                    textDiv.style.height = 'auto';
                                    textDiv.style.whiteSpace = 'pre-wrap';
                                    textDiv.style.wordWrap = 'break-word';
                                    textDiv.style.display = 'block';
                                    textDiv.textContent = clonedTextarea.value || clonedTextarea.textContent;
                                    clonedTextarea.parentNode.replaceChild(textDiv, clonedTextarea);
                                }
                            }
                            
                            // Remove any unwanted shadows from decorations
                            const decorations = clonedDoc.querySelectorAll('.decoration-item');
                            decorations.forEach(dec => {
                                dec.style.filter = 'none';
                                dec.style.boxShadow = 'none';
                            });
                            
                            // Remove shadows from card content container
                            const clonedContent = clonedDoc.querySelector('#cardContent');
                            if (clonedContent) {
                                clonedContent.style.boxShadow = 'none';
                                clonedContent.style.filter = 'none';
                            }
                        }
                    }).then(canvas => {
                        if (cardMessage && currentTemplate !== 'postcard') {
                            cardMessage.style.overflow = originalOverflow;
                            cardMessage.style.height = originalHeight;
                        }
                        
                        canvas.toBlob(blob => {
                            if (!blob) {
                                showError('Failed to generate image');
                                return;
                            }
                            
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.download = 'christmas-card.png';
                            link.href = url;
                            link.click();
                            
                            // Native share
                            if (navigator.share) {
                                setTimeout(() => {
                                    blob.arrayBuffer().then(buffer => {
                                        const file = new File([buffer], 'christmas-card.png', { type: 'image/png' });
                                        navigator.share({
                                            title: 'My Christmas Card',
                                            text: 'Check out my Christmas card!',
                                            files: [file]
                                        }).catch(() => {});
                                    }).catch(() => {});
                                }, 100);
                            }
                            
                            showSuccess('Card image saved!');
                        }, 'image/png', 1.0);
                    }).catch(error => {
                        if (cardMessage && currentTemplate !== 'postcard') {
                            cardMessage.style.overflow = originalOverflow;
                            cardMessage.style.height = originalHeight;
                        }
                        console.error('Share error:', error);
                        showError('Failed to generate card image');
                    });
                }, 100);
            });
        } catch (error) {
            console.error('Share card error:', error);
            showError('Failed to share card');
        }
    }

    // Decorations
    const decorationsGrid = document.getElementById('decorationsGrid');
    if (decorationsGrid) {
        decorations.forEach((decoration, index) => {
            const btn = document.createElement('button');
            btn.className = 'decoration-btn';
            btn.textContent = decoration;
            btn.title = decoration;
            btn.addEventListener('click', () => {
                addDecorationToCard(decoration);
                saveCardState();
                if (soundEnabled) playSound('click');
            });
            decorationsGrid.appendChild(btn);
        });
    }
    
    // Save state on message change
    cardMessage.addEventListener('input', () => {
        saveCardState();
    });
    
    // Save state on postcard fields change
    const postcardMsgField = document.getElementById('postcardMessage');
    const postcardSigField = document.getElementById('postcardSignature');
    const postcardAddrField = document.getElementById('postcardAddress');
    
    if (postcardMsgField) {
        postcardMsgField.addEventListener('input', () => {
            saveCardState();
        });
    }
    if (postcardSigField) {
        postcardSigField.addEventListener('input', () => {
            saveCardState();
        });
    }
    if (postcardAddrField) {
        postcardAddrField.addEventListener('input', () => {
            saveCardState();
        });
    }
    
    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update tab contents
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            const targetTab = document.getElementById(`tab-${tabName}`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
            
            if (soundEnabled) playSound('click');
        });
    });
    
    // Image Upload
    const imageUpload = document.getElementById('imageUpload');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageControls = document.getElementById('imageControls');
    const uploadedImage = document.getElementById('uploadedImage');
    const uploadedImageContainer = document.getElementById('uploadedImageContainer');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const imageOpacitySlider = document.getElementById('imageOpacity');
    const imageOpacityValue = document.getElementById('imageOpacityValue');
    const imageSizeSlider = document.getElementById('imageSize');
    const imageSizeValue = document.getElementById('imageSizeValue');
    
    if (uploadImageBtn && imageUpload) {
        uploadImageBtn.addEventListener('click', () => imageUpload.click());
    }
    
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Drag and drop
    if (imageUploadArea) {
        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.classList.add('dragover');
        });
        
        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.classList.remove('dragover');
        });
        
        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                handleImageFile(files[0]);
            }
        });
    }
    
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        }
    }
    
    function handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageDataUrl = e.target.result;
            
            // If postcard template, use image as stamp
            if (currentTemplate === 'postcard') {
                const stampImage = document.getElementById('stampImage');
                const stampLogo = document.getElementById('stampLogo');
                if (stampImage && stampLogo) {
                    stampImage.src = imageDataUrl;
                    stampImage.style.display = 'block';
                    stampLogo.style.display = 'none';
                }
            } else {
                // Regular card - use as background image
                const uploadedImageEl = document.getElementById('uploadedImage');
                if (uploadedImageEl) {
                    uploadedImageEl.src = imageDataUrl;
                    uploadedImageEl.onload = () => {
                        updateImageStyle();
                    };
                }
                if (uploadedImageContainer) {
                    uploadedImageContainer.style.display = 'flex';
                }
                updateImageStyle();
            }
            
            if (imageUploadArea) {
                imageUploadArea.style.display = 'none';
            }
            if (imageControls) {
                imageControls.style.display = 'block';
            }
            saveCardState();
            if (soundEnabled) playSound('success');
        };
        reader.readAsDataURL(file);
    }
    
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            // Handle postcard stamp
            if (currentTemplate === 'postcard') {
                const stampImage = document.getElementById('stampImage');
                const stampLogo = document.getElementById('stampLogo');
                if (stampImage && stampLogo) {
                    stampImage.src = '';
                    stampImage.style.display = 'none';
                    stampLogo.style.display = 'flex';
                }
            } else {
                // Handle regular card image
                const uploadedImageEl = document.getElementById('uploadedImage');
                if (uploadedImageEl) {
                    uploadedImageEl.src = '';
                }
                if (uploadedImageContainer) {
                    uploadedImageContainer.style.display = 'none';
                }
            }
            
            if (imageUploadArea) {
                imageUploadArea.style.display = 'block';
            }
            if (imageControls) {
                imageControls.style.display = 'none';
            }
            if (imageUpload) {
                imageUpload.value = '';
            }
            saveCardState();
            if (soundEnabled) playSound('click');
        });
    }
    
    if (imageOpacitySlider && imageOpacityValue) {
        imageOpacitySlider.addEventListener('input', (e) => {
            imageOpacity = e.target.value;
            imageOpacityValue.textContent = imageOpacity + '%';
            if (currentTemplate === 'postcard') {
                // For postcard, adjust stamp image opacity
                const stampImage = document.getElementById('stampImage');
                if (stampImage) {
                    stampImage.style.opacity = imageOpacity / 100;
                }
            } else {
                updateImageStyle();
            }
            saveCardState();
        });
    }
    
    if (imageSizeSlider && imageSizeValue) {
        imageSizeSlider.addEventListener('input', (e) => {
            imageSize = e.target.value;
            imageSizeValue.textContent = imageSize + '%';
            if (currentTemplate === 'postcard') {
                // For postcard, adjust stamp image size
                const stampImage = document.getElementById('stampImage');
                if (stampImage) {
                    stampImage.style.width = imageSize + '%';
                    stampImage.style.height = 'auto';
                }
            } else {
                updateImageStyle();
            }
            saveCardState();
        });
    }
    
    // Image Position (only for regular cards, not postcard)
    document.querySelectorAll('.position-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentTemplate === 'postcard') {
                // Position buttons don't apply to postcard stamp
                return;
            }
            imagePosition = btn.dataset.position;
            document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateImageStyle();
            saveCardState();
            if (soundEnabled) playSound('click');
        });
    });
    
    function updateImageStyle() {
        if (currentTemplate === 'postcard') {
            // Postcard uses stamp, not background image
            return;
        }
        
        const uploadedImageEl = document.getElementById('uploadedImage');
        if (!uploadedImageEl) return;
        
        uploadedImageEl.style.opacity = imageOpacity / 100;
        uploadedImageEl.style.width = imageSize + '%';
        uploadedImageEl.style.height = imageSize + '%';
        uploadedImageEl.style.objectFit = 'contain';
        
        const container = uploadedImageContainer;
        if (!container) return;
        
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        
        const positions = {
            'top-left': { justifyContent: 'flex-start', alignItems: 'flex-start' },
            'top-center': { justifyContent: 'center', alignItems: 'flex-start' },
            'top-right': { justifyContent: 'flex-end', alignItems: 'flex-start' },
            'center-left': { justifyContent: 'flex-start', alignItems: 'center' },
            'center': { justifyContent: 'center', alignItems: 'center' },
            'center-right': { justifyContent: 'flex-end', alignItems: 'center' },
            'bottom-left': { justifyContent: 'flex-start', alignItems: 'flex-end' },
            'bottom-center': { justifyContent: 'center', alignItems: 'flex-end' },
            'bottom-right': { justifyContent: 'flex-end', alignItems: 'flex-end' }
        };
        
        const pos = positions[imagePosition] || positions['center'];
        container.style.justifyContent = pos.justifyContent;
        container.style.alignItems = pos.alignItems;
    }
    
    // Frame functionality completely removed - no frames at all
    
    // Initialize card state
    // Set default text shadow
    if (textShadow && textShadow.checked) {
        cardMessage.style.textShadow = '2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.3)';
    }
    // Set default text color
    cardMessage.style.color = currentTextColor;
    // Mark first text color button as active
    const firstTextColorBtn = document.querySelector('[data-textcolor]');
    if (firstTextColorBtn) {
        firstTextColorBtn.classList.add('active');
    }
    // Frame initialization removed - no frames
    updateBackgroundColorVisibility();
    
    // Initialize postcard fonts
    const postcardMsgInit = document.getElementById('postcardMessage');
    const postcardSigInit = document.getElementById('postcardSignature');
    const postcardAddrInit = document.getElementById('postcardAddress');
    if (postcardMsgInit) {
        postcardMsgInit.style.fontFamily = 'Poppins, sans-serif';
    }
    if (postcardSigInit) {
        postcardSigInit.style.fontFamily = 'Poppins, sans-serif';
    }
    if (postcardAddrInit) {
        postcardAddrInit.style.fontFamily = 'Poppins, sans-serif';
    }
    
    saveCardState();

    // Clear Decorations
    document.getElementById('clearDecorations').addEventListener('click', () => {
        const decorations = cardContent.querySelectorAll('.decoration-item');
        decorations.forEach(dec => dec.remove());
        decorationCount = 0;
        if (soundEnabled) playSound('click');
    });

    function addDecorationToCard(decoration) {
        const decorationItem = document.createElement('div');
        decorationItem.className = 'decoration-item';
        decorationItem.textContent = decoration;
        decorationItem.style.left = `${20 + (decorationCount % 3) * 30}%`;
        decorationItem.style.top = `${20 + Math.floor(decorationCount / 3) * 30}%`;
        decorationCount++;

        makeDraggable(decorationItem);
        
        // Add delete button on decoration
        decorationItem.addEventListener('dblclick', () => {
            decorationItem.remove();
            decorationCount = Math.max(0, decorationCount - 1);
            saveCardState();
        });
        
        cardContent.appendChild(decorationItem);
    }

    function makeDraggable(element) {
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        element.addEventListener('mousedown', dragStart);
        element.addEventListener('touchstart', dragStart);

        function dragStart(e) {
            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - element.offsetLeft;
                initialY = e.touches[0].clientY - element.offsetTop;
            } else {
                initialX = e.clientX - element.offsetLeft;
                initialY = e.clientY - element.offsetTop;
            }

            if (e.target === element || element.contains(e.target)) {
                isDragging = true;
                element.style.cursor = 'grabbing';
            }
        }

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);

        function drag(e) {
            if (!isDragging) return;

            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            const cardPreview = document.getElementById('cardPreview');
            const rect = cardPreview.getBoundingClientRect();
            
            currentX = Math.max(0, Math.min(currentX, rect.width - element.offsetWidth));
            currentY = Math.max(0, Math.min(currentY, rect.height - element.offsetHeight));

            element.style.left = currentX + 'px';
            element.style.top = currentY + 'px';
        }

        function dragEnd() {
            isDragging = false;
            element.style.cursor = 'move';
        }
    }

    // Download Card
    document.getElementById('downloadCard').addEventListener('click', () => {
        downloadCard();
        if (soundEnabled) playSound('success');
    });

    // Email Card
    document.getElementById('emailCard').addEventListener('click', () => {
        emailCard();
        if (soundEnabled) playSound('success');
    });

    function downloadCard() {
        try {
            const cardPreview = document.getElementById('cardPreview');
            if (!cardPreview) {
                showError('Card preview not found');
                return;
            }
            
            // Ensure all images are loaded before capturing
            const images = cardPreview.querySelectorAll('img');
            const imagePromises = Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    setTimeout(resolve, 1000); // Timeout after 1 second
                });
            });
            
            Promise.all(imagePromises).then(() => {
                // Ensure textarea content is visible (for regular cards)
                const cardMessage = document.getElementById('cardMessage');
                let originalOverflow = '';
                let originalHeight = '';
                if (cardMessage && currentTemplate !== 'postcard') {
                    originalOverflow = cardMessage.style.overflow;
                    originalHeight = cardMessage.style.height;
                    cardMessage.style.overflow = 'visible';
                    cardMessage.style.height = 'auto';
                }
                
                // Fix postcard textareas
                if (currentTemplate === 'postcard') {
                    const postcardMessage = document.getElementById('postcardMessage');
                    const postcardAddress = document.getElementById('postcardAddress');
                    if (postcardMessage) {
                        postcardMessage.style.overflow = 'visible';
                        postcardMessage.style.height = 'auto';
                    }
                    if (postcardAddress) {
                        postcardAddress.style.overflow = 'visible';
                        postcardAddress.style.height = 'auto';
                    }
                }
                
                // Small delay to ensure all styles are applied
                setTimeout(() => {
                    html2canvas(cardPreview, {
                        backgroundColor: null,
                        scale: 2,
                        useCORS: true,
                        allowTaint: false,
                        logging: false,
                        width: cardPreview.offsetWidth,
                        height: cardPreview.offsetHeight,
                        windowWidth: cardPreview.scrollWidth,
                        windowHeight: cardPreview.scrollHeight,
                        onclone: (clonedDoc) => {
                            // Remove unwanted shadows and effects from cloned card
                            const clonedCard = clonedDoc.querySelector('#cardPreview');
                            if (clonedCard) {
                                clonedCard.style.boxShadow = 'none';
                                clonedCard.style.filter = 'none';
                                clonedCard.style.transform = 'none';
                                clonedCard.style.outline = 'none';
                                // Remove border for postcard
                                if (currentTemplate === 'postcard') {
                                    clonedCard.style.border = 'none';
                                    clonedCard.style.borderRadius = '0';
                                }
                            }
                            
                            // Frame overlay removed - no frames in card maker
                            
                            // Fix textarea in cloned document - convert to div for better rendering
                            const clonedTextarea = clonedDoc.querySelector('#cardMessage');
                            if (clonedTextarea) {
                                // Create a div to replace textarea for better canvas rendering
                                const textDiv = clonedDoc.createElement('div');
                                textDiv.id = 'cardMessage';
                                textDiv.className = clonedTextarea.className;
                                textDiv.style.cssText = clonedTextarea.style.cssText;
                                textDiv.style.overflow = 'visible';
                                textDiv.style.height = 'auto';
                                textDiv.style.whiteSpace = 'pre-wrap';
                                textDiv.style.wordWrap = 'break-word';
                                textDiv.style.display = 'block';
                                textDiv.textContent = clonedTextarea.value || clonedTextarea.textContent;
                                
                                // Replace textarea with div
                                clonedTextarea.parentNode.replaceChild(textDiv, clonedTextarea);
                            }
                            
                            // Fix postcard layout visibility in clone
                            const clonedPostcardLayout = clonedDoc.querySelector('#postcardLayout');
                            const clonedRegularLayout = clonedDoc.querySelector('#regularCardLayout');
                            
                            if (currentTemplate === 'postcard') {
                                    // Ensure postcard layout is visible and properly styled
                                    if (clonedPostcardLayout) {
                                        clonedPostcardLayout.style.display = 'flex';
                                        clonedPostcardLayout.style.width = '100%';
                                        clonedPostcardLayout.style.height = '100%';
                                        clonedPostcardLayout.style.position = 'relative';
                                        clonedPostcardLayout.style.flexDirection = 'row';
                                        clonedPostcardLayout.style.border = 'none';
                                        clonedPostcardLayout.style.outline = 'none';
                                        clonedPostcardLayout.style.boxShadow = 'none';
                                    }
                                if (clonedRegularLayout) {
                                    clonedRegularLayout.style.display = 'none';
                                }
                                
                                // Ensure card content has no padding for postcard
                                const clonedCardContent = clonedDoc.querySelector('#cardContent');
                                if (clonedCardContent) {
                                    clonedCardContent.style.padding = '0';
                                    clonedCardContent.style.border = 'none';
                                    clonedCardContent.style.boxShadow = 'none';
                                    clonedCardContent.style.outline = 'none';
                                }
                                
                                // Fix postcard message side
                                const clonedMessageSide = clonedDoc.querySelector('.postcard-message-side');
                                if (clonedMessageSide) {
                                    clonedMessageSide.style.flex = '1';
                                    clonedMessageSide.style.padding = '2rem';
                                    clonedMessageSide.style.display = 'flex';
                                    clonedMessageSide.style.flexDirection = 'column';
                                    clonedMessageSide.style.justifyContent = 'space-between';
                                    clonedMessageSide.style.border = 'none';
                                    clonedMessageSide.style.outline = 'none';
                                    clonedMessageSide.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard divider
                                const clonedDivider = clonedDoc.querySelector('.postcard-divider');
                                if (clonedDivider) {
                                    clonedDivider.style.width = '1px';
                                    clonedDivider.style.height = 'auto';
                                    clonedDivider.style.background = '#1a1a1a';
                                    clonedDivider.style.margin = '1rem 0';
                                    clonedDivider.style.border = 'none';
                                    clonedDivider.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard address side
                                const clonedAddressSide = clonedDoc.querySelector('.postcard-address-side');
                                if (clonedAddressSide) {
                                    clonedAddressSide.style.flex = '1';
                                    clonedAddressSide.style.padding = '2rem';
                                    clonedAddressSide.style.display = 'flex';
                                    clonedAddressSide.style.flexDirection = 'column';
                                    clonedAddressSide.style.position = 'relative';
                                    clonedAddressSide.style.border = 'none';
                                    clonedAddressSide.style.outline = 'none';
                                    clonedAddressSide.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard stamp
                                const clonedStamp = clonedDoc.querySelector('#postcardStamp');
                                if (clonedStamp) {
                                    clonedStamp.style.position = 'absolute';
                                    clonedStamp.style.top = '1.5rem';
                                    clonedStamp.style.right = '1.5rem';
                                    clonedStamp.style.width = '80px';
                                    clonedStamp.style.height = '80px';
                                    clonedStamp.style.border = '2px dashed #999';
                                    clonedStamp.style.borderRadius = '4px';
                                    clonedStamp.style.display = 'flex';
                                    clonedStamp.style.flexDirection = 'column';
                                    clonedStamp.style.alignItems = 'center';
                                    clonedStamp.style.justifyContent = 'center';
                                    clonedStamp.style.background = '#f5f5f5';
                                    clonedStamp.style.padding = '0.5rem';
                                }
                                
                                // Fix postcard textareas - convert to divs
                                const clonedPostcardMessage = clonedDoc.querySelector('#postcardMessage');
                                if (clonedPostcardMessage) {
                                    const postcardDiv = clonedDoc.createElement('div');
                                    postcardDiv.id = 'postcardMessage';
                                    postcardDiv.className = clonedPostcardMessage.className;
                                    postcardDiv.style.cssText = clonedPostcardMessage.style.cssText;
                                    postcardDiv.style.flex = '1';
                                    postcardDiv.style.width = '100%';
                                    postcardDiv.style.overflow = 'visible';
                                    postcardDiv.style.height = 'auto';
                                    postcardDiv.style.whiteSpace = 'pre-wrap';
                                    postcardDiv.style.wordWrap = 'break-word';
                                    postcardDiv.style.display = 'block';
                                    postcardDiv.textContent = clonedPostcardMessage.value || clonedPostcardMessage.textContent;
                                    clonedPostcardMessage.parentNode.replaceChild(postcardDiv, clonedPostcardMessage);
                                }
                                
                                const clonedPostcardAddress = clonedDoc.querySelector('#postcardAddress');
                                if (clonedPostcardAddress) {
                                    const addressDiv = clonedDoc.createElement('div');
                                    addressDiv.id = 'postcardAddress';
                                    addressDiv.className = clonedPostcardAddress.className;
                                    addressDiv.style.cssText = clonedPostcardAddress.style.cssText;
                                    addressDiv.style.width = '100%';
                                    addressDiv.style.overflow = 'visible';
                                    addressDiv.style.height = 'auto';
                                    addressDiv.style.whiteSpace = 'pre-wrap';
                                    addressDiv.style.wordWrap = 'break-word';
                                    addressDiv.style.display = 'block';
                                    addressDiv.textContent = clonedPostcardAddress.value || clonedPostcardAddress.textContent;
                                    clonedPostcardAddress.parentNode.replaceChild(addressDiv, clonedPostcardAddress);
                                }
                                
                                const clonedSignature = clonedDoc.querySelector('#postcardSignature');
                                if (clonedSignature) {
                                    const signatureDiv = clonedDoc.createElement('div');
                                    signatureDiv.id = 'postcardSignature';
                                    signatureDiv.className = clonedSignature.className;
                                    signatureDiv.style.cssText = clonedSignature.style.cssText;
                                    signatureDiv.style.width = '100%';
                                    signatureDiv.style.display = 'block';
                                    signatureDiv.textContent = clonedSignature.value || clonedSignature.textContent;
                                    clonedSignature.parentNode.replaceChild(signatureDiv, clonedSignature);
                                }
                                
                                // Fix stamp image in postcard
                                const clonedStampImage = clonedDoc.querySelector('#stampImage');
                                const clonedStampLogo = clonedDoc.querySelector('#stampLogo');
                                if (clonedStampImage && clonedStampImage.src && clonedStampImage.src !== '' && clonedStampImage.src !== window.location.href) {
                                    clonedStampImage.style.display = 'block';
                                    clonedStampImage.style.width = '100%';
                                    clonedStampImage.style.height = 'auto';
                                    clonedStampImage.style.maxHeight = '50px';
                                    clonedStampImage.style.objectFit = 'contain';
                                    if (clonedStampLogo) {
                                        clonedStampLogo.style.display = 'none';
                                    }
                                } else if (clonedStampLogo) {
                                    clonedStampLogo.style.display = 'flex';
                                    if (clonedStampImage) {
                                        clonedStampImage.style.display = 'none';
                                    }
                                }
                            } else {
                                if (clonedPostcardLayout) {
                                    clonedPostcardLayout.style.display = 'none';
                                }
                                if (clonedRegularLayout) {
                                    clonedRegularLayout.style.display = 'block';
                                }
                                
                                // Fix regular card textarea
                                const clonedTextarea = clonedDoc.querySelector('#cardMessage');
                                if (clonedTextarea) {
                                    const textDiv = clonedDoc.createElement('div');
                                    textDiv.id = 'cardMessage';
                                    textDiv.className = clonedTextarea.className;
                                    textDiv.style.cssText = clonedTextarea.style.cssText;
                                    textDiv.style.overflow = 'visible';
                                    textDiv.style.height = 'auto';
                                    textDiv.style.whiteSpace = 'pre-wrap';
                                    textDiv.style.wordWrap = 'break-word';
                                    textDiv.style.display = 'block';
                                    textDiv.textContent = clonedTextarea.value || clonedTextarea.textContent;
                                    clonedTextarea.parentNode.replaceChild(textDiv, clonedTextarea);
                                }
                            }
                            
                            // Remove any unwanted shadows from decorations
                            const decorations = clonedDoc.querySelectorAll('.decoration-item');
                            decorations.forEach(dec => {
                                dec.style.filter = 'none';
                                dec.style.boxShadow = 'none';
                            });
                            
                            // Remove shadows from card content container
                            const clonedContent = clonedDoc.querySelector('#cardContent');
                            if (clonedContent) {
                                clonedContent.style.boxShadow = 'none';
                                clonedContent.style.filter = 'none';
                            }
                        }
                    }).then(canvas => {
                        // Restore original styles
                        if (cardMessage && currentTemplate !== 'postcard') {
                            cardMessage.style.overflow = originalOverflow;
                            cardMessage.style.height = originalHeight;
                        }
                        
                        const link = document.createElement('a');
                        link.download = 'christmas-card.png';
                        link.href = canvas.toDataURL('image/png', 1.0);
                        link.click();
                        incrementStat('cardsCreated');
                        cardCreated();
                        showSuccess('Card downloaded successfully!');
                    }).catch(error => {
                        // Restore original styles on error
                        if (cardMessage && currentTemplate !== 'postcard') {
                            cardMessage.style.overflow = originalOverflow;
                            cardMessage.style.height = originalHeight;
                        }
                        console.error('Download error:', error);
                        showError('Failed to download card. Please try again.');
                    });
                }, 100);
            }).catch(() => {
                // Continue even if some images fail to load
                const cardMessage = document.getElementById('cardMessage');
                const originalOverflow = cardMessage.style.overflow;
                const originalHeight = cardMessage.style.height;
                cardMessage.style.overflow = 'visible';
                cardMessage.style.height = 'auto';
                
                setTimeout(() => {
                    html2canvas(cardPreview, {
                        backgroundColor: null,
                        scale: 2,
                        useCORS: true,
                        allowTaint: false,
                        logging: false,
                        onclone: (clonedDoc) => {
                            // Remove unwanted shadows and effects from cloned card
                            const clonedCard = clonedDoc.querySelector('#cardPreview');
                            if (clonedCard) {
                                clonedCard.style.boxShadow = 'none';
                                clonedCard.style.filter = 'none';
                                clonedCard.style.transform = 'none';
                                clonedCard.style.outline = 'none';
                                // Remove border for postcard
                                if (currentTemplate === 'postcard') {
                                    clonedCard.style.border = 'none';
                                    clonedCard.style.borderRadius = '0';
                                }
                            }
                            
                            // Frame overlay removed - no frames in card maker
                            
                            // Fix textarea in cloned document - convert to div for better rendering
                            const clonedTextarea = clonedDoc.querySelector('#cardMessage');
                            if (clonedTextarea) {
                                // Create a div to replace textarea for better canvas rendering
                                const textDiv = clonedDoc.createElement('div');
                                textDiv.id = 'cardMessage';
                                textDiv.className = clonedTextarea.className;
                                textDiv.style.cssText = clonedTextarea.style.cssText;
                                textDiv.style.overflow = 'visible';
                                textDiv.style.height = 'auto';
                                textDiv.style.whiteSpace = 'pre-wrap';
                                textDiv.style.wordWrap = 'break-word';
                                textDiv.style.display = 'block';
                                textDiv.textContent = clonedTextarea.value || clonedTextarea.textContent;
                                
                                // Replace textarea with div
                                clonedTextarea.parentNode.replaceChild(textDiv, clonedTextarea);
                            }
                            
                            // Fix postcard layout visibility in clone
                            const clonedPostcardLayout = clonedDoc.querySelector('#postcardLayout');
                            const clonedRegularLayout = clonedDoc.querySelector('#regularCardLayout');
                            
                            if (currentTemplate === 'postcard') {
                                    // Ensure postcard layout is visible and properly styled
                                    if (clonedPostcardLayout) {
                                        clonedPostcardLayout.style.display = 'flex';
                                        clonedPostcardLayout.style.width = '100%';
                                        clonedPostcardLayout.style.height = '100%';
                                        clonedPostcardLayout.style.position = 'relative';
                                        clonedPostcardLayout.style.flexDirection = 'row';
                                        clonedPostcardLayout.style.border = 'none';
                                        clonedPostcardLayout.style.outline = 'none';
                                        clonedPostcardLayout.style.boxShadow = 'none';
                                    }
                                if (clonedRegularLayout) {
                                    clonedRegularLayout.style.display = 'none';
                                }
                                
                                // Ensure card content has no padding for postcard
                                const clonedCardContent = clonedDoc.querySelector('#cardContent');
                                if (clonedCardContent) {
                                    clonedCardContent.style.padding = '0';
                                    clonedCardContent.style.border = 'none';
                                    clonedCardContent.style.boxShadow = 'none';
                                    clonedCardContent.style.outline = 'none';
                                }
                                
                                // Fix postcard message side
                                const clonedMessageSide = clonedDoc.querySelector('.postcard-message-side');
                                if (clonedMessageSide) {
                                    clonedMessageSide.style.flex = '1';
                                    clonedMessageSide.style.padding = '2rem';
                                    clonedMessageSide.style.display = 'flex';
                                    clonedMessageSide.style.flexDirection = 'column';
                                    clonedMessageSide.style.justifyContent = 'space-between';
                                    clonedMessageSide.style.border = 'none';
                                    clonedMessageSide.style.outline = 'none';
                                    clonedMessageSide.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard divider
                                const clonedDivider = clonedDoc.querySelector('.postcard-divider');
                                if (clonedDivider) {
                                    clonedDivider.style.width = '1px';
                                    clonedDivider.style.height = 'auto';
                                    clonedDivider.style.background = '#1a1a1a';
                                    clonedDivider.style.margin = '1rem 0';
                                    clonedDivider.style.border = 'none';
                                    clonedDivider.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard address side
                                const clonedAddressSide = clonedDoc.querySelector('.postcard-address-side');
                                if (clonedAddressSide) {
                                    clonedAddressSide.style.flex = '1';
                                    clonedAddressSide.style.padding = '2rem';
                                    clonedAddressSide.style.display = 'flex';
                                    clonedAddressSide.style.flexDirection = 'column';
                                    clonedAddressSide.style.position = 'relative';
                                    clonedAddressSide.style.border = 'none';
                                    clonedAddressSide.style.outline = 'none';
                                    clonedAddressSide.style.boxShadow = 'none';
                                }
                                
                                // Fix postcard stamp
                                const clonedStamp = clonedDoc.querySelector('#postcardStamp');
                                if (clonedStamp) {
                                    clonedStamp.style.position = 'absolute';
                                    clonedStamp.style.top = '1.5rem';
                                    clonedStamp.style.right = '1.5rem';
                                    clonedStamp.style.width = '80px';
                                    clonedStamp.style.height = '80px';
                                    clonedStamp.style.border = '2px dashed #999';
                                    clonedStamp.style.borderRadius = '4px';
                                    clonedStamp.style.display = 'flex';
                                    clonedStamp.style.flexDirection = 'column';
                                    clonedStamp.style.alignItems = 'center';
                                    clonedStamp.style.justifyContent = 'center';
                                    clonedStamp.style.background = '#f5f5f5';
                                    clonedStamp.style.padding = '0.5rem';
                                }
                                
                                // Fix postcard textareas - convert to divs
                                const clonedPostcardMessage = clonedDoc.querySelector('#postcardMessage');
                                if (clonedPostcardMessage) {
                                    const postcardDiv = clonedDoc.createElement('div');
                                    postcardDiv.id = 'postcardMessage';
                                    postcardDiv.className = clonedPostcardMessage.className;
                                    postcardDiv.style.cssText = clonedPostcardMessage.style.cssText;
                                    postcardDiv.style.flex = '1';
                                    postcardDiv.style.width = '100%';
                                    postcardDiv.style.overflow = 'visible';
                                    postcardDiv.style.height = 'auto';
                                    postcardDiv.style.whiteSpace = 'pre-wrap';
                                    postcardDiv.style.wordWrap = 'break-word';
                                    postcardDiv.style.display = 'block';
                                    postcardDiv.textContent = clonedPostcardMessage.value || clonedPostcardMessage.textContent;
                                    clonedPostcardMessage.parentNode.replaceChild(postcardDiv, clonedPostcardMessage);
                                }
                                
                                const clonedPostcardAddress = clonedDoc.querySelector('#postcardAddress');
                                if (clonedPostcardAddress) {
                                    const addressDiv = clonedDoc.createElement('div');
                                    addressDiv.id = 'postcardAddress';
                                    addressDiv.className = clonedPostcardAddress.className;
                                    addressDiv.style.cssText = clonedPostcardAddress.style.cssText;
                                    addressDiv.style.width = '100%';
                                    addressDiv.style.overflow = 'visible';
                                    addressDiv.style.height = 'auto';
                                    addressDiv.style.whiteSpace = 'pre-wrap';
                                    addressDiv.style.wordWrap = 'break-word';
                                    addressDiv.style.display = 'block';
                                    addressDiv.textContent = clonedPostcardAddress.value || clonedPostcardAddress.textContent;
                                    clonedPostcardAddress.parentNode.replaceChild(addressDiv, clonedPostcardAddress);
                                }
                                
                                const clonedSignature = clonedDoc.querySelector('#postcardSignature');
                                if (clonedSignature) {
                                    const signatureDiv = clonedDoc.createElement('div');
                                    signatureDiv.id = 'postcardSignature';
                                    signatureDiv.className = clonedSignature.className;
                                    signatureDiv.style.cssText = clonedSignature.style.cssText;
                                    signatureDiv.style.width = '100%';
                                    signatureDiv.style.display = 'block';
                                    signatureDiv.textContent = clonedSignature.value || clonedSignature.textContent;
                                    clonedSignature.parentNode.replaceChild(signatureDiv, clonedSignature);
                                }
                                
                                // Fix stamp image in postcard
                                const clonedStampImage = clonedDoc.querySelector('#stampImage');
                                const clonedStampLogo = clonedDoc.querySelector('#stampLogo');
                                if (clonedStampImage && clonedStampImage.src && clonedStampImage.src !== '' && clonedStampImage.src !== window.location.href) {
                                    clonedStampImage.style.display = 'block';
                                    clonedStampImage.style.width = '100%';
                                    clonedStampImage.style.height = 'auto';
                                    clonedStampImage.style.maxHeight = '50px';
                                    clonedStampImage.style.objectFit = 'contain';
                                    if (clonedStampLogo) {
                                        clonedStampLogo.style.display = 'none';
                                    }
                                } else if (clonedStampLogo) {
                                    clonedStampLogo.style.display = 'flex';
                                    if (clonedStampImage) {
                                        clonedStampImage.style.display = 'none';
                                    }
                                }
                            } else {
                                if (clonedPostcardLayout) {
                                    clonedPostcardLayout.style.display = 'none';
                                }
                                if (clonedRegularLayout) {
                                    clonedRegularLayout.style.display = 'block';
                                }
                                
                                // Fix regular card textarea
                                const clonedTextarea = clonedDoc.querySelector('#cardMessage');
                                if (clonedTextarea) {
                                    const textDiv = clonedDoc.createElement('div');
                                    textDiv.id = 'cardMessage';
                                    textDiv.className = clonedTextarea.className;
                                    textDiv.style.cssText = clonedTextarea.style.cssText;
                                    textDiv.style.overflow = 'visible';
                                    textDiv.style.height = 'auto';
                                    textDiv.style.whiteSpace = 'pre-wrap';
                                    textDiv.style.wordWrap = 'break-word';
                                    textDiv.style.display = 'block';
                                    textDiv.textContent = clonedTextarea.value || clonedTextarea.textContent;
                                    clonedTextarea.parentNode.replaceChild(textDiv, clonedTextarea);
                                }
                            }
                            
                            // Remove any unwanted shadows from decorations
                            const decorations = clonedDoc.querySelectorAll('.decoration-item');
                            decorations.forEach(dec => {
                                dec.style.filter = 'none';
                                dec.style.boxShadow = 'none';
                            });
                            
                            // Remove shadows from card content container
                            const clonedContent = clonedDoc.querySelector('#cardContent');
                            if (clonedContent) {
                                clonedContent.style.boxShadow = 'none';
                                clonedContent.style.filter = 'none';
                            }
                        }
                    }).then(canvas => {
                        if (cardMessage && currentTemplate !== 'postcard') {
                            cardMessage.style.overflow = originalOverflow;
                            cardMessage.style.height = originalHeight;
                        }
                        
                        const link = document.createElement('a');
                        link.download = 'christmas-card.png';
                        link.href = canvas.toDataURL('image/png', 1.0);
                        link.click();
                        incrementStat('cardsCreated');
                        cardCreated();
                        showSuccess('Card downloaded successfully!');
                    }).catch(error => {
                        if (cardMessage && currentTemplate !== 'postcard') {
                            cardMessage.style.overflow = originalOverflow;
                            cardMessage.style.height = originalHeight;
                        }
                        console.error('Download error:', error);
                        showError('Failed to download card. Please try again.');
                    });
                }, 100);
            });
        } catch (error) {
            console.error('Download error:', error);
            showError('Failed to download card. Please try again.');
        }
    }

    function emailCard() {
        try {
            const cardPreview = document.getElementById('cardPreview');
            if (!cardPreview) {
                showError('Card preview not found');
                return;
            }
            
            html2canvas(cardPreview, {
                backgroundColor: null,
                scale: 2
            }).then(canvas => {
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'christmas-card.png';
                    link.click();
                    
                    // Also open email client
                    setTimeout(() => {
                        const mailtoLink = `mailto:?subject=Merry Christmas!&body=Check out my Christmas card! I've attached it for you.`;
                        window.location.href = mailtoLink;
                    }, 500);
                    
                    incrementStat('cardsCreated');
                    cardCreated();
                    showSuccess('Card ready to email!');
                });
            }).catch(error => {
                console.error('Email card error:', error);
                showError('Failed to generate card image. Please try again.');
            });
        } catch (error) {
            console.error('Email card error:', error);
            showError('Failed to email card. Please try again.');
        }
    }
}

// Helper functions for color manipulation
function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount));
    const b = Math.max(0, Math.min(255, ((num >> 0) & 0xFF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xFF) + percent);
    const g = Math.min(255, ((num >> 8) & 0xFF) + percent);
    const b = Math.min(255, ((num >> 0) & 0xFF) + percent);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xFF) - percent);
    const g = Math.max(0, ((num >> 8) & 0xFF) - percent);
    const b = Math.max(0, ((num >> 0) & 0xFF) - percent);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Advent Calendar
function initAdventCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();
    
    // Check if we're in December
    const isDecember = currentMonth === 11; // December is month 11 (0-indexed)
    const isPastDecember = currentMonth > 11 || (currentMonth === 11 && currentDate > 25);
    
    // Create calendar for December (31 days)
    // First day of December 2024 is a Sunday (day 0)
    const firstDayOfWeek = new Date(currentYear, 11, 1).getDay(); // 0 = Sunday
    
    // Add empty cells for days before Dec 1
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Create cells for Dec 1-31
    for (let day = 1; day <= 31; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const isAdventDay = day <= 25; // Only days 1-25 are advent doors
        const isToday = isDecember && currentDate === day;
        const canOpen = isAdventDay && (isPastDecember || (isDecember && currentDate >= day));
        const isOpened = openedDoors.includes(day);
        
        if (isAdventDay) {
            dayCell.classList.add('advent-door');
            if (isOpened) {
                dayCell.classList.add('opened');
            } else if (!canOpen) {
                dayCell.classList.add('locked');
            }
            
            dayCell.innerHTML = `
                <div class="door-number">${day}</div>
                <div class="door-icon">${isOpened ? '🎁' : canOpen ? '🚪' : '🔒'}</div>
            `;
            
            if (canOpen && !isOpened) {
                dayCell.addEventListener('click', () => openDoor(day, dayCell));
                dayCell.style.cursor = 'pointer';
            } else if (!canOpen) {
                dayCell.style.cursor = 'not-allowed';
                dayCell.title = `Opens on December ${day}`;
            } else {
                dayCell.style.cursor = 'default';
            }
        } else {
            // Days 26-31 are regular calendar days (not advent doors)
            dayCell.classList.add('regular-day');
            dayCell.innerHTML = `
                <div class="day-number">${day}</div>
            `;
        }
        
        if (isToday) {
            dayCell.classList.add('today');
        }
        
        calendarGrid.appendChild(dayCell);
    }
}

function openDoor(day, doorElement) {
    if (openedDoors.includes(day)) {
        showDoorModal(day, adventContent[day]);
        return;
    }
    
    // Check if door can be opened today
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();
    const isDecember = currentMonth === 11;
    const isPastDecember = currentMonth > 11 || (currentMonth === 11 && currentDate > 25);
    
    // Can open if: past Dec 25 OR (in December AND current date >= door number)
    const canOpen = isPastDecember || (isDecember && currentDate >= day);
    
    if (!canOpen) {
        if (isDecember) {
            showError(`This door opens on December ${day}! Come back then!`);
        } else {
            showError(`This door opens on December ${day}!`);
        }
        return;
    }
    
    openedDoors.push(day);
    localStorage.setItem('openedDoors', JSON.stringify(openedDoors));
    incrementStat('doorsOpened');
    enhanceAdventCalendar(); // Update progress
    
    doorElement.classList.add('opened');
    doorElement.classList.remove('locked');
    const iconElement = doorElement.querySelector('.door-icon');
    if (iconElement) {
        iconElement.textContent = '🎁';
    }
    
    const content = adventContent[day];
    showDoorModal(day, content);
    
    if (soundEnabled) playSound('success');
}

function showDoorModal(day, content) {
    const modal = document.getElementById('doorModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h3>Day ${day}</h3>
        <p>${content.content}</p>
    `;
    
    modal.classList.add('active');
    
    document.getElementById('closeModal').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Personality Quiz
function initPersonalityQuiz() {
    renderQuiz();
    
    document.getElementById('retakeQuiz').addEventListener('click', () => {
        quizAnswers = [];
        currentQuestion = 0;
        document.getElementById('quizResult').style.display = 'none';
        renderQuiz();
        if (soundEnabled) playSound('click');
    });
}

function renderQuiz() {
    const quizContainer = document.getElementById('quizContainer');
    
    if (currentQuestion >= quizQuestions.length) {
        showQuizResult();
        return;
    }
    
    const question = quizQuestions[currentQuestion];
    
    quizContainer.innerHTML = `
        <div class="quiz-question">
            <h3>Question ${currentQuestion + 1} of ${quizQuestions.length}</h3>
            <h3>${question.question}</h3>
            <div class="quiz-options">
                ${question.options.map((option, index) => `
                    <div class="quiz-option" data-index="${index}">
                        ${option.text}
                    </div>
                `).join('')}
            </div>
            <div class="quiz-navigation">
                <button class="quiz-btn prev" ${currentQuestion === 0 ? 'disabled' : ''} id="prevQuestion">← Previous</button>
                <button class="quiz-btn next" id="nextQuestion">Next →</button>
            </div>
        </div>
    `;
    
    // Option selection
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            quizAnswers[currentQuestion] = parseInt(option.dataset.index);
            if (soundEnabled) playSound('click');
        });
    });
    
    // Navigation
    document.getElementById('prevQuestion').addEventListener('click', () => {
        if (currentQuestion > 0) {
            currentQuestion--;
            renderQuiz();
            if (soundEnabled) playSound('click');
        }
    });
    
    document.getElementById('nextQuestion').addEventListener('click', () => {
        if (quizAnswers[currentQuestion] !== undefined) {
            currentQuestion++;
            renderQuiz();
            if (soundEnabled) playSound('click');
        } else {
            alert('Please select an answer!');
        }
    });
}

function showQuizResult() {
    // Calculate result
    const characterCounts = { santa: 0, elf: 0, snowman: 0, reindeer: 0 };
    
    quizAnswers.forEach((answerIndex, questionIndex) => {
        const selectedOption = quizQuestions[questionIndex].options[answerIndex];
        characterCounts[selectedOption.character]++;
    });
    
    const resultCharacter = Object.keys(characterCounts).reduce((a, b) => 
        characterCounts[a] > characterCounts[b] ? a : b
    );
    
    const result = quizResults[resultCharacter];
    
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('quizResult').style.display = 'block';
    
    document.getElementById('resultContent').innerHTML = `
        <h2>${result.title}</h2>
        <div class="character-icon">${result.icon}</div>
        <p>${result.description}</p>
    `;
    
    // Share button
    document.getElementById('shareResult').addEventListener('click', () => {
        shareQuizResult(resultCharacter, result);
        if (soundEnabled) playSound('success');
    });
    
    incrementStat('quizzesTaken');
    if (soundEnabled) playSound('success');
}

function shareQuizResult(character, result) {
    try {
        // Create a canvas for Instagram Story (9:16 aspect ratio)
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920; // 9:16 ratio
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            showError('Canvas not supported in this browser');
            return;
        }
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Which Christmas', canvas.width / 2, 300);
    ctx.fillText('Character Are You?', canvas.width / 2, 400);
    
    // Character icon (larger)
    ctx.font = '200px Arial';
    ctx.fillText(result.icon, canvas.width / 2, 800);
    
    // Result title
    ctx.font = 'bold 70px Arial';
    ctx.fillText(result.title, canvas.width / 2, 1000);
    
    // Description
    ctx.font = '40px Arial';
    const words = result.description.split(' ');
    let line = '';
    let y = 1200;
    const maxWidth = canvas.width - 200;
    
    words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && y < 1700) {
            ctx.fillText(line, canvas.width / 2, y);
            line = word + ' ';
            y += 60;
        } else {
            line = testLine;
        }
    });
    ctx.fillText(line, canvas.width / 2, y);
    
        // Convert to image and show share options
        canvas.toBlob(blob => {
            if (!blob) {
                showError('Failed to generate image');
                return;
            }
            
            // Show share options modal with Instagram Story
            const shareText = `${result.title || 'My Christmas Character'}\n\n${result.description || 'Check out my Christmas character!'} 🎄`;
            showShareOptions('quiz', shareText, blob, result.title || 'My Christmas Character');
        }, 'image/png');
    } catch (error) {
        console.error('Share quiz result error:', error);
        showError('Failed to generate share image. Please try again.');
    }
}

// Lazy Loading Utilities
let leafletLoaded = false;
let html2canvasLoaded = false;

function loadLeaflet() {
    return new Promise((resolve, reject) => {
        if (typeof L !== 'undefined') {
            leafletLoaded = true;
            resolve();
            return;
        }
        
        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        
        // Load JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
            leafletLoaded = true;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
        if (typeof html2canvas !== 'undefined') {
            html2canvasLoaded = true;
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => {
            html2canvasLoaded = true;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Loading State Utilities
function showLoading(element, message = 'Loading...') {
    if (!element) return;
    const loader = document.createElement('div');
    loader.className = 'loading-spinner';
    loader.innerHTML = `
        <div class="spinner"></div>
        <p>${message}</p>
    `;
    element.appendChild(loader);
    return loader;
}

function hideLoading(loader) {
    if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
    }
}

// Sock Hanging
// Initialize empty - will be populated ONLY from Firebase (no localStorage, no demo data)
let sockData = [];
let sockStats = {"total": 0, "displayed": 0, "hanging": 0};
// Country rankings will be calculated dynamically from Firebase data - no separate storage
let map = null;
let userLocation = null;
let sockMarkers = [];

// City coordinates (lat, lng)
const cities = [
    { name: 'Seoul', country: '🇰🇷 Korea', lat: 37.5665, lng: 126.9780 },
    { name: 'Tokyo', country: '🇯🇵 Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'New York', country: '🇺🇸 USA', lat: 40.7128, lng: -74.0060 },
    { name: 'London', country: '🇬🇧 UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Paris', country: '🇫🇷 France', lat: 48.8566, lng: 2.3522 },
    { name: 'Sydney', country: '🇦🇺 Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Toronto', country: '🇨🇦 Canada', lat: 43.6532, lng: -79.3832 },
    { name: 'Berlin', country: '🇩🇪 Germany', lat: 52.5200, lng: 13.4050 },
    { name: 'Moscow', country: '🇷🇺 Russia', lat: 55.7558, lng: 37.6173 },
    { name: 'Beijing', country: '🇨🇳 China', lat: 39.9042, lng: 116.4074 }
];

function initSockHanging() {
    const hangSockBtn = document.getElementById('hangSockBtn');
    const sockMessage = document.getElementById('sockMessage');
    const charCount = document.getElementById('charCount');
    const btnSockEmoji = document.getElementById('btnSockEmoji');
    const sockMapDiv = document.getElementById('sockMap');
    let selectedSock = '🧦';

    // Lazy load map only when section is accessed
    if (sockMapDiv && !map) {
        const loader = showLoading(sockMapDiv, 'Loading map...');
        loadLeaflet().then(() => {
            hideLoading(loader);
            initMap();
        }).catch(() => {
            hideLoading(loader);
            showError('Failed to load map. Please refresh the page.');
        });
    } else if (map) {
        initMap();
    }

    // Initial UI will be updated after Firebase data loads
    // No demo/dummy data - only Firebase data
    updateStats();
    renderFeed();
    renderRankings();

    // Sock selection grid
    const sockOptions = document.querySelectorAll('.sock-option');
    sockOptions.forEach(option => {
        option.addEventListener('click', () => {
            sockOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            selectedSock = option.dataset.sock;
            btnSockEmoji.textContent = selectedSock;
            if (soundEnabled) playSound('click');
        });
    });

    // Character counter
    sockMessage.addEventListener('input', () => {
        const count = sockMessage.value.length;
        charCount.textContent = count;
    });

    // Hang sock button
    hangSockBtn.addEventListener('click', async () => {
        const message = sockMessage.value.trim();
        
        if (!selectedSock) return;

        // Get user location with real city name via reverse geocoding
        let location;
        if (userLocation) {
            // Get real city name from coordinates using reverse geocoding
            try {
                const cityName = await getCityNameFromCoordinates(userLocation.lat, userLocation.lng);
                const country = getCountryFromLocation(userLocation.lat, userLocation.lng);
                const countryName = country.replace(/🇰🇷|🇯🇵|🇺🇸|🇬🇧|🇫🇷|🇦🇺|🇨🇦|🇩🇪|🇷🇺|🇨🇳|🇹🇭|🇲🇾|🇮🇩|🇻🇳|🌍/g, '').trim();
                
                // Format: "City, Country" (e.g., "Seoul, Korea" or "Bangkok, Thailand")
            location = {
                    name: cityName ? `${cityName}, ${countryName}` : `${countryName}`,
                    country: countryName, // Save country name WITHOUT emoji
                lat: userLocation.lat + (Math.random() - 0.5) * 0.01,
                lng: userLocation.lng + (Math.random() - 0.5) * 0.01
            };
            } catch (error) {
                console.error('Error getting city name:', error);
                // Fallback to country name if reverse geocoding fails
                const country = getCountryFromLocation(userLocation.lat, userLocation.lng);
                const countryName = country.replace(/🇰🇷|🇯🇵|🇺🇸|🇬🇧|🇫🇷|🇦🇺|🇨🇦|🇩🇪|🇷🇺|🇨🇳|🇹🇭|🇲🇾|🇮🇩|🇻🇳|🌍/g, '').trim();
                location = {
                    name: countryName || 'Unknown',
                    country: countryName, // Save country name WITHOUT emoji
                    lat: userLocation.lat + (Math.random() - 0.5) * 0.01,
                    lng: userLocation.lng + (Math.random() - 0.5) * 0.01
                };
            }
        } else {
            // Fallback to random city
            location = cities[Math.floor(Math.random() * cities.length)];
        }
        
        // Create sock entry
        const sockEntry = {
            id: Date.now(),
            emoji: selectedSock,
            message: message || null,
            city: location.name,
            country: location.country,
            lat: location.lat,
            lng: location.lng,
            timestamp: new Date()
        };

        // Save to Firebase FIRST (this is the source of truth)
        // Do NOT add to local sockData - let Firebase real-time subscription update it
        saveSockToFirebase(sockEntry).then(() => {
            // After saving to Firebase, the real-time subscription will update the UI
            // This ensures stats are always based on Firebase data
        });

        // Update local stats for immediate feedback (will be corrected by Firebase sync)
        incrementStat('socksHung');
        completeDailyChallenge('sock');
        sockStats.hanging = Math.min(3, sockStats.hanging + 1);

        // Country rankings will be calculated from Firebase data - no need to store separately
        // Rankings are calculated dynamically from sockData in renderRankings()

        // Update UI immediately (will be refreshed by Firebase real-time subscription)
        // Add to map temporarily until Firebase sync updates it
        addSockToMap(sockEntry);
        
        // Stats will be updated by Firebase real-time subscription
        // This ensures consistency with Firebase data

        // Show share button with sock data
        const shareBtn = document.getElementById('shareSockBtn');
        shareBtn.style.display = 'block';
        shareBtn.dataset.sockData = JSON.stringify(sockEntry);

        // Clear form
        sockMessage.value = '';
        charCount.textContent = '0';

        // Animate hanging
        setTimeout(() => {
            sockStats.hanging = Math.max(0, sockStats.hanging - 1);
            // Sock stats no longer saved to localStorage (removed)
            updateStats();
        }, 2000);

        if (soundEnabled) playSound('success');
    });

    // Share sock button
    const shareSockBtn = document.getElementById('shareSockBtn');
    if (shareSockBtn) {
        shareSockBtn.addEventListener('click', () => {
            const sockDataStr = shareSockBtn.dataset.sockData;
            if (sockDataStr) {
                try {
                    const sockData = JSON.parse(sockDataStr);
                    shareSockImage(sockData);
                    if (soundEnabled) playSound('success');
                } catch (error) {
                    console.error('Share sock error:', error);
                    showError('Failed to share sock. Please try again.');
                }
            }
        });
    }

    // Load data ONLY from Firebase - NO auto-generation, NO localStorage initialization
    // All data must come from real user submissions via Firebase
    if (isFirebaseAvailable()) {
        // Load initial data from Firebase (one-time load)
        loadGlobalSocksFromFirebase(50).then(globalSocks => {
            // ONLY use Firebase data - ignore localStorage
            sockData = [...globalSocks];
            if (sockData.length > 50) sockData = sockData.slice(0, 50);
            
            // Stats based ONLY on Firebase data
            sockStats.displayed = sockData.length;
            sockStats.total = sockData.length;
            
            // DO NOT save Firebase data to localStorage - keep it separate
            // localStorage is only for user's own socks (when they hang one)
            
            // Update UI
            updateStats();
            loadSocksOnMap();
            renderFeed();
            renderRankings();
        }).catch(error => {
            console.error('Error loading socks from Firebase:', error);
            // If Firebase fails, show empty state
            sockData = [];
            sockStats.displayed = 0;
            sockStats.total = 0;
            updateStats();
            renderFeed();
        });
        
        // Subscribe to real-time updates from Firebase (read-only, no auto-creation)
        const unsubscribe = subscribeToGlobalSocks((globalSocks) => {
            // ONLY update from Firebase - do NOT create new socks
            // This is READ-ONLY - we're just syncing what's in Firebase
            sockData = [...globalSocks];
            if (sockData.length > 50) sockData = sockData.slice(0, 50);
            
            // Stats based ONLY on Firebase data
            sockStats.displayed = sockData.length;
            sockStats.total = sockData.length;

            // DO NOT save to localStorage - Firebase is the source of truth

            // Update UI
            updateStats();
            loadSocksOnMap();
            renderFeed();
            renderRankings();
        });
        
        // Store unsubscribe function for cleanup if needed
        if (unsubscribe) {
            window.sockUnsubscribe = unsubscribe;
        }
    } else {
        // No Firebase - show empty state (no localStorage fallback)
        sockData = [];
        sockStats.displayed = 0;
        sockStats.total = 0;
        updateStats();
        renderFeed();
    }
}

function updateStats() {
    // Show actual displayed socks count, not localStorage total
    const actualDisplayed = sockData.length;
    const totalSocksEl = document.getElementById('totalSocks');
    const currentDisplayEl = document.getElementById('currentDisplay');
    const hangingNowEl = document.getElementById('hangingNow');
    
    if (totalSocksEl) {
        // Show actual count from sockData (what's actually displayed)
        totalSocksEl.textContent = actualDisplayed;
    }
    if (currentDisplayEl) {
        currentDisplayEl.textContent = actualDisplayed;
    }
    if (hangingNowEl) {
        hangingNowEl.textContent = sockStats.hanging || 0;
    }
    
    // Update stats (no longer saved to localStorage)
    sockStats.displayed = actualDisplayed;
}

function initMap() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded');
        return;
    }
    
    // Don't initialize if map already exists
    if (map) {
        map.invalidateSize();
        return;
    }

    const sockMapDiv = document.getElementById('sockMap');
    if (!sockMapDiv) return;
    
    sockMapDiv.innerHTML = '';

    // Initialize map centered on a default location (Seoul)
    const defaultLat = 37.5665;
    const defaultLng = 126.9780;

    map = L.map('sockMap', {
        zoomControl: true,
        attributionControl: false
    }).setView([defaultLat, defaultLng], 2);

    // Add tile layer (using OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Get user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center map on user location
                map.setView([userLocation.lat, userLocation.lng], 10);
                
                // Add user location marker
                const userIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: '<div style="width: 20px; height: 20px; background: #FFB81C; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(255,184,28,0.8);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                
                L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                    .addTo(map)
                    .bindPopup('📍 Your Location');
                
                // Load existing socks
                loadSocksOnMap();
            },
            (error) => {
                // Geolocation failed - use default location
                if (error.code === error.PERMISSION_DENIED) {
                    console.log('User denied geolocation');
                } else {
                    console.log('Geolocation error:', error);
                }
                // Load socks with default location
                loadSocksOnMap();
            }
        );
    } else {
        // Browser doesn't support geolocation
        loadSocksOnMap();
    }
}

function loadSocksOnMap() {
    // Clear existing markers
    sockMarkers.forEach(marker => map.removeLayer(marker));
    sockMarkers = [];

    // Load global socks from Firebase (if available) and merge with local
    loadGlobalSocksFromFirebase(50).then(globalSocks => {
        const allSocks = [...globalSocks];
        
        // Add local socks that aren't in global list
        sockData.forEach(localSock => {
            if (!allSocks.find(s => s.id === localSock.id)) {
                allSocks.push(localSock);
            }
        });

        // Show recent socks on map (up to 50)
        const recentSocks = allSocks.slice(0, 50);
    const mapCount = document.getElementById('mapCount');
        if (mapCount) mapCount.textContent = recentSocks.length;

    recentSocks.forEach(sock => {
        addSockToMap(sock);
        });
    }).catch(() => {
        // Fallback to local socks only
        const recentSocks = sockData.slice(0, 50);
        const mapCount = document.getElementById('mapCount');
        if (mapCount) mapCount.textContent = recentSocks.length;
        recentSocks.forEach(sock => {
            addSockToMap(sock);
        });
    });
}

function addSockToMap(sock) {
    if (!map) return;

    // Check if sock has coordinates (new format) or old x/y format
    let lat, lng;
    if (sock.lat && sock.lng) {
        lat = sock.lat;
        lng = sock.lng;
    } else if (sock.x && sock.y) {
        // Convert old percentage format to approximate coordinates
        // This is a rough conversion - you may want to update old data
        lat = 37.5665 + (sock.y - 35) * 0.5;
        lng = 126.9780 + (sock.x - 75) * 0.5;
    } else {
        return; // Skip if no valid coordinates
    }

    // Create custom icon for sock
    const sockIcon = L.divIcon({
        className: 'sock-marker',
        html: `<div style="font-size: 2rem; text-align: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${sock.emoji}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    // Create popup content
    // sock.city already contains "City, Country" format
    const popupContent = `
        <div style="text-align: center; padding: 0.5rem;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${sock.emoji}</div>
            <div style="font-weight: 600; margin-bottom: 0.25rem;">📍 ${sock.city || 'Unknown Location'}</div>
            ${sock.message ? `<div style="margin-top: 0.5rem; font-size: 0.9rem; font-style: italic;">"${sock.message}"</div>` : ''}
        </div>
    `;

    const marker = L.marker([lat, lng], { icon: sockIcon })
        .addTo(map)
        .bindPopup(popupContent);

    sockMarkers.push(marker);
}

function renderFeed() {
    const sockFeed = document.getElementById('sockFeed');
    sockFeed.innerHTML = '';

    const feedItems = sockData.slice(0, 10);

    feedItems.forEach(sock => {
        const feedItem = document.createElement('div');
        feedItem.className = 'feed-item';
        
        const time = formatTime(sock.timestamp);
        const messageText = sock.message ? `: "${sock.message}"` : '';
        
        // sock.city already contains "City, Country" format, so just display it
        feedItem.innerHTML = `
            <div class="feed-item-icon">${sock.emoji}</div>
            <div class="feed-item-content">
                <div class="feed-item-text">Sock hung in ${sock.city || 'Unknown Location'}${messageText}</div>
                <div class="feed-item-location">📍 ${sock.city || 'Unknown Location'}</div>
            </div>
            <div class="feed-item-time">${time}</div>
        `;
        
        sockFeed.appendChild(feedItem);
    });

    if (feedItems.length === 0) {
        sockFeed.innerHTML = '<div class="empty-state-message" style="text-align: center; padding: 2rem;">No activity yet. Hang your first sock!</div>';
    }
}

function renderRankings() {
    const rankingsList = document.getElementById('rankingsList');
    if (!rankingsList) return;
    
    rankingsList.innerHTML = '';

    // Calculate country rankings dynamically from Firebase data (sockData) ONLY
    // NO localStorage, NO separate storage - only from actual Firebase data
    const countryCounts = {};
    
    // Count socks per country from Firebase data only
    sockData.forEach(sock => {
        if (sock.country) {
            countryCounts[sock.country] = (countryCounts[sock.country] || 0) + 1;
        }
    });

    // Convert to array and sort
    const rankings = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    if (rankings.length === 0) {
        rankingsList.innerHTML = '<div class="empty-state-message" style="text-align: center; padding: 2rem;">No rankings yet. Start hanging socks!</div>';
        return;
    }

    rankings.forEach((item, index) => {
        const rankingItem = document.createElement('div');
        rankingItem.className = 'ranking-item' + (index === 0 ? ' first' : '');
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        rankingItem.innerHTML = `
            <div class="ranking-position">${index + 1}</div>
            <div class="ranking-flag">${item.country}</div>
            <div class="ranking-info">
                <div class="ranking-country">${item.country} ${medal}</div>
                <div class="ranking-count">${item.count} sock${item.count !== 1 ? 's' : ''}</div>
            </div>
        `;
        
        rankingsList.appendChild(rankingItem);
    });
}

// Get real city name from coordinates using reverse geocoding
async function getCityNameFromCoordinates(lat, lng) {
    try {
        // Use OpenStreetMap Nominatim API (free, no API key required)
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`, {
            headers: {
                'User-Agent': 'Christmas Website' // Required by Nominatim
            }
        });
        
        if (!response.ok) {
            throw new Error('Reverse geocoding failed');
        }
        
        const data = await response.json();
        
        // Extract city name from response
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.municipality || 
                    address.county || address.state || address.country || 'Unknown';
        
        return city;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}

// Get user location for games (if not already set)
async function getUserLocationForGames() {
    // Return existing location if available
    if (userLocation) {
        return userLocation;
    }
    
    // Check if geolocation is available
    if (!navigator.geolocation) {
        console.log('Geolocation not supported in this browser');
        return null;
    }
    
    // Check if we're in a secure context (HTTPS) - required for geolocation
    if (!window.isSecureContext) {
        console.warn('Geolocation requires HTTPS. Current connection is not secure.');
        // Show user-friendly message
        if (window.confirm('Location access requires a secure connection (HTTPS).\n\nYou are currently using HTTP. Location will default to "World".\n\nTo enable location:\n- Use HTTPS\n- Or deploy to a secure server\n\nClick OK to continue without location.')) {
            return null;
        }
        return null;
    }
    
    // Try to get location
    return new Promise((resolve) => {
        // Request location with proper options
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('Location obtained for games:', userLocation);
                resolve(userLocation);
            },
            (error) => {
                console.log('Geolocation error for games:', error.message);
                if (error.code === error.PERMISSION_DENIED) {
                    console.log('User denied location permission');
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    console.log('Location information unavailable');
                } else if (error.code === error.TIMEOUT) {
                    console.log('Location request timed out');
                } else {
                    console.log('Unknown geolocation error:', error);
                }
                resolve(null);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000, // 10 seconds timeout
                maximumAge: 0 // Don't use cached location, always request fresh
            }
        );
    });
}

// Get country name from location (with reverse geocoding fallback)
async function getCountryNameForLeaderboard() {
    let location = await getUserLocationForGames();
    
    if (!location) {
        // Try to get country from IP or use a better fallback
        try {
            // Use reverse geocoding API to get country from approximate location
            // Or we can use a geolocation API service
            return 'World';
        } catch (error) {
            return 'World';
        }
    }
    
    // Try reverse geocoding first for accurate country (request English names)
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=3&addressdetails=1&accept-language=en`, {
            headers: {
                'User-Agent': 'Christmas Magic App'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.address && data.address.country) {
                // Convert native country name to English if needed
                const englishCountry = convertCountryToEnglish(data.address.country);
                console.log('Country from API:', data.address.country, '→ Converted to:', englishCountry);
                return englishCountry;
            }
        }
    } catch (error) {
        console.log('Reverse geocoding failed, using coordinate-based detection:', error);
    }
    
    // Fallback to coordinate-based detection
    const country = getCountryFromLocation(location.lat, location.lng);
    const countryName = country.replace(/🇰🇷|🇯🇵|🇺🇸|🇬🇧|🇫🇷|🇦🇺|🇨🇦|🇩🇪|🇷🇺|🇨🇳|🇹🇭|🇲🇾|🇮🇩|🇻🇳|🌍/g, '').trim();
    console.log('Country from coordinates:', countryName);
    // Convert to English if needed (should already be in English from getCountryFromLocation)
    const englishCountry = convertCountryToEnglish(countryName);
    console.log('Converted country:', englishCountry);
    return englishCountry || countryName || 'World';
}

function getCountryFromLocation(lat, lng) {
    // Simple country detection based on coordinates
    // This is a basic approximation - in production, use a reverse geocoding API
    if (lat >= 33 && lat <= 43 && lng >= 124 && lng <= 132) return '🇰🇷 Korea';
    if (lat >= 24 && lat <= 46 && lng >= 123 && lng <= 146) return '🇯🇵 Japan';
    if (lat >= 25 && lat <= 49 && lng >= -125 && lng <= -66) return '🇺🇸 USA';
    if (lat >= 50 && lat <= 60 && lng >= -8 && lng <= 2) return '🇬🇧 UK';
    if (lat >= 41 && lat <= 51 && lng >= -5 && lng <= 10) return '🇫🇷 France';
    if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154) return '🇦🇺 Australia';
    if (lat >= 42 && lat <= 83 && lng >= -141 && lng <= -52) return '🇨🇦 Canada';
    if (lat >= 47 && lat <= 55 && lng >= 5 && lng <= 15) return '🇩🇪 Germany';
    if (lat >= 41 && lat <= 82 && lng >= 19 && lng <= 180) return '🇷🇺 Russia';
    if (lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135) return '🇨🇳 China';
    if (lat >= 5 && lat <= 21 && lng >= 97 && lng <= 106) return '🇹🇭 Thailand';
    if (lat >= 1 && lat <= 7 && lng >= 100 && lng <= 120) return '🇲🇾 Malaysia';
    if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) return '🇮🇩 Indonesia';
    if (lat >= 10 && lat <= 24 && lng >= 102 && lng <= 110) return '🇻🇳 Vietnam';
    if (lat >= 4 && lat <= 21 && lng >= 92 && lng <= 102) return '🇹🇭 Thailand';
    return '🌍 World';
}

// Convert native country names to English
function convertCountryToEnglish(countryName) {
    if (!countryName || countryName.trim() === '') return 'World';
    
    const countryLower = countryName.toLowerCase().trim();
    
    // Map native/local country names to English
    const countryMap = {
        // Korean
        '대한민국': 'South Korea',
        '한국': 'South Korea',
        // Japanese
        '日本': 'Japan',
        // Chinese
        '中国': 'China',
        '中华人民共和国': 'China',
        // Thai
        'ประเทศไทย': 'Thailand',
        // Vietnamese
        'việt nam': 'Vietnam',
        'vietnam': 'Vietnam',
        // Indonesian
        'indonesia': 'Indonesia',
        // Malay
        'malaysia': 'Malaysia',
        // Russian
        'россия': 'Russia',
        'российская федерация': 'Russia',
        // German
        'deutschland': 'Germany',
        // French
        'france': 'France',
        // Spanish
        'españa': 'Spain',
        'méxico': 'Mexico',
        'mexico': 'Mexico',
        // Other common variations
        'united states': 'USA',
        'united states of america': 'USA',
        'united kingdom': 'UK',
        'great britain': 'UK',
        'korea': 'South Korea',
        'south korea': 'South Korea'
    };
    
    // Try exact match first (with original case)
    if (countryMap[countryName]) {
        return countryMap[countryName];
    }
    
    // Try lowercase match
    if (countryMap[countryLower]) {
        return countryMap[countryLower];
    }
    
    // Check if it's already in English (common English country names)
    const englishCountries = ['Korea', 'South Korea', 'Japan', 'USA', 'United States', 'UK', 'United Kingdom', 
                              'France', 'Australia', 'Canada', 'Germany', 'Russia', 'China', 'Thailand', 
                              'Malaysia', 'Indonesia', 'Vietnam', 'Spain', 'Mexico', 'Brazil', 'India'];
    
    // First try exact match (case-insensitive)
    for (const engName of englishCountries) {
        const engLower = engName.toLowerCase();
        if (countryLower === engLower) {
            return engName;
        }
    }
    
    // Then try partial match
    for (const engName of englishCountries) {
        const engLower = engName.toLowerCase();
        if (countryLower.includes(engLower) || engLower.includes(countryLower)) {
            // Special case: if input is just "Korea", return "South Korea"
            if (countryLower === 'korea' && engName === 'South Korea') {
                return 'South Korea';
            }
            return engName;
        }
    }
    
    // If contains Korean characters, assume it's Korea
    if (/[가-힣]/.test(countryName)) {
        return 'South Korea';
    }
    
    // If contains Japanese characters, assume it's Japan
    if (/[ひらがなカタカナ一-龯]/.test(countryName)) {
        return 'Japan';
    }
    
    // If contains Chinese characters, could be China, Taiwan, etc.
    if (/[\u4e00-\u9fff]/.test(countryName)) {
        // Try to determine based on common patterns
        if (countryName.includes('中国') || countryName.includes('中华')) {
            return 'China';
        }
        return 'China'; // Default to China for Chinese characters
    }
    
    // Return as-is if it looks like English (contains only letters and spaces)
    if (/^[a-zA-Z\s]+$/.test(countryName)) {
        // Capitalize first letter of each word
        const capitalized = countryName.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        // If it's a known country name, return it; otherwise try to match
        for (const engName of englishCountries) {
            if (capitalized.toLowerCase() === engName.toLowerCase() || 
                capitalized.toLowerCase().includes(engName.toLowerCase()) ||
                engName.toLowerCase().includes(capitalized.toLowerCase())) {
                return engName;
            }
        }
        // Return capitalized version if it looks reasonable
        return capitalized;
    }
    
    // Last resort: return World
    return 'World';
}

// Get flag emoji for country name (without emoji)
function getCountryFlag(countryName) {
    if (!countryName || countryName === 'World') return '🌍';
    
    // First convert to English if needed
    const englishCountry = convertCountryToEnglish(countryName);
    if (englishCountry === 'World') return '🌍';
    
    const countryLower = englishCountry.toLowerCase().trim();
    
    // Map country names to flag emojis
    const flagMap = {
        'korea': '🇰🇷',
        'south korea': '🇰🇷',
        'japan': '🇯🇵',
        'usa': '🇺🇸',
        'united states': '🇺🇸',
        'united states of america': '🇺🇸',
        'uk': '🇬🇧',
        'united kingdom': '🇬🇧',
        'france': '🇫🇷',
        'australia': '🇦🇺',
        'canada': '🇨🇦',
        'germany': '🇩🇪',
        'russia': '🇷🇺',
        'china': '🇨🇳',
        'thailand': '🇹🇭',
        'malaysia': '🇲🇾',
        'indonesia': '🇮🇩',
        'vietnam': '🇻🇳',
        'spain': '🇪🇸',
        'mexico': '🇲🇽',
        'brazil': '🇧🇷',
        'india': '🇮🇳'
    };
    
    // Try exact match first
    if (flagMap[countryLower]) {
        return flagMap[countryLower];
    }
    
    // Try partial match (e.g., "Korea" in "South Korea")
    for (const [key, flag] of Object.entries(flagMap)) {
        if (countryLower.includes(key) || key.includes(countryLower)) {
            return flag;
        }
    }
    
    // Default to world flag
    return '🌍';
}

function shareSockImage(sock) {
    try {
        // Create a canvas for Instagram Story (9:16 aspect ratio)
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920; // 9:16 ratio
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            showError('Canvas not supported in this browser');
            return;
        }
        
        // Background gradient (dark Christmas theme)
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0A0A0A');
        gradient.addColorStop(0.3, '#1A0F0F');
        gradient.addColorStop(0.7, '#0F1A0F');
        gradient.addColorStop(1, '#0A0A0A');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Decorative elements (snowflakes)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        for (let i = 0; i < 10; i++) {
            const x = (canvas.width / 10) * i + 50;
            const y = 100 + (i % 3) * 200;
            ctx.fillText('❄', x, y);
        }
        
        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 72px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('I Hung a Sock!', canvas.width / 2, 280);
        
        // Sock emoji (large)
        ctx.font = '240px Arial';
        ctx.fillText(sock.emoji || '🧦', canvas.width / 2, 650);
        
        // Location pin emoji
        ctx.font = '80px Arial';
        ctx.fillText('📍', canvas.width / 2, 850);
        
        // Location text
        ctx.fillStyle = '#FFB81C';
        ctx.font = 'bold 64px Arial, sans-serif';
        ctx.fillText(sock.city || 'Unknown Location', canvas.width / 2, 950);
        
        // Country
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '48px Arial, sans-serif';
        ctx.fillText(sock.country || 'World', canvas.width / 2, 1020);
        
        // Message if exists
        if (sock.message) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '42px Arial, sans-serif';
            const words = sock.message.split(' ');
            let line = '';
            let y = 1150;
            const maxWidth = canvas.width - 200;
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && y < 1600) {
                    ctx.fillText(line, canvas.width / 2, y);
                    line = word + ' ';
                    y += 65;
                } else {
                    line = testLine;
                }
            });
            if (line.trim()) {
                ctx.fillText(line, canvas.width / 2, y);
            }
        }
        
        // Footer decoration
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '50px Arial';
        ctx.fillText('🎄', canvas.width / 2 - 100, canvas.height - 120);
        ctx.fillText('✨', canvas.width / 2 + 100, canvas.height - 120);
        
        // Footer text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '32px Arial, sans-serif';
        ctx.fillText('Christmas Magic', canvas.width / 2, canvas.height - 80);
        
        // Convert to image and show share options
        canvas.toBlob(blob => {
            if (!blob) {
                showError('Failed to generate image');
                return;
            }
            
            // Show share options modal with Instagram Story
            const shareText = sock.message 
                ? `${sock.message}\n\n📍 ${sock.city || 'Unknown Location'}`
                : `I hung a sock in ${sock.city || 'Unknown Location'}! 🧦🎄`;
            showShareOptions('sock', shareText, blob, 'I Hung a Sock!');
        }, 'image/png');
    } catch (error) {
        console.error('Share sock image error:', error);
        showError('Failed to generate share image. Please try again.');
    }
}

function formatTime(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

// Gift Exchange Generator
function initGiftExchange() {
    try {
        const participants = [];
        let currentPairs = []; // Store pairs for copying
        const addBtn = document.getElementById('addParticipant');
        const nameInput = document.getElementById('participantName');
        const participantsList = document.getElementById('participantsList');
        const generateBtn = document.getElementById('generatePairs');
        const pairsResult = document.getElementById('pairsResult');
        const pairsList = document.getElementById('pairsList');
        const resetBtn = document.getElementById('resetExchange');
        const copyPairsBtn = document.getElementById('copyPairsText');
        const autoGenerateBtn = document.getElementById('autoGenerate');
        const participantCount = document.getElementById('participantCount');
        const generatorType = document.getElementById('generatorType');
        const incrementBtn = document.getElementById('incrementCount');
        const decrementBtn = document.getElementById('decrementCount');
        
        if (!addBtn) return;
        
        // Number input increment/decrement handlers
        if (incrementBtn && participantCount) {
            incrementBtn.addEventListener('click', () => {
                const current = parseInt(participantCount.value) || 5;
                const max = parseInt(participantCount.max) || 50;
                if (current < max) {
                    participantCount.value = current + 1;
                    participantCount.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }
        
        if (decrementBtn && participantCount) {
            decrementBtn.addEventListener('click', () => {
                const current = parseInt(participantCount.value) || 5;
                const min = parseInt(participantCount.min) || 2;
                if (current > min) {
                    participantCount.value = current - 1;
                    participantCount.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }
        
        // Nicknames pool for auto-generation
        const nicknames = [
            'Santa', 'Elf', 'Snowman', 'Rudolph', 'Frosty', 'Grinch', 'Scrooge',
            'Buddy', 'Holly', 'Noel', 'Joy', 'Hope', 'Peace', 'Love', 'Star',
            'Angel', 'Sparkle', 'Twinkle', 'Jingle', 'Bells', 'Candy', 'Cookie',
            'Ginger', 'Peppermint', 'Cocoa', 'Mistletoe', 'Tinsel', 'Ornament',
            'Stocking', 'Wreath', 'Caroler', 'Reindeer', 'Polar', 'North', 'South'
        ];
        
        function renderParticipants() {
            participantsList.innerHTML = '';
            participants.forEach((name, index) => {
                const item = document.createElement('div');
                item.className = 'participant-item';
                item.innerHTML = `
                    <span>${name}</span>
                    <button class="remove-btn" data-index="${index}">×</button>
                `;
                participantsList.appendChild(item);
            });
            
            generateBtn.disabled = participants.length < 2;
        }
        
        // Auto-generate participants
        autoGenerateBtn.addEventListener('click', () => {
            const count = parseInt(participantCount.value) || 5;
            const type = generatorType.value;
            
            if (count < 2 || count > 50) {
                showError('Please enter a number between 2 and 50');
                return;
            }
            
            participants.length = 0; // Clear existing
            
            if (type === 'numbers') {
                for (let i = 1; i <= count; i++) {
                    participants.push(i.toString());
                }
            } else if (type === 'letters') {
                for (let i = 0; i < count; i++) {
                    participants.push(String.fromCharCode(65 + i)); // A, B, C...
                }
            } else if (type === 'nicknames') {
                const shuffled = [...nicknames].sort(() => Math.random() - 0.5);
                for (let i = 0; i < count && i < shuffled.length; i++) {
                    participants.push(shuffled[i]);
                }
                // If we need more than available nicknames, add numbers
                if (count > nicknames.length) {
                    for (let i = nicknames.length; i < count; i++) {
                        participants.push(`Person ${i + 1}`);
                    }
                }
            }
            
            renderParticipants();
            if (soundEnabled) playSound('click');
            showSuccess(`Generated ${count} participants as ${type}!`);
        });
        
        addBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name && !participants.includes(name)) {
                participants.push(name);
                nameInput.value = '';
                renderParticipants();
                if (soundEnabled) playSound('click');
            } else if (participants.includes(name)) {
                showError('This participant already exists');
            }
        });
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addBtn.click();
        });
        
        participantsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const index = parseInt(e.target.dataset.index);
                participants.splice(index, 1);
                renderParticipants();
                if (soundEnabled) playSound('click');
            }
        });
        
        generateBtn.addEventListener('click', () => {
            if (participants.length < 2) {
                showError('Need at least 2 participants');
                return;
            }
            
            // Ensure no one gets themselves
            let pairs = [];
            let attempts = 0;
            const maxAttempts = 100;
            
            while (attempts < maxAttempts) {
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                pairs = [];
                let valid = true;
                
                for (let i = 0; i < shuffled.length; i++) {
                    const giver = shuffled[i];
                    const receiver = shuffled[(i + 1) % shuffled.length];
                    
                    if (giver === receiver) {
                        valid = false;
                        break;
                    }
                    
                    pairs.push({
                        giver: giver,
                        receiver: receiver
                    });
                }
                
                if (valid) break;
                attempts++;
            }
            
            // If still invalid (edge case with 2 participants), swap
            if (pairs.length === 2 && pairs[0].giver === pairs[1].receiver && pairs[0].receiver === pairs[1].giver) {
                const temp = pairs[0].receiver;
                pairs[0].receiver = pairs[1].receiver;
                pairs[1].receiver = temp;
            }
            
            // Store pairs for copying
            currentPairs = pairs;
            
            pairsList.innerHTML = '';
            pairs.forEach(pair => {
                const div = document.createElement('div');
                div.className = 'pair-item';
                div.innerHTML = `
                    <strong>${pair.giver}</strong> → <span>${pair.receiver}</span>
                `;
                pairsList.appendChild(div);
            });
            
            pairsResult.style.display = 'block';
            incrementStat('gamesPlayed');
            if (soundEnabled) playSound('success');
            
            // Scroll to results
            pairsResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        
        // Copy pairs text
        if (copyPairsBtn) {
            copyPairsBtn.addEventListener('click', () => {
                if (currentPairs.length === 0) {
                    showError('No pairs to copy. Generate pairs first.');
                    return;
                }
                
                const text = currentPairs.map(pair => 
                    `${pair.giver} → ${pair.receiver}`
                ).join('\n');
                
                const fullText = `🎁 Secret Santa Pairs:\n\n${text}\n\nGenerated by Christmas Magic 🎄`;
                
                navigator.clipboard.writeText(fullText).then(() => {
                    showSuccess('Pairs copied to clipboard!');
                    if (soundEnabled) playSound('success');
                }).catch(() => {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = fullText;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                        document.execCommand('copy');
                        showSuccess('Pairs copied to clipboard!');
                        if (soundEnabled) playSound('success');
                    } catch (err) {
                        showError('Failed to copy. Please select and copy manually.');
                    }
                    document.body.removeChild(textarea);
                });
            });
        }
        
        resetBtn.addEventListener('click', () => {
            participants.length = 0;
            currentPairs = [];
            participantCount.value = '5';
            generatorType.value = 'numbers';
            renderParticipants();
            pairsResult.style.display = 'none';
            if (soundEnabled) playSound('click');
        });
    } catch (error) {
        console.error('Gift exchange error:', error);
    }
}

// Firework/Candy Bomb Effect
// Confetti Effect (21st.dev Magic UI style)
function createConfettiEffect(container) {
    if (typeof confetti === 'undefined') {
        // Fallback if confetti library not loaded
        createFireworkEffect(container);
        return;
    }
    
    const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    // Create confetti burst
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: ['#FFB81C', '#C8102E', '#0F5132', '#FF6B6B', '#4ECDC4', '#FFE66D', '#FFFFFF'],
        shapes: ['circle', 'square'],
        gravity: 0.8,
        ticks: 200
    });
    
    // Additional burst after delay
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x, y },
            colors: ['#FFB81C', '#C8102E', '#0F5132'],
            shapes: ['circle'],
            gravity: 0.8,
            ticks: 150
        });
    }, 250);
    
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x, y },
            colors: ['#FFB81C', '#C8102E', '#0F5132'],
            shapes: ['circle'],
            gravity: 0.8,
            ticks: 150
        });
    }, 400);
}

// Legacy firework effect (fallback)
function createFireworkEffect(container) {
    const fireworks = ['🎆', '✨', '🎉', '🎊', '⭐', '🌟', '💫', '🎁', '🍬', '🍭', '🍪', '🎄'];
    const colors = ['#FFB81C', '#C8102E', '#0F5132', '#FF6B6B', '#4ECDC4', '#FFE66D'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.fontSize = Math.random() * 30 + 20 + 'px';
            particle.style.zIndex = '10000';
            particle.style.pointerEvents = 'none';
            particle.textContent = fireworks[Math.floor(Math.random() * fireworks.length)];
            
            const angle = (Math.PI * 2 * i) / 50;
            const velocity = 200 + Math.random() * 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.transform = `translate(-50%, -50%)`;
            particle.style.transition = 'all 1s ease-out';
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.style.transform = `translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px))`;
                particle.style.opacity = '0';
            }, 10);
            
            setTimeout(() => {
                particle.remove();
            }, 1100);
        }, i * 20);
    }
}

// Games
const triviaQuestions = [
    { q: 'What date is Christmas?', options: ['Dec 24', 'Dec 25', 'Dec 26', 'Jan 1'], correct: 1 },
    { q: 'Who wrote "A Christmas Carol"?', options: ['Shakespeare', 'Dickens', 'Tolkien', 'Rowling'], correct: 1 },
    { q: 'What do reindeer pull?', options: ['Sleigh', 'Cart', 'Wagon', 'Truck'], correct: 0 },
    { q: 'What color is Santa\'s suit?', options: ['Blue', 'Red', 'Green', 'White'], correct: 1 },
    { q: 'How many reindeer pull Santa\'s sleigh?', options: ['6', '8', '9', '10'], correct: 2 }
];

let currentGame = null;
let gameKeyboardHandler = null;

function initGames() {
    try {
        const gameCards = document.querySelectorAll('.game-card');
        if (gameCards.length === 0) {
            console.log('No game cards found');
            return;
        }
        
        gameCards.forEach(card => {
            card.addEventListener('click', () => {
                const game = card.dataset.game;
                const section = card.dataset.section;
                
                // Handle section navigation (Quiz, Gift Exchange)
                if (section) {
                    switchSection(section);
                    // Update nav tabs
                    const expandableTabs = document.querySelectorAll('.expandable-tab');
                    expandableTabs.forEach(t => {
                        t.classList.remove('active');
                        if (t.dataset.section === section) {
                            t.classList.add('active');
                        }
                    });
                    // Hide hero (modern navbar is always visible)
                    const hero = document.getElementById('hero');
                    if (hero) hero.style.display = 'none';
                    if (soundEnabled) playSound('click');
                    return;
                }
                
                // Handle game selection
                if (!game) return;
                
                // Hide all game containers
                document.querySelectorAll('.game-container').forEach(c => {
                    c.style.display = 'none';
                });
                
                // Hide games grid and leaderboard
                const gamesGrid = document.querySelector('.games-grid');
                if (gamesGrid) gamesGrid.style.display = 'none';
                const leaderboard = document.getElementById('gamesLeaderboard');
                if (leaderboard) leaderboard.style.display = 'none';
                
                // Remove old keyboard handler
                if (gameKeyboardHandler) {
                    document.removeEventListener('keydown', gameKeyboardHandler);
                    gameKeyboardHandler = null;
                }
                
                // Show selected game
                currentGame = game;
                if (game === 'trivia') {
                    initTrivia();
                } else if (game === 'memory') {
                    initMemory();
                } else if (game === 'wordsearch') {
                    initWordSearch();
                } else if (game === 'wordle') {
                    initWordle();
                }
                
                // Add keyboard shortcuts
                initGameKeyboardShortcuts(game);
                
                incrementStat('gamesPlayed');
                if (soundEnabled) playSound('click');
            });
        });
        
        // Add back button functionality
        addGameBackButtons();
    } catch (error) {
        console.error('Games init error:', error);
        showError('Failed to initialize games');
    }
}

function initGameKeyboardShortcuts(game) {
    // Remove old handler
    if (gameKeyboardHandler) {
        document.removeEventListener('keydown', gameKeyboardHandler);
    }
    
    gameKeyboardHandler = (e) => {
        // Escape to go back
        if (e.key === 'Escape') {
            document.querySelectorAll('.game-container').forEach(c => c.style.display = 'none');
            const gamesGrid = document.querySelector('.games-grid');
            if (gamesGrid) gamesGrid.style.display = 'grid';
            const leaderboard = document.getElementById('gamesLeaderboard');
            if (leaderboard) leaderboard.style.display = 'block';
            currentGame = null;
            if (gameKeyboardHandler) {
                document.removeEventListener('keydown', gameKeyboardHandler);
                gameKeyboardHandler = null;
            }
            return;
        }
        
        // Game-specific shortcuts
        if (game === 'trivia') {
            // Number keys 1-4 for options
            if (e.key >= '1' && e.key <= '4') {
                const index = parseInt(e.key) - 1;
                const options = document.querySelectorAll('.trivia-option');
                if (options[index] && !options[index].disabled) {
                    options[index].click();
                }
            }
            // Enter for next
            if (e.key === 'Enter') {
                const nextBtn = document.getElementById('triviaNext');
                if (nextBtn && nextBtn.style.display !== 'none') {
                    nextBtn.click();
                }
            }
        } else if (game === 'wordle') {
            // Wordle already has keyboard support, but add Enter/Escape
            if (e.key === 'Enter') {
                const enterBtn = document.querySelector('.wordle-key[data-key="ENTER"]');
                if (enterBtn) enterBtn.click();
            }
            if (e.key === 'Backspace') {
                const backBtn = document.querySelector('.wordle-key[data-key="BACK"]');
                if (backBtn) backBtn.click();
            }
        }
    };
    
    document.addEventListener('keydown', gameKeyboardHandler);
}

function addGameBackButtons() {
    const gameContainers = document.querySelectorAll('.game-container');
    gameContainers.forEach(container => {
        // Check if back button already exists
        if (container.querySelector('.game-back-btn')) return;
        
        const backBtn = document.createElement('button');
        backBtn.className = 'action-btn game-back-btn';
        backBtn.textContent = '← Back (Esc)';
        backBtn.style.marginBottom = '1rem';
        backBtn.addEventListener('click', () => {
            document.querySelectorAll('.game-container').forEach(c => c.style.display = 'none');
            const gamesGrid = document.querySelector('.games-grid');
            if (gamesGrid) gamesGrid.style.display = 'grid';
            const leaderboard = document.getElementById('gamesLeaderboard');
            if (leaderboard) leaderboard.style.display = 'block';
            currentGame = null;
            if (gameKeyboardHandler) {
                document.removeEventListener('keydown', gameKeyboardHandler);
                gameKeyboardHandler = null;
            }
        });
        container.insertBefore(backBtn, container.firstChild);
    });
}

// Games Leaderboard System - Firebase only (no localStorage)
function saveGameScore(gameType, score, country = 'World') {
    // Save to Firebase (global leaderboard only)
    saveGameScoreToFirebase(gameType, score, country);
    
    updateLeaderboard(gameType);
}

async function updateLeaderboard(gameType, viewType = 'overall') {
    const leaderboardContent = document.getElementById('leaderboardContent');
    if (!leaderboardContent) return;
    
    const isDaily = viewType === 'daily';
    
    // For Wordle, we need all scores to calculate percentages
    const limit = gameType === 'wordle' ? 1000 : 50;
    
    // Load global leaderboard from Firebase only (no localStorage)
    let allScores = [];
    try {
        allScores = await loadGlobalLeaderboardFromFirebase(gameType, limit, isDaily);
    } catch (error) {
        console.error('Error loading leaderboard from Firebase:', error);
        allScores = [];
    }
    
    // Special handling for Wordle: Calculate percentage of players who got 1 guess
    if (gameType === 'wordle') {
        // Group all scores by country
        const countryStats = {};
        
        allScores.forEach(entry => {
            const normalizedCountry = convertCountryToEnglish(entry.country);
            const countryKey = normalizedCountry;
            
            if (!countryStats[countryKey]) {
                countryStats[countryKey] = {
                    country: normalizedCountry,
                    total: 0,
                    oneGuess: 0
                };
            }
            
            countryStats[countryKey].total++;
            if (entry.score === 1) {
                countryStats[countryKey].oneGuess++;
            }
        });
        
        // Simple ranking: Count of players who got 1 guess
        // Higher number of 1-guess players = higher rank
        const countryRankings = Object.values(countryStats)
            .filter(stat => stat.oneGuess > 0) // Only show countries with at least 1 player who got it in 1 guess
            .map(stat => ({
                country: stat.country,
                percentage: (stat.oneGuess / stat.total) * 100,
                oneGuess: stat.oneGuess,
                total: stat.total
            }))
            .sort((a, b) => {
                // Primary sort: number of players who got 1 guess (descending)
                if (a.oneGuess !== b.oneGuess) {
                    return b.oneGuess - a.oneGuess;
                }
                // Secondary sort: if same count, prefer higher percentage
                if (Math.abs(a.percentage - b.percentage) > 0.1) {
                    return b.percentage - a.percentage;
                }
                // Tertiary sort: if same percentage, prefer larger total sample
                return b.total - a.total;
            })
            .slice(0, 10);
        
        leaderboardContent.innerHTML = '';
        
        if (countryRankings.length === 0) {
            const message = isDaily 
                ? 'No scores today yet. Play to get on the daily leaderboard!' 
                : allScores.length === 0
                    ? 'No scores yet. Play to get on the leaderboard!'
                    : 'Not enough data yet. Need at least 5 players per country to show rankings.';
            leaderboardContent.innerHTML = `<div class="empty-state-message" style="text-align: center; padding: 2rem;">${message}</div>`;
            return;
        }
        
        countryRankings.forEach((entry, index) => {
            try {
                const item = document.createElement('div');
                item.className = 'leaderboard-item';
                const englishCountry = convertCountryToEnglish(entry.country);
                const flag = getCountryFlag(englishCountry);
                
                // Create progress bar
                const percentage = Math.round(entry.percentage * 10) / 10; // Round to 1 decimal
                
                item.innerHTML = `
                    <div class="leaderboard-rank">#${index + 1}</div>
                    <div class="leaderboard-country">${flag} ${englishCountry}</div>
                    <div class="leaderboard-wordle-stats" style="flex: 1; margin-left: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <div style="flex: 1; background: rgba(255,255,255,0.1); border-radius: 10px; height: 8px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%); height: 100%; width: ${percentage}%; transition: width 0.3s ease; border-radius: 10px;"></div>
                            </div>
                            <div style="font-weight: 600; color: var(--christmas-gold); min-width: 60px; text-align: right;">${percentage}%</div>
                        </div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); text-align: center;">
                            ${entry.oneGuess} player${entry.oneGuess !== 1 ? 's' : ''} got it in 1 guess (${Math.round(entry.percentage * 10) / 10}%)
                        </div>
                    </div>
                `;
                leaderboardContent.appendChild(item);
            } catch (error) {
                console.error('Error creating leaderboard item:', error);
            }
        });
        
        return;
    }
    
    // Original logic for other games
    // Group by country and get best score per country
    // Normalize country names to avoid duplicates (e.g., "Korea" and "South Korea")
    const countryScores = {};
    allScores.forEach(entry => {
        // Normalize country name to English and standardize variations
        const normalizedCountry = convertCountryToEnglish(entry.country);
        const countryKey = normalizedCountry; // Use normalized name as key
        
        if (!countryScores[countryKey] || 
            (gameType === 'memory' || gameType === 'wordsearch' ? entry.score < countryScores[countryKey].score : entry.score > countryScores[countryKey].score)) {
            // Store with normalized country name
            countryScores[countryKey] = {
                ...entry,
                country: normalizedCountry // Use normalized name
            };
        }
    });
    
    // Convert to array and sort
    const sorted = Object.values(countryScores).sort((a, b) => {
        if (gameType === 'memory' || gameType === 'wordsearch') {
            return a.score - b.score;
        }
        return b.score - a.score;
    }).slice(0, 10);
    
    leaderboardContent.innerHTML = '';
    
    if (sorted.length === 0) {
        const message = isDaily ? 'No scores today yet. Play to get on the daily leaderboard!' : 'No scores yet. Play to get on the leaderboard!';
        leaderboardContent.innerHTML = `<div class="empty-state-message" style="text-align: center; padding: 2rem;">${message}</div>`;
        return;
    }
    
    sorted.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        // Convert country name to English and get flag
        const englishCountry = convertCountryToEnglish(entry.country);
        const flag = getCountryFlag(englishCountry);
        item.innerHTML = `
            <div class="leaderboard-rank">#${index + 1}</div>
            <div class="leaderboard-country">${flag} ${englishCountry}</div>
            <div class="leaderboard-score">${entry.score}${gameType === 'trivia' ? '%' : gameType === 'memory' ? ' moves' : gameType === 'wordsearch' ? ' words' : ' guesses'}</div>
        `;
        leaderboardContent.appendChild(item);
    });
}

let currentLeaderboardView = 'overall'; // 'daily' or 'overall'
let currentLeaderboardGame = 'trivia';

function initLeaderboard() {
    // Leaderboard view toggle (Daily/Overall)
    const viewToggleButtons = document.querySelectorAll('.leaderboard-view-btn');
    viewToggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewToggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLeaderboardView = btn.dataset.view;
            updateLeaderboard(currentLeaderboardGame, currentLeaderboardView);
        });
    });
    
    // Game type tabs
    const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
    leaderboardTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            leaderboardTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentLeaderboardGame = tab.dataset.game;
            
            // Show leaderboard and games grid when clicking a tab
            const leaderboard = document.getElementById('gamesLeaderboard');
            if (leaderboard) leaderboard.style.display = 'block';
            const gamesGrid = document.querySelector('.games-grid');
            if (gamesGrid) gamesGrid.style.display = 'grid';
            // Hide any active game
            document.querySelectorAll('.game-container').forEach(c => c.style.display = 'none');
            currentGame = null;
            
            updateLeaderboard(currentLeaderboardGame, currentLeaderboardView);
        });
    });
    
    // Show leaderboard directly below games grid (no button needed)
            const leaderboard = document.getElementById('gamesLeaderboard');
            if (leaderboard) {
        // Only show when games grid is visible
        const gamesGrid = document.querySelector('.games-grid');
        if (gamesGrid && gamesGrid.style.display !== 'none') {
            leaderboard.style.display = 'block';
            updateLeaderboard('trivia', 'overall');
        } else {
            leaderboard.style.display = 'none';
        }
    }
}

let triviaScore = 0;
let currentTriviaQ = 0;
let triviaTimerInterval = null;
let triviaTimeLeft = 0;

function initTrivia() {
    try {
        const triviaGame = document.getElementById('triviaGame');
        if (!triviaGame) {
            showError('Trivia game not found');
            return;
        }
        triviaGame.style.display = 'block';
        
        // Request location permission when game starts (user interaction context)
        // Only request if in secure context (HTTPS required for geolocation)
        if (!userLocation && navigator.geolocation && window.isSecureContext) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('Location obtained for trivia game');
                },
                (error) => {
                    console.log('Location permission not granted for trivia:', error.message);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000
                }
            );
        } else if (!window.isSecureContext) {
            console.warn('Geolocation requires HTTPS. Using default location for trivia.');
        }
        
        triviaScore = 0;
        currentTriviaQ = 0;
        
        // Get difficulty and timer settings
        const difficulty = document.getElementById('triviaDifficulty')?.value || 'medium';
        const timerValue = parseInt(document.getElementById('triviaTimer')?.value || '0');
        
        // Clear existing timer
        if (triviaTimerInterval) {
            clearInterval(triviaTimerInterval);
            triviaTimerInterval = null;
        }
        
        // Setup timer if enabled
        const timerDisplay = document.getElementById('triviaTimerDisplay');
        if (timerValue > 0 && timerDisplay) {
            triviaTimeLeft = timerValue;
            timerDisplay.style.display = 'block';
            document.getElementById('triviaTimeLeft').textContent = triviaTimeLeft;
            
            triviaTimerInterval = setInterval(() => {
                triviaTimeLeft--;
                document.getElementById('triviaTimeLeft').textContent = triviaTimeLeft;
                
                if (triviaTimeLeft <= 0) {
                    clearInterval(triviaTimerInterval);
                    showError('Time\'s up!');
                    // Auto-advance or end game
                    if (currentTriviaQ < triviaQuestions.length - 1) {
                        currentTriviaQ++;
                        showTriviaQuestion();
                    } else {
                        // End game
                        showTriviaQuestion();
                    }
                }
            }, 1000);
        } else if (timerDisplay) {
            timerDisplay.style.display = 'none';
        }
        
        showTriviaQuestion();
    } catch (error) {
        console.error('Trivia error:', error);
        showError('Failed to start trivia game');
    }
}

function showTriviaQuestion() {
    if (currentTriviaQ >= triviaQuestions.length) {
        // Clear timer
        if (triviaTimerInterval) {
            clearInterval(triviaTimerInterval);
            triviaTimerInterval = null;
        }
        
        document.getElementById('triviaQuestion').textContent = 'Game Over!';
        const percentage = Math.round((triviaScore / triviaQuestions.length) * 100);
        const finalScore = `${triviaScore}/${triviaQuestions.length}`;
        document.getElementById('triviaOptions').innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3 style="font-size: 2rem; margin-bottom: 1rem;">Final Score: ${finalScore}</h3>
                <p style="font-size: 1.25rem; color: var(--christmas-gold); margin-bottom: 1rem;">${percentage}% Correct!</p>
                <button class="action-btn" id="shareTriviaResult" style="margin-top: 1rem;">📱 Share Result</button>
            </div>
        `;
        
        // Save to leaderboard with real location
        getCountryNameForLeaderboard().then(userCountry => {
        saveGameScore('trivia', percentage, userCountry);
        });
        
        // Complete daily challenge
        completeDailyChallenge('trivia');
        
        // Confetti effect
        createConfettiEffect(document.getElementById('triviaGame'));
        
        // Share button
        document.getElementById('shareTriviaResult').addEventListener('click', () => {
            shareGameResult('trivia', {
                score: triviaScore,
                total: triviaQuestions.length,
                percentage: percentage
            });
        });
        
        return;
    }
    
    // Reset timer for new question if timer is enabled
    const timerValue = parseInt(document.getElementById('triviaTimer')?.value || '0');
    if (timerValue > 0) {
        if (triviaTimerInterval) {
            clearInterval(triviaTimerInterval);
        }
        triviaTimeLeft = timerValue;
        document.getElementById('triviaTimeLeft').textContent = triviaTimeLeft;
        
        triviaTimerInterval = setInterval(() => {
            triviaTimeLeft--;
            document.getElementById('triviaTimeLeft').textContent = triviaTimeLeft;
            
            if (triviaTimeLeft <= 0) {
                clearInterval(triviaTimerInterval);
                showError('Time\'s up!');
                currentTriviaQ++;
                showTriviaQuestion();
            }
        }, 1000);
    }
    
    const q = triviaQuestions[currentTriviaQ];
    document.getElementById('triviaQuestion').textContent = q.q;
    document.getElementById('triviaScore').textContent = triviaScore;
    document.getElementById('triviaNext').style.display = 'none';
    
    const optionsDiv = document.getElementById('triviaOptions');
    optionsDiv.innerHTML = '';
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'trivia-option';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
            if (i === q.correct) {
                triviaScore++;
                btn.style.background = '#2ECC71';
                showSuccess('Correct!');
            } else {
                btn.style.background = '#E74C3C';
                showError('Wrong!');
            }
            document.getElementById('triviaScore').textContent = triviaScore;
            document.querySelectorAll('.trivia-option').forEach(b => b.disabled = true);
            document.getElementById('triviaNext').style.display = 'block';
        });
        optionsDiv.appendChild(btn);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const triviaNext = document.getElementById('triviaNext');
    if (triviaNext) {
        triviaNext.addEventListener('click', () => {
            currentTriviaQ++;
            showTriviaQuestion();
        });
    }
});

let memoryTimerInterval = null;
let memoryTimeLeft = 0;

function initMemory() {
    try {
        const memoryGame = document.getElementById('memoryGame');
        const grid = document.getElementById('memoryGrid');
        if (!memoryGame || !grid) {
            showError('Memory game not found');
            return;
        }
        memoryGame.style.display = 'block';
        grid.innerHTML = '';
        
        // Request location permission when game starts (user interaction context)
        // Only request if in secure context (HTTPS required for geolocation)
        if (!userLocation && navigator.geolocation && window.isSecureContext) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('Location obtained for memory game');
                },
                (error) => {
                    console.log('Location permission not granted for memory:', error.message);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000
                }
            );
        } else if (!window.isSecureContext) {
            console.warn('Geolocation requires HTTPS. Using default location for memory.');
        }
        
        // Get difficulty and timer settings
        const difficulty = document.getElementById('memoryDifficulty')?.value || 'medium';
        const timerValue = parseInt(document.getElementById('memoryTimer')?.value || '0');
        
        // Clear existing timer
        if (memoryTimerInterval) {
            clearInterval(memoryTimerInterval);
            memoryTimerInterval = null;
        }
        
        // Setup timer if enabled
        const timerDisplay = document.getElementById('memoryTimerDisplay');
        if (timerValue > 0 && timerDisplay) {
            memoryTimeLeft = timerValue;
            timerDisplay.style.display = 'block';
            document.getElementById('memoryTimeLeft').textContent = memoryTimeLeft;
            
            memoryTimerInterval = setInterval(() => {
                memoryTimeLeft--;
                document.getElementById('memoryTimeLeft').textContent = memoryTimeLeft;
                
                if (memoryTimeLeft <= 0) {
                    clearInterval(memoryTimerInterval);
                    showError('Time\'s up!');
                    // End game
                    grid.innerHTML = '<div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.7);">Time\'s up! Try again.</div>';
                }
            }, 1000);
        } else if (timerDisplay) {
            timerDisplay.style.display = 'none';
        }
        
        // Difficulty-based symbol count
        let symbolCount = 6; // Easy
        if (difficulty === 'medium') symbolCount = 12;
        if (difficulty === 'hard') symbolCount = 18;
        
        const allSymbols = ['🎄', '🎅', '🎁', '❄️', '🦌', '🔔', '⭐', '🌟', '🎊', '🎉', '🎈', '🎀', '🕯️', '🍪', '🥛', '🎵', '🎶', '🎤'];
        const symbols = allSymbols.slice(0, symbolCount);
        const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
        
        // Store game state in closure
        let flipped = [];
        let moves = 0;
        let matched = 0;
        let isChecking = false;
        
        cards.forEach((symbol, i) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = i;
            card.dataset.symbol = symbol;
            card.textContent = '?';
            
            card.addEventListener('click', () => {
                // Prevent clicking if already flipped, matched, or checking
                if (isChecking || card.classList.contains('flipped') || card.classList.contains('matched')) {
                    return;
                }
                
                // Flip the card
                card.textContent = symbol;
                card.classList.add('flipped');
                flipped.push(card);
                
                // If two cards are flipped, check for match
                if (flipped.length === 2) {
                    isChecking = true;
                    moves++;
                    document.getElementById('memoryMoves').textContent = moves;
                    
                    // Check if they match
                    if (flipped[0].dataset.symbol === flipped[1].dataset.symbol) {
                        // Match found!
                        flipped.forEach(c => {
                            c.classList.add('matched');
                            c.style.background = 'rgba(46, 204, 113, 0.3)';
                        });
                        matched += 2;
                        flipped = [];
                        isChecking = false;
                        
                        if (matched === cards.length) {
                            // Clear timer
                            if (memoryTimerInterval) {
                                clearInterval(memoryTimerInterval);
                                memoryTimerInterval = null;
                            }
                            
                            setTimeout(() => {
                                showSuccess('You won! 🎉');
                                if (soundEnabled) playSound('success');
                                
                                // Save to leaderboard with real location
                                getCountryNameForLeaderboard().then(userCountry => {
                                saveGameScore('memory', moves, userCountry);
                                });
                                
                                // Complete daily challenge
                                completeDailyChallenge('memory');
                                
                                // Confetti effect
                                createConfettiEffect(document.getElementById('memoryGame'));
                                
                                // Add share button
                                const memoryGame = document.getElementById('memoryGame');
                                let shareBtn = memoryGame.querySelector('#shareMemoryResult');
                                if (!shareBtn) {
                                    shareBtn = document.createElement('button');
                                    shareBtn.id = 'shareMemoryResult';
                                    shareBtn.className = 'action-btn';
                                    shareBtn.textContent = '📱 Share Result';
                                    shareBtn.style.marginTop = '1rem';
                                    shareBtn.addEventListener('click', () => {
                                        shareGameResult('memory', {
                                            moves: moves,
                                            time: memoryTimeLeft > 0 ? `${memoryTimeLeft}s` : 'N/A'
                                        });
                                    });
                                    memoryGame.appendChild(shareBtn);
                                }
                            }, 500);
                        }
                    } else {
                        // No match - flip back after delay
                        setTimeout(() => {
                            flipped.forEach(c => {
                                c.textContent = '?';
                                c.classList.remove('flipped');
                            });
                            flipped = [];
                            isChecking = false;
                        }, 1000);
                    }
                }
            });
            
            grid.appendChild(card);
        });
        
        document.getElementById('memoryMoves').textContent = '0';
    } catch (error) {
        console.error('Memory game error:', error);
        showError('Failed to start memory game');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const memoryReset = document.getElementById('memoryReset');
    if (memoryReset) {
        memoryReset.addEventListener('click', () => initMemory());
    }
});

// Word Search - Daily words
const wordSearchWordLists = [
    ['SANTA', 'SNOW', 'GIFT', 'TREE', 'BELL'],
    ['HOLLY', 'MERRY', 'JOLLY', 'FROST', 'CAROL'],
    ['ANGEL', 'STOCK', 'WREATH', 'CANDY', 'LIGHTS'],
    ['SLEIGH', 'REINDEER', 'ORNAMENT', 'PRESENT', 'FAMILY'],
    ['PEACE', 'LOVE', 'JOY', 'HOPE', 'STAR'],
    ['GINGER', 'COOKIE', 'MILK', 'CANDLE', 'FIRE'],
    ['WINTER', 'CHILLY', 'FROSTY', 'SNOWY', 'ICICLE'],
    ['DECEMBER', 'CHRISTMAS', 'HOLIDAY', 'FESTIVE', 'CELEBRATE']
];

function getDailyWordSearchWords() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const wordIndex = dayOfYear % wordSearchWordLists.length;
    return wordSearchWordLists[wordIndex];
}

function initWordSearch() {
    try {
        const wordsearchGame = document.getElementById('wordsearchGame');
        const gridDiv = document.getElementById('wordsearchGrid');
        if (!wordsearchGame || !gridDiv) {
            showError('Word search game not found');
            return;
        }
        wordsearchGame.style.display = 'block';
        
        // Request location permission when game starts (user interaction context)
        // Only request if in secure context (HTTPS required for geolocation)
        if (!userLocation && navigator.geolocation && window.isSecureContext) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('Location obtained for word search game');
                },
                (error) => {
                    console.log('Location permission not granted for word search:', error.message);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000
                }
            );
        } else if (!window.isSecureContext) {
            console.warn('Geolocation requires HTTPS. Using default location for word search.');
        }
        
        const words = getDailyWordSearchWords();
        // Use smaller grid on mobile devices
        const isMobile = window.innerWidth <= 768;
        const gridSize = isMobile ? 8 : 15; // Much smaller grid for mobile (8x8), larger for desktop
        const grid = [];
        const wordPositions = {}; // Track where words are placed with direction
        let foundWords = new Set();
        let selectedCells = [];
        let isSelecting = false;
        
        // Initialize grid with random letters
        for (let i = 0; i < gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < gridSize; j++) {
                grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
        
        // All 8 directions for maximum variety
        const directions = [
            {dr: 0, dc: 1},   // Horizontal (right)
            {dr: 0, dc: -1},  // Horizontal (left)
            {dr: 1, dc: 0},   // Vertical (down)
            {dr: -1, dc: 0},  // Vertical (up)
            {dr: 1, dc: 1},   // Diagonal (down-right)
            {dr: 1, dc: -1},  // Diagonal (down-left)
            {dr: -1, dc: 1},  // Diagonal (up-right)
            {dr: -1, dc: -1}  // Diagonal (up-left)
        ];
        
        // Place words in various directions
        words.forEach((word) => {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (!placed && attempts < maxAttempts) {
                attempts++;
                
                // Random starting position
                const startRow = Math.floor(Math.random() * gridSize);
                const startCol = Math.floor(Math.random() * gridSize);
                
                // Random direction
                const direction = directions[Math.floor(Math.random() * directions.length)];
                
                // Check if word fits
                const endRow = startRow + (word.length - 1) * direction.dr;
                const endCol = startCol + (word.length - 1) * direction.dc;
                
                if (endRow >= 0 && endRow < gridSize && endCol >= 0 && endCol < gridSize) {
                    // Check if cells are available (not conflicting with existing words)
                    let canPlace = true;
                    const positions = [];
                    
                    for (let i = 0; i < word.length; i++) {
                        const row = startRow + i * direction.dr;
                        const col = startCol + i * direction.dc;
                        const cell = grid[row][col];
                        
                        // Check if this cell is part of another word
                        let isPartOfWord = false;
                        for (const existingWord in wordPositions) {
                            if (wordPositions[existingWord].positions.some(pos => pos.row === row && pos.col === col)) {
                                isPartOfWord = true;
                                break;
                            }
                        }
                        if (isPartOfWord) {
                            canPlace = false;
                            break;
                        }
                        
                        // If cell doesn't match word letter, it's okay if it's not part of another word
                        if (cell !== word[i]) {
                            // Allow overwriting random letters
                        }
                        positions.push({row, col});
                    }
                    
                    if (canPlace) {
                        // Place the word
                        for (let i = 0; i < word.length; i++) {
                            const row = startRow + i * direction.dr;
                            const col = startCol + i * direction.dc;
                            grid[row][col] = word[i];
                        }
                        wordPositions[word] = {positions, direction};
                        placed = true;
                    }
                }
            }
            
            // Warn if word couldn't be placed
            if (!placed) {
                console.warn(`Could not place word: ${word} after ${maxAttempts} attempts`);
            }
        });
        
        // Check if all words were placed
        const placedWords = Object.keys(wordPositions);
        if (placedWords.length === 0) {
            showError('Failed to generate word search. Please try again.');
            return;
        }
        
        gridDiv.innerHTML = '';
        gridDiv.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        // Create cells with click/drag functionality
        grid.forEach((row, i) => {
            row.forEach((cell, j) => {
                const div = document.createElement('div');
                div.className = 'wordsearch-cell';
                div.dataset.row = i;
                div.dataset.col = j;
                div.textContent = cell;
                
                // Mouse events for word selection
                div.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    isSelecting = true;
                    selectedCells = [{row: i, col: j}];
                    div.classList.add('selected');
                });
                
                div.addEventListener('mouseenter', () => {
                    if (isSelecting) {
                        // Check if this cell is adjacent to the last selected cell
                        const lastCell = selectedCells[selectedCells.length - 1];
                        if (lastCell) {
                            const rowDiff = Math.abs(i - lastCell.row);
                            const colDiff = Math.abs(j - lastCell.col);
                            // Allow if adjacent (including diagonal)
                            if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
                                // Check if it's in a straight line
                                if (selectedCells.length === 1 || 
                                    (i - lastCell.row === lastCell.row - selectedCells[selectedCells.length - 2].row &&
                                     j - lastCell.col === lastCell.col - selectedCells[selectedCells.length - 2].col)) {
                                    if (!selectedCells.find(c => c.row === i && c.col === j)) {
                                        selectedCells.push({row: i, col: j});
                                        div.classList.add('selected');
                                    }
                                }
                            }
                        } else {
                            selectedCells.push({row: i, col: j});
                            div.classList.add('selected');
                        }
                    }
                });
                
                div.addEventListener('mouseup', () => {
                    if (isSelecting) {
                        checkWordSelection(selectedCells, wordPositions, Object.keys(wordPositions), foundWords);
                        clearSelection(gridDiv);
                        isSelecting = false;
                        selectedCells = [];
                    }
                });
                
                // Touch events for mobile
                div.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    isSelecting = true;
                    selectedCells = [{row: i, col: j}];
                    div.classList.add('selected');
                });
                
                div.addEventListener('touchmove', (e) => {
                    if (isSelecting) {
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (element && element.classList.contains('wordsearch-cell')) {
                            const row = parseInt(element.dataset.row);
                            const col = parseInt(element.dataset.col);
                            const lastCell = selectedCells[selectedCells.length - 1];
                            
                            if (lastCell) {
                                const rowDiff = Math.abs(row - lastCell.row);
                                const colDiff = Math.abs(col - lastCell.col);
                                if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
                                    if (selectedCells.length === 1 || 
                                        (row - lastCell.row === lastCell.row - selectedCells[selectedCells.length - 2].row &&
                                         col - lastCell.col === lastCell.col - selectedCells[selectedCells.length - 2].col)) {
                                        if (!selectedCells.find(c => c.row === row && c.col === col)) {
                                            selectedCells.push({row, col});
                                            element.classList.add('selected');
                                        }
                                    }
                                }
                            } else if (!selectedCells.find(c => c.row === row && c.col === col)) {
                                selectedCells.push({row, col});
                                element.classList.add('selected');
                            }
                        }
                    }
                });
                
                div.addEventListener('touchend', () => {
                    if (isSelecting) {
                        checkWordSelection(selectedCells, wordPositions, Object.keys(wordPositions), foundWords);
                        clearSelection(gridDiv);
                        isSelecting = false;
                        selectedCells = [];
                    }
                });
                
                gridDiv.appendChild(div);
            });
        });
        
        // Update word list to show only placed words
        const placedWordsList = Object.keys(wordPositions);
        document.getElementById('wordsearchWords').textContent = placedWordsList.join(', ');
        document.getElementById('wordsearchTotal').textContent = placedWordsList.length;
        document.getElementById('wordsearchFound').textContent = '0';
        
        // Clear selection on mouse leave
        const globalMouseUpHandler = () => {
            if (isSelecting) {
                checkWordSelection(selectedCells, wordPositions, placedWordsList, foundWords);
                clearSelection(gridDiv);
                isSelecting = false;
                selectedCells = [];
            }
        };
        
        document.addEventListener('mouseup', globalMouseUpHandler);
    } catch (error) {
        console.error('Word search error:', error);
        showError('Failed to start word search game');
    }
}

function checkWordSelection(selectedCells, wordPositions, words, foundWords) {
    if (selectedCells.length < 3) return;
    
    // Get the word from selected cells (in order of selection)
    const word = selectedCells.map(cell => {
        const cellEl = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
        return cellEl ? cellEl.textContent : '';
    }).join('');
    
    // Also check reverse
    const reverseWord = [...selectedCells].reverse().map(cell => {
        const cellEl = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
        return cellEl ? cellEl.textContent : '';
    }).join('');
    
    // Check if word matches (forward or reverse)
    const matchedWord = words.find(w => w === word || w === reverseWord);
    
    if (matchedWord && !foundWords.has(matchedWord)) {
        // Verify the selection matches the word's direction
        const wordInfo = wordPositions[matchedWord];
        if (!wordInfo) return;
        
        // Check if selected cells match the word's positions
        const selectedSet = new Set(selectedCells.map(c => `${c.row},${c.col}`));
        const wordSet = new Set(wordInfo.positions.map(p => `${p.row},${p.col}`));
        
        // Check if all selected cells match word positions (or reverse)
        const allMatch = wordInfo.positions.every(p => selectedSet.has(`${p.row},${p.col}`)) &&
                        selectedCells.length === wordInfo.positions.length;
        
        if (allMatch) {
            foundWords.add(matchedWord);
            selectedCells.forEach(cell => {
                const cellEl = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
                if (cellEl) {
                    cellEl.classList.add('found');
                    cellEl.classList.remove('selected');
                }
            });
            
            document.getElementById('wordsearchFound').textContent = foundWords.size;
            showSuccess(`Found "${matchedWord}"!`);
            
            if (foundWords.size === words.length) {
                setTimeout(() => {
                    showSuccess('You found all words! 🎉');
                    
                    // Confetti effect
                    createConfettiEffect(document.getElementById('wordsearchGame'));
                    
                    // Add share button
                    const wordsearchGame = document.getElementById('wordsearchGame');
                    let shareBtn = wordsearchGame.querySelector('#shareWordSearchResult');
                    if (!shareBtn) {
                        shareBtn = document.createElement('button');
                        shareBtn.id = 'shareWordSearchResult';
                        shareBtn.className = 'action-btn';
                        shareBtn.textContent = '📱 Share Result';
                        shareBtn.style.marginTop = '1rem';
                    shareBtn.addEventListener('click', () => {
                        shareGameResult('wordsearch', {
                            wordsFound: foundWords.size,
                            totalWords: words.length
                        });
                    });
                    wordsearchGame.appendChild(shareBtn);
                    
                    // Save to leaderboard and complete challenge
                    getCountryNameForLeaderboard().then(userCountry => {
                    saveGameScore('wordsearch', foundWords.size, userCountry);
                    });
                    completeDailyChallenge('wordsearch');
                }
            }, 500);
        }
        }
    }
}

function clearSelection(gridDiv) {
    gridDiv.querySelectorAll('.wordsearch-cell.selected:not(.found)').forEach(cell => {
        cell.classList.remove('selected');
    });
}

// Share to Specific Platforms
function shareToPlatform(platform, text, url = window.location.href, blob = null) {
    // If we have a blob and native share is available, use it (works better for images)
    if (blob && navigator.share && navigator.canShare) {
        blob.arrayBuffer().then(buffer => {
            const file = new File([buffer], `christmas-${platform}-${Date.now()}.png`, { type: 'image/png' });
            const shareData = {
                title: 'My Christmas Result',
                text: text,
                files: [file]
            };
            
            if (navigator.canShare(shareData)) {
                navigator.share(shareData).then(() => {
                    showSuccess('Shared successfully!');
                    if (soundEnabled) playSound('success');
                }).catch((error) => {
                    if (error.name !== 'AbortError') {
                        // Fallback to URL-based sharing
                        shareToPlatformURL(platform, text, url, blob);
                    }
                });
            } else {
                // Can't share files, use URL-based sharing
                shareToPlatformURL(platform, text, url, blob);
            }
        }).catch(() => {
            // Fallback to URL-based sharing
            shareToPlatformURL(platform, text, url, blob);
        });
    } else {
        // No native share or no blob - use URL-based sharing
        shareToPlatformURL(platform, text, url, blob);
    }
}

// URL-based platform sharing (fallback)
function shareToPlatformURL(platform, text, url, blob) {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    
    const platforms = {
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        email: `mailto:?subject=${encodeURIComponent('Check out my Christmas result!')}&body=${encodedText}%20${encodedUrl}`
    };
    
    if (platforms[platform]) {
        if (platform === 'email') {
            window.location.href = platforms[platform];
        } else {
            window.open(platforms[platform], '_blank', 'width=600,height=400');
        }
        showSuccess('Share window opened!');
    }
}

// Share to Instagram Stories (Mobile)
async function shareToInstagramStory(blob, text = '') {
    if (!blob) {
        showError('No image to share');
        return;
    }
    
    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
    
    console.log('Instagram Share Debug:', {
        isMobile,
        hasNavigatorShare: !!navigator.share,
        isSecureContext,
        protocol: location.protocol,
        hostname: location.hostname
    });
    
    // Check if native share is available and we're in a secure context
    if (navigator.share && isSecureContext) {
        try {
            // Convert blob to File
            const buffer = await blob.arrayBuffer();
            const file = new File([buffer], `christmas-story-${Date.now()}.png`, { type: 'image/png' });
            
            // Prepare share data with just the file (no text to avoid issues)
            const shareData = {
                files: [file]
            };
            
            console.log('Prepared file for sharing:', {
                name: file.name,
                type: file.type,
                size: file.size
            });
            
            // Try to share - don't rely on canShare as it may return false incorrectly
            try {
                console.log('Calling navigator.share...');
                await navigator.share(shareData);
                console.log('Share dialog opened successfully');
                if (soundEnabled) playSound('success');
                return; // Success - user will see Instagram's share interface
            } catch (error) {
                console.error('navigator.share error:', error);
                
                // User cancelled - do nothing
                if (error.name === 'AbortError' || error.message.includes('cancel')) {
                    console.log('User cancelled share');
                    return;
                }
                
                // Check if error is about unsupported file sharing
                if (error.message && error.message.includes('file')) {
                    console.log('File sharing not supported, trying without canShare check');
                    // Some browsers need canShare check first
                    if (navigator.canShare) {
                        const canShare = navigator.canShare(shareData);
                        console.log('canShare result:', canShare);
                        if (!canShare) {
                            throw new Error('File sharing not supported by browser');
                        }
                    }
                }
                
                throw error; // Re-throw to be caught by outer catch
            }
        } catch (error) {
            console.error('Error in share process:', error);
            // Fallback: open Instagram app (no download)
            if (isMobile) {
                openInstagramApp(blob, false);
                showError('Native share failed. Please download the image and share manually, or try again.');
            } else {
                showError('Native share not available. Please download the image and share manually.');
            }
        }
    } else {
        // No native share API or not secure context
        const reason = !navigator.share ? 'Browser does not support native sharing' : 'Page must be served over HTTPS';
        console.log('Cannot use native share:', reason);
        if (isMobile) {
            openInstagramApp(blob, false);
            showError(`${reason}. Please download the image and share manually.`);
        } else {
            showError('Native share not available. Please download the image and share manually.');
        }
    }
}

// Helper function to download image for sharing
function downloadImageForSharing(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `christmas-share-${Date.now()}.png`;
    link.href = url;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Open Instagram App (fallback)
function openInstagramApp(blob, download = false) {
    // Only download if explicitly requested
    if (download && blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `christmas-story-${Date.now()}.png`;
        link.href = url;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    
    // Try to open Instagram app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
        // iOS: Try to open Instagram Stories directly
        try {
            window.location.href = 'instagram-stories://share';
            setTimeout(() => {
                // If that didn't work, try opening Instagram app
                window.location.href = 'instagram://';
            }, 1000);
        } catch (e) {
            // Fallback to Instagram app
            window.location.href = 'instagram://';
        }
    } else if (isAndroid) {
        // Android: Try to open Instagram with intent
        try {
            window.location.href = 'intent://share#Intent;package=com.instagram.android;scheme=https;end';
            setTimeout(() => {
                // Fallback to web Instagram if app not installed
                window.open('https://www.instagram.com/', '_blank');
            }, 1000);
        } catch (e) {
            // Fallback to web Instagram
            window.open('https://www.instagram.com/', '_blank');
        }
    } else {
        // Desktop: Open Instagram web
        window.open('https://www.instagram.com/', '_blank');
    }
}

// Share Game Results
function shareGameResult(gameType, result) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            showError('Canvas not supported');
            return;
        }
        
        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0A0A0A');
        gradient.addColorStop(0.5, '#1A0F0F');
        gradient.addColorStop(1, '#0A0A0A');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 64px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Christmas Games', canvas.width / 2, 200);
        
        // Game-specific content
        let gameTitle = '';
        let gameResult = '';
        let shareText = '';
        
        switch(gameType) {
            case 'trivia':
                gameTitle = '🎯 Christmas Trivia';
                gameResult = `Score: ${result.score}/${result.total}\n${result.percentage}% Correct!`;
                shareText = `I scored ${result.score}/${result.total} (${result.percentage}%) on Christmas Trivia! 🎄`;
                break;
            case 'memory':
                gameTitle = '🧠 Memory Game';
                gameResult = `Completed in ${result.moves} moves!`;
                shareText = `I completed the Christmas Memory Game in ${result.moves} moves! 🎄`;
                break;
            case 'wordsearch':
                gameTitle = '🔍 Word Search';
                gameResult = `Found ${result.wordsFound}/${result.totalWords} words!`;
                shareText = `I found ${result.wordsFound}/${result.totalWords} words in the Christmas Word Search! 🎄`;
                break;
            case 'wordle':
                gameTitle = '🎯 Christmas Wordle';
                const guessText = result.guesses === 1 ? 'try' : 'tries';
                gameResult = `I finished the Christmas Wordle game in ${result.guesses} ${guessText}!`;
                shareText = `I finished the Christmas Wordle game in ${result.guesses} ${guessText}! 🎄`;
                break;
        }
        
        // Game title
        ctx.font = 'bold 56px Arial, sans-serif';
        ctx.fillText(gameTitle, canvas.width / 2, 400);
        
        // Result
        ctx.font = 'bold 48px Arial, sans-serif';
        const lines = gameResult.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, canvas.width / 2, 600 + i * 80);
        });
        
        // Decorative elements
        ctx.font = '120px Arial';
        ctx.fillText('🎄', canvas.width / 2 - 150, 900);
        ctx.fillText('✨', canvas.width / 2 + 150, 900);
        
        // Footer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '32px Arial, sans-serif';
        ctx.fillText('Christmas Magic', canvas.width / 2, canvas.height - 100);
        
        // Convert to image and share
        canvas.toBlob(blob => {
            if (!blob) {
                showError('Failed to generate image');
                return;
            }
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `christmas-${gameType}-result-${Date.now()}.png`;
            link.href = url;
            link.click();
            
            // Show platform share options
            showShareOptions(gameType, shareText, blob, gameTitle);
            
            showSuccess('Result image saved!');
        }, 'image/png');
    } catch (error) {
        console.error('Share game result error:', error);
        showError('Failed to share result. Please try again.');
    }
}

// Wordle Game
const christmasWords = [
    'SANTA', 'SNOWY', 'GIFTS', 'TREES', 'BELLS', 'HOLLY', 'MERRY', 'JOLLY',
    'FROST', 'CAROL', 'ANGEL', 'STOCK', 'WREATH', 'CANDY', 'LIGHTS', 'SLEIGH',
    'REINDEER', 'ORNAMENT', 'PRESENT', 'FAMILY', 'PEACE', 'LOVE', 'JOY', 'HOPE'
].filter(w => w.length === 5); // Only 5-letter words

// Word hints - descriptive clues for each word
const wordHints = {
    'SANTA': 'The jolly man in red who delivers presents on Christmas Eve; also known as Saint Nicholas or Father Christmas.',
    'SNOWY': 'Covered with or resembling snow; a white, wintry landscape perfect for Christmas scenes.',
    'GIFTS': 'Presents given during Christmas celebrations; items wrapped in colorful paper and placed under the tree.',
    'TREES': 'Evergreen plants decorated with lights, ornaments, and a star on top during the Christmas season.',
    'BELLS': 'Musical instruments that ring and jingle, often heard in Christmas carols and on sleigh rides.',
    'HOLLY': 'A festive evergreen plant with red berries and spiky leaves, used for Christmas decorations and wreaths.',
    'MERRY': 'A cheerful and joyful feeling associated with Christmas celebrations and good spirits.',
    'JOLLY': 'Happy, cheerful, and full of good humor; often used to describe Santa Claus\'s personality.',
    'FROST': 'A thin layer of ice crystals that forms on surfaces during cold winter mornings, creating a magical appearance.',
    'CAROL': 'A traditional Christmas song or hymn sung during the holiday season, like "Silent Night" or "Jingle Bells".',
    'ANGEL': 'A heavenly messenger often depicted on top of Christmas trees or in nativity scenes, symbolizing peace and hope.',
    'STOCK': 'A long sock hung by the fireplace for Santa to fill with small gifts and treats on Christmas Eve.',
    'CANDY': 'Sweet treats like candy canes, chocolates, and other confections enjoyed during Christmas celebrations.',
    'PEACE': 'A state of tranquility and harmony, one of the core values celebrated during the Christmas season.'
};

function getDailyWord() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const wordIndex = dayOfYear % christmasWords.length;
    return christmasWords[wordIndex].toUpperCase();
}

let wordleWord = '';
let wordleGuesses = [];
let currentGuess = '';
let currentRow = 0;
let wordleHintShown = false; // Track if hint has been shown (only one hint per game)
const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

function initWordle() {
    try {
        const wordleGame = document.getElementById('wordleGame');
        const grid = document.getElementById('wordleGrid');
        const keyboard = document.getElementById('wordleKeyboard');
        
        if (!wordleGame || !grid || !keyboard) {
            showError('Wordle game not found');
            return;
        }
        
        wordleGame.style.display = 'block';
        
        // Request location permission when game starts (user interaction context)
        // Only request if in secure context (HTTPS required for geolocation)
        if (!userLocation && navigator.geolocation && window.isSecureContext) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('Location obtained for wordle game');
                },
                (error) => {
                    console.log('Location permission not granted for wordle:', error.message);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000
                }
            );
        } else if (!window.isSecureContext) {
            console.warn('Geolocation requires HTTPS. Using default location for wordle.');
        }
        
        wordleWord = getDailyWord();
        wordleGuesses = [];
        currentGuess = '';
        currentRow = 0;
        wordleHintShown = false;
        
        // Create grid
        grid.innerHTML = '';
        for (let i = 0; i < MAX_GUESSES; i++) {
            const row = document.createElement('div');
            row.className = 'wordle-row';
            for (let j = 0; j < WORD_LENGTH; j++) {
                const cell = document.createElement('div');
                cell.className = 'wordle-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                row.appendChild(cell);
            }
            grid.appendChild(row);
        }
        
        // Create keyboard
        keyboard.innerHTML = '';
        const keyboardLayout = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
        ];
        
        keyboardLayout.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'wordle-keyboard-row';
            row.forEach(key => {
                const keyBtn = document.createElement('button');
                keyBtn.className = 'wordle-key';
                keyBtn.dataset.key = key;
                
                if (key === 'ENTER') {
                    keyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v5h-5"></path></svg>';
                    keyBtn.setAttribute('aria-label', 'Enter');
                    keyBtn.addEventListener('click', () => submitGuess());
                } else if (key === 'BACK') {
                    keyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>';
                    keyBtn.setAttribute('aria-label', 'Backspace');
                    keyBtn.addEventListener('click', () => deleteLetter());
                } else {
                    keyBtn.textContent = key;
                    keyBtn.addEventListener('click', () => addLetter(key));
                }
                
                rowDiv.appendChild(keyBtn);
            });
            keyboard.appendChild(rowDiv);
        });
        
        // Keyboard input
        document.addEventListener('keydown', handleWordleKeydown);
        
        // Reset button
        const resetBtn = document.getElementById('wordleReset');
        if (resetBtn) {
            resetBtn.style.display = 'none';
            resetBtn.onclick = () => initWordle();
        }
        
        // Hint button
        let hintBtn = document.getElementById('wordleHint');
        if (!hintBtn) {
            hintBtn = document.createElement('button');
            hintBtn.id = 'wordleHint';
            hintBtn.className = 'action-btn';
            hintBtn.textContent = '💡 Get Hint';
            hintBtn.style.marginTop = '1rem';
            hintBtn.style.marginRight = '0.5rem';
            hintBtn.addEventListener('click', showWordleHint);
            const wordleGame = document.getElementById('wordleGame');
            const resetBtn = document.getElementById('wordleReset');
            if (resetBtn && resetBtn.parentNode) {
                resetBtn.parentNode.insertBefore(hintBtn, resetBtn);
            } else {
                wordleGame.appendChild(hintBtn);
            }
        } else {
            hintBtn.style.display = 'block';
            hintBtn.disabled = false;
            hintBtn.style.opacity = '1';
            hintBtn.textContent = '💡 Get Hint';
            hintBtn.onclick = showWordleHint;
        }
        
        // Hint message area
        let hintMessage = document.getElementById('wordleHintMessage');
        if (!hintMessage) {
            hintMessage = document.createElement('div');
            hintMessage.id = 'wordleHintMessage';
            hintMessage.style.marginTop = '1rem';
            hintMessage.style.padding = '1rem';
            hintMessage.style.background = 'rgba(255, 184, 28, 0.1)';
            hintMessage.style.border = '1px solid rgba(255, 184, 28, 0.3)';
            hintMessage.style.borderRadius = '12px';
            hintMessage.style.color = 'rgba(255, 255, 255, 0.9)';
            hintMessage.style.fontSize = '0.95rem';
            hintMessage.style.lineHeight = '1.6';
            hintMessage.style.display = 'none';
            const wordleGame = document.getElementById('wordleGame');
            const hintBtn = document.getElementById('wordleHint');
            if (hintBtn && hintBtn.parentNode) {
                hintBtn.parentNode.insertBefore(hintMessage, hintBtn.nextSibling);
            } else {
                wordleGame.appendChild(hintMessage);
            }
        } else {
            hintMessage.style.display = 'none';
            hintMessage.textContent = '';
        }
        
        document.getElementById('wordleMessage').textContent = '';
    } catch (error) {
        console.error('Wordle error:', error);
        showError('Failed to start Wordle game');
    }
}

function handleWordleKeydown(e) {
    if (document.getElementById('wordleGame').style.display === 'none') return;
    
    if (e.key === 'Enter') {
        submitGuess();
    } else if (e.key === 'Backspace') {
        deleteLetter();
    } else if (/^[A-Za-z]$/.test(e.key)) {
        addLetter(e.key.toUpperCase());
    }
}

function addLetter(letter) {
    if (currentGuess.length < WORD_LENGTH) {
        currentGuess += letter;
        updateWordleDisplay();
    }
}

function deleteLetter() {
    if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        updateWordleDisplay();
    }
}

function updateWordleDisplay() {
    const row = document.querySelector(`.wordle-row:nth-child(${currentRow + 1})`);
    if (!row) return;
    
    const cells = row.querySelectorAll('.wordle-cell');
    cells.forEach((cell, i) => {
        cell.textContent = currentGuess[i] || '';
    });
}

function submitGuess() {
    if (currentGuess.length !== WORD_LENGTH) {
        showError('Word must be 5 letters!');
        return;
    }
    
    if (!christmasWords.includes(currentGuess)) {
        showError('Not a valid word!');
        return;
    }
    
    const result = checkWordleGuess(currentGuess, wordleWord);
    wordleGuesses.push({word: currentGuess, result});
    
    // Update display with colors
    const row = document.querySelector(`.wordle-row:nth-child(${currentRow + 1})`);
    const cells = row.querySelectorAll('.wordle-cell');
    
    result.forEach((status, i) => {
        cells[i].textContent = currentGuess[i];
        if (status === 'correct') {
            cells[i].classList.add('correct');
        } else if (status === 'present') {
            cells[i].classList.add('present');
        } else {
            cells[i].classList.add('absent');
        }
        
        // Update keyboard
        const key = document.querySelector(`[data-key="${currentGuess[i]}"]`);
        if (key) {
            if (status === 'correct') {
                key.classList.add('correct');
            } else if (status === 'present' && !key.classList.contains('correct')) {
                key.classList.add('present');
            } else if (status === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present')) {
                key.classList.add('absent');
            }
        }
    });
    
    // Check win/lose
    if (currentGuess === wordleWord) {
        const guesses = currentRow + 1;
        document.getElementById('wordleMessage').textContent = `🎉 You won in ${guesses} guesses!`;
        document.getElementById('wordleReset').style.display = 'block';
        const hintBtn = document.getElementById('wordleHint');
        if (hintBtn) hintBtn.style.display = 'none';
        document.removeEventListener('keydown', handleWordleKeydown);
        showSuccess('Congratulations!');
        
        // Save to leaderboard and complete challenge
        getCountryNameForLeaderboard().then(userCountry => {
        saveGameScore('wordle', guesses, userCountry);
        });
        completeDailyChallenge('wordle');
        
        // Confetti effect
        createConfettiEffect(document.getElementById('wordleGame'));
        
        // Add share button
        const wordleGame = document.getElementById('wordleGame');
        let shareBtn = wordleGame.querySelector('#shareWordleResult');
        if (!shareBtn) {
            shareBtn = document.createElement('button');
            shareBtn.id = 'shareWordleResult';
            shareBtn.className = 'action-btn';
            shareBtn.textContent = '📱 Share Result';
            shareBtn.style.marginTop = '1rem';
            shareBtn.addEventListener('click', () => {
                shareGameResult('wordle', {
                    guesses: guesses,
                    word: wordleWord
                });
            });
            wordleGame.insertBefore(shareBtn, wordleGame.querySelector('#wordleReset'));
        }
        return;
    }
    
    currentRow++;
    currentGuess = '';
    
    if (currentRow >= MAX_GUESSES) {
        document.getElementById('wordleMessage').textContent = `Game Over! The word was: ${wordleWord}`;
        document.getElementById('wordleReset').style.display = 'block';
        const hintBtn = document.getElementById('wordleHint');
        if (hintBtn) hintBtn.style.display = 'none';
        document.removeEventListener('keydown', handleWordleKeydown);
        showError('Out of guesses!');
    }
}

function showWordleHint() {
    if (wordleHintShown) {
        showError('Hint has already been shown!');
        return;
    }
    
    // Get the hint for the current word
    const hint = wordHints[wordleWord];
    
    if (!hint) {
        showError('No hint available for this word.');
        return;
    }
    
    // Show the hint message
    const hintMessage = document.getElementById('wordleHintMessage');
    if (hintMessage) {
        hintMessage.innerHTML = `<strong>💡 Hint:</strong> ${hint}`;
        hintMessage.style.display = 'block';
        
        // Add light mode support
        if (!document.body.classList.contains('dark-mode')) {
            hintMessage.style.background = 'rgba(255, 184, 28, 0.15)';
            hintMessage.style.borderColor = 'rgba(255, 184, 28, 0.4)';
            hintMessage.style.color = '#1a1a1a';
        }
    }
    
    // Update hint button
    const hintBtn = document.getElementById('wordleHint');
    if (hintBtn) {
        hintBtn.textContent = '💡 Hint (Used)';
        hintBtn.disabled = true;
        hintBtn.style.opacity = '0.5';
    }
    
    wordleHintShown = true;
    showSuccess('💡 Hint revealed!');
}

function checkWordleGuess(guess, target) {
    const result = Array(WORD_LENGTH).fill('absent');
    const targetLetters = target.split('');
    const guessLetters = guess.split('');
    
    // First pass: mark correct positions
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            result[i] = 'correct';
            targetLetters[i] = null; // Mark as used
            guessLetters[i] = null;
        }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessLetters[i] !== null && targetLetters.includes(guessLetters[i])) {
            result[i] = 'present';
            const index = targetLetters.indexOf(guessLetters[i]);
            targetLetters[index] = null;
        }
    }
    
    return result;
}

// Enhanced Sock Hanging - Add filters and search
function enhanceSockHanging() {
    try {
        const sockSearch = document.getElementById('sockSearch');
        const countryFilter = document.getElementById('countryFilter');
        const exportMapBtn = document.getElementById('exportMapBtn');
        
        // Populate country filter
        if (countryFilter) {
            // Get countries from Firebase data (sockData) only
            const countries = [...new Set(sockData.map(sock => sock.country).filter(Boolean))];
            countries.sort().forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countryFilter.appendChild(option);
            });
        }
        
        // Search functionality
        if (sockSearch) {
            sockSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                filterSockFeed(searchTerm);
            });
        }
        
        // Country filter
        if (countryFilter) {
            countryFilter.addEventListener('change', (e) => {
                const selectedCountry = e.target.value;
                filterSockFeed(null, selectedCountry);
            });
        }
        
        // Export map view
        if (exportMapBtn) {
            exportMapBtn.addEventListener('click', () => {
                exportMapView();
            });
        }
    } catch (error) {
        console.error('Sock enhancement error:', error);
    }
}

function filterSockFeed(searchTerm = null, country = null) {
    const sockFeed = document.getElementById('sockFeed');
    if (!sockFeed) return;
    
    let filteredData = sockData;
    
    if (searchTerm) {
        filteredData = filteredData.filter(sock => 
            sock.city.toLowerCase().includes(searchTerm) ||
            sock.country.toLowerCase().includes(searchTerm) ||
            (sock.message && sock.message.toLowerCase().includes(searchTerm))
        );
    }
    
    if (country) {
        filteredData = filteredData.filter(sock => sock.country === country);
    }
    
    sockFeed.innerHTML = '';
    const feedItems = filteredData.slice(0, 10);
    
    feedItems.forEach(sock => {
        const feedItem = document.createElement('div');
        feedItem.className = 'feed-item';
        
        const time = formatTime(sock.timestamp);
        const messageText = sock.message ? `: "${sock.message}"` : '';
        
        feedItem.innerHTML = `
            <div class="feed-item-icon">${sock.emoji}</div>
            <div class="feed-item-content">
                <div class="feed-item-text">Sock hung in ${sock.city}${messageText}</div>
                <div class="feed-item-location">${sock.country}</div>
            </div>
            <div class="feed-item-time">${time}</div>
        `;
        
        sockFeed.appendChild(feedItem);
    });
    
    if (feedItems.length === 0) {
        sockFeed.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">No socks found matching your search.</div>';
    }
}

function exportMapView() {
    if (!map) {
        showError('Map not loaded yet. Please wait...');
        return;
    }
    
    loadHtml2Canvas().then(() => {
        if (typeof html2canvas === 'undefined') {
            showError('Failed to load image generator. Please refresh the page.');
            return;
        }
        
        const mapContainer = document.getElementById('sockMap');
        if (!mapContainer) return;
        
        const loader = showLoading(mapContainer, 'Generating map image...');
        
        html2canvas(mapContainer, {
            backgroundColor: '#1a1a1a',
            scale: 2,
            useCORS: true
        }).then(canvas => {
            hideLoading(loader);
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `christmas-sock-map-${Date.now()}.png`;
                link.href = url;
                link.click();
                showSuccess('Map exported!');
                if (soundEnabled) playSound('success');
            }, 'image/png');
        }).catch(error => {
            hideLoading(loader);
            console.error('Export error:', error);
            showError('Failed to export map. Please try again.');
        });
    });
}

// Daily Challenges System
// Daily Challenges - Removed localStorage (using in-memory only)
let dailyChallenges = {
    lastChallengeDate: '',
    challenges: { trivia: false, memory: false, wordsearch: false, wordle: false, card: false, sock: false }
};

function initDailyChallenges() {
    const today = new Date().toDateString();
    
    if (dailyChallenges.lastChallengeDate !== today) {
        // New day - reset challenges
        dailyChallenges.lastChallengeDate = today;
        dailyChallenges.challenges = {
            trivia: false,
            memory: false,
            wordsearch: false,
            wordle: false,
            card: false,
            sock: false
        };
    }
    
    // Show daily challenge indicator
    const completedCount = Object.values(dailyChallenges.challenges).filter(c => c).length;
    const totalChallenges = Object.keys(dailyChallenges.challenges).length;
    
    if (completedCount < totalChallenges) {
        // Add challenge badge to games section
        const gamesSection = document.getElementById('games');
        if (gamesSection) {
            let challengeBadge = gamesSection.querySelector('.daily-challenge-badge');
            if (!challengeBadge) {
                challengeBadge = document.createElement('div');
                challengeBadge.className = 'daily-challenge-badge';
                challengeBadge.innerHTML = `
                    <span>🎯 Daily Challenge: ${completedCount}/${totalChallenges} completed</span>
                `;
                gamesSection.querySelector('.container').insertBefore(challengeBadge, gamesSection.querySelector('.games-grid'));
            }
        }
    }
}

function completeDailyChallenge(challengeType) {
    dailyChallenges.challenges[challengeType] = true;
    initDailyChallenges(); // Refresh display
}

// Enhanced Advent Calendar - Add progress tracking
function enhanceAdventCalendar() {
    try {
        const progress = openedDoors.length;
        const total = 24;
        const progressText = `${progress}/${total} doors opened`;
        
        // Add progress indicator if not exists
        const calendarSection = document.getElementById('advent-calendar');
        if (calendarSection) {
            let progressDiv = document.getElementById('adventProgress');
            if (!progressDiv) {
                progressDiv = document.createElement('div');
                progressDiv.id = 'adventProgress';
                progressDiv.className = 'advent-progress';
                calendarSection.querySelector('.container').insertBefore(progressDiv, calendarSection.querySelector('.calendar-grid'));
            }
            progressDiv.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(progress / total) * 100}%"></div>
                </div>
                <p>${progressText}</p>
            `;
        }
    } catch (error) {
        console.error('Advent enhancement error:', error);
    }
}

// Mobile Optimizations - Better keyboard handling only
function initMobileOptimizations() {
    try {
        // Better mobile keyboard handling
        const textInputs = document.querySelectorAll('input[type="text"], textarea');
        textInputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Scroll input into view on mobile
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    } catch (error) {
        console.error('Mobile optimization error:', error);
    }
}

// Share Your Christmas
// Initialize empty - will be populated ONLY from Firebase (no localStorage, no demo data)
let christmasShares = [];

// Image Sphere Grid Viewer (3D Sphere of Images)
let sphereGridViewer = null;
let sphereImages = [];

function initImageSphere() {
    // No close button needed - sphere view is always visible now
    // Just initialize when needed
}

// Sphere Math Utilities
const SPHERE_MATH = {
    degreesToRadians: (degrees) => degrees * (Math.PI / 180),
    radiansToDegrees: (radians) => radians * (180 / Math.PI),
    sphericalToCartesian: (radius, theta, phi) => ({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta)
    }),
    normalizeAngle: (angle) => {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    }
};

// Create 3D Sphere Grid Viewer
function createSphereGridViewer(images, containerElement, sharesData = null) {
    if (!containerElement || !images || images.length === 0) {
        console.error('Invalid parameters for sphere grid viewer');
        return null;
    }
    
    // Map images to share data for modal display
    const imageToShareMap = {};
    if (sharesData && sharesData.length === images.length) {
        images.forEach((img, index) => {
            imageToShareMap[img] = sharesData[index];
        });
    }
    
    // Configuration
    const CONFIG = {
        containerSize: 600,
        sphereRadius: 200,
        dragSensitivity: 0.8,
        momentumDecay: 0.96,
        maxRotationSpeed: 6,
        baseImageScale: 0.15,
        hoverScale: 1.3,
        perspective: 1000,
        autoRotate: true,
        autoRotateSpeed: 0.2
    };
    
    // State
    let rotation = { x: 15, y: 15, z: 0 };
    let velocity = { x: 0, y: 0 };
    let isDragging = false;
    let lastMousePos = { x: 0, y: 0 };
    let hoveredIndex = null;
    let selectedImage = null;
    let animationFrameId = null;
    let mouseDownPos = { x: 0, y: 0 };
    let hasDragged = false;
    let documentListenersAttached = false; // Track if document listeners are attached
    
    // Generate sphere positions using Fibonacci distribution
    function generateSpherePositions() {
        const positions = [];
        const imageCount = images.length;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleIncrement = 2 * Math.PI / goldenRatio;
        
        for (let i = 0; i < imageCount; i++) {
            const t = i / imageCount;
            const inclination = Math.acos(1 - 2 * t);
            const azimuth = angleIncrement * i;
            
            let phi = inclination * (180 / Math.PI);
            let theta = (azimuth * (180 / Math.PI)) % 360;
            
            const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
            if (phi < 90) {
                phi = Math.max(5, phi - poleBonus);
            } else {
                phi = Math.min(175, phi + poleBonus);
            }
            
            phi = 15 + (phi / 180) * 150;
            
            const randomOffset = (Math.random() - 0.5) * 20;
            theta = (theta + randomOffset) % 360;
            phi = Math.max(0, Math.min(180, phi + (Math.random() - 0.5) * 10));
            
            positions.push({ theta, phi, radius: CONFIG.sphereRadius });
        }
        
        return positions;
    }
    
    const imagePositions = generateSpherePositions();
    const baseImageSize = CONFIG.containerSize * CONFIG.baseImageScale;
    
    // Calculate world positions
    function calculateWorldPositions() {
        return imagePositions.map((pos, index) => {
            const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta);
            const phiRad = SPHERE_MATH.degreesToRadians(pos.phi);
            const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x);
            const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y);
            
            let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
            let y = pos.radius * Math.cos(phiRad);
            let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);
            
            // Apply Y-axis rotation
            const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
            const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
            x = x1;
            z = z1;
            
            // Apply X-axis rotation
            const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
            const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
            y = y2;
            z = z2;
            
            // More lenient visibility - show images even when slightly behind
            const fadeZoneStart = -20;
            const fadeZoneEnd = -50;
            const isVisible = z > fadeZoneEnd;
            let fadeOpacity = 1;
            if (z <= fadeZoneStart && z > fadeZoneEnd) {
                fadeOpacity = Math.max(0.1, (z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd));
            } else if (z <= fadeZoneEnd) {
                fadeOpacity = 0.1; // Still slightly visible even when behind
            }
            
            const distanceFromCenter = Math.sqrt(x * x + y * y);
            const maxDistance = CONFIG.sphereRadius;
            const distanceRatio = Math.min(distanceFromCenter / maxDistance, 1);
            const centerScale = Math.max(0.3, 1 - distanceRatio * 0.7);
            const depthScale = (z + CONFIG.sphereRadius) / (2 * CONFIG.sphereRadius);
            const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);
            
            return { x, y, z, scale, zIndex: Math.round(1000 + z), isVisible, fadeOpacity, originalIndex: index };
        });
    }
    
    // Render images
    function render() {
        const worldPositions = calculateWorldPositions();
        containerElement.innerHTML = '';
        
        // Sort by z-index for proper rendering order
        const sortedPositions = worldPositions
            .map((pos, index) => ({ ...pos, originalIndex: index }))
            .sort((a, b) => b.z - a.z); // Render back to front
        
        sortedPositions.forEach((pos) => {
            const index = pos.originalIndex;
            // Show all images, but with reduced opacity if behind
            // if (!pos.isVisible && pos.fadeOpacity < 0.1) return;
            
            const image = images[index];
            if (!image) return;
            
            const imageSize = baseImageSize * pos.scale;
            const isHovered = hoveredIndex === index;
            const finalScale = isHovered ? Math.min(1.2, 1.2 / pos.scale) : 1;
            
            const imgDiv = document.createElement('div');
            imgDiv.className = 'sphere-image-item';
            imgDiv.dataset.imageIndex = index;
            // Center the sphere in the container - use actual container dimensions
            // Since container uses padding-bottom: 100%, width and height are the same
            const containerSize = containerElement.offsetWidth || containerElement.clientWidth || CONFIG.containerSize;
            const centerX = containerSize / 2;
            const centerY = containerSize / 2;
            imgDiv.style.cssText = `
                position: absolute;
                width: ${imageSize}px;
                height: ${imageSize}px;
                left: ${centerX + pos.x}px;
                top: ${centerY + pos.y}px;
                opacity: ${Math.max(0.3, pos.fadeOpacity)};
                transform: translate(-50%, -50%) scale(${finalScale});
                z-index: ${pos.zIndex};
                cursor: pointer;
                transition: transform 0.2s ease-out;
                pointer-events: auto;
            `;
            
            imgDiv.innerHTML = `
                <div class="sphere-image-wrapper">
                    <img src="${image}" alt="Christmas share" loading="${index < 3 ? 'eager' : 'lazy'}" draggable="false" />
                </div>
            `;
            
            imgDiv.addEventListener('mouseenter', () => { hoveredIndex = index; render(); });
            imgDiv.addEventListener('mouseleave', () => { hoveredIndex = null; render(); });
            
            // Prevent container drag when clicking on image (desktop only)
            // On mobile, allow touch events to work for sphere rotation
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            (window.innerWidth <= 768);
            
            // Track drag state per image
            let imageHasDragged = false;
            let imageMouseDownPos = { x: 0, y: 0 };
            let imageTouchStartPos = { x: 0, y: 0 };
            let imageTouchStartTime = 0;
            
            // Desktop: mouse events
            if (!isMobile) {
                imgDiv.addEventListener('mousedown', (e) => {
                    e.stopPropagation(); // Prevent container drag from starting
                    imageHasDragged = false;
                    imageMouseDownPos = { x: e.clientX, y: e.clientY };
                });
                
                // Track if image was dragged
                imgDiv.addEventListener('mousemove', (e) => {
                    if (imageMouseDownPos.x !== 0 || imageMouseDownPos.y !== 0) {
                        const dragDistance = Math.sqrt(
                            Math.pow(e.clientX - imageMouseDownPos.x, 2) + 
                            Math.pow(e.clientY - imageMouseDownPos.y, 2)
                        );
                        if (dragDistance > 5) {
                            imageHasDragged = true;
                        }
                    }
                });
                
                // Click handler to show modal
                const handleImageClick = (e) => {
                    // Only show modal if user didn't drag
                    if (!imageHasDragged) {
                        e.stopPropagation();
                        e.preventDefault();
                        const shareData = imageToShareMap[image] || null;
                        showImageModal(image, shareData);
                    }
                    // Reset for next interaction
                    imageHasDragged = false;
                    imageMouseDownPos = { x: 0, y: 0 };
                };
                
                imgDiv.addEventListener('click', handleImageClick);
            } else {
                // Mobile: touch events
                imgDiv.addEventListener('touchstart', (e) => {
                    const touch = e.touches[0];
                    if (touch) {
                        imageHasDragged = false;
                        imageTouchStartPos = { x: touch.clientX, y: touch.clientY };
                        imageTouchStartTime = Date.now();
                    }
                }, { passive: true });
                
                imgDiv.addEventListener('touchmove', (e) => {
                    const touch = e.touches[0];
                    if (touch && imageTouchStartPos.x !== 0) {
                        const dragDistance = Math.sqrt(
                            Math.pow(touch.clientX - imageTouchStartPos.x, 2) + 
                            Math.pow(touch.clientY - imageTouchStartPos.y, 2)
                        );
                        // Increase threshold to 15px to make taps easier
                        if (dragDistance > 15) {
                            imageHasDragged = true;
                        }
                    }
                }, { passive: true });
                
                // Touch end handler to show modal
                imgDiv.addEventListener('touchend', (e) => {
                    const touchTime = Date.now() - imageTouchStartTime;
                    // Only show modal if it was a tap (not a drag) and quick tap (< 500ms)
                    if (!imageHasDragged && touchTime < 500) {
                        // Stop propagation immediately to prevent container from handling it
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        
                        // Use setTimeout to ensure this happens after drag handlers
                        setTimeout(() => {
                            const shareData = imageToShareMap[image] || null;
                            showImageModal(image, shareData);
                        }, 10);
                    }
                    // Reset for next interaction
                    imageHasDragged = false;
                    imageTouchStartPos = { x: 0, y: 0 };
                    imageTouchStartTime = 0;
                }, { passive: false, capture: true });
            }
            
            // Prevent image drag
            const img = imgDiv.querySelector('img');
            if (img) {
                img.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
            }
            
            containerElement.appendChild(imgDiv);
        });
    }
    
    // Show image modal - RE-ENABLED with non-blocking implementation for all devices
    function showImageModal(imageSrc, shareData = null) {
        
        // Remove any existing modal first
        const existingModal = document.querySelector('.sphere-image-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'sphere-image-modal';
        modal.setAttribute('data-modal-active', 'true');
        modal.setAttribute('id', 'sphereImageModal_' + Date.now());
        // CRITICAL: Make background NOT block clicks - only content is interactive
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.7);
            animation: fadeIn 0.3s ease-out;
            overflow-y: auto;
            pointer-events: none !important;
            touch-action: none !important;
        `;
        
        // Note: Modal background has pointer-events: none, so clicks go through to buttons automatically
        // No need for additional safeguards - buttons will work normally
        
        const time = shareData && shareData.timestamp 
            ? (shareData.timestamp instanceof Date 
                ? shareData.timestamp.toLocaleTimeString() 
                : (shareData.time || ''))
            : '';
        
        modal.innerHTML = `
            <div class="sphere-modal-content" style="
                background: white;
                border-radius: 12px;
                max-width: 500px;
                width: 100%;
                overflow: hidden;
                animation: scaleIn 0.3s ease-out;
                margin: auto;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                position: relative;
                pointer-events: auto;
                z-index: 10001;
            ">
                <div style="position: relative; aspect-ratio: 1; pointer-events: none;">
                    <img src="${imageSrc}" alt="Christmas share" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;" />
                    <button class="sphere-modal-close" id="sphereModalCloseBtn" style="
                        position: absolute;
                        top: 0.5rem;
                        right: 0.5rem;
                        width: 48px;
                        height: 48px;
                        min-width: 48px;
                        min-height: 48px;
                        background: rgba(0, 0, 0, 0.8);
                        border-radius: 50%;
                        color: white;
                        border: 3px solid rgba(255, 255, 255, 0.5);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                        font-weight: bold;
                        line-height: 1;
                        z-index: 10003;
                        touch-action: manipulation;
                        -webkit-tap-highlight-color: rgba(255, 255, 255, 0.5);
                        user-select: none;
                        pointer-events: auto !important;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                        transition: transform 0.2s ease;
                    ">×</button>
                </div>
                ${shareData ? `
                    <div style="padding: 1.5rem; overflow-y: auto; flex: 1; min-width: 0;">
                        ${shareData.message ? `
                            <p class="sphere-modal-message" style="
                                color: #1a1a1a;
                                font-size: 1rem;
                                line-height: 1.6;
                                margin: 0 0 1rem 0;
                                padding: 0;
                                word-wrap: break-word;
                                overflow-wrap: anywhere;
                                word-break: break-word;
                                white-space: pre-wrap;
                                max-width: 100%;
                                box-sizing: border-box;
                            ">${shareData.message}</p>
                        ` : ''}
                        <div class="sphere-modal-footer" style="
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            padding-top: 1rem;
                            border-top: 1px solid rgba(0, 0, 0, 0.1);
                            font-size: 0.85rem;
                            color: rgba(0, 0, 0, 0.6);
                            flex-wrap: wrap;
                            gap: 0.75rem;
                            width: 100%;
                            box-sizing: border-box;
                        ">
                            <div class="sphere-modal-location" style="
                                display: flex;
                                align-items: flex-start;
                                gap: 0.5rem;
                                flex: 1;
                                min-width: 0;
                                max-width: 100%;
                            ">
                                ${shareData.location ? `
                                    <span style="
                                        word-wrap: break-word;
                                        overflow-wrap: anywhere;
                                        word-break: break-word;
                                        white-space: normal;
                                        display: inline-block;
                                        max-width: 100%;
                                        line-height: 1.4;
                                    ">📍 ${shareData.location}</span>
                                ` : '<span>🌍 Unknown Location</span>'}
                            </div>
                            ${time ? `
                                <div class="sphere-modal-time" style="
                                    flex-shrink: 0;
                                    white-space: nowrap;
                                    margin-left: auto;
                                ">${time}</div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Close button handler - use multiple event types for mobile compatibility
        const closeModal = (e) => {
            // Check if modal is still active
            if (!modal || !modal.parentNode || modal.getAttribute('data-modal-active') !== 'true') {
                return false; // Already closed
            }
            
            if (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
            console.log('Closing modal'); // Debug log
            
            // Immediately remove from DOM - don't wait
            // No need to remove listeners since we're not using document listeners anymore
            
            // Remove immediately - use multiple methods to ensure removal
            modal.removeAttribute('data-modal-active');
            modal.style.display = 'none';
            modal.style.pointerEvents = 'none';
            modal.style.zIndex = '-1';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.style.position = 'absolute'; // Change position to prevent blocking
            modal.style.left = '-9999px'; // Move off screen
            
            // Remove from DOM immediately
            if (modal.parentNode) {
                try {
                    modal.remove();
                } catch (err) {
                    console.error('Error removing modal:', err);
                    // Fallback: hide it completely
                    modal.style.display = 'none';
                    modal.style.pointerEvents = 'none';
                }
            }
            
            selectedImage = null;
            
            return false;
        };
        
        // Attach close button handlers immediately
        const closeBtn = modal.querySelector('.sphere-modal-close') || document.getElementById('sphereModalCloseBtn');
        if (closeBtn) {
            // Add multiple event listeners for maximum compatibility
            const handleClose = (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeModal(e);
            };
            
            closeBtn.addEventListener('click', handleClose, { passive: false });
            closeBtn.addEventListener('touchend', handleClose, { passive: false });
            closeBtn.addEventListener('pointerup', handleClose, { passive: false });
            
            // Direct handlers as fallback
            closeBtn.onclick = handleClose;
            closeBtn.ontouchend = handleClose;
            
            // Make sure button is interactive
            closeBtn.style.pointerEvents = 'auto !important';
            closeBtn.style.touchAction = 'manipulation !important';
            closeBtn.style.cursor = 'pointer !important';
            closeBtn.style.zIndex = '10003 !important';
        }
        
        // Background click handler - removed to prevent blocking
        // Users can close via the X button or ESC key only
        
        // ESC key to close modal
        const escHandler = (e) => {
            if (e.key === 'Escape' && modal && modal.getAttribute('data-modal-active') === 'true') {
                closeModal(e);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        document.body.appendChild(modal);
        
        // Force modal to be visible
        requestAnimationFrame(() => {
            modal.style.display = 'flex';
            console.log('Modal appended and displayed'); // Debug log
        });
    }
    
    // Event handlers
    function handleMouseDown(e) {
        // Don't start dragging if clicking on an image
        if (e.target.closest('.sphere-image-item')) {
            return;
        }
        isDragging = true;
        hasDragged = false;
        velocity = { x: 0, y: 0 };
        lastMousePos = { x: e.clientX, y: e.clientY };
        mouseDownPos = { x: e.clientX, y: e.clientY };
        containerElement.style.cursor = 'grabbing';
    }
    
    function handleMouseMove(e) {
        if (!isDragging) return;
        
        // NEVER prevent default or stop propagation - allow all clicks to work normally
        // This handler only processes drag events, it doesn't block anything
        
        // Check if user has actually dragged (moved more than a few pixels)
        const dragDistance = Math.sqrt(
            Math.pow(e.clientX - mouseDownPos.x, 2) + 
            Math.pow(e.clientY - mouseDownPos.y, 2)
        );
        if (dragDistance > 5) {
            hasDragged = true;
        }
        
        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;
        
        const rotationDelta = {
            x: -deltaY * CONFIG.dragSensitivity,
            y: deltaX * CONFIG.dragSensitivity
        };
        
        rotation = {
            x: SPHERE_MATH.normalizeAngle(rotation.x + Math.max(-CONFIG.maxRotationSpeed, Math.min(CONFIG.maxRotationSpeed, rotationDelta.x))),
            y: SPHERE_MATH.normalizeAngle(rotation.y + Math.max(-CONFIG.maxRotationSpeed, Math.min(CONFIG.maxRotationSpeed, rotationDelta.y))),
            z: rotation.z
        };
        
        velocity = {
            x: Math.max(-CONFIG.maxRotationSpeed, Math.min(CONFIG.maxRotationSpeed, rotationDelta.x)),
            y: Math.max(-CONFIG.maxRotationSpeed, Math.min(CONFIG.maxRotationSpeed, rotationDelta.y))
        };
        
        lastMousePos = { x: e.clientX, y: e.clientY };
        render();
    }
    
    function handleMouseUp() {
        isDragging = false;
        containerElement.style.cursor = 'grab';
    }
    
    function handleTouchStart(e) {
        // On mobile, allow sphere to rotate even when touching images
        // Just don't show modal, but allow dragging
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (window.innerWidth <= 768);
        
        const touch = e.touches[0];
        if (!touch) return;
        
        // Check if touch is on an image - if so, let image handle it
        const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elementAtPoint && elementAtPoint.closest('.sphere-image-item')) {
            return; // Let image handle the touch for modal
        }
        
        // Also check target
        if (e.target.closest('.sphere-image-item')) {
            return; // Let image handle the touch
        }
        
        // Start dragging only if not on an image
        e.preventDefault();
        isDragging = true;
        hasDragged = false;
        velocity = { x: 0, y: 0 };
        lastMousePos = { x: touch.clientX, y: touch.clientY };
        mouseDownPos = { x: touch.clientX, y: touch.clientY };
    }
    
    function handleTouchMove(e) {
        if (!isDragging) return;
        
        const touch = e.touches[0];
        if (!touch) return;
        
        // Check if touch is over an image - if so, stop dragging and let image handle it
        const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elementAtPoint && elementAtPoint.closest('.sphere-image-item')) {
            isDragging = false; // Stop dragging to allow image tap
            return;
        }
        
        // Only prevent default if touch is within the container to allow scrolling elsewhere
        const isContainerEvent = containerElement.contains(e.target) || 
                                 e.target === containerElement;
        
        if (isContainerEvent && isDragging && hasDragged) {
            e.preventDefault(); // Only prevent default for container drag events
        }
        
        const deltaX = touch.clientX - lastMousePos.x;
        const deltaY = touch.clientY - lastMousePos.y;
        
        const rotationDelta = {
            x: -deltaY * CONFIG.dragSensitivity,
            y: deltaX * CONFIG.dragSensitivity
        };
        
        rotation = {
            x: SPHERE_MATH.normalizeAngle(rotation.x + Math.max(-CONFIG.maxRotationSpeed, Math.min(CONFIG.maxRotationSpeed, rotationDelta.x))),
            y: SPHERE_MATH.normalizeAngle(rotation.y + Math.max(-CONFIG.maxRotationSpeed, Math.min(CONFIG.maxRotationSpeed, rotationDelta.y))),
            z: rotation.z
        };
        
        velocity = {
            x: Math.max(-CONFIG.maxRotationSpeed, Math.min(CONFIG.maxRotationSpeed, rotationDelta.x)),
            y: Math.max(-CONFIG.maxRotationSpeed, Math.min(CONFIG.maxRotationSpeed, rotationDelta.y))
        };
        
        lastMousePos = { x: touch.clientX, y: touch.clientY };
        render();
    }
    
    function handleTouchEnd() {
        isDragging = false;
    }
    
    // Momentum and auto-rotation
    function updateMomentum() {
        if (isDragging) return;
        
        velocity = {
            x: velocity.x * CONFIG.momentumDecay,
            y: velocity.y * CONFIG.momentumDecay
        };
        
        if (!CONFIG.autoRotate && Math.abs(velocity.x) < 0.01 && Math.abs(velocity.y) < 0.01) {
            velocity = { x: 0, y: 0 };
        }
        
        let newY = rotation.y;
        if (CONFIG.autoRotate) {
            newY += CONFIG.autoRotateSpeed;
        }
        newY += Math.max(-CONFIG.maxRotationSpeed, Math.min(CONFIG.maxRotationSpeed, velocity.y));
        
        rotation = {
            x: SPHERE_MATH.normalizeAngle(rotation.x + Math.max(-CONFIG.maxRotationSpeed, Math.min(CONFIG.maxRotationSpeed, velocity.x))),
            y: SPHERE_MATH.normalizeAngle(newY),
            z: rotation.z
        };
        
        render();
    }
    
    // Setup container - calculate size based on wrapper dimensions
    // Wait for container to be rendered to get actual size
    const wrapper = containerElement.parentElement;
    let actualContainerSize = 500; // Default
    
    // Calculate size based on wrapper width (accounting for padding)
    const calculateSize = () => {
        if (wrapper) {
            const wrapperWidth = wrapper.clientWidth || wrapper.offsetWidth;
            const padding = 48; // 1.5rem * 2 = 3rem = 48px
            const availableWidth = wrapperWidth - padding;
            // Use 95% of available width to fill the container
            actualContainerSize = Math.min(availableWidth * 0.95, 800);
            // Ensure minimum size
            actualContainerSize = Math.max(actualContainerSize, 400);
        }
        
        // Ensure container fills the wrapper and is square
        containerElement.style.cssText = `
            position: relative;
            width: 100% !important;
            height: 0 !important;
            padding-bottom: 100% !important;
            perspective: ${CONFIG.perspective}px;
            cursor: grab;
            user-select: none;
            overflow: visible;
        `;
        
        // Wait for layout to calculate actual size
        setTimeout(() => {
            const renderedWidth = containerElement.offsetWidth || containerElement.clientWidth || actualContainerSize;
            const renderedHeight = containerElement.offsetHeight || containerElement.clientHeight || renderedWidth;
            CONFIG.containerSize = Math.min(renderedWidth, renderedHeight);
            
            // Re-render with correct size
            render();
        }, 0);
    };
    
    // Calculate size after container is rendered
    requestAnimationFrame(() => {
        calculateSize();
    });
    
    // Also recalculate on window resize
    const resizeHandler = () => {
        calculateSize();
    };
    window.addEventListener('resize', resizeHandler);
    
    // Initial size for first render
    CONFIG.containerSize = actualContainerSize;
    
    // Only attach document listeners when actually dragging to avoid blocking other clicks
    const attachDocumentListeners = () => {
        if (!documentListenersAttached && isDragging) {
            documentListenersAttached = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
        }
    };
    const detachDocumentListeners = () => {
        if (documentListenersAttached) {
            documentListenersAttached = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        }
    };
    
    // Store original handlers
    const originalHandleMouseDown = handleMouseDown;
    const originalHandleMouseUp = handleMouseUp;
    const originalHandleTouchStart = handleTouchStart;
    const originalHandleTouchEnd = handleTouchEnd;
    
    // Wrap handlers to attach/detach document listeners
    handleMouseDown = function(e) {
        originalHandleMouseDown(e);
        if (isDragging) {
            attachDocumentListeners();
        }
    };
    
    handleMouseUp = function(e) {
        originalHandleMouseUp(e);
        detachDocumentListeners();
    };
    
    handleTouchStart = function(e) {
        originalHandleTouchStart(e);
        if (isDragging) {
            attachDocumentListeners();
        }
    };
    
    handleTouchEnd = function(e) {
        originalHandleTouchEnd(e);
        detachDocumentListeners();
    };
    
    // Add event listeners - ONLY on container initially, document listeners added only when dragging
    containerElement.addEventListener('mousedown', handleMouseDown);
    containerElement.addEventListener('mousemove', handleMouseMove);
    containerElement.addEventListener('mouseup', handleMouseUp);
    containerElement.addEventListener('mouseleave', handleMouseUp); // Stop dragging when mouse leaves container
    containerElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    containerElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    containerElement.addEventListener('touchend', handleTouchEnd);
    
    // Animation loop
    function animate() {
        updateMomentum();
        animationFrameId = requestAnimationFrame(animate);
    }
    animate();
    
    // Initial render
    render();
    
    // Cleanup function
    function cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('resize', resizeHandler);
    }
    
    return { cleanup, render };
}

function showSphereView() {
    const container = document.getElementById('imgSphereContainer');
    const gridContainer = document.getElementById('sphereGridContainer');
    if (!container || !gridContainer) return;
    
    // Get all shares with images (keep full share data, not just image URLs)
    const sharesWithImages = christmasShares.filter(share => share.image);
    
    if (sharesWithImages.length === 0) {
        // Show empty state in sphere container
        gridContainer.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: rgba(255, 255, 255, 0.5);
                padding: 2rem;
            ">
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No images yet</p>
                <p style="font-size: 0.9rem;">Share your first Christmas moment above!</p>
            </div>
        `;
        const infoSpan = document.getElementById('sphereInfo');
        if (infoSpan) {
            infoSpan.innerHTML = `<span id="sphereImageCount">0</span> images`;
        }
        return;
    }
    
    // Extract just image URLs for the sphere viewer
    sphereImages = sharesWithImages.map(share => share.image);
    
    // Show container
    container.style.display = 'block';
    
    // Update info
    const infoSpan = document.getElementById('sphereInfo');
    if (infoSpan) {
        infoSpan.innerHTML = `<span id="sphereImageCount">${sharesWithImages.length}</span> images`;
    }
    
    // Clean up previous viewer
    if (sphereGridViewer && sphereGridViewer.cleanup) {
        sphereGridViewer.cleanup();
    }
    
    // Wait for container to be visible
    requestAnimationFrame(() => {
        setTimeout(() => {
            // Pass full shares data so we can show message and location in modal
            sphereGridViewer = createSphereGridViewer(sphereImages, gridContainer, sharesWithImages);
        }, 100);
    });
}

function initShareChristmas() {
    // REMOVED: All cleanupSphereModals calls - they were causing blocking
    
    // Initialize sphere view automatically when section loads
    const container = document.getElementById('imgSphereContainer');
    if (container) {
        // Show sphere view by default
        container.style.display = 'block';
    }
    
    const form = document.getElementById('shareChristmasForm');
    const imageInput = document.getElementById('christmasImage');
    const imageBtn = document.getElementById('christmasImageBtn');
    const imagePlaceholder = document.getElementById('christmasImagePlaceholder');
    const imagePreview = document.getElementById('christmasImagePreview');
    const imagePreviewImg = document.getElementById('christmasImagePreviewImg');
    const removeImageBtn = document.getElementById('removeChristmasImageBtn');
    const messageInput = document.getElementById('christmasMessage');
    const messageCounter = document.getElementById('christmasMessageCounter');
    const locationInput = document.getElementById('christmasLocation');
    const locationStatus = document.getElementById('locationStatus');
    const getLocationBtn = document.getElementById('getCurrentLocationBtn');
    
    // Load shares ONLY from Firebase - no localStorage
    // Stats will be updated automatically after loadChristmasShares() completes
    loadChristmasShares();
    
    // Initialize sphere view after loading shares
    setTimeout(() => {
        showSphereView();
    }, 500);
    
    // Image upload
    if (imageBtn) {
        imageBtn.addEventListener('click', (e) => {
            imageInput.click();
        });
    }
    
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleChristmasImageFile(file);
            }
        });
    }
    
    // Drag and drop
    const uploadArea = document.getElementById('christmasImageUploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleChristmasImageFile(file);
            }
        });
    }
    
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', (e) => {
            imageInput.value = '';
            imagePlaceholder.style.display = 'flex';
            imagePreview.style.display = 'none';
        });
    }
    
    // Message counter
    if (messageInput && messageCounter) {
        messageInput.addEventListener('input', () => {
            const length = messageInput.value.length;
            messageCounter.textContent = `${length} / 200`;
            if (length > 200) {
                messageInput.value = messageInput.value.substring(0, 200);
                messageCounter.textContent = '200 / 200';
            }
        });
    }
    
    // Get current location (required)
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', (e) => {
            if (!navigator.geolocation) {
                if (locationStatus) {
                    locationStatus.textContent = '❌ Geolocation not supported in this browser.';
                    locationStatus.style.color = 'var(--christmas-red)';
                }
                showError('Geolocation not supported in this browser.');
                return;
            }
            
            // Disable button during request
            getLocationBtn.disabled = true;
            getLocationBtn.style.opacity = '0.6';
            getLocationBtn.style.cursor = 'not-allowed';
            
            if (locationStatus) {
                locationStatus.textContent = 'Getting location...';
                locationStatus.style.color = 'var(--christmas-gold)';
            }
            
            // Set timeout for geolocation request (backup timeout)
            let timeoutCleared = false;
            const timeoutId = setTimeout(() => {
                if (!timeoutCleared) {
                    timeoutCleared = true;
                    getLocationBtn.disabled = false;
                    getLocationBtn.style.opacity = '1';
                    getLocationBtn.style.cursor = 'pointer';
                    
                    if (locationStatus) {
                        locationStatus.textContent = '⏱️ Location request timed out. Please try again.';
                        locationStatus.style.color = 'var(--christmas-red)';
                    }
                    showError('Location request timed out. Please try again.');
                }
            }, 15000); // 15 second backup timeout
            
            const geoOptions = {
                enableHighAccuracy: false,
                timeout: 10000, // 10 second timeout
                maximumAge: 60000 // Accept cached location up to 1 minute old
            };
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (timeoutCleared) return; // Already handled by timeout
                    clearTimeout(timeoutId);
                    timeoutCleared = true;
                    
                    getLocationBtn.disabled = false;
                    getLocationBtn.style.opacity = '1';
                    getLocationBtn.style.cursor = 'pointer';
                    
                    // Use async IIFE to handle await
                    (async () => {
                    try {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        console.log('Location received:', lat, lng);
                        
                            // Get real city name from coordinates using reverse geocoding
                            const cityName = await getCityNameFromCoordinates(lat, lng);
                        const country = getCountryFromLocation(lat, lng);
                            const countryName = country.replace(/🇰🇷|🇯🇵|🇺🇸|🇬🇧|🇫🇷|🇦🇺|🇨🇦|🇩🇪|🇷🇺|🇨🇳|🇹🇭|🇲🇾|🇮🇩|🇻🇳|🌍/g, '').trim();
                            
                            // Format: "City, Country" (e.g., "Seoul, Korea" or "Bangkok, Thailand")
                            const locationText = cityName ? `${cityName}, ${countryName}` : `${countryName}`;
                        locationInput.value = locationText;
                        
                        if (locationStatus) {
                            locationStatus.textContent = `📍 ${locationText}`;
                            locationStatus.style.color = 'var(--christmas-gold)';
                        }
                        showSuccess('Location detected!');
                        if (soundEnabled) playSound('success');
                    } catch (error) {
                        console.error('Location processing error:', error);
                        if (locationStatus) {
                            locationStatus.textContent = '❌ Error processing location. Please try again.';
                            locationStatus.style.color = 'var(--christmas-red)';
                        }
                        showError('Error processing location. Please try again.');
                    }
                    })();
                },
                (error) => {
                    if (timeoutCleared) return; // Already handled by timeout
                    clearTimeout(timeoutId);
                    timeoutCleared = true;
                    
                    getLocationBtn.disabled = false;
                    getLocationBtn.style.opacity = '1';
                    getLocationBtn.style.cursor = 'pointer';
                    
                    console.error('Geolocation error:', error);
                    
                    let errorMessage = 'Could not get location. ';
                    if (error.code === 1) {
                        errorMessage = 'Location access denied. Please allow location access in your browser settings and try again.';
                    } else if (error.code === 2) {
                        errorMessage = 'Location unavailable. Please check your device settings.';
                    } else if (error.code === 3) {
                        errorMessage = 'Location request timed out. Please try again.';
                    } else {
                        errorMessage = `Could not get location (Error ${error.code}). Please try again.`;
                    }
                    
                    if (locationStatus) {
                        locationStatus.textContent = `❌ ${errorMessage}`;
                        locationStatus.style.color = 'var(--christmas-red)';
                    }
                    showError(errorMessage);
                },
                geoOptions
            );
        });
    }
    
    // Form submit
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitChristmasShare();
        });
    }
}

// Compress and resize image for mobile optimization
function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with quality compression
                let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                
                // If still too large, reduce quality further
                if (compressedBase64.length > 2 * 1024 * 1024) { // 2MB base64 limit
                    compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                }
                
                // If still too large, reduce quality even more
                if (compressedBase64.length > 2 * 1024 * 1024) {
                    compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
                }
                
                resolve(compressedBase64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function handleChristmasImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file.');
        return;
    }
    
    // Show loading state
    const imagePlaceholder = document.getElementById('christmasImagePlaceholder');
    const imagePreview = document.getElementById('christmasImagePreview');
    if (imagePlaceholder) {
        imagePlaceholder.innerHTML = '<p>Compressing image...</p>';
    }
    
    // Detect mobile device and use smaller dimensions
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const maxDimension = isMobile ? 1280 : 1920; // Smaller for mobile
    const quality = isMobile ? 0.7 : 0.8; // Lower quality for mobile
    
    // Compress image before displaying
    compressImage(file, maxDimension, maxDimension, quality)
        .then((compressedBase64) => {
        const imagePreviewImg = document.getElementById('christmasImagePreviewImg');
        
        if (imagePreviewImg) {
                imagePreviewImg.src = compressedBase64;
                // Store compressed image in data attribute for later use
                imagePreviewImg.dataset.compressedImage = compressedBase64;
        }
        if (imagePreview) {
            imagePreview.style.display = 'block';
        }
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'none';
        }
        })
        .catch((error) => {
            console.error('Image compression error:', error);
            showError('Failed to process image. Please try a different image.');
            if (imagePlaceholder) {
                imagePlaceholder.innerHTML = `
                    <span class="upload-icon">📷</span>
                    <p>Click or drag image here</p>
                    <button type="button" class="upload-btn" id="christmasImageBtn">Choose Image</button>
                `;
                // Re-initialize button click handler
                const imageBtn = document.getElementById('christmasImageBtn');
                const imageInput = document.getElementById('christmasImage');
                if (imageBtn && imageInput) {
                    imageBtn.addEventListener('click', () => {
                        imageInput.click();
                    });
                }
            }
        });
}

async function submitChristmasShare() {
    const imageInput = document.getElementById('christmasImage');
    const messageInput = document.getElementById('christmasMessage');
    const locationInput = document.getElementById('christmasLocation');
    const imagePreviewImg = document.getElementById('christmasImagePreviewImg');
    
    if (!imageInput.files[0] && !imagePreviewImg.src) {
        showError('Please upload an image.');
        return;
    }
    
    // Location is required
    if (!locationInput || !locationInput.value || locationInput.value.trim() === '') {
        showError('Please get your current location first. Location is required.');
        const getLocationBtn = document.getElementById('getCurrentLocationBtn');
        if (getLocationBtn) {
            getLocationBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // Get compressed image if available, otherwise use original
    let imageData = '';
    if (imagePreviewImg) {
        // Use compressed image if available, otherwise use the src
        imageData = imagePreviewImg.dataset.compressedImage || imagePreviewImg.src;
    }
    
    if (!imageData || imageData === '') {
        showError('Please upload an image.');
        return;
    }
    
    // Check image size before upload
    const base64Size = imageData.length * 0.75; // Approximate size in bytes
    if (base64Size > 2 * 1024 * 1024) { // 2MB limit for mobile
        showError('Image is still too large after compression. Please try a smaller image.');
        return;
    }
    
    const share = {
        id: Date.now(),
        image: imageData,
        message: messageInput ? messageInput.value.trim() : '',
        location: locationInput ? locationInput.value.trim() : '',
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    };
    
    // Show loading state
    const submitBtn = document.querySelector('#shareChristmasForm button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';
    }
    
    try {
        // Save to Firebase FIRST (this is the source of truth)
        const saved = await saveChristmasShareToFirebase(share);
        
        if (!saved) {
            showError('Failed to save to Firebase. Please check your connection and try again.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
            return;
        }
        
        // Reset form only after successful save
    imageInput.value = '';
    document.getElementById('christmasImagePlaceholder').style.display = 'flex';
    document.getElementById('christmasImagePreview').style.display = 'none';
    if (messageInput) messageInput.value = '';
    if (locationInput) locationInput.value = '';
    document.getElementById('christmasMessageCounter').textContent = '0 / 200';
    
    // Reset location status
    const locationStatus = document.getElementById('locationStatus');
    if (locationStatus) {
        locationStatus.textContent = 'Click button below to get your location';
        locationStatus.style.color = 'rgba(255, 255, 255, 0.7)';
    }
    
        // Wait a moment for Firebase to process, then reload feed
        setTimeout(async () => {
            await loadChristmasShares();
    updateShareChristmasStats();
        }, 1000);
        
    if (typeof incrementStat === 'function') {
        incrementStat('christmasShares');
    }
    
    showSuccess('Your Christmas moment has been shared! 🎄');
    if (soundEnabled) playSound('success');
    } catch (error) {
        console.error('Error submitting Christmas share:', error);
        showError('Failed to share. Please try again.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
}

async function loadChristmasShares() {
    const feed = document.getElementById('shareChristmasFeed');
    if (!feed) return;
    
    feed.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 1rem;">Loading shares...</p>';
    
    // Load shares ONLY from Firebase - NO localStorage, NO demo data
    if (isFirebaseAvailable()) {
        try {
            const globalShares = await loadGlobalChristmasSharesFromFirebase(100);
            christmasShares = [...globalShares];
            
            // Sort by timestamp (most recent first)
            christmasShares.sort((a, b) => {
                const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp || a.date);
                const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp || b.date);
                return timeB - timeA;
            });
        } catch (error) {
            console.error('Error loading Christmas shares:', error);
            christmasShares = [];
        }
    } else {
        // No Firebase - show empty state
        christmasShares = [];
    }
    
    feed.innerHTML = '';
    
    if (christmasShares.length === 0) {
        feed.innerHTML = '<p class="empty-feed-message">No shares yet. Be the first to share your Christmas moment! 🎄</p>';
        // Hide sphere view button if no shares
        const showSphereViewBtn = document.getElementById('showSphereViewBtn');
        if (showSphereViewBtn) showSphereViewBtn.style.display = 'none';
        return;
    }
    
    christmasShares.forEach(share => {
        const item = document.createElement('div');
        item.className = 'share-christmas-item';
        const time = share.timestamp instanceof Date ? share.timestamp.toLocaleTimeString() : (share.time || '');
        item.innerHTML = `
            <img src="${share.image}" alt="Christmas share" class="share-christmas-item-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'.9em\' font-size=\'90\'%3E🎄%3C/text%3E%3C/svg%3E'">
            <div class="share-christmas-item-content">
                ${share.message ? `<p class="share-christmas-item-message">${share.message}</p>` : ''}
                <div class="share-christmas-item-footer">
                    <div class="share-christmas-item-location">
                        ${share.location ? `<span>📍 ${share.location}</span>` : '<span>🌍 Unknown Location</span>'}
                    </div>
                    <div class="share-christmas-item-time">${time}</div>
                </div>
            </div>
        `;
        feed.appendChild(item);
    });
    
    // Update sphere view after loading shares
    showSphereView();
    
    // Update stats after loading shares
    updateShareChristmasStats();
}

function updateShareChristmasStats() {
    const totalShares = document.getElementById('totalShares');
    const shareChristmasTotal = document.getElementById('shareChristmasTotal');
    const shareChristmasToday = document.getElementById('shareChristmasToday');
    
    // Calculate today's shares by comparing dates
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const todayShares = christmasShares.filter(share => {
        if (!share.timestamp) return false;
        const shareDate = share.timestamp instanceof Date 
            ? share.timestamp 
            : new Date(share.timestamp);
        shareDate.setHours(0, 0, 0, 0);
        return shareDate.getTime() === today.getTime();
    }).length;
    
    // Update total shares
    if (totalShares) totalShares.textContent = christmasShares.length;
    
    // Update page stats
    if (shareChristmasTotal) shareChristmasTotal.textContent = christmasShares.length;
    if (shareChristmasToday) shareChristmasToday.textContent = todayShares;
    
    console.log('Share stats updated:', {
        total: christmasShares.length,
        today: todayShares
    });
}

// How Button (in Control Bar)
function initHowButton() {
    const howBtn = document.getElementById('howBtn');
    if (howBtn) {
        howBtn.addEventListener('click', () => {
            showHowModal();
            // Close control menu on mobile
            const controlButtonsWrapper = document.querySelector('.control-buttons-wrapper');
            const controlMenuToggle = document.getElementById('controlMenuToggle');
            if (controlButtonsWrapper && controlMenuToggle) {
                controlButtonsWrapper.classList.remove('active');
                controlMenuToggle.classList.remove('active');
            }
            if (soundEnabled) playSound('click');
        });
    }
}

function showHowModal() {
    const modal = document.getElementById('shareModal');
    const modalBody = document.getElementById('shareModalBody');
    
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = `
        <h3>❓ How to Use Christmas Magic</h3>
        <div style="text-align: left; margin-top: 1.5rem; line-height: 1.8;">
            <h4 style="color: var(--christmas-gold); margin-top: 1rem; margin-bottom: 0.5rem;">✉️ Card Maker</h4>
            <p>Create personalized Christmas cards with custom text, colors, fonts, and decorations. Upload images and share your creations!</p>
            
            <h4 style="color: var(--christmas-gold); margin-top: 1rem; margin-bottom: 0.5rem;">🎁 Advent Calendar</h4>
            <p>Open a door each day from December 1st to 25th to discover daily surprises and Christmas content!</p>
            
            <h4 style="color: var(--christmas-gold); margin-top: 1rem; margin-bottom: 0.5rem;">🎭 Personality Quiz</h4>
            <p>Answer fun questions to discover which Christmas character you are - Santa, Elf, Snowman, or Reindeer!</p>
            
            <h4 style="color: var(--christmas-gold); margin-top: 1rem; margin-bottom: 0.5rem;">🧦 Hang Sock</h4>
            <p>Hang a virtual sock on the map with your location. See socks from around the world and compete in country rankings!</p>
            
            <h4 style="color: var(--christmas-gold); margin-top: 1rem; margin-bottom: 0.5rem;">🎁 Gift Exchange</h4>
            <p>Generate Secret Santa pairs for your gift exchange. Add participants manually or use auto-generation!</p>
            
            <h4 style="color: var(--christmas-gold); margin-top: 1rem; margin-bottom: 0.5rem;">🎮 Games</h4>
            <p><strong>❓ Christmas Trivia:</strong> Answer multiple-choice questions about Christmas. Choose difficulty (Easy/Medium/Hard) and optional timer. Score points for correct answers!</p>
            <p><strong>🧠 Memory Game:</strong> Match pairs of Christmas symbols by clicking cards. Remember their positions and match all pairs with the fewest moves possible!</p>
            <p><strong>🔍 Word Search:</strong> Find hidden Christmas words in a grid. Click and drag to select letters horizontally, vertically, or diagonally. Find all words to win!</p>
            <p><strong>🎯 Christmas Wordle:</strong> Guess the 5-letter Christmas word in 6 tries. Green = correct letter & position, Yellow = correct letter wrong position, Gray = not in word. Use hints if needed!</p>
            
            <h4 style="color: var(--christmas-gold); margin-top: 1rem; margin-bottom: 0.5rem;">📸 Share Christmas</h4>
            <p>Upload your Christmas photos with a message and location. Share your holiday moments with the world!</p>
        </div>
        <div style="margin-top: 1.5rem;">
            <button class="action-btn secondary" onclick="document.getElementById('shareModal').style.display='none'">Close</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Optimized Snow Animation
let snowInterval = null;
let snowEnabled = JSON.parse(localStorage.getItem('snowEnabled') || 'true');
let maxSnowflakes = 30; // Limit number of flakes
let currentSnowflakes = 0;

function initSnow() {
    if (!snowEnabled) return;
    
    const snowContainer = document.getElementById('snowContainer');
    if (!snowContainer) return;
    
    // Clear existing interval if any
    if (snowInterval) {
        clearInterval(snowInterval);
        snowInterval = null;
    }
    
    const snowflakes = ['❄', '❅', '❆'];
    
    function createSnowflake() {
        // Limit number of snowflakes for performance
        if (currentSnowflakes >= maxSnowflakes) return;
        
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = (Math.random() * 3 + 3) + 's'; // 3-6 seconds
        snowflake.style.opacity = Math.random() * 0.3 + 0.4; // 0.4-0.7
        snowflake.style.fontSize = (Math.random() * 6 + 12) + 'px'; // 12-18px
        
        snowContainer.appendChild(snowflake);
        currentSnowflakes++;
        
        // Remove after animation completes
        const duration = parseFloat(snowflake.style.animationDuration) * 1000;
        setTimeout(() => {
            if (snowflake.parentNode) {
                snowflake.remove();
                currentSnowflakes--;
            }
        }, duration);
    }
    
    // Create initial snowflakes
    for (let i = 0; i < 10; i++) {
        setTimeout(() => createSnowflake(), i * 200);
    }
    
    // Create new snowflakes less frequently (every 800ms instead of 300ms)
    snowInterval = setInterval(createSnowflake, 800);
}

function initSnowToggle() {
    const snowToggle = document.getElementById('snowToggle');
    const snowContainer = document.getElementById('snowContainer');
    
    if (!snowToggle || !snowContainer) return;
    
    // Set initial state
    if (!snowEnabled) {
        snowToggle.classList.add('disabled');
        snowContainer.style.display = 'none';
    } else {
        initSnow();
    }
    
    snowToggle.addEventListener('click', () => {
        snowEnabled = !snowEnabled;
        localStorage.setItem('snowEnabled', JSON.stringify(snowEnabled));
        
        if (snowEnabled) {
            snowToggle.classList.remove('disabled');
            snowContainer.style.display = 'block';
            currentSnowflakes = 0; // Reset counter
            initSnow();
        } else {
            snowToggle.classList.add('disabled');
            snowContainer.style.display = 'none';
            if (snowInterval) {
                clearInterval(snowInterval);
                snowInterval = null;
            }
            // Clear existing snowflakes
            snowContainer.innerHTML = '';
            currentSnowflakes = 0;
        }
        
        if (soundEnabled) playSound('click');
    });
}

// Control Menu Toggle (Mobile)
function initControlMenu() {
    const controlMenuToggle = document.getElementById('controlMenuToggle');
    const controlButtonsWrapper = document.querySelector('.control-buttons-wrapper');
    const controlButtonsContainer = document.getElementById('controlButtonsContainer');
    
    if (!controlMenuToggle || !controlButtonsWrapper || !controlButtonsContainer) return;
    
    controlMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        controlButtonsWrapper.classList.toggle('active');
        controlMenuToggle.classList.toggle('active');
        
        if (soundEnabled) playSound('click');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!controlButtonsWrapper.contains(e.target)) {
            controlButtonsWrapper.classList.remove('active');
            controlMenuToggle.classList.remove('active');
        }
    });
    
    // Close menu when clicking a control button
    const controlButtons = controlButtonsContainer.querySelectorAll('.control-btn');
    controlButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Small delay to allow the button action to complete
            setTimeout(() => {
                controlButtonsWrapper.classList.remove('active');
                controlMenuToggle.classList.remove('active');
            }, 200);
        });
    });
}

// Sound Effects
function initSoundToggle() {
    const soundToggle = document.getElementById('soundToggle');
    if (!soundToggle) return;
    
    // Set initial state
    soundToggle.classList.toggle('muted', !soundEnabled);
    updateSoundIcon(soundToggle);
    
    soundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundToggle.classList.toggle('muted', !soundEnabled);
        updateSoundIcon(soundToggle);
        if (soundEnabled) playSound('click');
    });
}

function updateSoundIcon(button) {
    const icon = button.querySelector('.control-icon svg');
    if (!icon) return;
    
    if (soundEnabled) {
        // Sound on icon
        icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
    } else {
        // Sound off icon
        icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
    }
}

// Dark Mode Toggle
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;
    
    // Check system preference and localStorage
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    // Apply initial theme
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Update icon based on current mode
    updateThemeIcon(darkModeToggle);
    
    darkModeToggle.addEventListener('click', () => {
        const isCurrentlyDark = document.body.classList.contains('dark-mode');
        
        if (isCurrentlyDark) {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        }
        
        updateThemeIcon(darkModeToggle);
        if (soundEnabled) playSound('click');
    });
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            updateThemeIcon(darkModeToggle);
        }
    });
}

function updateThemeIcon(button) {
    const icon = button.querySelector('.control-icon svg');
    if (!icon) return;
    
    const isDark = document.body.classList.contains('dark-mode');
    
    if (isDark) {
        // Sun icon (light mode)
        icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        // Moon icon (dark mode)
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    
    // Create audio context for simple beep sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'click':
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'success':
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
    }
}



