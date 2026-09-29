require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.MOCK_PORT || 3002;

app.use(cors());
app.use(express.json());

// ============================================
// ESTADO SIMULADO DE DESAFÍOS
// ============================================
let mockChallenges = {
  1: { completed: false, difficulty: 'easy', name: 'Desafío de Códigos' },
  2: { completed: false, difficulty: 'medium', name: 'Desafío de Lógica' },
  3: { completed: false, difficulty: 'hard', name: 'Desafío de Acertijos' },
  4: { completed: false, difficulty: 'hard', name: 'Desafío Final' }
};

// ============================================
// ENDPOINTS DE MOCK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'escape-room-mock-api',
    timestamp: new Date()
  });
});

app.get('/api/challenges', (req, res) => {
  res.json({
    success: true,
    challenges: mockChallenges,
    timestamp: new Date()
  });
});

app.get('/api/challenge/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!mockChallenges[id]) {
    return res.status(404).json({ success: false, error: 'No encontrado' });
  }

  res.json({
    success: true,
    challenge: id,
    data: mockChallenges[id],
    timestamp: new Date()
  });
});

// Simular completación de desafío
app.post('/api/challenge/:id/complete', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!mockChallenges[id]) {
    return res.status(404).json({ success: false, error: 'No encontrado' });
  }

  mockChallenges[id].completed = true;

  // Enviar la actualización a la API principal
  setTimeout(() => {
    const axios = require('axios');
    axios.post('http://localhost:3001/api/sync/external-challenge', {
      challengeId: id,
      completed: true,
      source: 'mock-challenge-app'
    }).catch(err => console.log('Mock: No se pudo sincronizar con API principal'));
  }, 500);

  res.json({
    success: true,
    message: `Desafío ${id} completado en mock`,
    challenge: mockChallenges[id],
    timestamp: new Date()
  });
});

// Reiniciar desafío
app.post('/api/challenge/:id/reset', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!mockChallenges[id]) {
    return res.status(404).json({ success: false, error: 'No encontrado' });
  }

  mockChallenges[id].completed = false;

  res.json({
    success: true,
    message: `Desafío ${id} reiniciado`,
    challenge: mockChallenges[id],
    timestamp: new Date()
  });
});

app.post('/api/challenges/reset-all', (req, res) => {
  for (let i = 1; i <= 4; i++) {
    mockChallenges[i].completed = false;
  }

  res.json({
    success: true,
    message: 'Todos los desafíos reiniciados',
    challenges: mockChallenges,
    timestamp: new Date()
  });
});

// ============================================
// DEMOSTRACIÓN DE COMPLETACIONES AUTOMÁTICAS
// ============================================

let demoMode = false;

app.post('/api/demo/start', (req, res) => {
  demoMode = true;
  console.log('🎬 Modo DEMO iniciado - Completando desafíos automáticamente...');

  // Simular desafíos completándose secuencialmente
  const times = [3000, 7000, 11000, 14000];
  
  times.forEach((delay, index) => {
    setTimeout(() => {
      const challengeId = index + 1;
      mockChallenges[challengeId].completed = true;
      console.log(`✅ Desafío ${challengeId} completado (Demo)`);

      const axios = require('axios');
      axios.post('http://localhost:3001/api/sync/external-challenge', {
        challengeId: challengeId,
        completed: true,
        source: 'mock-demo'
      }).catch(err => console.log('Demo: No se pudo sincronizar'));
    }, delay);
  });

  res.json({
    success: true,
    message: 'Demo iniciado - Los desafíos se completarán automáticamente',
    schedule: {
      challenge1: '3 segundos',
      challenge2: '7 segundos',
      challenge3: '11 segundos',
      challenge4: '14 segundos'
    }
  });
});

app.post('/api/demo/stop', (req, res) => {
  demoMode = false;
  res.json({
    success: true,
    message: 'Demo detenido'
  });
});

app.listen(PORT, () => {
  console.log(`
  ╔═════════════════════════════════════════╗
  ║  🎪 MOCK API - SERVIDOR DE PRUEBA 🎪   ║
  ║                                         ║
  ║  Puerto: ${PORT}                            ║
  ║  Propósito: Emular otra API              ║
  ║                                         ║
  ║  Rutas útiles:                          ║
  ║  - GET /api/challenges                  ║
  ║  - POST /api/challenge/:id/complete     ║
  ║  - POST /api/demo/start                 ║
  ║                                         ║
  ║  http://localhost:${PORT}               ║
  ╚═════════════════════════════════════════╝
  `);
});
