/* CONFIGURACIÓN */
const CONFIG = {
    version: '1.6',
    partnerName: "", // Poner nombre aquí, e.g. "Laura"
    sinceDate: "", // Texto opcional, e.g. "Desde 2023... 💘"
    photoUrl: "", // Ruta opcional, e.g. "./assets/us.jpg"
    soundEnabled: true,
    screen2Attempts: 8,
    // Regalos normales (indices 1, 2, 3)
    gifts: [
        "Vale por un día de Spa, masajes y mimos. 🧖‍♀️",
        "Vale por una sesión de besos infinitos. 💋",
        "Vale por un Plan Secreto que te encantará. 🤫"
    ],
    // Regalo especial (index 0)
    letterGift: {
        title: "Tu cartita 💌",
        buttonLabel: "Ver texto",
        image: "./assets/nosotros.jpg",
        message: `Bueno annetxus si no calculo mal estarás leyendo este mensaje conmigo en Santander o Oviedo.

Lo primero que te quiero decir es que eres lo mejor que me ha pasado en la vida y que te quiero un montonazo.

Te conocí en una época de mi vida que no estaba muy bien y desde que estoy contigo todo ha ido a mejor.

No creo en las casualidades pero desde que te conozco hemos ganado la copa, estoy mucho más feliz…

Aunque tengamos nuestros rifirafes y nuestros enfados ambos sabemos que nos queremos un montonazo y que estamos el uno para el otro y ojalá así sea siempre Annetxus.

Y no sabes lo bien que me lo paso contigo de viaje visitando sitios y riéndonos juntos.

Y probablemente cuando estés leyendo esto me lo estaré pasando dpm cntigo, habiendo cenado en la tasca y con nuestro cachopin😋😋😋

Por eso solo quiero decirte gracias por estar a mi lado cuando te necesito y para pasárnoslo bien juntos.

Te quiero un montón miniña🩵🐥🩵🐥🩵

Te amo Annetxus🩵🩵`
    },
    messages: {
        screen2No: "No acepto esa respuesta 😌",
        screen2Funny: "Vale, vale... 😌",
        toastAccept: "¡Sabía que dirías que sí! 💖",
        miniTexts: ["Casi me pillas 😳", "Uy 😅", "No tan rápido 😈", "Muejeje 🏃‍♂️", "Inténtalo 😜"]
    },
    escapeTextsScreen1: ["No 😅", "¿Seguro? 😳", "Nop 🤭", "Inténtalo 😈", "Casi… 😂", "Uy 😏"],
    escapeTextsScreen2: ["Sí 😏", "Píllame 😳", "No tan rápido 😈", "Casi lo logras 😅", "Última 😜", "Ok ok… 🙈"]
};

/* ESTADO GLOBAL */
const state = {
    screen2ClickCount: 0,
    canClickScreen2Yes: false,
    textIndex1: 0,
    textIndex2: 0,
};

// Nuevo estado de flujo de regalos
const giftFlow = {
    openIndex: null,
    revealed: new Set() // Indices de regalos revelados
};

/* AUDIO CONTEXT */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = new AudioContext();

function toggleSound() {
    CONFIG.soundEnabled = !CONFIG.soundEnabled;
    const btn = document.getElementById('sound-toggle');
    btn.innerText = CONFIG.soundEnabled ? '🔊' : '🔇';
}

function playPop() {
    if (!CONFIG.soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

/* PERSONALIZATION */
function initPersonalization() {
    // Inject Version
    const scripts = document.querySelectorAll('script[src^="./app.js"]');
    if (scripts.length > 0) scripts[0].src = `./app.js?v=${CONFIG.version}`;
    const links = document.querySelectorAll('link[href^="./styles.css"]');
    if (links.length > 0) links[0].href = `./styles.css?v=${CONFIG.version}`;

    // Name
    if (CONFIG.partnerName) {
        document.getElementById('partner-name-display').innerText = `, ${CONFIG.partnerName}`;
    }
    // Date
    if (CONFIG.sinceDate) {
        document.getElementById('since-date-display').innerText = CONFIG.sinceDate;
    }
    // Photo
    if (CONFIG.photoUrl) {
        const photoContainer = document.getElementById('partner-photo-container');
        const img = document.getElementById('partner-photo');
        img.src = CONFIG.photoUrl;
        photoContainer.classList.remove('hidden');
    }

    // Sound Toggle Listener
    document.getElementById('sound-toggle').addEventListener('click', toggleSound);

    // Listen for Button Yes Screen 1
    document.getElementById('btn-y1').addEventListener('click', () => {
        // Pop animation
        const btn = document.getElementById('btn-y1');
        btn.style.transform = "scale(0.95)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);
        goToScreen(2);
    });
}

/* ESCAPE LOGIC (Overlay + Shake) */
function makeButtonShake(btn) {
    btn.classList.add('shake');
    setTimeout(() => {
        btn.classList.remove('shake');
    }, 300);

    // Vibrate
    if (CONFIG.soundEnabled && navigator.vibrate) navigator.vibrate(25);
}

function showMiniTargetMessage(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = 'btn-msg';
    msg.innerText = CONFIG.messages.miniTexts[Math.floor(Math.random() * CONFIG.messages.miniTexts.length)];

    container.innerHTML = ''; // Limpiar anterior
    container.appendChild(msg);

    setTimeout(() => {
        msg.remove();
    }, 700);
}

function moveButton(btn) {
    if (!btn.classList.contains('escaping')) {
        makeButtonShake(btn);
        // Delay move slightly for shake effect
        setTimeout(() => moveButtonAction(btn), 120);
    } else {
        moveButtonAction(btn);
    }
}

function moveButtonAction(btn) {
    if (!btn.classList.contains('escaping')) moveButtonToOverlay(btn);

    // Dynamic Text
    if (btn.id === 'btn-n1') {
        state.textIndex1 = (state.textIndex1 + 1) % CONFIG.escapeTextsScreen1.length;
        btn.innerText = CONFIG.escapeTextsScreen1[state.textIndex1];
        showMiniTargetMessage('msg-container-1');
    } else if (btn.id === 'btn-y2') {
        state.textIndex2 = (state.textIndex2 + 1) % CONFIG.escapeTextsScreen2.length;
        btn.innerText = CONFIG.escapeTextsScreen2[state.textIndex2];
        showMiniTargetMessage('msg-container-2');
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const btnRect = btn.getBoundingClientRect();
    const margin = 20;

    const isMobile = width < 768;
    const minJump = isMobile ? 180 : 240;

    let newX, newY, safe = 0;
    const currentX = btnRect.left;
    const currentY = btnRect.top;

    do {
        newX = margin + Math.random() * (width - btnRect.width - margin * 2);
        newY = margin + Math.random() * (height - btnRect.height - margin * 2);
        safe++;
    } while (Math.hypot(newX - currentX, newY - currentY) < minJump && safe < 15);

    if (newX < 0 || newX > width - btnRect.width || newY < 0 || newY > height - btnRect.height) {
        newX = (width - btnRect.width) / 2;
        newY = (height - btnRect.height) / 2;
    }

    btn.style.left = `${newX}px`;
    btn.style.top = `${newY}px`;
}

function ensureEscapeLayer() {
    let layer = document.getElementById('escape-layer');
    if (!layer) {
        layer = document.createElement('div');
        layer.id = 'escape-layer';
        layer.style.position = 'fixed';
        layer.style.inset = '0';
        layer.style.pointerEvents = 'none';
        layer.style.zIndex = '999';
        document.body.appendChild(layer);
    }
    return layer;
}

function moveButtonToOverlay(btn) {
    if (btn.classList.contains('escaping')) return;
    const layer = ensureEscapeLayer();
    const container = btn.parentElement;
    if (!container) return;

    // Placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'btn-placeholder';
    placeholder.style.width = `${btn.offsetWidth}px`;
    placeholder.style.height = `${btn.offsetHeight}px`;
    placeholder.style.display = 'inline-block';
    container.insertBefore(placeholder, btn);

    const rect = btn.getBoundingClientRect();
    layer.appendChild(btn);
    btn._placeholderRef = placeholder;

    btn.style.position = 'fixed';
    btn.style.left = `${rect.left}px`;
    btn.style.top = `${rect.top}px`;
    btn.style.zIndex = '1000';
    btn.style.pointerEvents = 'auto';
    btn.classList.add('escaping');
}

function returnButtonToContainer(btn) {
    if (!btn._placeholderRef) return;
    const placeholder = btn._placeholderRef;
    const container = placeholder.parentElement;

    if (container) {
        container.insertBefore(btn, placeholder);
        placeholder.remove();
    }

    btn.style.position = '';
    btn.style.left = '';
    btn.style.top = '';
    btn.style.zIndex = '';
    btn.style.pointerEvents = '';
    btn.classList.remove('escaping');
    delete btn._placeholderRef;
}

function resetEscapingButtons() {
    document.querySelectorAll('.escaping').forEach(btn => returnButtonToContainer(btn));
}

function initButtons() {
    // PANTALLA 1: Botón NO se escapa
    const btnNo1 = document.getElementById('btn-n1');
    const escapeHandler1 = (e) => { moveButton(btnNo1); };

    btnNo1.addEventListener('mouseenter', escapeHandler1);
    btnNo1.addEventListener('click', (e) => { e.preventDefault(); moveButton(btnNo1); });
    btnNo1.addEventListener('touchstart', (e) => { e.preventDefault(); escapeHandler1(e); }, { passive: false });

    // PANTALLA 1: Botón SÍ
    const btnYes1 = document.getElementById('btn-y1');
    const handleYes1 = () => {
        btnYes1.style.transform = "scale(0.95)";
        setTimeout(() => btnYes1.style.transform = "scale(1)", 100);
        goToScreen(2);
    };

    btnYes1.addEventListener('click', handleYes1);
    btnYes1.addEventListener('touchend', (e) => {
        handleYes1();
    });

    // PANTALLA 2: Botón SÍ se escapa (al revés)
    const btnYes2 = document.getElementById('btn-y2');
    const btnNo2 = document.getElementById('btn-n2');

    btnNo2.addEventListener('click', () => { alert(CONFIG.messages.screen2No); });

    const escapeHandler2 = (e) => {
        if (state.canClickScreen2Yes) return;

        state.screen2ClickCount++;

        if (state.screen2ClickCount >= CONFIG.screen2Attempts) {
            state.canClickScreen2Yes = true;
            returnButtonToContainer(btnYes2);
            resetEscapingButtons();
            btnYes2.innerText = CONFIG.messages.screen2Funny;
            btnYes2.removeEventListener('mouseenter', escapeHandler2);
            // Mostrar Toast
            showToast(CONFIG.messages.toastAccept);
        } else {
            moveButton(btnYes2);
        }
    };

    btnYes2.addEventListener('mouseenter', escapeHandler2);
    btnYes2.addEventListener('touchstart', (e) => {
        if (!state.canClickScreen2Yes) { e.preventDefault(); escapeHandler2(e); }
    }, { passive: false });

    btnYes2.addEventListener('click', (e) => {
        if (state.canClickScreen2Yes) {
            showToast(CONFIG.messages.toastAccept); // Toast también al clickar definitivo
            setTimeout(() => goToScreen(3), 1000); // Pequeño delay para ver el toast
        } else {
            e.preventDefault(); moveButton(btnYes2);
        }
    });
}

/* UI HELPERS */
function showToast(text) {
    const toast = document.getElementById('toast');
    toast.innerText = text;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3500);
}

function goToScreen(screenNum) {
    resetEscapingButtons();
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    const target = document.getElementById(`screen-${screenNum}`);
    target.classList.remove('hidden');
    target.classList.add('active');

    if (screenNum === 3) startConfetti();
}

/* GIFTS LOGIC - MIXED BEHAVIOR */
function spawnMiniConfetti(element) {
    const colors = ['#ff4d6d', '#ff8fa3', '#fff', '#ffc107', '#ff0055'];
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const confetto = document.createElement('div');
        confetto.classList.add('mini-confetto');
        confetto.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        confetto.style.setProperty('--tx', `${tx}px`);
        confetto.style.setProperty('--ty', `${ty}px`);

        element.appendChild(confetto);
        setTimeout(() => confetto.remove(), 800);
    }
}

function openGift(element, index) {
    if (element.classList.contains('open')) return;

    // ACCORDION LOGIC: Solo uno abierto a la vez.
    const currentlyOpen = document.querySelector('.gift-box.open');
    if (currentlyOpen && currentlyOpen !== element) {
        currentlyOpen.classList.remove('open');
        const oldContent = currentlyOpen.querySelector('.gift-content');
        if (oldContent) oldContent.innerHTML = '';
    }

    giftFlow.openIndex = index;
    // Se considera revelado al abrir porque ya se ve el contenido completo
    giftFlow.revealed.add(index);

    playPop();
    spawnMiniConfetti(element);
    if (navigator.vibrate) navigator.vibrate(30);

    element.classList.add('bounce');
    element.classList.add('open');

    const contentDiv = element.querySelector('.gift-content');
    contentDiv.innerHTML = '';

    // Render Content Wrapper
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%';

    if (index === 0) {
        // CARTA (Igual que antes)
        const container = document.createElement('div');
        container.className = 'gift-preview';

        const title = document.createElement('div');
        title.className = 'gift-preview-title';
        title.innerText = CONFIG.letterGift.title;

        const btn = document.createElement('button');
        btn.className = 'btn-reveal';
        btn.innerText = CONFIG.letterGift.buttonLabel;
        btn.setAttribute('data-action', 'open-letter');

        container.appendChild(title);
        container.appendChild(btn);
        wrapper.appendChild(container);

    } else {
        // REGALOS 1, 2, 3 (Nuevo Diseño)
        const title = document.createElement('h3');
        title.className = 'gift-title';

        const text = document.createElement('p');
        text.className = 'gift-text-body';

        const btn = document.createElement('button');
        btn.className = 'gift-btn-action';

        if (index === 1) {
            title.innerText = "Relax & Mimos 🧖‍♀️";
            text.innerText = "Vale por un día de mimos y relax juntos, sin prisas… 💗";
            btn.innerText = "Modo relax ✨";
            btn.setAttribute('data-action', 'reveal-spa');
        } else if (index === 2) {
            title.innerText = "Besos Infinitos 💋";
            text.innerText = "Vale por besos infinitos, de los que curan cualquier día malo ✨";
            btn.innerText = "Dame play 😘";
            btn.setAttribute('data-action', 'reveal-kisses');
        } else if (index === 3) {
            title.innerText = "Plan Sorpresa 🤫";
            text.innerText = "Vale por un plan sorpresa… y solo tú tendrás la pista 🎀";
            btn.innerText = "Desbloquear pista 🎀";
            btn.setAttribute('data-action', 'reveal-secret');
        }

        wrapper.appendChild(title);
        wrapper.appendChild(text);
        wrapper.appendChild(btn);
    }

    contentDiv.appendChild(wrapper);
    updateGiftLocks();
}

function revealGiftContent(index, btnElement) {
    // No used but kept for safety
}

/* OVERLAY MANAGEMENT */
function closeAllOverlays() {
    // 1. Hide all overlays
    const overlays = document.querySelectorAll('.overlay, .letter-overlay');
    overlays.forEach(ov => {
        ov.classList.remove('active');
        ov.classList.add('hidden');
    });

    // 2. Stop Video if playing
    const video = document.getElementById('kisses-video');
    if (video) {
        video.pause();
        video.currentTime = 0;
    }

    // 3. Restore Scroll
    document.body.style.overflow = '';
}

function openLetterOverlay() {
    closeAllOverlays(); // Safety First

    const overlay = document.getElementById('letter-overlay');
    const title = document.getElementById('letter-title');
    const body = document.getElementById('letter-body');

    // Content
    title.innerText = CONFIG.letterGift.title;
    body.innerText = CONFIG.letterGift.message;

    // Image Logic
    const imgEl = document.getElementById("letter-img");
    imgEl.src = CONFIG.letterGift.image;
    imgEl.style.display = "block";

    imgEl.onload = () => { imgEl.style.display = "block"; };
    imgEl.onerror = () => { imgEl.style.display = "none"; };

    // Logic
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');
    void overlay.offsetWidth;
    overlay.classList.add('active');

    giftFlow.revealed.add(0);
    updateGiftLocks();
}

function closeLetterOverlay() {
    closeAllOverlays();
}

/* SPA OVERLAY */
function openSpaOverlay() {
    closeAllOverlays(); // Safety First

    const overlay = document.getElementById('spa-overlay');
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');
    void overlay.offsetWidth;
    overlay.classList.add('active');

    spawnMiniConfetti(overlay.querySelector('.video-card'));
}

function closeSpaOverlay() {
    closeAllOverlays();
}

/* SURPRISE OVERLAY */
function openSurpriseOverlay() {
    closeAllOverlays(); // Safety First

    const overlay = document.getElementById('surprise-overlay');
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');
    void overlay.offsetWidth;
    overlay.classList.add('active');

    spawnMiniConfetti(overlay.querySelector('.video-card'));
}

function closeSurpriseOverlay() {
    closeAllOverlays();
}

/* VIDEO OVERLAY LOGIC (KISSES) */
function openVideoOverlay() {
    closeAllOverlays(); // Safety First

    const overlay = document.getElementById('video-overlay');
    const video = document.getElementById('kisses-video');

    // Set source (try relative first)
    // To ensure fresh load in case of errors
    video.src = "./assets/nosotros1.mov";

    // Logic
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');
    // Force reflow
    void overlay.offsetWidth;
    overlay.classList.add('active');

    video.load();
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Auto-play prevented", error);
            // Fallback path check if needed or user interacts
        });
    }

    // Update locks if not already (though gift opening does it)
    updateGiftLocks();
}

function closeVideoOverlay() {
    closeAllOverlays();
}

// Global Listener mandatory (WITH RETURNS)
document.addEventListener("click", (e) => {
    const target = e.target;

    // 1. Open Letter
    if (target.closest('[data-action="open-letter"]')) {
        e.stopPropagation();
        openLetterOverlay();
        return;
    }

    // 2. Close Actions (ALL CLOSINGS)
    if (target.closest('[data-action="close-letter"]') ||
        target.closest('[data-action="close-video"]') ||
        target.closest('[data-action="close-spa"]') ||
        target.closest('[data-action="close-surprise"]')) {

        e.stopPropagation();
        closeAllOverlays();
        return;
    }

    // 3. Reveal Gifts (Actions)
    // SPA -> SPA OVERLAY
    if (target.matches('[data-action="reveal-spa"]')) {
        e.stopPropagation();
        openSpaOverlay();
        return;
    }
    // KISSES -> VIDEO OVERLAY
    if (target.matches('[data-action="reveal-kisses"]')) {
        e.stopPropagation();
        openVideoOverlay();
        return;
    }
    // SECRET -> SECRET OVERLAY
    if (target.matches('[data-action="reveal-secret"]')) {
        e.stopPropagation();
        openSurpriseOverlay();
        return;
    }
});

// ESC Key for Overlays
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllOverlays();
    }
});

function updateGiftLocks() {
    // CON ACCORDION, YA NO BLOQUEAMOS NADA. SIEMPRE SE PUEDE ABRIR CUALQUIERA.
    // Solo mantenemos la función para no romper llamadas existentes, pero la vaciamos de lógica de bloqueo.
    document.querySelectorAll('.gift-box').forEach((box) => {
        box.classList.remove('gift-disabled');
    });
}

/* CONFETI BACKGROUND (Screen 3) */
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return; // Paranoia check
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = [];
    const confettiCount = 300;
    const gravity = 0.5;
    const terminalVelocity = 5;
    const drag = 0.075;
    const colors = [
        { front: '#ff4d6d', back: '#ff0055' },
        { front: '#ffc107', back: '#ff9800' },
        { front: '#ffffff', back: '#eeeeee' }
    ];

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);

    class Confetto {
        constructor() {
            this.randomModifier = Math.random() * 99;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.dimensions = {
                x: Math.random() * 10 + 10,
                y: Math.random() * 10 + 10,
            };
            this.position = {
                x: Math.random() * canvas.width,
                y: canvas.height - 1,
            };
            this.rotation = Math.random() * 2 * Math.PI;
            this.scale = {
                x: 1,
                y: 1,
            };
            this.velocity = {
                x: Math.random() * 50 - 25,
                y: Math.random() * -50 - 10,
            };
        }

        update() {
            this.velocity.x -= this.velocity.x * drag;
            this.velocity.y = Math.min(this.velocity.y + gravity, terminalVelocity);
            this.velocity.x += Math.random() > 0.5 ? Math.random() : -Math.random();

            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;

            this.scale.y = Math.cos(this.position.y * 0.1);
            this.color.front = this.scale.y > 0 ? this.color.front : this.color.back;

            if (this.position.y >= canvas.height) {
                this.velocity.y = -Math.random() * 10 - 10;
            }
        }

        draw() {
            const width = (this.dimensions.x * this.scale.x);
            const height = (this.dimensions.y * this.scale.y);

            ctx.translate(this.position.x, this.position.y);
            ctx.rotate(this.rotation);

            ctx.fillStyle = this.color.front;
            ctx.fillRect(-width / 2, -height / 2, width, height);

            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    // Inicializar confeti (explosión inicial)
    for (let i = 0; i < confettiCount; i++) {
        confetti.push(new Confetto());
    }

    // Bucle de animación simple
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confetti.forEach((confetto) => {
            confetto.update();
            confetto.draw();
        });
        requestAnimationFrame(render);
    }

    render();
}

/* BACKGROUND CORAZONES */
function createHearts() {
    const container = document.getElementById('bg-hearts');
    const heartCount = 15;
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '❤';
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.fontSize = Math.random() * 20 + 20 + 'px';
        heart.style.animationDuration = Math.random() * 5 + 5 + 's';
        heart.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(heart);
    }
}

// Start
window.onload = () => {
    initButtons();
    createHearts();
};
