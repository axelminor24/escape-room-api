// ============================================
// ARCHIVO: html-integration-example.js
// 
// Copia esta sección en tu HTML para integrar
// la API de Escape Room
// ============================================

// 1. CONFIGURACIÓN INICIAL
const API_URL = 'http://localhost:3001';
const API_SYNC_INTERVAL = 5000; // Sincronizar cada 5 segundos

// 2. VARIABLE PARA POLLING
let syncIntervalId = null;

// ============================================
// FUNCIÓN: Inicializar sincronización con API
// ============================================
function initializeAPISync() {
  console.log('✅ Sincronización con API iniciada');
  
  // Sincronizar estado inicial
  syncStateFromAPI();
  
  // Polling automático cada 5 segundos
  syncIntervalId = setInterval(syncStateFromAPI, API_SYNC_INTERVAL);
}

// ============================================
// FUNCIÓN: Obtener estado de la API
// ============================================
async function syncStateFromAPI() {
  try {
    const response = await fetch(`${API_URL}/api/challenges`);
    
    if (!response.ok) {
      console.warn('⚠️ No se pudo conectar con la API');
      return;
    }
    
    const data = await response.json();
    
    if (data.success && data.challenges) {
      // Actualizar desafíos según estado remoto
      Object.keys(data.challenges).forEach(challengeId => {
        const isCompleted = data.challenges[challengeId].completed;
        setChallengeStatus(parseInt(challengeId), isCompleted);
      });
    }
  } catch (error) {
    console.error('Error sincronizando con API:', error);
  }
}

// ============================================
// FUNCIÓN: Completar desafío (modificada)
// ============================================
async function completeChallenge(challengeId, source = 'html-admin') {
  try {
    const response = await fetch(`${API_URL}/api/challenge/${challengeId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: source
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Desafío ${challengeId} completado en API`);
      return true;
    } else {
      console.error(`❌ Error al completar desafío: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.error('Error comunicándose con API:', error);
    return false;
  }
}

// ============================================
// FUNCIÓN: Reiniciar un desafío
// ============================================
async function resetChallenge(challengeId) {
  try {
    const response = await fetch(`${API_URL}/api/challenge/${challengeId}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Desafío ${challengeId} reiniciado`);
      return true;
    }
  } catch (error) {
    console.error('Error reiniciando desafío:', error);
  }
  
  return false;
}

// ============================================
// FUNCIÓN: Reiniciar todos los desafíos
// ============================================
async function resetAllChallenges() {
  try {
    const response = await fetch(`${API_URL}/api/challenges/reset-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Todos los desafíos reiniciados');
      return true;
    }
  } catch (error) {
    console.error('Error reiniciando desafíos:', error);
  }
  
  return false;
}

// ============================================
// FUNCIÓN: Iniciar juego
// ============================================
async function startGameAPI() {
  try {
    const response = await fetch(`${API_URL}/api/game/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Juego iniciado en API');
      return true;
    }
  } catch (error) {
    console.error('Error iniciando juego:', error);
  }
  
  return false;
}

// ============================================
// FUNCIÓN: Pausar juego
// ============================================
async function pauseGameAPI() {
  try {
    const response = await fetch(`${API_URL}/api/game/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Juego pausado en API');
      return true;
    }
  } catch (error) {
    console.error('Error pausando juego:', error);
  }
  
  return false;
}

// ============================================
// FUNCIÓN: Finalizar juego
// ============================================
async function endGameAPI(reason = 'victory') {
  try {
    const response = await fetch(`${API_URL}/api/game/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: reason // 'victory', 'gameover', 'timeout'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Juego finalizado: ${reason}`);
      return true;
    }
  } catch (error) {
    console.error('Error finalizando juego:', error);
  }
  
  return false;
}

// ============================================
// FUNCIÓN: Obtener estado completo
// ============================================
async function getFullGameStatus() {
  try {
    const response = await fetch(`${API_URL}/api/status`);
    const data = await response.json();
    
    if (data.success) {
      console.log('📊 Estado del juego:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('Error obteniendo estado:', error);
  }
  
  return null;
}

// ============================================
// FUNCIÓN: Verificar salud de APIs externas
// ============================================
async function checkExternalAPIsHealth() {
  try {
    const response = await fetch(`${API_URL}/api/sync/health-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('🏥 Estado de APIs externas:', data.healthStatus);
    return data.healthStatus;
  } catch (error) {
    console.error('Error verificando salud de APIs:', error);
  }
  
  return null;
}

// ============================================
// INTEGRACIÓN CON EL CÓDIGO EXISTENTE
// ============================================

// Modificar la función toggleChallenge existente
/*
REEMPLAZAR ESTO EN TU HTML:

window.toggleChallenge = function(challengeNum) {
  setChallengeStatus(challengeNum, !challenges[challengeNum]);
};

POR ESTO:
*/

window.toggleChallenge = function(challengeNum) {
  const newState = !challenges[challengeNum];
  setChallengeStatus(challengeNum, newState);
  
  // Si se marca como completado, notificar a la API
  if (newState) {
    completeChallenge(challengeNum, 'html-admin');
  } else {
    resetChallenge(challengeNum);
  }
};

// ============================================
// INTEGRACIÓN CON BOTONES EXISTENTES
// ============================================

/*
Reemplazar los addEventListener existentes con:
*/

// Botón Iniciar (modificado)
/*
document.getElementById("btnStart").addEventListener("click", async () => {
  await startGameAPI();
  startGameSequence(); // Tu función existente
});
*/

// Botón Pausar (modificado)
/*
document.getElementById("btnPause").addEventListener("click", async () => {
  await pauseGameAPI();
  // ... tu código existente
});
*/

// Botón Reset (modificado)
/*
document.getElementById("btnReset").addEventListener("click", async () => {
  await resetAllChallenges();
  // ... tu código existente
});
*/

// Botón Victoria (modificado)
/*
document.getElementById("btnWin").addEventListener("click", async () => {
  await endGameAPI('victory');
  triggerVictory(); // Tu función existente
});
*/

// ============================================
// INICIALIZACIÓN
// ============================================

// Llamar esto cuando el documento esté listo
// document.addEventListener('DOMContentLoaded', initializeAPISync);

// O si ya tienes un inicializador:
// Agregar initializeAPISync() en tu función de setup

// ============================================
// CLASE HELPER (Opcional - Para código limpio)
// ============================================

class EscapeRoomAPIClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.syncInterval = null;
  }

  /**
   * Iniciar sincronización automática
   */
  startSync(intervalMs = 5000) {
    this.syncInterval = setInterval(() => this.sync(), intervalMs);
    console.log(`✅ Sincronización iniciada cada ${intervalMs}ms`);
  }

  /**
   * Detener sincronización
   */
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Sincronización detenida');
    }
  }

  /**
   * Sincronizar estado
   */
  async sync() {
    try {
      const response = await fetch(`${this.baseUrl}/api/challenges`);
      const data = await response.json();
      return data.challenges;
    } catch (error) {
      console.error('Error en sync:', error);
      return null;
    }
  }

  /**
   * Completar desafío
   */
  async completeChallenge(id, source = 'client') {
    return this._post(`/api/challenge/${id}/complete`, { source });
  }

  /**
   * Reiniciar desafío
   */
  async resetChallenge(id) {
    return this._post(`/api/challenge/${id}/reset`, {});
  }

  /**
   * Reiniciar todos
   */
  async resetAll() {
    return this._post(`/api/challenges/reset-all`, {});
  }

  /**
   * Iniciar juego
   */
  async startGame() {
    return this._post(`/api/game/start`, {});
  }

  /**
   * Pausar juego
   */
  async pauseGame() {
    return this._post(`/api/game/pause`, {});
  }

  /**
   * Finalizar juego
   */
  async endGame(reason = 'victory') {
    return this._post(`/api/game/end`, { reason });
  }

  /**
   * Obtener estado completo
   */
  async getStatus() {
    return this._get(`/api/status`);
  }

  /**
   * Obtener desafíos
   */
  async getChallenges() {
    return this._get(`/api/challenges`);
  }

  /**
   * Verificar salud de APIs
   */
  async healthCheck() {
    return this._post(`/api/sync/health-check`, {});
  }

  // Métodos privados
  async _get(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      return await response.json();
    } catch (error) {
      console.error(`Error GET ${endpoint}:`, error);
      return null;
    }
  }

  async _post(endpoint, body) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await response.json();
    } catch (error) {
      console.error(`Error POST ${endpoint}:`, error);
      return null;
    }
  }
}

// ============================================
// USO DE LA CLASE HELPER
// ============================================

/*
// En tu HTML:

const apiClient = new EscapeRoomAPIClient('http://localhost:3001');

// Iniciar sincronización
apiClient.startSync(5000);

// Usar en botones:
document.getElementById("btnStart").addEventListener("click", async () => {
  await apiClient.startGame();
  startGameSequence();
});

// Detener sincronización si es necesario
// apiClient.stopSync();
*/
