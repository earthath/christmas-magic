// Global State
let currentSection = 'card-maker';
let soundEnabled = true;
let openedDoors = JSON.parse(localStorage.getItem('openedDoors') || '[]');
let quizAnswers = [];
let currentQuestion = 0;

// Stats Tracking
let userStats = JSON.parse(localStorage.getItem('userStats') || '{"cardsCreated": 0, "socksHung": 0, "doorsOpened": 0, "quizzesTaken": 0, "gamesPlayed": 0, "lastDate": "", "cardsToday": 0, "socksToday": 0}');

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    try {
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
        initShareModal();
        initDailyChallenges();
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
    const heroButtons = document.querySelectorAll('.hero-btn');
    heroButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Create click ripple
            createRippleEffect(btn, e);
            
            const section = btn.dataset.section;
            switchSection(section);
            
            // Hide hero section (menu will be shown via toggle)
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
        });
    });
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
        localStorage.setItem('userStats', JSON.stringify(userStats));
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
        
        localStorage.setItem('userStats', JSON.stringify(userStats));
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
            <button class="share-platform-btn instagram-story-btn" id="instagramStoryBtn" style="background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); border-color: #bc1888;">
                📸 Instagram Story
            </button>
            <button class="share-platform-btn" data-platform="twitter">🐦 Twitter</button>
            <button class="share-platform-btn" data-platform="facebook">📘 Facebook</button>
            <button class="share-platform-btn" data-platform="whatsapp">💬 WhatsApp</button>
            <button class="share-platform-btn" data-platform="telegram">✈️ Telegram</button>
            <button class="share-platform-btn" data-platform="email">📧 Email</button>
        </div>
        <div style="margin-top: 1rem;">
            <button class="action-btn secondary" id="copyShareText">📋 Copy Text</button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Instagram Story button (special handling)
    const instagramBtn = modalBody.querySelector('#instagramStoryBtn');
    if (instagramBtn && blob) {
        instagramBtn.addEventListener('click', () => {
            shareToInstagramStory(blob, shareText);
            if (soundEnabled) playSound('click');
        });
    }
    
    // Platform buttons
    modalBody.querySelectorAll('.share-platform-btn:not(#instagramStoryBtn)').forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.dataset.platform;
            shareToPlatform(platform, shareText);
            if (soundEnabled) playSound('click');
        });
    });
    
    // Copy text button
    const copyBtn = modalBody.querySelector('#copyShareText');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(shareText).then(() => {
                showSuccess('Text copied to clipboard!');
                if (soundEnabled) playSound('success');
            }).catch(() => {
                showError('Failed to copy text');
            });
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

// Staggered Menu Navigation - GSAP Implementation
function initNavigation() {
    // Wait for GSAP to be available
    if (typeof gsap === 'undefined') {
        console.error('GSAP is not loaded. Please check the CDN link.');
        // Retry after a short delay
        setTimeout(initNavigation, 100);
        return;
    }

    const wrapper = document.getElementById('staggeredMenuWrapper');
    const panel = document.getElementById('staggered-menu-panel');
    const toggleBtn = document.getElementById('staggeredMenuToggle');
    const preLayers = document.getElementById('preLayers');
    const plusH = document.getElementById('plusH');
    const plusV = document.getElementById('plusV');
    const icon = document.getElementById('menuIcon');
    const textInner = document.getElementById('toggleTextInner');
    const hero = document.getElementById('hero');
    
    if (!wrapper || !panel || !toggleBtn) {
        console.error('Staggered menu elements not found');
        return;
    }
    
    let isOpen = false;
    let busy = false;
    let openTl = null;
    let closeTween = null;
    let spinTween = null;
    let textCycleAnim = null;
    let colorTween = null;
    const position = wrapper.dataset.position || 'right';
    
    // Get prelayers
    const preLayerEls = preLayers ? Array.from(preLayers.querySelectorAll('.sm-prelayer')) : [];
    
    // Initialize positions - check if elements exist
    const offscreen = position === 'left' ? -100 : 100;
    gsap.set([panel, ...preLayerEls], { xPercent: offscreen });
    
    if (plusH) gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
    if (plusV) gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
    if (icon) gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
    if (textInner) gsap.set(textInner, { yPercent: 0 });
    if (toggleBtn) gsap.set(toggleBtn, { color: '#e9e9ef' });
    
    // Build open timeline
    function buildOpenTimeline() {
        if (openTl) openTl.kill();
        if (closeTween) {
            closeTween.kill();
            closeTween = null;
        }
        
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
        const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
        
        if (itemEls.length) {
            gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        }
        if (numberEls.length) {
            gsap.set(numberEls, { '--sm-num-opacity': 0 });
        }
        
        const tl = gsap.timeline({ paused: true });
        
        // Animate prelayers
        preLayerEls.forEach((el, i) => {
            const start = Number(gsap.getProperty(el, 'xPercent'));
            tl.fromTo(el, 
                { xPercent: start }, 
                { xPercent: 0, duration: 0.5, ease: 'power4.out' }, 
                i * 0.07
            );
        });
        
        const lastTime = preLayerEls.length ? (preLayerEls.length - 1) * 0.07 : 0;
        const panelInsertTime = lastTime + (preLayerEls.length ? 0.08 : 0);
        const panelDuration = 0.65;
        const panelStart = Number(gsap.getProperty(panel, 'xPercent'));
        
        tl.fromTo(panel,
            { xPercent: panelStart },
            { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
            panelInsertTime
        );
        
        // Animate menu items
        if (itemEls.length) {
            const itemsStartRatio = 0.15;
            const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
            tl.to(itemEls, {
                yPercent: 0,
                rotate: 0,
                duration: 1,
                ease: 'power4.out',
                stagger: { each: 0.1, from: 'start' }
            }, itemsStart);
            
            if (numberEls.length) {
                tl.to(numberEls, {
                    duration: 0.6,
                    ease: 'power2.out',
                    '--sm-num-opacity': 1,
                    stagger: { each: 0.08, from: 'start' }
                }, itemsStart + 0.1);
            }
        }
        
        openTl = tl;
        return tl;
    }
    
    // Play open animation
    function playOpen() {
        if (busy) return;
        busy = true;
        wrapper.setAttribute('data-open', 'true');
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.setAttribute('aria-label', 'Close menu');
        panel.setAttribute('aria-hidden', 'false');
        
        const tl = buildOpenTimeline();
        if (tl) {
            tl.eventCallback('onComplete', () => {
                busy = false;
            });
            tl.play(0);
        } else {
            busy = false;
        }
    }
    
    // Play close animation
    function playClose() {
        if (openTl) {
            openTl.kill();
            openTl = null;
        }
        
        const all = [...preLayerEls, panel];
        if (closeTween) closeTween.kill();
        
        closeTween = gsap.to(all, {
            xPercent: offscreen,
            duration: 0.32,
            ease: 'power3.in',
            overwrite: 'auto',
            onComplete: () => {
                const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
                if (itemEls.length) {
                    gsap.set(itemEls, { yPercent: 140, rotate: 10 });
                }
                const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
                if (numberEls.length) {
                    gsap.set(numberEls, { '--sm-num-opacity': 0 });
                }
                wrapper.removeAttribute('data-open');
                wrapper.style.pointerEvents = 'none';
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.setAttribute('aria-label', 'Open menu');
                panel.setAttribute('aria-hidden', 'true');
                busy = false;
            }
        });
    }
    
    // Animate icon
    function animateIcon(opening) {
        if (!icon) return;
        if (spinTween) spinTween.kill();
        if (opening) {
            spinTween = gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
        } else {
            spinTween = gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
        }
    }
    
    // Animate text
    function animateText(opening) {
        if (!textInner) return;
        if (textCycleAnim) textCycleAnim.kill();
        
        const currentLabel = opening ? 'Menu' : 'Close';
        const targetLabel = opening ? 'Close' : 'Menu';
        const cycles = 3;
        const seq = [currentLabel];
        let last = currentLabel;
        for (let i = 0; i < cycles; i++) {
            last = last === 'Menu' ? 'Close' : 'Menu';
            seq.push(last);
        }
        if (last !== targetLabel) seq.push(targetLabel);
        seq.push(targetLabel);
        
        // Update text lines
        textInner.innerHTML = seq.map(l => `<span class="sm-toggle-line">${l}</span>`).join('');
        
        gsap.set(textInner, { yPercent: 0 });
        const lineCount = seq.length;
        const finalShift = ((lineCount - 1) / lineCount) * 100;
        textCycleAnim = gsap.to(textInner, {
            yPercent: -finalShift,
            duration: 0.5 + lineCount * 0.07,
            ease: 'power4.out'
        });
    }
    
    // Toggle menu
    function toggleMenu() {
        if (busy) {
            console.log('Menu is busy, ignoring toggle');
            return;
        }
        const target = !isOpen;
        isOpen = target;
        console.log('Toggling menu to:', target ? 'open' : 'close');
        
        if (target) {
            wrapper.style.pointerEvents = 'auto';
            playOpen();
        } else {
            playClose();
        }
        animateIcon(target);
        animateText(target);
    }
    
    // Menu item click handlers
    const menuItems = panel.querySelectorAll('.sm-panel-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            
            if (section === 'home') {
                // Hide all sections
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                // Show hero section
                if (hero) hero.style.display = 'block';
                // Close menu
                if (isOpen) toggleMenu();
            } else if (section) {
                switchSection(section);
                // Hide hero section
                if (hero) hero.style.display = 'none';
                // Close menu
                if (isOpen) toggleMenu();
            }
            
            if (soundEnabled) playSound('click');
        });
    });
    
    // How button handler
    const howBtn = document.getElementById('howBtnStaggered');
    if (howBtn) {
        howBtn.addEventListener('click', () => {
            if (isOpen) toggleMenu();
            initHowButton();
        });
    }
    
    // Toggle button click
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Menu toggle clicked, isOpen:', isOpen);
        toggleMenu();
    });
    
    console.log('Staggered menu initialized successfully');
    
    // Show menu when hero buttons are clicked
    const heroButtons = document.querySelectorAll('.hero-btn');
    heroButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(() => {
                if (!isOpen) toggleMenu();
            }, 100);
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
    let currentFrame = 'simple';
    let currentFrameColor = '#FFB81C';
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
    
    // Card Border Toggle
    if (cardBorder) {
        cardBorder.addEventListener('change', (e) => {
            if (e.target.checked) {
                cardPreview.style.border = '3px solid rgba(255, 184, 28, 0.6)';
                cardPreview.style.boxShadow = '0 0 30px rgba(255, 184, 28, 0.3)';
            } else {
                cardPreview.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                cardPreview.style.boxShadow = 'none';
            }
            saveCardState();
        });
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
        cardPreview.style.border = '1px solid rgba(255, 255, 255, 0.1)';
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
                            
                            // Handle frame overlay - remove outer shadows, keep only inset and border
                            const clonedFrame = clonedDoc.querySelector('#cardFrameOverlay');
                            if (clonedFrame) {
                                // For postcard, hide frame overlay completely
                                if (currentTemplate === 'postcard') {
                                    clonedFrame.style.display = 'none';
                                } else {
                                    // Get computed styles
                                    const computedStyle = clonedDoc.defaultView.getComputedStyle(clonedFrame);
                                    const boxShadow = computedStyle.boxShadow;
                                    
                                    // Remove outer shadows (those starting with "0 0"), keep only inset shadows
                                    if (boxShadow && boxShadow !== 'none') {
                                        const shadows = boxShadow.split(',').map(s => s.trim());
                                        const insetShadows = shadows.filter(s => s.includes('inset'));
                                        if (insetShadows.length > 0) {
                                            clonedFrame.style.boxShadow = insetShadows.join(', ');
                                        } else {
                                            clonedFrame.style.boxShadow = 'none';
                                        }
                                    }
                                }
                            }
                            
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
                            
                            // Handle frame overlay - remove outer shadows, keep only inset and border
                            const clonedFrame = clonedDoc.querySelector('#cardFrameOverlay');
                            if (clonedFrame) {
                                // For postcard, hide frame overlay completely
                                if (currentTemplate === 'postcard') {
                                    clonedFrame.style.display = 'none';
                                } else {
                                    // Get computed styles
                                    const computedStyle = clonedDoc.defaultView.getComputedStyle(clonedFrame);
                                    const boxShadow = computedStyle.boxShadow;
                                    
                                    // Remove outer shadows (those starting with "0 0"), keep only inset shadows
                                    if (boxShadow && boxShadow !== 'none') {
                                        const shadows = boxShadow.split(',').map(s => s.trim());
                                        const insetShadows = shadows.filter(s => s.includes('inset'));
                                        if (insetShadows.length > 0) {
                                            clonedFrame.style.boxShadow = insetShadows.join(', ');
                                        } else {
                                            clonedFrame.style.boxShadow = 'none';
                                        }
                                    }
                                }
                            }
                            
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
    
    // Frame Selection
    const cardFrameOverlay = document.getElementById('cardFrameOverlay');
    document.querySelectorAll('.frame-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFrame = btn.dataset.frame;
            document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateFrame();
            saveCardState();
            if (soundEnabled) playSound('click');
        });
    });
    
    // Frame Color
    document.querySelectorAll('[data-framecolor]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFrameColor = btn.dataset.framecolor;
            document.querySelectorAll('[data-framecolor]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateFrame();
            saveCardState();
            if (soundEnabled) playSound('click');
        });
    });
    
    function updateFrame() {
        if (!cardFrameOverlay) return;
        
        cardFrameOverlay.className = 'card-frame-overlay';
        if (currentFrame !== 'none') {
            cardFrameOverlay.classList.add(`frame-${currentFrame}`);
            cardFrameOverlay.style.setProperty('--frame-color', currentFrameColor);
        } else {
            cardFrameOverlay.style.display = 'none';
        }
    }
    
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
    // Initialize frame
    updateFrame();
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
                            
                            // Handle frame overlay - remove outer shadows, keep only inset and border
                            const clonedFrame = clonedDoc.querySelector('#cardFrameOverlay');
                            if (clonedFrame) {
                                // For postcard, hide frame overlay completely
                                if (currentTemplate === 'postcard') {
                                    clonedFrame.style.display = 'none';
                                } else {
                                    // Get computed styles
                                    const computedStyle = clonedDoc.defaultView.getComputedStyle(clonedFrame);
                                    const boxShadow = computedStyle.boxShadow;
                                    
                                    // Remove outer shadows (those starting with "0 0"), keep only inset shadows
                                    if (boxShadow && boxShadow !== 'none') {
                                        const shadows = boxShadow.split(',').map(s => s.trim());
                                        const insetShadows = shadows.filter(s => s.includes('inset'));
                                        if (insetShadows.length > 0) {
                                            clonedFrame.style.boxShadow = insetShadows.join(', ');
                                        } else {
                                            clonedFrame.style.boxShadow = 'none';
                                        }
                                    }
                                }
                            }
                            
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
                            
                            // Handle frame overlay - remove outer shadows, keep only inset and border
                            const clonedFrame = clonedDoc.querySelector('#cardFrameOverlay');
                            if (clonedFrame) {
                                // For postcard, hide frame overlay completely
                                if (currentTemplate === 'postcard') {
                                    clonedFrame.style.display = 'none';
                                } else {
                                    // Get computed styles
                                    const computedStyle = clonedDoc.defaultView.getComputedStyle(clonedFrame);
                                    const boxShadow = computedStyle.boxShadow;
                                    
                                    // Remove outer shadows (those starting with "0 0"), keep only inset shadows
                                    if (boxShadow && boxShadow !== 'none') {
                                        const shadows = boxShadow.split(',').map(s => s.trim());
                                        const insetShadows = shadows.filter(s => s.includes('inset'));
                                        if (insetShadows.length > 0) {
                                            clonedFrame.style.boxShadow = insetShadows.join(', ');
                                        } else {
                                            clonedFrame.style.boxShadow = 'none';
                                        }
                                    }
                                }
                            }
                            
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
let sockData = JSON.parse(localStorage.getItem('sockData') || '[]');
let sockStats = JSON.parse(localStorage.getItem('sockStats') || '{"total": 0, "displayed": 0, "hanging": 0}');
let countryRankings = JSON.parse(localStorage.getItem('countryRankings') || '{}');
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

    // Load initial data
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
    hangSockBtn.addEventListener('click', () => {
        const message = sockMessage.value.trim();
        
        if (!selectedSock) return;

        // Get user location or random city
        let location;
        if (userLocation) {
            // Add slight random offset from user location
            location = {
                name: 'Your Location',
                country: getCountryFromLocation(userLocation.lat, userLocation.lng),
                lat: userLocation.lat + (Math.random() - 0.5) * 0.01,
                lng: userLocation.lng + (Math.random() - 0.5) * 0.01
            };
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

        // Add to data
        sockData.unshift(sockEntry);
        if (sockData.length > 50) sockData.pop(); // Keep last 50

        // Update stats
        sockStats.total++;
        incrementStat('socksHung');
        completeDailyChallenge('sock');
        sockStats.displayed = sockData.length;
        sockStats.hanging = Math.min(3, sockStats.hanging + 1);

        // Update country rankings
        const countryCode = location.country;
        countryRankings[countryCode] = (countryRankings[countryCode] || 0) + 1;

        // Save to localStorage
        localStorage.setItem('sockData', JSON.stringify(sockData));
        localStorage.setItem('sockStats', JSON.stringify(sockStats));
        localStorage.setItem('countryRankings', JSON.stringify(countryRankings));

        // Update UI
        updateStats();
        addSockToMap(sockEntry);
        renderFeed();
        renderRankings();

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
            localStorage.setItem('sockStats', JSON.stringify(sockStats));
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

    // Simulate real-time updates every 5 seconds
    setInterval(() => {
        // Occasionally add random socks
        if (Math.random() > 0.7) {
            const city = cities[Math.floor(Math.random() * cities.length)];
            const sockEmojis = ['🧦', '🧤', '🧥', '🎄', '⭐', '🎁'];
            const sockEntry = {
                id: Date.now(),
                emoji: sockEmojis[Math.floor(Math.random() * sockEmojis.length)],
                message: null,
                city: city.name,
                country: city.country,
                lat: city.lat + (Math.random() - 0.5) * 0.01,
                lng: city.lng + (Math.random() - 0.5) * 0.01,
                timestamp: new Date()
            };

            sockData.unshift(sockEntry);
            if (sockData.length > 50) sockData.pop();

            const countryCode = city.country;
            countryRankings[countryCode] = (countryRankings[countryCode] || 0) + 1;

            sockStats.total++;
            sockStats.displayed = sockData.length;

            localStorage.setItem('sockData', JSON.stringify(sockData));
            localStorage.setItem('sockStats', JSON.stringify(sockStats));
            localStorage.setItem('countryRankings', JSON.stringify(countryRankings));

            updateStats();
            addSockToMap(sockEntry);
            renderFeed();
            renderRankings();
        }
    }, 5000);
}

function updateStats() {
    document.getElementById('totalSocks').textContent = sockStats.total || 0;
    document.getElementById('currentDisplay').textContent = sockStats.displayed || 0;
    document.getElementById('hangingNow').textContent = sockStats.hanging || 0;
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

    // Show recent socks on map
    const recentSocks = sockData.slice(0, 50);
    const mapCount = document.getElementById('mapCount');
    mapCount.textContent = recentSocks.length;

    recentSocks.forEach(sock => {
        addSockToMap(sock);
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
    const popupContent = `
        <div style="text-align: center; padding: 0.5rem;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${sock.emoji}</div>
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${sock.city}</div>
            <div style="font-size: 0.85rem; color: #666;">${sock.country}</div>
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
        sockFeed.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">No activity yet. Hang your first sock!</div>';
    }
}

function renderRankings() {
    const rankingsList = document.getElementById('rankingsList');
    rankingsList.innerHTML = '';

    // Convert to array and sort
    const rankings = Object.entries(countryRankings)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    if (rankings.length === 0) {
        rankingsList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">No rankings yet. Start hanging socks!</div>';
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
    return '🌍 World';
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
                ? `${sock.message}\n\n📍 ${sock.city || 'Unknown'}, ${sock.country || 'World'}`
                : `I hung a sock in ${sock.city || 'the world'}, ${sock.country || 'World'}! 🧦🎄`;
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
        
        if (!addBtn) return;
        
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
                if (!game) return;
                
                // Hide all game containers
                document.querySelectorAll('.game-container').forEach(c => {
                    c.style.display = 'none';
                });
                
                // Hide games grid
                const gamesGrid = document.querySelector('.games-grid');
                if (gamesGrid) gamesGrid.style.display = 'none';
                
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
            currentGame = null;
            if (gameKeyboardHandler) {
                document.removeEventListener('keydown', gameKeyboardHandler);
                gameKeyboardHandler = null;
            }
        });
        container.insertBefore(backBtn, container.firstChild);
    });
}

// Games Leaderboard System
let gameLeaderboards = JSON.parse(localStorage.getItem('gameLeaderboards') || '{"trivia": [], "memory": [], "wordsearch": [], "wordle": []}');

function saveGameScore(gameType, score, country = '🌍 World') {
    if (!gameLeaderboards[gameType]) {
        gameLeaderboards[gameType] = [];
    }
    
    const entry = {
        score: score,
        country: country,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    gameLeaderboards[gameType].push(entry);
    
    // Keep top 50 scores per game
    if (gameLeaderboards[gameType].length > 50) {
        gameLeaderboards[gameType] = gameLeaderboards[gameType]
            .sort((a, b) => {
                // Sort by score (higher is better for most games)
                if (gameType === 'memory' || gameType === 'wordsearch') {
                    // Lower is better (fewer moves, less time)
                    return a.score - b.score;
                }
                return b.score - a.score;
            })
            .slice(0, 50);
    }
    
    localStorage.setItem('gameLeaderboards', JSON.stringify(gameLeaderboards));
    updateLeaderboard(gameType);
}

function updateLeaderboard(gameType) {
    const leaderboardContent = document.getElementById('leaderboardContent');
    if (!leaderboardContent) return;
    
    const scores = gameLeaderboards[gameType] || [];
    
    // Group by country and get best score per country
    const countryScores = {};
    scores.forEach(entry => {
        if (!countryScores[entry.country] || 
            (gameType === 'memory' || gameType === 'wordsearch' ? entry.score < countryScores[entry.country].score : entry.score > countryScores[entry.country].score)) {
            countryScores[entry.country] = entry;
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
        leaderboardContent.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">No scores yet. Play to get on the leaderboard!</div>';
        return;
    }
    
    sorted.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <div class="leaderboard-rank">#${index + 1}</div>
            <div class="leaderboard-country">${entry.country}</div>
            <div class="leaderboard-score">${entry.score}${gameType === 'trivia' ? '%' : gameType === 'memory' ? ' moves' : gameType === 'wordsearch' ? ' words' : ' guesses'}</div>
        `;
        leaderboardContent.appendChild(item);
    });
}

function initLeaderboard() {
    const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
    leaderboardTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            leaderboardTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const gameType = tab.dataset.game;
            updateLeaderboard(gameType);
        });
    });
    
    // Show leaderboard on games section
    const gamesSection = document.getElementById('games');
    if (gamesSection) {
        const showLeaderboardBtn = document.createElement('button');
        showLeaderboardBtn.className = 'action-btn secondary';
        showLeaderboardBtn.textContent = '🏆 View Leaderboard';
        showLeaderboardBtn.style.marginTop = '1rem';
        showLeaderboardBtn.addEventListener('click', () => {
            const leaderboard = document.getElementById('gamesLeaderboard');
            if (leaderboard) {
                leaderboard.style.display = leaderboard.style.display === 'none' ? 'block' : 'none';
                if (leaderboard.style.display !== 'none') {
                    updateLeaderboard('trivia');
                }
            }
        });
        gamesSection.querySelector('.container').appendChild(showLeaderboardBtn);
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
        
        // Save to leaderboard
        const userCountry = userLocation ? getCountryFromLocation(userLocation.lat, userLocation.lng) : '🌍 World';
        saveGameScore('trivia', percentage, userCountry);
        
        // Complete daily challenge
        completeDailyChallenge('trivia');
        
        // Firework effect
        createFireworkEffect(document.getElementById('triviaGame'));
        
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
                                
                                // Save to leaderboard
                                const userCountry = userLocation ? getCountryFromLocation(userLocation.lat, userLocation.lng) : '🌍 World';
                                saveGameScore('memory', moves, userCountry);
                                
                                // Complete daily challenge
                                completeDailyChallenge('memory');
                                
                                // Firework effect
                                createFireworkEffect(document.getElementById('memoryGame'));
                                
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
        
        const words = getDailyWordSearchWords();
        const gridSize = 15; // Larger grid for more variety
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
        
        // Directions: horizontal, vertical, diagonal (down-right), diagonal (down-left)
        const directions = [
            {dr: 0, dc: 1},   // Horizontal (right)
            {dr: 1, dc: 0},   // Vertical (down)
            {dr: 1, dc: 1},   // Diagonal (down-right)
            {dr: 1, dc: -1}   // Diagonal (down-left)
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
                    
                    // Firework effect
                    createFireworkEffect(document.getElementById('wordsearchGame'));
                    
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
                    const userCountry = userLocation ? getCountryFromLocation(userLocation.lat, userLocation.lng) : '🌍 World';
                    saveGameScore('wordsearch', foundWords.size, userCountry);
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
        window.open(platforms[platform], '_blank', 'width=600,height=400');
    }
}

// Share to Instagram Stories (Mobile)
function shareToInstagramStory(blob, text = '') {
    if (!blob) {
        showError('No image to share');
        return;
    }
    
    // Check if on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
        // Use native share API - Instagram will appear as an option on mobile
        blob.arrayBuffer().then(buffer => {
            const file = new File([buffer], `christmas-story-${Date.now()}.png`, { type: 'image/png' });
            navigator.share({
                title: 'My Christmas Result',
                text: text || 'Check out my Christmas result! 🎄',
                files: [file]
            }).then(() => {
                showSuccess('Shared to Instagram!');
                if (soundEnabled) playSound('success');
            }).catch((error) => {
                // If user cancels or share fails, try Instagram deep link
                if (error.name !== 'AbortError') {
                    openInstagramApp(blob);
                }
            });
        }).catch(() => {
            openInstagramApp(blob);
        });
    } else {
        // Desktop or no native share - try to open Instagram app or web
        openInstagramApp(blob);
    }
}

// Open Instagram App (fallback)
function openInstagramApp(blob) {
    // Create a download link first
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `christmas-story-${Date.now()}.png`;
    link.href = url;
    link.click();
    
    // Try to open Instagram app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
        // iOS: Try to open Instagram Stories
        window.location.href = 'instagram-stories://share';
        setTimeout(() => {
            // Fallback to Instagram app
            window.location.href = 'instagram://';
        }, 500);
    } else if (isAndroid) {
        // Android: Try to open Instagram
        window.location.href = 'intent://share#Intent;package=com.instagram.android;scheme=https;end';
        setTimeout(() => {
            // Fallback to web Instagram
            window.open('https://www.instagram.com/', '_blank');
        }, 500);
    } else {
        // Desktop: Open Instagram web
        window.open('https://www.instagram.com/', '_blank');
        showSuccess('Image downloaded! Open Instagram and add it to your story.');
    }
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        wordleWord = getDailyWord();
        wordleGuesses = [];
        currentGuess = '';
        currentRow = 0;
        
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
                keyBtn.textContent = key;
                keyBtn.dataset.key = key;
                
                if (key === 'ENTER') {
                    keyBtn.addEventListener('click', () => submitGuess());
                } else if (key === 'BACK') {
                    keyBtn.addEventListener('click', () => deleteLetter());
                } else {
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
        document.removeEventListener('keydown', handleWordleKeydown);
        showSuccess('Congratulations!');
        
        // Save to leaderboard and complete challenge
        const userCountry = userLocation ? getCountryFromLocation(userLocation.lat, userLocation.lng) : '🌍 World';
        saveGameScore('wordle', guesses, userCountry);
        completeDailyChallenge('wordle');
        
        // Firework effect
        createFireworkEffect(document.getElementById('wordleGame'));
        
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
        document.removeEventListener('keydown', handleWordleKeydown);
        showError('Out of guesses!');
    }
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
            const countries = [...new Set(Object.keys(countryRankings))];
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
function initDailyChallenges() {
    const today = new Date().toDateString();
    const lastChallengeDate = localStorage.getItem('lastChallengeDate');
    
    if (lastChallengeDate !== today) {
        // New day - reset challenges
        localStorage.setItem('lastChallengeDate', today);
        localStorage.setItem('dailyChallenges', JSON.stringify({
            trivia: false,
            memory: false,
            wordsearch: false,
            wordle: false,
            card: false,
            sock: false
        }));
    }
    
    // Show daily challenge indicator
    const challenges = JSON.parse(localStorage.getItem('dailyChallenges') || '{}');
    const completedCount = Object.values(challenges).filter(c => c).length;
    const totalChallenges = Object.keys(challenges).length;
    
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
    const challenges = JSON.parse(localStorage.getItem('dailyChallenges') || '{}');
    challenges[challengeType] = true;
    localStorage.setItem('dailyChallenges', JSON.stringify(challenges));
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
let christmasShares = JSON.parse(localStorage.getItem('christmasShares') || '[]');

function initShareChristmas() {
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
    
    // Load existing shares
    loadChristmasShares();
    updateShareChristmasStats();
    
    // Image upload
    if (imageBtn) {
        imageBtn.addEventListener('click', () => {
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
        removeImageBtn.addEventListener('click', () => {
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
        getLocationBtn.addEventListener('click', () => {
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
                    
                    try {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        console.log('Location received:', lat, lng);
                        
                        const country = getCountryFromLocation(lat, lng);
                        const city = country.replace(/🇰🇷|🇯🇵|🇺🇸|🇬🇧|🇫🇷|🇦🇺|🇨🇦|🇩🇪|🇷🇺|🇨🇳|🌍/g, '').trim();
                        const locationText = `${city}, ${country}`;
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

function handleChristmasImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file.');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showError('Image size should be less than 5MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const imagePreview = document.getElementById('christmasImagePreview');
        const imagePreviewImg = document.getElementById('christmasImagePreviewImg');
        const imagePlaceholder = document.getElementById('christmasImagePlaceholder');
        
        if (imagePreviewImg) {
            imagePreviewImg.src = e.target.result;
        }
        if (imagePreview) {
            imagePreview.style.display = 'block';
        }
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

function submitChristmasShare() {
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
    
    const share = {
        id: Date.now(),
        image: imagePreviewImg ? imagePreviewImg.src : '',
        message: messageInput ? messageInput.value.trim() : '',
        location: locationInput ? locationInput.value.trim() : '',
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    };
    
    // Add to beginning of array (most recent first)
    christmasShares.unshift(share);
    
    // Keep only last 100 shares
    if (christmasShares.length > 100) {
        christmasShares = christmasShares.slice(0, 100);
    }
    
    localStorage.setItem('christmasShares', JSON.stringify(christmasShares));
    
    // Reset form
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
    
    // Reset location status - user needs to click button again
    const getLocationBtn = document.getElementById('getCurrentLocationBtn');
    // Don't auto-click - browsers require user interaction for geolocation
    
    // Reload feed
    loadChristmasShares();
    updateShareChristmasStats();
    if (typeof incrementStat === 'function') {
        incrementStat('christmasShares');
    }
    
    showSuccess('Your Christmas moment has been shared! 🎄');
    if (soundEnabled) playSound('success');
}

function loadChristmasShares() {
    const feed = document.getElementById('shareChristmasFeed');
    if (!feed) return;
    
    feed.innerHTML = '';
    
    if (christmasShares.length === 0) {
        feed.innerHTML = '<p class="empty-feed-message">No shares yet. Be the first to share your Christmas moment! 🎄</p>';
        return;
    }
    
    christmasShares.forEach(share => {
        const item = document.createElement('div');
        item.className = 'share-christmas-item';
        item.innerHTML = `
            <img src="${share.image}" alt="Christmas share" class="share-christmas-item-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'.9em\' font-size=\'90\'%3E🎄%3C/text%3E%3C/svg%3E'">
            <div class="share-christmas-item-content">
                ${share.message ? `<p class="share-christmas-item-message">${share.message}</p>` : ''}
                <div class="share-christmas-item-footer">
                    <div class="share-christmas-item-location">
                        ${share.location ? `<span>📍 ${share.location}</span>` : '<span>🌍 Unknown Location</span>'}
                    </div>
                    <div>${share.time}</div>
                </div>
            </div>
        `;
        feed.appendChild(item);
    });
}

function updateShareChristmasStats() {
    const totalShares = document.getElementById('totalShares');
    const shareChristmasTotal = document.getElementById('shareChristmasTotal');
    const shareChristmasToday = document.getElementById('shareChristmasToday');
    
    const today = new Date().toLocaleDateString();
    const todayShares = christmasShares.filter(share => share.date === today).length;
    
    if (totalShares) totalShares.textContent = christmasShares.length;
    if (shareChristmasTotal) shareChristmasTotal.textContent = userStats.christmasShares || 0;
    if (shareChristmasToday) shareChristmasToday.textContent = userStats.christmasSharesToday || 0;
}

// How Button
function initHowButton() {
    const howBtn = document.getElementById('howBtn');
    if (howBtn) {
        howBtn.addEventListener('click', () => {
            showHowModal();
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
            <p>Play Christmas-themed games: Trivia, Memory, Word Search, and Wordle. Challenge yourself with different difficulty levels!</p>
            
            <h4 style="color: var(--christmas-gold); margin-top: 1rem; margin-bottom: 0.5rem;">📸 Share Christmas</h4>
            <p>Upload your Christmas photos with a message and location. Share your holiday moments with the world!</p>
        </div>
        <div style="margin-top: 1.5rem;">
            <button class="action-btn secondary" onclick="document.getElementById('shareModal').style.display='none'">Close</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Snow Animation
let snowInterval = null;
let snowEnabled = JSON.parse(localStorage.getItem('snowEnabled') || 'true');

function initSnow() {
    if (!snowEnabled) return;
    
    const snowContainer = document.getElementById('snowContainer');
    if (!snowContainer) return;
    
    const snowflakes = ['❄', '❅', '❆', '✻', '✼', '✽'];
    
    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        snowflake.style.opacity = Math.random() * 0.5 + 0.5;
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        
        snowContainer.appendChild(snowflake);
        
        setTimeout(() => {
            snowflake.remove();
        }, 5000);
    }
    
    // Clear existing interval if any
    if (snowInterval) clearInterval(snowInterval);
    
    snowInterval = setInterval(createSnowflake, 300);
}

function initSnowToggle() {
    const snowToggle = document.getElementById('snowToggle');
    const snowContainer = document.getElementById('snowContainer');
    
    if (!snowToggle || !snowContainer) return;
    
    // Set initial state
    if (!snowEnabled) {
        snowToggle.classList.add('disabled');
        snowContainer.style.display = 'none';
    }
    
    snowToggle.addEventListener('click', () => {
        snowEnabled = !snowEnabled;
        localStorage.setItem('snowEnabled', JSON.stringify(snowEnabled));
        
        if (snowEnabled) {
            snowToggle.classList.remove('disabled');
            snowContainer.style.display = 'block';
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
        }
        
        if (soundEnabled) playSound('click');
    });
}

// Sound Effects
function initSoundToggle() {
    const soundToggle = document.getElementById('soundToggle');
    soundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundToggle.classList.toggle('muted', !soundEnabled);
        soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    });
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
        darkModeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.textContent = '🌙';
    }
    
    darkModeToggle.addEventListener('click', () => {
        const isCurrentlyDark = document.body.classList.contains('dark-mode');
        
        if (isCurrentlyDark) {
            document.body.classList.remove('dark-mode');
            darkModeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        }
        
        if (soundEnabled) playSound('click');
    });
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.add('dark-mode');
                darkModeToggle.textContent = '☀️';
            } else {
                document.body.classList.remove('dark-mode');
                darkModeToggle.textContent = '🌙';
            }
        }
    });
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


