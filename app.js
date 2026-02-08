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

/* FUNCIONES DE BOTONES ESCAPISTAS */
/* FUNCIONES DE BOTONES ESCAPISTAS */
function getActiveButtonsContainer(btn) {
    // Busca el contenedor de botones dentro de la pantalla donde está el botón
    const screen = btn.closest('.screen');
    if (!screen) return null;
    return screen.querySelector('.buttons-container');
}

function moveButton(btn) {
    const container = getActiveButtonsContainer(btn);
    if (!container) return;

    // Asegura posicionamiento relativo en contenedor (por si acaso)
    container.style.position = container.style.position || 'relative';

    const margin = 12;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Medidas reales del botón
    const bw = btn.offsetWidth;
    const bh = btn.offsetHeight;

    // Si el contenedor es muy pequeño, no mover
    if (cw < bw + margin * 2 || ch < bh + margin * 2) return;

    const maxX = cw - bw - margin;
    const maxY = ch - bh - margin;

    const newX = Math.random() * (maxX - margin) + margin;
    const newY = Math.random() * (maxY - margin) + margin;

    // 🔥 IMPORTANTE: ahora el botón es absolute dentro del contenedor
    btn.classList.add('btn-escape');
    btn.style.left = `${newX}px`;
    btn.style.top = `${newY}px`;
}

function initButtons() {
    // PANTALLA 1: Botón NO se escapa
    const btnNo1 = document.getElementById('btn-n1');
    const escapeHandler1 = (e) => {
        moveButton(btnNo1);
    };
    btnNo1.addEventListener('mouseenter', escapeHandler1);
    btnNo1.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Evitar click
        escapeHandler1(e);
    });
    btnNo1.addEventListener('click', (e) => {
        e.preventDefault();
        moveButton(btnNo1); // Por si acaso
    });

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
            btnYes2.classList.remove('btn-escape');
            btnYes2.style.left = '';
            btnYes2.style.top = '';
            btnYes2.innerText = CONFIG.messages.screen2Funny;
            // Quitamos listeners para que sea clicable
            btnYes2.removeEventListener('mouseenter', escapeHandler2);
        } else {
            moveButton(btnYes2);
        }
    };

    btnYes2.addEventListener('mouseenter', escapeHandler2);
    // Para móvil usamos un truco: al intentar tocar, se mueve. 
    // Pero si ya se puede clickar, permitimos el click.
    btnYes2.addEventListener('touchstart', (e) => {
        if (!state.canClickScreen2Yes) {
            e.preventDefault();
            escapeHandler2(e);
        }
    });

    btnYes2.addEventListener('click', () => {
        if (state.canClickScreen2Yes) {
            goToScreen(3);
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
