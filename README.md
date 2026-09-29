# 🎮 Escape Room API - Documentación Completa

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Instalación](#instalación)
3. [Uso Rápido](#uso-rápido)
4. [Endpoints](#endpoints)
5. [Integración HTML](#integración-html)
6. [Integración con otra API](#integración-con-otra-api)
7. [Ejemplos](#ejemplos)

---

## 📖 Descripción General

**Escape Room API** es un servidor Node.js + Express diseñado para:

- ✅ Gestionar el estado de 4 desafíos en tiempo real
- ✅ Sincronizar múltiples aplicaciones (HTML, API externa, etc.)
- ✅ Proporcionar endpoints REST para control remoto
- ✅ Incluir un servidor Mock para pruebas sin API externa

### Componentes

| Componente | Puerto | Propósito |
|------------|--------|----------|
| **API Principal** | 3001 | Servidor central de sincronización |
| **Mock Server** | 3002 | Emulación de otra API (para pruebas) |
| **Tu otra API** | 3003 | Tu API real (por conectar) |

---

## 🚀 Instalación

### Requisitos
- Node.js v14+ 
- npm o yarn

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/axelminor24/escape-room-api.git
cd escape-room-api

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env (si no existe)
cp .env.example .env  # O editar manualmente

# 4. Iniciar el servidor principal
npm start

# 5. En otra terminal, iniciar el mock server (opcional, para pruebas)
npm run mock
```

### Contenido de .env
```
PORT=3001
NODE_ENV=development
CHALLENGE_API_URL=http://localhost:3002
ANOTHER_API_URL=http://localhost:3003
MOCK_PORT=3002
```

---

## ⚡ Uso Rápido

### Terminal 1: Servidor Principal
```bash
npm start
# Escucha en http://localhost:3001
```

### Terminal 2: Servidor Mock (Pruebas)
```bash
npm run mock
# Escucha en http://localhost:3002
```

### Terminal 3: Prueba de Endpoints
```bash
# Ver estado actual
curl http://localhost:3001/api/status

# Completar desafío 1
curl -X POST http://localhost:3001/api/challenge/1/complete \
  -H "Content-Type: application/json" \
  -d '{"source":"test"}'

# Iniciar juego
curl -X POST http://localhost:3001/api/game/start
```

---

## 📡 Endpoints

### 📊 Información del Estado

#### `GET /api/status`
Obtiene el estado completo del juego

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "isRunning": false,
    "challenges": {
      "1": { "completed": false, "timestamp": null, "source": "unknown" },
      "2": { "completed": false, "timestamp": null, "source": "unknown" },
      "3": { "completed": false, "timestamp": null, "source": "unknown" },
      "4": { "completed": false, "timestamp": null, "source": "unknown" }
    },
    "gameStatus": "IDLE",
    "startTime": null,
    "elapsedTime": 0,
    "lastUpdate": "2026-09-29T00:00:00.000Z"
  },
  "timestamp": "2026-09-29T00:00:00.000Z"
}
```

#### `GET /api/challenges`
Solo el estado de los desafíos

**Respuesta:**
```json
{
  "success": true,
  "challenges": { "1": {...}, "2": {...}, "3": {...}, "4": {...} },
  "completedCount": 2,
  "timestamp": "2026-09-29T00:00:00.000Z"
}
```

#### `GET /api/challenge/:id`
Estado de un desafío específico (1-4)

---

### 🎯 Control de Desafíos

#### `POST /api/challenge/:id/complete`
Marca un desafío como completado

**Body:**
```json
{
  "source": "nombre-de-la-app"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Desafío 1 completado",
  "challengeState": {
    "completed": true,
    "timestamp": "2026-09-29T00:00:00.000Z",
    "source": "nombre-de-la-app"
  }
}
```

#### `POST /api/challenge/:id/reset`
Reinicia un desafío específico

#### `POST /api/challenges/reset-all`
Reinicia todos los desafíos

---

### 🎮 Control de Juego

#### `POST /api/game/start`
Inicia el juego

#### `POST /api/game/pause`
Pausa el juego

#### `POST /api/game/resume`
Reanuda el juego

#### `POST /api/game/end`
Finaliza el juego

**Body:**
```json
{
  "reason": "victory" // o "gameover", "timeout"
}
```

---

### 🔗 Sincronización con APIs Externas

#### `POST /api/sync/external-challenge`
Recibe actualizaciones de desafíos desde otra API

**Uso:** Tu API externa llama a este endpoint cuando un desafío se completa

**Body:**
```json
{
  "challengeId": 1,
  "completed": true,
  "source": "nombre-de-tu-app"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Desafío 1 sincronizado desde nombre-de-tu-app",
  "challengeState": {
    "completed": true,
    "timestamp": "2026-09-29T00:00:00.000Z",
    "source": "nombre-de-tu-app"
  }
}
```

#### `POST /api/sync/health-check`
Verifica si las APIs externas están disponibles

**Respuesta:**
```json
{
  "success": true,
  "healthStatus": {
    "challengeApp": {
      "status": "online",
      "url": "http://localhost:3002",
      "responseTime": 200
    },
    "anotherApp": {
      "status": "offline",
      "url": "http://localhost:3003",
      "error": "connect ECONNREFUSED"
    }
  }
}
```

---

## 🔌 Integración HTML

### Paso 1: Modificar el HTML para conectar con la API

En tu archivo HTML (`ai_studio_code.html`), reemplaza la sección de sincronización:

```javascript
// Cambiar esto:
const syncChannel = new BroadcastChannel('escape_room_sync');

// Por esto:
const API_URL = 'http://localhost:3001';

async function syncWithAPI() {
  try {
    const response = await fetch(`${API_URL}/api/challenges`);
    const data = await response.json();
    
    if (data.success) {
      // Actualizar estado local basado en API
      Object.keys(data.challenges).forEach(id => {
        setChallengeStatus(id, data.challenges[id].completed);
      });
    }
  } catch (error) {
    console.error('Error sincronizando con API:', error);
  }
}

// Sincronizar cuando se completa un desafío
window.toggleChallenge = function(challengeNum) {
  setChallengeStatus(challengeNum, !challenges[challengeNum]);
  
  // Notificar a la API
  fetch(`${API_URL}/api/challenge/${challengeNum}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'html-app' })
  }).catch(err => console.error('Error:', err));
};
```

### Paso 2: Llamar a sincronización al iniciar

```javascript
// En la función startGameSequence()
function startGameSequence() {
  // ... código existente ...
  
  // Llamar a la API
  fetch(`${API_URL}/api/game/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).catch(err => console.error('Error:', err));
}
```

---

## 🔗 Integración con otra API

### Caso: Tu API detecta que un desafío se completó

Cuando tu otra API (puerto 3003) detecte que un desafío está resuelto:

```javascript
// En tu API (Node.js, Python, etc.)

// Notificar al servidor central
async function notifyChallengeSolved(challengeId) {
  try {
    const response = await fetch('http://localhost:3001/api/sync/external-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: challengeId,
        completed: true,
        source: 'mi-app-externa'
      })
    });
    
    const data = await response.json();
    console.log('Sincronizado:', data);
  } catch (error) {
    console.error('Error sincronizando:', error);
  }
}

// Cuando un desafío se completa
notifyChallengeSolved(1);
```

### Python (Flask)
```python
import requests

def notify_challenge_solved(challenge_id):
    url = 'http://localhost:3001/api/sync/external-challenge'
    payload = {
        'challengeId': challenge_id,
        'completed': True,
        'source': 'flask-app'
    }
    response = requests.post(url, json=payload)
    return response.json()

# Usar
notify_challenge_solved(2)
```

### Python (Django)
```python
import requests
from django.http import JsonResponse

def complete_challenge(request, challenge_id):
    # Tu lógica aquí...
    
    # Notificar API central
    requests.post('http://localhost:3001/api/sync/external-challenge', json={
        'challengeId': challenge_id,
        'completed': True,
        'source': 'django-app'
    })
    
    return JsonResponse({'success': True})
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Flujo completo

```bash
# Terminal 1: Iniciar servidor principal
npm start

# Terminal 2: Iniciar mock server
npm run mock

# Terminal 3: Hacer pruebas
# Obtener estado
curl http://localhost:3001/api/status

# Iniciar juego
curl -X POST http://localhost:3001/api/game/start

# Completar desafío (desde mock server)
curl -X POST http://localhost:3002/api/challenge/1/complete

# Ver actualización en API principal
curl http://localhost:3001/api/challenges

# Finalizar juego
curl -X POST http://localhost:3001/api/game/end \
  -H "Content-Type: application/json" \
  -d '{"reason":"victory"}'
```

### Ejemplo 2: Usando Postman

1. **Crear colección**: "Escape Room"
2. **Agregar requests:**
   - GET `http://localhost:3001/api/status`
   - POST `http://localhost:3001/api/game/start`
   - POST `http://localhost:3001/api/challenge/1/complete` (body: `{"source":"postman"}`)
   - POST `http://localhost:3001/api/game/end` (body: `{"reason":"victory"}`)

### Ejemplo 3: Cliente JavaScript (fetch)

```javascript
const API = 'http://localhost:3001';

// Clase helper
class EscapeRoomAPI {
  static async getStatus() {
    return (await fetch(`${API}/api/status`)).json();
  }

  static async startGame() {
    return (await fetch(`${API}/api/game/start`, { method: 'POST' })).json();
  }

  static async completeChallenge(id, source = 'client') {
    return (await fetch(`${API}/api/challenge/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source })
    })).json();
  }

  static async endGame(reason = 'victory') {
    return (await fetch(`${API}/api/game/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    })).json();
  }
}

// Usar
(async () => {
  console.log(await EscapeRoomAPI.getStatus());
  console.log(await EscapeRoomAPI.startGame());
  console.log(await EscapeRoomAPI.completeChallenge(1, 'mi-app'));
})();
```

---

## 🐛 Troubleshooting

### "Error: Cannot find module 'express'"
```bash
npm install
```

### "ECONNREFUSED - No se conecta a API"
- Verificar que el servidor está corriendo: `npm start`
- Verificar puerto en .env: `PORT=3001`
- Verificar CORS está habilitado

### "Mock server no sincroniza"
- Asegurarse de que API principal está corriendo en puerto 3001
- Ver logs en consola para errores

### Prueba de Health Check
```bash
curl http://localhost:3001/api/sync/health-check
```

---

## 📝 Archivo .env.example

```env
# Servidor principal
PORT=3001
NODE_ENV=development

# URLs de APIs externas
CHALLENGE_API_URL=http://localhost:3002
ANOTHER_API_URL=http://localhost:3003

# Mock server
MOCK_PORT=3002
```

---

## 🎯 Próximos Pasos

1. **Actualizar HTML** con las llamadas a la API
2. **Conectar tu otra API** usando `POST /api/sync/external-challenge`
3. **Probar con mock server** antes de conectar tu API real
4. **Desplegar** en servidor (Heroku, AWS, DigitalOcean, etc.)

---

## 📞 Soporte

Para más información o ayuda:
- 📧 Email: axelminor62@gmail.com
- 🔗 GitHub: https://github.com/axelminor24/escape-room-api

---

**¡Listo para integrar tus APIs! 🚀**
