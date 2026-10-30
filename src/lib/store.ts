import { SensorTelemetry, ActuatorState, HttpLog } from '@/types';

interface GlobalStore {
  telemetryHistory: SensorTelemetry[];
  latestTelemetry: SensorTelemetry | null;
  actuators: ActuatorState;
  httpLogs: HttpLog[];
  serverStartTime: number;
  stats: {
    totalRequests: number;
    esp32Packets: number;
    simulatorPackets: number;
  };
}

// Inicialización de estado inicial demostrativo para los estudiantes
const createInitialState = (): GlobalStore => {
  const now = new Date();
  const initialTelemetry: SensorTelemetry = {
    id: 'demo-init-1',
    deviceId: 'esp32-aula-lab',
    timestamp: now.toISOString(),
    light: 480,
    lightUnit: 'lux',
    proximity: 25.4,
    proximityUnit: 'cm',
    battery: 98,
    clientIp: '192.168.1.150',
    status: 'normal',
    notes: 'Inicialización de demostración'
  };

  return {
    telemetryHistory: [initialTelemetry],
    latestTelemetry: initialTelemetry,
    actuators: {
      led: false,
      buzzer: false,
      ledMode: 'auto',
      proximityThreshold: 15,
      lightThreshold: 200,
      lastUpdated: now.toISOString(),
    },
    httpLogs: [
      {
        id: 'log-seed-1',
        timestamp: now.toISOString(),
        method: 'POST',
        path: '/api/sensors',
        statusCode: 201,
        clientIp: '192.168.1.150',
        userAgent: 'ESP32HTTPClient/1.0',
        requestHeaders: {
          'host': '192.168.1.50:3000',
          'content-type': 'application/json',
          'user-agent': 'ESP32HTTPClient/1.0',
        },
        requestBody: {
          deviceId: 'esp32-aula-lab',
          light: 480,
          proximity: 25.4,
        },
        responseBody: {
          status: 'success',
          message: 'Telemetría guardada exitosamente',
          actuators: { led: false, buzzer: false },
        },
        latencyMs: 14,
        source: 'esp32',
      }
    ],
    serverStartTime: Date.now(),
    stats: {
      totalRequests: 1,
      esp32Packets: 1,
      simulatorPackets: 0,
    },
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __esp32Store: GlobalStore | undefined;
}

if (!globalThis.__esp32Store) {
  globalThis.__esp32Store = createInitialState();
}

const store = globalThis.__esp32Store;

export const LabStore = {
  // Telemetría de sensores
  addTelemetry(data: Omit<SensorTelemetry, 'id' | 'timestamp' | 'status'> & { id?: string; timestamp?: string }) {
    const timestamp = data.timestamp || new Date().toISOString();
    const id = data.id || `tel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Regla de alerta didáctica
    let status: SensorTelemetry['status'] = 'normal';
    if (data.proximity < store.actuators.proximityThreshold) {
      status = 'alert_proximity';
    } else if (data.light < store.actuators.lightThreshold) {
      status = 'alert_light';
    }

    const newTelemetry: SensorTelemetry = {
      ...data,
      id,
      timestamp,
      status,
    };

    // Actualizar última telemetría e historial (máximo 80 registros)
    store.latestTelemetry = newTelemetry;
    store.telemetryHistory.unshift(newTelemetry);
    if (store.telemetryHistory.length > 80) {
      store.telemetryHistory.pop();
    }

    // Si el modo de actuadores es 'auto', se ajusta el LED automáticamente
    if (store.actuators.ledMode === 'auto') {
      const shouldLedTurnOn = newTelemetry.proximity < store.actuators.proximityThreshold ||
                              newTelemetry.light < store.actuators.lightThreshold;
      store.actuators.led = shouldLedTurnOn;
      store.actuators.buzzer = newTelemetry.proximity < (store.actuators.proximityThreshold / 2);
      store.actuators.lastUpdated = new Date().toISOString();
    }

    return newTelemetry;
  },

  getLatestTelemetry(): SensorTelemetry | null {
    return store.latestTelemetry;
  },

  getHistory(limit = 30): SensorTelemetry[] {
    return store.telemetryHistory.slice(0, limit);
  },

  // Actuadores (LED, Buzzer)
  getActuators(): ActuatorState {
    return store.actuators;
  },

  updateActuators(partial: Partial<ActuatorState>): ActuatorState {
    store.actuators = {
      ...store.actuators,
      ...partial,
      lastUpdated: new Date().toISOString(),
    };
    return store.actuators;
  },

  // Registro de Auditoría HTTP en tiempo real para estudiantes
  addHttpLog(log: Omit<HttpLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) {
    const timestamp = log.timestamp || new Date().toISOString();
    const id = log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const fullLog: HttpLog = {
      ...log,
      id,
      timestamp,
    };

    store.httpLogs.unshift(fullLog);
    if (store.httpLogs.length > 60) {
      store.httpLogs.pop();
    }

    store.stats.totalRequests++;
    if (log.source === 'esp32') {
      store.stats.esp32Packets++;
    } else if (log.source === 'browser_sim') {
      store.stats.simulatorPackets++;
    }

    return fullLog;
  },

  getHttpLogs(limit = 50): HttpLog[] {
    return store.httpLogs.slice(0, limit);
  },

  clearHttpLogs() {
    store.httpLogs = [];
  },

  getStats() {
    return {
      ...store.stats,
      uptimeSeconds: Math.floor((Date.now() - store.serverStartTime) / 1000),
      historyCount: store.telemetryHistory.length,
      lastTelemetryTime: store.latestTelemetry?.timestamp || null,
    };
  },
};
