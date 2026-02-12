/* CONFIGURACIÓN */
const CONFIG = {
    version: '1.5',
    partnerName: "", // Poner nombre aquí, e.g. "Laura"
    sinceDate: "", // Texto opcional, e.g. "Desde 2023... 💘"
    photoUrl: "", // Ruta opcional, e.g. "./assets/us.jpg"
    soundEnabled: true,
    screen2Attempts: 8,
    gifts: [
        {
            type: "text",
            title: "Vale Especial 📝",
            buttonLabel: "Ver vale",
            message: "Vale por un texto bonito cuando más lo necesites. Solo tienes que pedírmelo y me pondré inspirad@ para escribirte lo que sientes.",
            footer: "Con amor, yo 💌"
        },
        {
            type: "text",
            title: "Relax Time 🧖‍♀️",
            buttonLabel: "Ver sorpresa",
            message: "Vale por un día de Spa, masajes y mimos. Prepárate para relajarte completamente.",
            footer: "Para ti ❤️"
        },
        {
            type: "text",
            title: "Besos 💋",
            buttonLabel: "Canjear",
            message: "Vale por una sesión de besos infinitos (sin caducidad). Canjeable en cualquier momento y lugar.",
            footer: "Te quiero 💖"
        },
        {
            type: "text",
            title: "Sorpresa 🤫",
            buttonLabel: "Descubrir",
            message: "Vale por un Plan Secreto que te encantará. Es algo que sé que tienes ganas de hacer...",
            footer: "Juntos 👫"
        }
    ],
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
    openIndex: null,       // Índice del regalo actualmente abierto (o null)
    revealedSet: new Set() // Índices de regalos ya revelados totalmente
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

/* REGALOS & MODAL */
/* FUNCIONES DE REGALOS */
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

function updateGiftLocks(clickedIndex) {
    // Si hay un regalo abierto y NO revelado, bloqueamos los demás
    const isBlocking = state.openIndex !== null && !state.revealedSet.has(state.openIndex);

    document.querySelectorAll('.gift-box').forEach((box, i) => {
        // Bloquear si: hay bloqueo activo Y ESTA caja no es la que está abierta (y no está revelada ya)
        // O si ya está revelada, la dejamos tranquila (o accesible para relectura)

        // Criterio de bloqueo:
        // Si hay bloqueo activo:
        // - La caja abierta (openIndex) debe estar normal (activa).
        // - Todas las demás deben estar disabled.

        if (isBlocking) {
            if (i === state.openIndex) {
                box.classList.remove('gift-disabled');
            } else {
                box.classList.add('gift-disabled');
            }
        } else {
            // Sin bloqueo, todas desbloqueadas
            box.classList.remove('gift-disabled');
        }
    });
}

function openGift(element, index) {
    // 1. Si ya está abierta, no hacemos nada extra (salvo si queremos re-renderizar, pero no es el caso)
    if (element.classList.contains('open')) {
        // Si ya está abierta y revelada, no hacemos nada o dejamos que el usuario interactúe
        return;
    }

    // 2. Comprobar bloqueo: Si hay otro regalo abierto y no revelado, abortar
    if (state.openIndex !== null && !state.revealedSet.has(state.openIndex) && state.openIndex !== index) {
        return; // Está bloqueado
    }

    state.openIndex = index;

    playPop();
    spawnMiniConfetti(element);
    if (navigator.vibrate) navigator.vibrate(30);

    element.classList.add('bounce');
    element.classList.add('open');

    // Render Preview
    renderGiftPreview(element, index);

    // Actualizar bloqueos visuales
    updateGiftLocks(index);
}

function renderGiftPreview(element, index) {
    const giftData = CONFIG.gifts[index];
    const contentDiv = element.querySelector('.gift-content');
    contentDiv.innerHTML = ''; // Limpiar

    const container = document.createElement('div');
    container.className = 'gift-preview';

    const title = document.createElement('div');
    title.className = 'gift-preview-title';
    title.innerText = giftData.title;

    const btn = document.createElement('button');
    btn.className = 'btn-reveal';
    btn.innerText = giftData.buttonLabel || "Ver";
    btn.onclick = (e) => {
        e.stopPropagation(); // Evitar triggers raros
        revealGift(element, index);
    };

    container.appendChild(title);
    container.appendChild(btn);
    contentDiv.appendChild(container);
}

function revealGift(element, index) {
    // Marcar como revelado
    state.revealedSet.add(index);

    // Desbloquear (ya no hay openIndex pendiente de revelar, aunque openIndex siga siendo este)
    // Dejamos openIndex apuntando aquí, pero como revealedSet lo tiene, updateGiftLocks quitará el disabled global
    updateGiftLocks(index);

    const giftData = CONFIG.gifts[index];
    const contentDiv = element.querySelector('.gift-content');
    contentDiv.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'gift-reveal';

    const title = document.createElement('div');
    title.className = 'gift-reveal-title';
    title.innerText = giftData.title;

    const msg = document.createElement('div');
    msg.className = 'gift-reveal-message';
    msg.innerText = giftData.message;

    if (giftData.footer) {
        const foot = document.createElement('div');
        foot.className = 'gift-reveal-footer';
        foot.innerText = giftData.footer;
        msg.appendChild(foot);
    }

    container.appendChild(title);
    container.appendChild(msg);
    contentDiv.appendChild(container);
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
