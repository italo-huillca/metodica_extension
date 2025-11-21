# METODICA_EXTENSION

## 1. Contexto general
Este módulo implementa la experiencia del estudiante dentro de Canvas LMS. Aquí se capturan:

- Estado emocional.
- Interacciones relevantes dentro del curso.
- Conversaciones con el avatar.
- Señales de frustración, tristeza o desmotivación.
- Eventos que influyen en riesgo: no abrir tareas, no enviar entregas, etc.

La extensión envía toda esta información al backend para contribuir al análisis central.

---

## 2. Contexto específico del proyecto (metodica_extension)
Esta extensión de Chrome agrega:

- Un panel lateral con el avatar conversacional.  
- Un conjunto de avatares/íconos para registrar emoción.  
- Scripts que detectan actividad dentro de Canvas:
  - Tiempo en página.
  - Apertura de tareas.
  - Entradas a módulos.
  - Fechas cercanas a exámenes o entregas.
- Envío de estos datos al backend en tiempo real o cada cierto intervalo.

El objetivo es convertir el entorno Canvas del estudiante en un sensor activo del sistema Metódica.

---

## 3. TODO — Lista de tareas

### 🟦 Setup
- [ ] Crear Chrome Extension con manifest v3.
- [ ] Content script para Canvas.
- [ ] Background service worker.
- [ ] UI básica en HTML/CSS para el panel.
- [ ] Configurar Canvas LMS API token (almacenado de forma segura).
- [ ] Crear cliente API para comunicación con Canvas LMS.

### 🟩 Inyección del avatar
- [ ] Insertar componente flotante dentro de Canvas.
- [ ] Crear chat ligero (frontend básico interno).
- [ ] Enviar mensajes al backend.
- [ ] Registrar emociones detectadas del texto.

### 🟧 Panel emocional
- [ ] Mostrar mini-avatares emocionales.
- [ ] Registrar emoción seleccionada.
- [ ] Enviar emoción al backend.

### 🟥 Captura de comportamiento y sincronización con Canvas LMS API
- [ ] Obtener tareas del estudiante mediante Canvas LMS API.
- [ ] Obtener entregas y deadlines mediante Canvas LMS API.
- [ ] Sincronizar calificaciones desde Canvas LMS API.
- [ ] Detectar sesiones largas sin actividad (eventos del navegador).
- [ ] Detectar navegación por módulos de Canvas.
- [ ] Registrar eventos de preparación antes de exámenes.
- [ ] Enviar datos sincronizados al backend.

### 🟦 Integración API
- [ ] Enviar emociones.
- [ ] Enviar mensajes del chat.
- [ ] Enviar actividad.
- [ ] Identificar estudiante (ID Canvas).

### 🟨 Optimización
- [ ] Minimizar interferencia visual.
- [ ] Activar/desactivar panel fácilmente.
- [ ] Manejo de errores y reconexión.
