/* =========================
   CONFIGURACIÓN
========================= */
const CONFIG = {
    // Pantalla 2: intentos antes de que el botón "Sí" se deje pulsar
    screen2Attempts: 8,

    // Textos graciosos al escapar
    escapeTextsScreen1: ["No 😅", "¿Seguro? 😳", "Nop 🤭", "Inténtalo 😈", "Casi… 😂", "Uy 😏"],
    escapeTextsScreen2: ["Sí 😏", "Píllame 😳", "No tan rápido 😈", "Casi 😅", "Última 😜", "Ok ok… 🙈"],

    // Mensajitos pequeños (debajo)
    tinyMessages: ["Uy 😳", "Casi me pillas 😅", "No tan rápido 😈", "JA 😏", "Otra vez 🤭"],

    // Regalos normales (NO carta). Índices 1..3
    normalGifts: [
        { title: "Regalo 2 💝", message: "Vale por un día de Spa 🧖‍♀️" },
        { title: "Regalo 3 💝", message: "Vale por besos infinitos 💋" },
        { title: "Regalo 4 💝", message: "Vale por un Plan Secreto 🤫" }
    ],

    // Regalo 0: CARTA
    letterGift: {
        title: "Para ti, Annetxus 💌",
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
    }
};

/* =========================
   ESTADO
========================= */
const state = {
    screen2Count: 0,
    screen2CanClickYes: false,

    // escape text index por botón
    escapeTextIndex: {
        "btn-n1": 0,
        "btn-y2": 0
    },

    // Para saltos grandes
    lastPos: {
        "btn-n1": null,
        "btn-y2": null
    },

    // Regalos
    gift: {
        openIndex: null,        // cuál está abierto
        letterRevealed: false,  // si ya se pulsó "Ver texto"
        overlayOpen: false      // mientras la carta está abierta
    }
};

/* =========================
   UTILIDADES UI
========================= */
function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
}

function showTinyMessage(screenNum) {
    const el = document.getElementById(`tiny-msg-${screenNum}`);
    if (!el) return;
    const msg = CONFIG.tinyMessages[Math.floor(Math.random() * CONFIG.tinyMessages.length)];
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 800);
}

function goToScreen(num) {
    resetEscapingButtons();
    closeLetterOverlay(true); // por si acaso

    document.querySelectorAll(".screen").forEach(s => {
        s.classList.remove("active");
        s.classList.add("hidden");
    });

    const target = document.getElementById(`screen-${num}`);
    target.classList.remove("hidden");
    target.classList.add("active");
}

/* =========================
   ESCAPE LAYER (botones que huyen)
========================= */
function ensureEscapeLayer() {
    const layer = document.getElementById("escape-layer");
    if (!layer) {
        const div = document.createElement("div");
        div.id = "escape-layer";
        div.setAttribute("aria-hidden", "true");
        document.body.appendChild(div);
    }
    return document.getElementById("escape-layer");
}

function moveButtonInViewport(btn) {
    const margin = 20;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const bw = btn.offsetWidth || 120;
    const bh = btn.offsetHeight || 46;

    const maxX = Math.max(margin, w - bw - margin);
    const maxY = Math.max(margin, h - bh - margin);

    const minDist = isMobile() ? 170 : 240;

    let x, y;
    let tries = 0;

    const last = state.lastPos[btn.id];

    do {
        x = margin + Math.random() * (maxX - margin);
        y = margin + Math.random() * (maxY - margin);

        tries++;
        if (!last) break;

        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= minDist) break;
    } while (tries < 14);

    state.lastPos[btn.id] = { x, y };

    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
}

function updateEscapeText(btn, screenNum) {
    const arr = (screenNum === 1) ? CONFIG.escapeTextsScreen1 : CONFIG.escapeTextsScreen2;
    const idx = state.escapeTextIndex[btn.id] ?? 0;
    btn.textContent = arr[idx % arr.length];
    state.escapeTextIndex[btn.id] = idx + 1;
}

function shake(btn) {
    btn.animate(
        [
            { transform: "translateX(0)" },
            { transform: "translateX(-6px)" },
            { transform: "translateX(6px)" },
            { transform: "translateX(-4px)" },
            { transform: "translateX(4px)" },
            { transform: "translateX(0)" }
        ],
        { duration: 140, iterations: 1 }
    );
}

function moveToEscapeLayer(btn) {
    const layer = ensureEscapeLayer();
    if (btn.parentElement !== layer) {
        layer.appendChild(btn);
    }
    btn.classList.add("btn-escape");
    btn.style.position = "fixed";
    btn.style.pointerEvents = "auto";
}

function resetEscapingButtons() {
    // Por si se queda algún botón en escape-layer
    const layer = ensureEscapeLayer();
    const btnN1 = document.getElementById("btn-n1");
    const btnY2 = document.getElementById("btn-y2");

    // devolvemos a sus containers si procede
    const c1 = document.querySelector("#screen-1 .buttons-container");
    const c2 = document.querySelector("#screen-2 .buttons-container");

    if (btnN1 && c1 && btnN1.parentElement === layer) {
        c1.appendChild(btnN1);
        btnN1.classList.remove("btn-escape");
        btnN1.style.position = "";
        btnN1.style.left = "";
        btnN1.style.top = "";
    }
    if (btnY2 && c2 && btnY2.parentElement === layer) {
        c2.appendChild(btnY2);
        btnY2.classList.remove("btn-escape");
        btnY2.style.position = "";
        btnY2.style.left = "";
        btnY2.style.top = "";
    }

    // limpieza visual
    while (layer.firstChild) layer.removeChild(layer.firstChild);
}

/* =========================
   REGALOS (bloqueo + carta)
========================= */
function setGiftLocks(locked) {
    document.querySelectorAll(".gift-box").forEach(box => {
        const idx = Number(box.dataset.index);
        if (locked && idx !== 0) box.classList.add("gift-disabled");
        else box.classList.remove("gift-disabled");
    });
}

function openGift(box, index) {
    // bloqueo si la carta (0) está abierta y aún no se ha revelado
    if (state.gift.openIndex === 0 && !state.gift.letterRevealed && index !== 0) {
        return;
    }
    // bloqueo mientras overlay abierto
    if (state.gift.overlayOpen) return;

    if (box.classList.contains("open")) return;

    box.classList.add("open");
    state.gift.openIndex = index;

    const content = box.querySelector(".gift-content");
    content.innerHTML = "";

    if (index === 0) {
        // preview + botón
        const wrap = document.createElement("div");
        wrap.className = "gift-preview";

        const title = document.createElement("div");
        title.className = "gift-preview-title";
        title.textContent = "Tu cartita 💌";

        const btn = document.createElement("button");
        btn.className = "btn btn-yes gift-preview-btn";
        btn.type = "button";
        btn.textContent = CONFIG.letterGift.buttonLabel;
        btn.setAttribute("data-action", "open-letter");

        wrap.appendChild(title);
        wrap.appendChild(btn);
        content.appendChild(wrap);

        // bloquear otros hasta revelar
        setGiftLocks(true);
    } else {
        // Regalos normales: index 1..3 -> normalGifts[ index-1 ]
        const g = CONFIG.normalGifts[index - 1];
        const note = document.createElement("div");
        note.className = "gift-note";

        const t = document.createElement("div");
        t.className = "gift-note-title";
        t.textContent = g.title;

        const m = document.createElement("div");
        m.className = "gift-note-message";
        m.textContent = g.message;

        note.appendChild(t);
        note.appendChild(m);
        content.appendChild(note);
    }
}

/* =========================
   OVERLAY CARTA (sobre que se abre)
========================= */
function openLetterOverlay() {
    const overlay = document.getElementById("letter-overlay");
    const envelope = document.getElementById("envelope");
    const titleEl = document.getElementById("letter-title");
    const bodyEl = document.getElementById("letter-body");
    const imgEl = document.getElementById("letter-img");

    titleEl.textContent = CONFIG.letterGift.title;
    bodyEl.textContent = CONFIG.letterGift.message;

    // imagen opcional
    if (CONFIG.letterGift.image) {
        imgEl.src = CONFIG.letterGift.image;
        imgEl.style.display = "block";
        imgEl.onerror = () => { imgEl.style.display = "none"; };
    } else {
        imgEl.style.display = "none";
    }

    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    state.gift.overlayOpen = true;
    state.gift.letterRevealed = true; // ya pulsó "Ver texto"

    // Reinicia animación
    envelope.classList.remove("open");
    void envelope.offsetWidth; // reflow
    setTimeout(() => envelope.classList.add("open"), 120);
}

function closeLetterOverlay(silent = false) {
    const overlay = document.getElementById("letter-overlay");
    if (!overlay || overlay.classList.contains("hidden")) return;

    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    state.gift.overlayOpen = false;

    // desbloquea otros regalos cuando ya se reveló
    if (state.gift.letterRevealed) setGiftLocks(false);

    if (!silent) {
        // nada extra
    }
}

/* =========================
   INICIALIZAR
========================= */
function initHearts() {
    const container = document.getElementById("bg-hearts");
    const heartCount = 16;
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement("div");
        heart.className = "heart";
        heart.textContent = "❤";
        heart.style.left = Math.random() * 100 + "vw";
        heart.style.fontSize = (Math.random() * 18 + 18) + "px";
        heart.style.animationDuration = (Math.random() * 5 + 6) + "s";
        heart.style.animationDelay = (Math.random() * 5) + "s";
        container.appendChild(heart);
    }
}

function initButtons() {
    const btnY1 = document.getElementById("btn-y1");
    const btnN1 = document.getElementById("btn-n1");
    const btnY2 = document.getElementById("btn-y2");
    const btnN2 = document.getElementById("btn-n2");

    // SÍ pantalla 1
    btnY1.addEventListener("click", () => goToScreen(2));

    // NO pantalla 1 escapa
    const escapeN1 = (e) => {
        e.preventDefault?.();
        moveToEscapeLayer(btnN1);
        shake(btnN1);
        updateEscapeText(btnN1, 1);
        moveButtonInViewport(btnN1);
        showTinyMessage(1);
        if (navigator.vibrate) navigator.vibrate(20);
    };

    btnN1.addEventListener("mouseenter", escapeN1);
    btnN1.addEventListener("touchstart", (e) => { e.preventDefault(); escapeN1(e); }, { passive: false });
    btnN1.addEventListener("click", (e) => { e.preventDefault(); escapeN1(e); });

    // Pantalla 2: NO muestra mensaje
    btnN2.addEventListener("click", () => {
        alert("No acepto esa respuesta 😌");
    });

    // Pantalla 2: SÍ escapa hasta intentos
    const escapeY2 = (e) => {
        if (state.screen2CanClickYes) return;

        e.preventDefault?.();
        state.screen2Count++;

        if (state.screen2Count >= CONFIG.screen2Attempts) {
            state.screen2CanClickYes = true;

            // devolver botón al contenedor normal
            const cont = document.querySelector("#screen-2 .buttons-container");
            cont.appendChild(btnY2);

            btnY2.classList.remove("btn-escape");
            btnY2.style.position = "";
            btnY2.style.left = "";
            btnY2.style.top = "";
            btnY2.textContent = "Vale, vale… 😌";

            showTinyMessage(2);
            return;
        }

        moveToEscapeLayer(btnY2);
        shake(btnY2);
        updateEscapeText(btnY2, 2);
        moveButtonInViewport(btnY2);
        showTinyMessage(2);
        if (navigator.vibrate) navigator.vibrate(20);
    };

    btnY2.addEventListener("mouseenter", escapeY2);
    btnY2.addEventListener("touchstart", (e) => {
        if (!state.screen2CanClickYes) {
            e.preventDefault();
            escapeY2(e);
        }
    }, { passive: false });

    btnY2.addEventListener("click", () => {
        if (state.screen2CanClickYes) goToScreen(3);
    });
}

function initGifts() {
    document.querySelectorAll(".gift-box").forEach(box => {
        const idx = Number(box.dataset.index);

        box.addEventListener("click", () => openGift(box, idx));
        box.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openGift(box, idx);
            }
        });
    });

    // Delegación para "Ver texto"
    document.addEventListener("click", (e) => {
        const openBtn = e.target.closest('[data-action="open-letter"]');
        if (openBtn) {
            openLetterOverlay();
            return;
        }

        const closeBtn = e.target.closest('[data-action="close-letter"]');
        if (closeBtn) {
            closeLetterOverlay();
            return;
        }
    });

    // ESC para cerrar overlay
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeLetterOverlay();
    });
}

// Start
window.addEventListener("load", () => {
    initHearts();
    initButtons();
    initGifts();
});