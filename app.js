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
function moveButton(btn) {
    const container = btn.closest('.buttons-container');
    if (!container) return;

    // Asegurar position absolute
    if (getComputedStyle(btn).position !== 'absolute') {
        btn.style.position = 'absolute';
    }

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const bw = btn.offsetWidth;
    const bh = btn.offsetHeight;
    const margin = 8;

    // Calcular límites
    const maxLeft = cw - bw - margin;
    const maxTop = ch - bh - margin;

    // Generar posiciones
    let newLeft = margin + Math.random() * (maxLeft - margin);
    let newTop = margin + Math.random() * (maxTop - margin);

    // Clamp escrito (seguridad)
    // newLeft debe ser >= margin y <= maxLeft
    newLeft = Math.min(Math.max(newLeft, margin), maxLeft);
    newTop = Math.min(Math.max(newTop, margin), maxTop);

    btn.style.left = `${newLeft}px`;
    btn.style.top = `${newTop}px`;

    // Failsafe pedido: verificar numéricamente
    const currentLeft = parseFloat(btn.style.left);
    const currentTop = parseFloat(btn.style.top);

    if (currentLeft < 0 || currentLeft > maxLeft || currentTop < 0 || currentTop > maxTop) {
        // Centrar si falla
        btn.style.left = `${(cw - bw) / 2}px`;
        btn.style.top = `${(ch - bh) / 2}px`;
    }
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

            // RESET COMPLETAMENTE AL FLUJO NORMAL
            btnYes2.style.position = '';
            btnYes2.style.left = '';
            btnYes2.style.top = '';

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
