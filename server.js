require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// CONFIGURACIÓN DE APIS EXTERNAS
// ============================================
const EXTERNAL_APIs = {
  challengeApp: process.env.CHALLENGE_API_URL || 'http://localhost:3002',
  anotherApp: process.env.ANOTHER_API_URL || 'http://localhost:3003'
};

// ============================================
// ESTADO DEL JUEGO EN MEMORIA
// ============================================
let gameState = {
  isRunning: false,
  challenges: {
    1: { completed: false, timestamp: null, source: 'unknown' },
    2: { completed: false, timestamp: null, source: 'unknown' },
    3: { completed: false, timestamp: null, source: 'unknown' },
    4: { completed: false, timestamp: null, source: 'unknown' }
  },
  startTime: null,
  elapsedTime: 0,
  gameStatus: 'IDLE', // IDLE, RUNNING, PAUSED, VICTORY, GAMEOVER
  lastUpdate: new Date()
};

// ============================================
// ENDPOINTS DE INFORMACIÓN
// ============================================

/**
 * GET /api/status
 * Obtiene el estado actual del juego
 */
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: gameState,
    timestamp: new Date()
  });
});

/**
 * GET /api/challenges
 * Obtiene solo el estado de los desafíos
 */
app.get('/api/challenges', (req, res) => {
  res.json({
    success: true,
    challenges: gameState.challenges,
    completedCount: Object.values(gameState.challenges).filter(c => c.completed).length,
    timestamp: new Date()
  });
});

/**
 * GET /api/challenge/:id
 * Obtiene el estado de un desafío específico
 */
app.get('/api/challenge/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!gameState.challenges[id]) {
    return res.status(404).json({
      success: false,
      error: 'Desafío no encontrado'
    });
  }

  res.json({
    success: true,
    challenge: id,
    data: gameState.challenges[id],
    timestamp: new Date()
  });
});

// ============================================
// ENDPOINTS DE CONTROL DE DESAFÍOS
// ============================================

/**
 * POST /api/challenge/:id/complete
 * Marca un desafío como completado
 */
app.post('/api/challenge/:id/complete', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!gameState.challenges[id]) {
    return res.status(404).json({
      success: false,
      error: 'Desafío no encontrado'
    });
  }

  const wasAlreadyCompleted = gameState.challenges[id].completed;
  
  gameState.challenges[id] = {
    completed: true,
    timestamp: new Date(),
    source: req.body.source || 'api-direct'
  };

  gameState.lastUpdate = new Date();

  // Sincronizar con la ventana del navegador
  broadcastUpdate({
    type: 'CHALLENGE_COMPLETED',
    challengeId: id,
    wasNew: !wasAlreadyCompleted
  });

  // Verificar si todos los desafíos están completados
  checkVictoryCondition();

  res.json({
    success: true,
    message: `Desafío ${id} completado`,
    challengeState: gameState.challenges[id],
    timestamp: new Date()
  });
});

/**
 * POST /api/challenge/:id/reset
 * Reinicia un desafío específico
 */
app.post('/api/challenge/:id/reset', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!gameState.challenges[id]) {
    return res.status(404).json({
      success: false,
      error: 'Desafío no encontrado'
    });
  }

  gameState.challenges[id] = {
    completed: false,
    timestamp: null,
    source: 'reset'
  };

  gameState.lastUpdate = new Date();

  broadcastUpdate({
    type: 'CHALLENGE_RESET',
    challengeId: id
  });

  res.json({
    success: true,
    message: `Desafío ${id} reiniciado`,
    challengeState: gameState.challenges[id],
    timestamp: new Date()
  });
});

/**
 * POST /api/challenges/reset-all
 * Reinicia todos los desafíos
 */
app.post('/api/challenges/reset-all', (req, res) => {
  for (let i = 1; i <= 4; i++) {
    gameState.challenges[i] = {
      completed: false,
      timestamp: null,
      source: 'reset-all'
    };
  }

  gameState.gameStatus = 'IDLE';
  gameState.startTime = null;
  gameState.elapsedTime = 0;
  gameState.lastUpdate = new Date();

  broadcastUpdate({
    type: 'ALL_CHALLENGES_RESET'
  });

  res.json({
    success: true,
    message: 'Todos los desafíos han sido reiniciados',
    gameState: gameState,
    timestamp: new Date()
  });
});

// ============================================
// ENDPOINTS DE CONTROL DE JUEGO
// ============================================

/**
 * POST /api/game/start
 * Inicia el juego
 */
app.post('/api/game/start', (req, res) => {
  gameState.gameStatus = 'RUNNING';
  gameState.startTime = new Date();
  gameState.isRunning = true;
  gameState.lastUpdate = new Date();

  broadcastUpdate({
    type: 'GAME_STARTED',
    startTime: gameState.startTime
  });

  res.json({
    success: true,
    message: 'Juego iniciado',
    gameState: gameState,
    timestamp: new Date()
  });
});

/**
 * POST /api/game/pause
 * Pausa el juego
 */
app.post('/api/game/pause', (req, res) => {
  gameState.gameStatus = 'PAUSED';
  gameState.isRunning = false;
  gameState.lastUpdate = new Date();

  broadcastUpdate({
    type: 'GAME_PAUSED'
  });

  res.json({
    success: true,
    message: 'Juego pausado',
    gameState: gameState,
    timestamp: new Date()
  });
});

/**
 * POST /api/game/resume
 * Reanuda el juego
 */
app.post('/api/game/resume', (req, res) => {
  gameState.gameStatus = 'RUNNING';
  gameState.isRunning = true;
  gameState.lastUpdate = new Date();

  broadcastUpdate({
    type: 'GAME_RESUMED'
  });

  res.json({
    success: true,
    message: 'Juego reanudado',
    gameState: gameState,
    timestamp: new Date()
  });
});

/**
 * POST /api/game/end
 * Finaliza el juego (derrota o victoria)
 */
app.post('/api/game/end', (req, res) => {
  const reason = req.body.reason || 'unknown'; // 'victory', 'gameover', 'timeout'
  
  gameState.gameStatus = reason === 'victory' ? 'VICTORY' : 'GAMEOVER';
  gameState.isRunning = false;
  gameState.lastUpdate = new Date();

  broadcastUpdate({
    type: 'GAME_ENDED',
    reason: reason,
    finalState: gameState
  });

  res.json({
    success: true,
    message: `Juego finalizado: ${reason}`,
    gameState: gameState,
    timestamp: new Date()
  });
});

// ============================================
// ENDPOINTS DE INTEGRACIÓN CON OTRAS APIs
// ============================================

/**
 * POST /api/sync/external-challenge
 * Recibe actualizaciones de desafíos desde otra API
 * Formato esperado: { challengeId: 1, completed: true, source: 'app-name' }
 */
app.post('/api/sync/external-challenge', (req, res) => {
  const { challengeId, completed, source } = req.body;

  if (!challengeId || typeof completed !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'Parámetros inválidos. Se requiere: challengeId (número), completed (booleano)'
    });
  }

  if (!gameState.challenges[challengeId]) {
    return res.status(404).json({
      success: false,
      error: `Desafío ${challengeId} no existe`
    });
  }

  gameState.challenges[challengeId] = {
    completed: completed,
    timestamp: new Date(),
    source: source || 'external-sync'
  };

  gameState.lastUpdate = new Date();

  broadcastUpdate({
    type: 'EXTERNAL_CHALLENGE_UPDATE',
    challengeId: challengeId,
    completed: completed,
    source: source
  });

  checkVictoryCondition();

  res.json({
    success: true,
    message: `Desafío ${challengeId} sincronizado desde ${source || 'externa'}`,
    challengeState: gameState.challenges[challengeId],
    timestamp: new Date()
  });
});

/**
 * POST /api/sync/health-check
 * Verifica si las APIs externas están disponibles
 */
app.post('/api/sync/health-check', async (req, res) => {
  const healthStatus = {};

  for (const [key, url] of Object.entries(EXTERNAL_APIs)) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      healthStatus[key] = {
        status: 'online',
        url: url,
        responseTime: response.status
      };
    } catch (error) {
      healthStatus[key] = {
        status: 'offline',
        url: url,
        error: error.message
      };
    }
  }

  res.json({
    success: true,
    healthStatus: healthStatus,
    timestamp: new Date()
  });
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Verifica si se ha alcanzado la victoria (todos los desafíos completados)
 */
function checkVictoryCondition() {
  const allCompleted = Object.values(gameState.challenges).every(c => c.completed);
  
  if (allCompleted && gameState.gameStatus === 'RUNNING') {
    gameState.gameStatus = 'VICTORY';
    gameState.isRunning = false;
    
    broadcastUpdate({
      type: 'VICTORY_ACHIEVED',
      finalState: gameState
    });
  }
}

/**
 * Emitir actualizaciones a través de WebSocket (simulado con logs)
 * En producción, usar Socket.io para actualizaciones en tiempo real
 */
function broadcastUpdate(data) {
  console.log('[BROADCAST]', JSON.stringify(data, null, 2));
  // Aquí se conectaría a Socket.io para enviar a clientes conectados
  // socket.emit('update', data);
}

// ============================================
// RUTAS DE SERVICIO
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'escape-room-api',
    timestamp: new Date()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Escape Room API',
    version: '1.0.0',
    description: 'API de sincronización para sistema de Escape Room',
    endpoints: {
      info: {
        'GET /api/status': 'Estado completo del juego',
        'GET /api/challenges': 'Estado de todos los desafíos',
        'GET /api/challenge/:id': 'Estado de un desafío específico'
      },
      challenges: {
        'POST /api/challenge/:id/complete': 'Marcar desafío como completado',
        'POST /api/challenge/:id/reset': 'Reiniciar un desafío',
        'POST /api/challenges/reset-all': 'Reiniciar todos los desafíos'
      },
      game: {
        'POST /api/game/start': 'Iniciar juego',
        'POST /api/game/pause': 'Pausar juego',
        'POST /api/game/resume': 'Reanudar juego',
        'POST /api/game/end': 'Finalizar juego'
      },
      sync: {
        'POST /api/sync/external-challenge': 'Sincronizar desafío desde API externa',
        'POST /api/sync/health-check': 'Verificar estado de APIs externas'
      }
    },
    docs: 'Revisa README.md para más información'
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   🎮 ESCAPE ROOM API - SERVER 🎮     ║
  ║                                       ║
  ║   Puerto: ${PORT}                          ║
  ║   Entorno: ${process.env.NODE_ENV || 'development'}         ║
  ║                                       ║
  ║   APIs Externas:                      ║
  ║   - Challenge App: ${EXTERNAL_APIs.challengeApp}    ║
  ║   - Another App: ${EXTERNAL_APIs.anotherApp}       ║
  ║                                       ║
  ║   http://localhost:${PORT}             ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
