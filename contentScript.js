// contentScript.js - Metodika Extension v2.3 con registro automático de token
const N8N_WEBHOOK_URL = "https://ggpacheco.app.n8n.cloud/webhook/metodika/emotion";
const METODICA_BACKEND_URL = "http://localhost:8000"; // Cambiar a tu URL de producción

let canvasUserId = null;
let canvasUserName = null;
let canvasUserEmail = null;
let canvasToken = null;
let isMinimized = false;
let isRegistered = false;

/**
 * Extrae el token de Canvas de las cookies o localStorage
 */
function extractCanvasToken() {
  try {
    // Método 1: Intentar obtener de cookies
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'canvas_token' || name === '_csrf_token') {
        return value;
      }
    }

    // Método 2: Intentar obtener del localStorage
    const localToken = localStorage.getItem('canvas_token');
    if (localToken) {
      return localToken;
    }

    // Método 3: Buscar en sessionStorage
    const sessionToken = sessionStorage.getItem('canvas_token');
    if (sessionToken) {
      return sessionToken;
    }

    console.warn("⚠️ No se pudo extraer el token de Canvas automáticamente");
    return null;
  } catch (err) {
    console.error("❌ Error extrayendo token:", err);
    return null;
  }
}

/**
 * Registra el token en el backend de Metodica
 */
async function registerTokenInBackend() {
  if (!canvasUserId || isRegistered) {
    return;
  }

  const token = extractCanvasToken();
  
  const payload = {
    canvas_user_id: canvasUserId,
    canvas_token: token || "auto-extracted-token",
    name: canvasUserName,
    email: canvasUserEmail
  };

  try {
    const response = await fetch(`${METODICA_BACKEND_URL}/api/student/register-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Token registrado en Metodica:", data);
    isRegistered = true;
    
    if (data.is_new_student) {
      showNotification("✅ Bienvenido a Metodica! Perfil creado", "success");
    } else {
      showNotification("✅ Conectado a Metodica", "success");
    }
  } catch (err) {
    console.error("❌ Error registrando token en backend:", err);
    // No mostrar error al usuario si es problema de conexión con backend local
  }
}

/**
 * Carga la librería de Lottie Web Component una sola vez
 */
function loadLottieLibrary() {
  if (document.getElementById("dotlottie-loader")) return;

  const script = document.createElement("script");
  script.id = "dotlottie-loader";
  script.src = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.8.5/dist/dotlottie-wc.js";
  script.type = "module";
  document.head.appendChild(script);
}

// Obtener datos del usuario de Canvas
async function fetchCanvasUser() {
  try {
    const res = await fetch("/api/v1/users/self/profile");
    if (!res.ok) {
      console.error("Error al obtener perfil de Canvas:", res.status);
      return null;
    }

    const data = await res.json();
    console.log("✅ Canvas user identificado:", data);

    canvasUserId = data.id;
    canvasUserName = data.name || data.short_name || "Estudiante";
    canvasUserEmail = data.primary_email || data.login_id || null;

    // Registrar automáticamente en el backend de Metodica
    await registerTokenInBackend();

    return data;
  } catch (err) {
    console.error("❌ Error de red al llamar Canvas:", err);
    return null;
  }
}

// Enviar emoción al webhook
function sendEmotion(emotion, emoji) {
  if (!canvasUserId) {
    showNotification("⚠️ No se pudo identificar tu usuario de Canvas", "error");
    return;
  }

  const payload = {
    student_id: canvasUserId.toString(),
    canvas_user_id: canvasUserId,
    emotion,
    source: "extension",
    timestamp: new Date().toISOString(),
  };

  disableButtons(true);
  showNotification("Enviando...", "loading");

  fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((r) => r.json())
    .then((data) => {
      console.log("✅ Emoción enviada:", data);
      showNotification(`${emoji} Registrado correctamente`, "success");
      highlightAvatar(); // pequeño efecto en el Lottie
    })
    .catch((err) => {
      console.error("❌ Error enviando emoción:", err);
      showNotification("❌ Error al enviar. Intenta de nuevo.", "error");
    })
    .finally(() => {
      disableButtons(false);
    });
}

// Deshabilitar/habilitar botones
function disableButtons(disabled) {
  const buttons = document.querySelectorAll(".metodika-emotion-btn");
  buttons.forEach((btn) => {
    btn.disabled = disabled;
    btn.style.opacity = disabled ? "0.5" : "1";
    btn.style.cursor = disabled ? "not-allowed" : "pointer";
  });
}

// Pequeño glow en el avatar cuando todo va bien
function highlightAvatar() {
  const avatarWrapper = document.getElementById("metodika-avatar-wrapper");
  if (!avatarWrapper) return;

  avatarWrapper.style.boxShadow = "0 0 20px rgba(255,255,255,0.9)";
  avatarWrapper.style.transform = "scale(1.05)";

  setTimeout(() => {
    avatarWrapper.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
    avatarWrapper.style.transform = "scale(1)";
  }, 700);
}

// Mostrar notificación temporal
function showNotification(message, type = "info") {
  const notification = document.getElementById("metodika-notification");
  if (!notification) return;

  const colors = {
    success: "#22c55e",
    error: "#f97373",
    loading: "#3b82f6",
    info: "#6b7280",
  };

  notification.textContent = message;
  notification.style.background = colors[type] || colors.info;
  notification.style.display = "flex";

  if (type !== "loading") {
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }
}

// Toggle minimizar/expandir
function toggleMinimize() {
  const content = document.getElementById("metodika-content");
  const toggleBtn = document.getElementById("metodika-toggle");

  isMinimized = !isMinimized;

  if (isMinimized) {
    content.style.display = "none";
    toggleBtn.textContent = "📊";
    toggleBtn.title = "Expandir Metodika";
  } else {
    content.style.display = "block";
    toggleBtn.textContent = "−";
    toggleBtn.title = "Minimizar";
  }
}

// Crear interfaz mejorada (Lottie grande + diseño más interactivo)
function injectUI() {
  loadLottieLibrary(); // cargamos la librería antes

  const container = document.createElement("div");
  container.id = "metodika-widget";
  container.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: linear-gradient(145deg, #0f172a 0%, #1d4ed8 40%, #7c3aed 100%);
    border-radius: 20px;
    box-shadow: 0 18px 50px rgba(15,23,42,0.6);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    min-width: 360px;
    max-width: 380px;
    color: white;
    overflow: hidden;
    backdrop-filter: blur(10px);
    transform: translateY(0);
    transition: transform 0.2s ease-out;
  `;

  container.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      padding: 14px 16px 10px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.12);
      background: radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent);
    ">
      <div id="metodika-avatar-wrapper" style="
        width: 80px;
        height: 80px;
        border-radius: 24px;
        overflow: hidden;
        background: radial-gradient(circle at 30% 20%, #facc15, #f97316);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        box-shadow: 0 8px 20px rgba(15,23,42,0.6);
        transition: all 0.25s ease-out;
      ">
        <dotlottie-wc
          src="https://lottie.host/c25cd636-fa2a-4d19-8876-f52c69293ad6/O0lPvi31GW.lottie"
          style="width: 72px; height: 72px;"
          autoplay
          loop
        ></dotlottie-wc>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span id="metodika-title" style="font-weight: 600; font-size: 15px;">
            Cargando Metodika...
          </span>
          <button id="metodika-toggle" style="
            background: rgba(15,23,42,0.7);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 999px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          " title="Minimizar">−</button>
        </div>
        <span style="font-size: 12px; opacity: 0.8;">
          Tu asistente emocional dentro de Canvas 💬
        </span>
      </div>
    </div>

    <div id="metodika-content" style="padding: 14px 16px 16px 16px;">
      <p style="
        margin: 0 0 10px 0;
        font-size: 13px;
        opacity: 0.9;
      ">
        ¿Cómo te sientes ahora? Selecciona un estado para que tu tutor pueda ayudarte mejor.
      </p>

      <div style="
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 12px;
      ">
        <button class="metodika-emotion-btn" data-emotion="happy" data-emoji="😊" style="
          background: rgba(22,163,74,0.25);
          border: 1px solid rgba(34,197,94,0.8);
          color: white;
          padding: 10px 8px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 22px;
          transition: all 0.18s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        ">
          <span>😊</span>
          <span style="font-size: 11px;">Feliz</span>
        </button>

        <button class="metodika-emotion-btn" data-emotion="neutral" data-emoji="😐" style="
          background: rgba(148,163,184,0.25);
          border: 1px solid rgba(148,163,184,0.8);
          color: white;
          padding: 10px 8px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 22px;
          transition: all 0.18s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        ">
          <span>😐</span>
          <span style="font-size: 11px;">Normal</span>
        </button>

        <button class="metodika-emotion-btn" data-emotion="stressed" data-emoji="😰" style="
          background: rgba(59,130,246,0.2);
          border: 1px solid rgba(59,130,246,0.85);
          color: white;
          padding: 10px 8px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 22px;
          transition: all 0.18s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        ">
          <span>😰</span>
          <span style="font-size: 11px;">Estresado</span>
        </button>

        <button class="metodika-emotion-btn" data-emotion="sad" data-emoji="😢" style="
          background: rgba(59,130,246,0.18);
          border: 1px solid rgba(96,165,250,0.8);
          color: white;
          padding: 10px 8px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 22px;
          transition: all 0.18s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        ">
          <span>😢</span>
          <span style="font-size: 11px;">Triste</span>
        </button>

        <button class="metodika-emotion-btn" data-emotion="anxious" data-emoji="😟" style="
          background: rgba(234,179,8,0.22);
          border: 1px solid rgba(250,204,21,0.9);
          color: white;
          padding: 10px 8px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 22px;
          transition: all 0.18s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        ">
          <span>😟</span>
          <span style="font-size: 11px;">Ansioso</span>
        </button>

        <button class="metodika-emotion-btn" data-emotion="angry" data-emoji="😤" style="
          background: rgba(239,68,68,0.25);
          border: 1px solid rgba(248,113,113,0.95);
          color: white;
          padding: 10px 8px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 22px;
          transition: all 0.18s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        ">
          <span>😤</span>
          <span style="font-size: 11px;">Molesto</span>
        </button>
      </div>

      <div id="metodika-notification" style="
        display: none;
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        text-align: center;
        justify-content: center;
        align-items: center;
        gap: 6px;
      "></div>
    </div>
  `;

  document.body.appendChild(container);

  // Animación sutil al pasar el mouse por todo el widget
  container.addEventListener("mouseenter", () => {
    container.style.transform = "translateY(-3px)";
  });
  container.addEventListener("mouseleave", () => {
    container.style.transform = "translateY(0)";
  });

  // Event listeners
  document.getElementById("metodika-toggle").addEventListener("click", toggleMinimize);

  document.querySelectorAll(".metodika-emotion-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const emotion = this.getAttribute("data-emotion");
      const emoji = this.getAttribute("data-emoji");
      sendEmotion(emotion, emoji);
    });

    btn.addEventListener("mouseenter", function () {
      if (!this.disabled) {
        this.style.transform = "translateY(-2px) scale(1.03)";
        this.style.boxShadow = "0 8px 18px rgba(15,23,42,0.55)";
      }
    });

    btn.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)";
      this.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
    });
  });
}

// Inicializar extensión
async function initMetodikaExtension() {
  console.log("🚀 Iniciando Metodika Extension v2.3 (con registro automático)");

  injectUI();

  const titleEl = document.getElementById("metodika-title");

  const profile = await fetchCanvasUser();
  if (profile) {
    const nombre = canvasUserName || "Estudiante";
    if (titleEl) {
      titleEl.textContent = `Hola, ${nombre}`;
    }
  } else {
    if (titleEl) {
      titleEl.textContent = "Error de conexión";
    }
    showNotification("⚠️ No se pudo conectar con Canvas", "error");
  }
}

// Ejecutar al cargar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMetodikaExtension);
} else {
  initMetodikaExtension();
}
