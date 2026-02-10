/* CONFIGURACIÓN */
const CONFIG = {
    screen2Attempts: 8, // Intentos antes de que el botón Sí se deje pulsar
    gifts: [
        "Vale por un texto bonito 📝",
        "Vale por un día de Spa 🧖‍♀️",
        "Vale por besos infinitos 💋",
        "Vale por un Plan Secreto 🤫"
    ],
    messages: {
        screen2No: "No acepto esa respuesta 😌",
        screen2Funny: "Vale, vale... 😌"
    }
};

/* ESTADO */
const state = {
    screen2ClickCount: 0,
    canClickScreen2Yes: false
};

/* FUNCIONES DE NAVEGACIÓN */
function goToScreen(screenNum) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    const target = document.getElementById(`screen-${screenNum}`);
    target.classList.remove('hidden');
    target.classList.add('active');

    if (screenNum === 3) {
        startConfetti();
    }
}

/* DEBUG MODE */
const DEBUG = true;
if (DEBUG) {
    console.log("VERSION OVERLAY 1");
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.top = '0';
    debugDiv.style.right = '0';
    debugDiv.style.background = 'black';
    debugDiv.style.color = '#0f0';
    debugDiv.style.padding = '5px';
    debugDiv.style.zIndex = '9999';
    debugDiv.innerText = 'OVERLAY ON';
    document.body.appendChild(debugDiv);
}

/* FUNCIONES DE BOTONES ESCAPISTAS (Overlay Logic) */
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
        if (DEBUG) console.log("Created escape-layer dynamically");
    }
    return layer;
}

function moveButtonToOverlay(btn) {
    if (btn.classList.contains('escaping')) return;

    const layer = ensureEscapeLayer();
    const container = btn.parentElement;
    if (!container) return; // Should not happen

    // Crear placeholder para mantener layout
    const placeholder = document.createElement('div');
    placeholder.className = 'btn-placeholder';
    placeholder.style.width = `${btn.offsetWidth}px`;
    placeholder.style.height = `${btn.offsetHeight}px`;
    placeholder.style.display = 'inline-block';
    placeholder.id = `idx-${Math.random().toString(36).substr(2, 9)}`;

    // Insertar placeholder y mover botón
    container.insertBefore(placeholder, btn);

    // Guardar posición inicial absoluta para evitar saltos visuales
    const rect = btn.getBoundingClientRect();

    layer.appendChild(btn);

    // Guardar ref al placeholder en el botón
    btn._placeholderRef = placeholder;

    // Config style fixed
    btn.style.position = 'fixed';
    btn.style.left = `${rect.left}px`;
    btn.style.top = `${rect.top}px`;
    btn.style.zIndex = '1000';
    btn.style.pointerEvents = 'auto'; // Asegurar click interactuable
    btn.classList.add('escaping');

    if (DEBUG) {
        console.log("moved to overlay", btn.id);
        console.log("Parent is now:", btn.parentElement.id);
    }
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

    if (DEBUG) console.log("Returned to container");
}

function moveButton(btn) {
    // Si no está en modo escape, iniciarlo
    if (!btn.classList.contains('escaping')) {
        moveButtonToOverlay(btn);
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const btnRect = btn.getBoundingClientRect();
    const margin = 20; // Seguridad bordes

    // Distancia mínima de salto según dispositivo
    const isMobile = width < 768;
    const minJump = isMobile ? 180 : 240;

    let newX, newY;
    let safe = 0;
    const currentX = btnRect.left;
    const currentY = btnRect.top;

    // Reintentar para conseguir salto grande
    do {
        newX = margin + Math.random() * (width - btnRect.width - margin * 2);
        newY = margin + Math.random() * (height - btnRect.height - margin * 2);

        safe++;
        if (DEBUG && safe === 1) {
            const dist = Math.hypot(newX - currentX, newY - currentY);
            // console.log(`Attempt 1 dist: ${dist}`);
        }
    } while (Math.hypot(newX - currentX, newY - currentY) < minJump && safe < 15);

    // Failsafe centro si se sale (aunque math random con margin lo evita)
    if (newX < 0 || newX > width - btnRect.width || newY < 0 || newY > height - btnRect.height) {
        newX = (width - btnRect.width) / 2;
        newY = (height - btnRect.height) / 2;
        if (DEBUG) console.warn("Failsafe triggered");
    }

    btn.style.left = `${newX}px`;
    btn.style.top = `${newY}px`;

    if (DEBUG) console.log(`Moved to ${newX}, ${newY}`);
}

function initButtons() {
    // PANTALLA 1: Botón NO se escapa
    const btnNo1 = document.getElementById('btn-n1');
    const escapeHandler1 = (e) => {
        moveButton(btnNo1);
    };

    btnNo1.addEventListener('mouseenter', escapeHandler1);
    btnNo1.addEventListener('touchstart', (e) => {
        e.preventDefault();
        escapeHandler1(e);
    }, { passive: false });

    // PANTALLA 2: Botón SÍ se escapa (al revés)
    const btnYes2 = document.getElementById('btn-y2');
    const btnNo2 = document.getElementById('btn-n2');

    // Botón No de pantalla 2
    btnNo2.addEventListener('click', () => {
        alert(CONFIG.messages.screen2No);
    });

    const escapeHandler2 = (e) => {
        if (state.canClickScreen2Yes) return;

        state.screen2ClickCount++;

        if (state.screen2ClickCount >= CONFIG.screen2Attempts) {
            state.canClickScreen2Yes = true;

            // VOLVER A CASA
            returnButtonToContainer(btnYes2);

            btnYes2.innerText = CONFIG.messages.screen2Funny;
            // Quitamos listeners
            btnYes2.removeEventListener('mouseenter', escapeHandler2);
            // No quitamos touchstart aquí porque tenemos lógica condicional dentro
        } else {
            moveButton(btnYes2);
        }
    };

    btnYes2.addEventListener('mouseenter', escapeHandler2);
    btnYes2.addEventListener('touchstart', (e) => {
        if (!state.canClickScreen2Yes) {
            e.preventDefault();
            escapeHandler2(e);
        }
    }, { passive: false });

    btnYes2.addEventListener('click', (e) => {
        if (state.canClickScreen2Yes) {
            goToScreen(3);
        } else {
            e.preventDefault(); // Evitar click si aún escapa
            moveButton(btnYes2);
        }
    });
}

/* FUNCIONES DE REGALOS */
function openGift(element, index) {
    if (element.classList.contains('open')) return;

    element.classList.add('open');
    const contentDiv = element.querySelector('.gift-content');
    contentDiv.innerText = CONFIG.gifts[index];
}

/* CONFETI */
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
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
