# Sistema de Registro Automático de Token Canvas

## 🎯 Problema Resuelto

Anteriormente, cada estudiante tenía que:
1. Ir al frontend de Metodica
2. Copiar manualmente su token de Canvas
3. Pegarlo en el sistema

**Problema:** El token de Canvas cambia frecuentemente, obligando al estudiante a repetir este proceso.

## ✅ Solución Implementada

La extensión de Chrome ahora registra automáticamente al estudiante en el backend cuando accede a Canvas.

### Flujo Automático

```
1. Estudiante accede a Canvas LMS
   ↓
2. Extension se carga en la página
   ↓
3. Extension obtiene:
   - canvas_user_id (permanente)
   - canvas_token (temporal)
   - nombre y email del estudiante
   ↓
4. Extension envía datos a: POST /api/student/register-token
   ↓
5. Backend:
   - Si es estudiante nuevo: lo crea con datos mínimos
   - Si ya existe: actualiza solo el token
   ↓
6. Estudiante queda registrado automáticamente
```

## 🔧 Componentes Modificados

### Backend (`metodica_backend`)

#### 1. Modelo de Datos (`app/models/schemas.py`)
```python
class Student(BaseModel):
    # ... campos existentes ...
    canvas_user_id: Optional[int] = None  # ID permanente de Canvas
    canvas_token: Optional[str] = None    # Token temporal (cambia frecuentemente)
    last_token_update: Optional[str] = None

class TokenRegistration(BaseModel):
    canvas_user_id: int
    canvas_token: str
    name: Optional[str] = None
    email: Optional[str] = None
```

#### 2. Servicio de Datos (`app/services/data_service.py`)
- Método `register_or_update_token()`: crea o actualiza estudiante con token

#### 3. API Endpoint (`app/api/student.py`)
```python
POST /api/student/register-token
{
  "canvas_user_id": 12345,
  "canvas_token": "abc123...",
  "name": "Juan Pérez",
  "email": "juan@tecsup.edu.pe"
}
```

#### 4. CORS (`main.py`)
- Configurado para aceptar peticiones desde `chrome-extension://`

### Extension (`metodica_extension`)

#### Archivo: `contentScript.js`

**Nuevas funciones:**

1. `extractCanvasToken()`: Intenta extraer el token de Canvas de cookies/localStorage
2. `registerTokenInBackend()`: Envía los datos al backend automáticamente
3. `fetchCanvasUser()`: Modificado para incluir el registro automático

**Variables nuevas:**
```javascript
const METODICA_BACKEND_URL = "http://localhost:8000"; // Cambiar en producción
let canvasUserEmail = null;
let isRegistered = false;
```

## 🚀 Cómo Usar

### Configuración

1. **Backend:**
   - El backend debe estar corriendo en el puerto 8000 (o actualizar URL en la extensión)
   - CORS configurado para aceptar extensiones de Chrome

2. **Extension:**
   - Actualizar `METODICA_BACKEND_URL` en `contentScript.js` con la URL del backend en producción

### Para el Estudiante

1. Instalar la extensión de Chrome
2. Acceder a Canvas normalmente
3. **¡Eso es todo!** El registro es automático

La extensión:
- Mostrará "✅ Bienvenido a Metodica! Perfil creado" (primera vez)
- O "✅ Conectado a Metodica" (visitas posteriores)

## 🔑 Identificación Permanente

El sistema usa `canvas_user_id` como identificador permanente:

- **canvas_user_id**: No cambia, identifica al estudiante de forma única
- **canvas_token**: Cambia frecuentemente, se actualiza automáticamente cada vez

### En la Base de Datos (simulada)

```json
{
  "student_id": "12345",           // Mismo que canvas_user_id
  "name": "Juan Pérez",
  "canvas_user_id": 12345,         // 🔑 Identificador permanente
  "canvas_token": "abc123...",     // 🔄 Se actualiza automáticamente
  "last_token_update": "2025-11-28T10:30:00Z"
}
```

## 📊 Endpoint de Emociones

El endpoint `/api/student/emotion` ya estaba preparado para trabajar con `canvas_user_id`:

```python
# La extensión envía:
{
  "canvas_user_id": 12345,
  "emotion": "happy",
  "source": "extension"
}

# El backend busca al estudiante por canvas_user_id
student = data_service.get_student_by_canvas_id(canvas_user_id)
```

## 🎨 Frontend (Opcional)

El frontend ya no necesita que el estudiante ingrese su token manualmente, pero puede:

1. Mostrar el estado de conexión del estudiante
2. Permitir actualizar datos adicionales (especialidad, periodo, etc.)
3. Sincronizar con Canvas API usando el token almacenado

## 🔒 Seguridad

**Consideraciones:**

1. El token se envía desde la extensión al backend de forma directa
2. CORS configurado para solo aceptar extensiones legítimas
3. En producción, considerar:
   - HTTPS obligatorio
   - Validación adicional de origen
   - Encriptación de tokens en la DB

## 🧪 Testing

Para probar el sistema:

```bash
# 1. Iniciar backend
cd metodica_backend
python main.py

# 2. Cargar extensión en Chrome
# - Ir a chrome://extensions/
# - Activar "Modo de desarrollador"
# - "Cargar extensión sin empaquetar"
# - Seleccionar carpeta metodica_extension/

# 3. Visitar Canvas
# https://tecsup.instructure.com/

# 4. Ver consola de Chrome (F12)
# Deberías ver:
# ✅ Canvas user identificado: {...}
# ✅ Token registrado en Metodica: {...}
```

## 📝 Notas de Desarrollo

- La extensión intenta extraer el token de Canvas, pero Canvas no siempre lo expone fácilmente
- Como fallback, enviamos "auto-extracted-token" que puede ser actualizado manualmente más tarde
- El `canvas_user_id` es lo más importante, ya que identifica de forma permanente al estudiante
