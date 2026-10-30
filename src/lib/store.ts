import {
  SensorTelemetry,
  ActuatorState,
  HttpLog,
  StudentDHT11Reading,
  StudentSession,
  ClassroomSummary,
} from '@/types';

// Función para calcular Sensación Térmica (Heat Index)
function calculateHeatIndex(tempC: number, hum: number): number {
  const T = tempC;
  const R = hum;
  const hi = T + 0.5555 * ((6.11 * Math.exp(5417.7530 * (1/273.16 - 1/(273.15 + T)))) * (R/100) - 10);
  return Math.round((isNaN(hi) || hi < T ? T : hi) * 10) / 10;
}

interface GlobalStore {
  // Laboratorio Multi-Estudiante DHT11
  students: Record<string, StudentSession>;
  classroomLedBroadcast: boolean | null;

  // Laboratorio de Luz y Proximidad
  telemetryHistory: SensorTelemetry[];
  latestTelemetry: SensorTelemetry | null;
  actuators: ActuatorState;

  // Auditoría HTTP compartida
  httpLogs: HttpLog[];
  serverStartTime: number;
  stats: {
    totalRequests: number;
    esp32Packets: number;
    simulatorPackets: number;
  };
}

const createInitialState = (): GlobalStore => {
  return {
    students: {},
    classroomLedBroadcast: null,
    telemetryHistory: [],
    latestTelemetry: null,
    actuators: {
      led: false,
      buzzer: false,
      ledMode: 'auto',
      proximityThreshold: 15,
      lightThreshold: 200,
      lastUpdated: new Date().toISOString(),
    },
    httpLogs: [],
    serverStartTime: Date.now(),
    stats: {
      totalRequests: 0,
      esp32Packets: 0,
      simulatorPackets: 0,
    },
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __esp32Store: GlobalStore | undefined;
}

if (!globalThis.__esp32Store || !globalThis.__esp32Store.students) {
  globalThis.__esp32Store = createInitialState();
} else {
  // Limpiar cualquier dato ficticio de pruebas anteriores
  delete globalThis.__esp32Store.students['alumno-01'];
  delete globalThis.__esp32Store.students['alumno-02'];
  delete globalThis.__esp32Store.students['alumno-03'];
  delete globalThis.__esp32Store.students['alumno-04'];
}

const store = globalThis.__esp32Store;
if (!store.students) {
  store.students = {};
}

export const LabStore = {
  // ==========================================
  // GESTIÓN DEL AULA DHT11 (MULTI-ESTUDIANTE)
  // ==========================================
  registerStudentDHT11(data: {
    studentId: string;
    studentName: string;
    deskNumber?: string;
    temperature: number;
    humidity: number;
    clientIp: string;
    source?: 'esp32' | 'simulator';
  }) {
    const now = new Date();
    const studentId = data.studentId.trim().toLowerCase().replace(/\s+/g, '-');
    const studentName = data.studentName.trim() || `Alumno ${studentId}`;
    const deskNumber = data.deskNumber?.trim() || 'Mesa Aula';
    const temp = Math.round(Number(data.temperature) * 10) / 10;
    const hum = Math.round(Number(data.humidity) * 10) / 10;
    const heatIndex = calculateHeatIndex(temp, hum);

    // Evaluación de estado de confort térmico
    let status: StudentDHT11Reading['status'] = 'optimal';
    if (temp > 28) {
      status = 'warning_heat';
    } else if (temp < 19) {
      status = 'warning_cold';
    } else if (hum > 70 || hum < 30) {
      status = 'warning_humidity';
    }

    // Regla de actuador LED para el ESP32 del alumno
    let ledCommand = status !== 'optimal';
    const existing = store.students[studentId];

    if (store.classroomLedBroadcast !== null) {
      ledCommand = store.classroomLedBroadcast;
    } else if (existing && typeof existing.ledTarget === 'boolean' && existing.ledTarget) {
      ledCommand = true;
    }

    const reading: StudentDHT11Reading = {
      id: `dht-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      studentName,
      deskNumber,
      temperature: temp,
      humidity: hum,
      heatIndex,
      timestamp: now.toISOString(),
      clientIp: data.clientIp,
      source: data.source || 'esp32',
      status,
      ledCommand,
    };

    if (!store.students[studentId]) {
      // Nuevo estudiante ingresando al aula
      store.students[studentId] = {
        studentId,
        studentName,
        deskNumber,
        latestReading: reading,
        history: [reading],
        firstSeen: now.toISOString(),
        lastSeen: now.toISOString(),
        packetsCount: 1,
        isOnline: true,
        ledTarget: false,
        clientIp: data.clientIp,
      };
    } else {
      // Actualización de estudiante existente
      const session = store.students[studentId];
      session.studentName = studentName;
      if (data.deskNumber) session.deskNumber = deskNumber;
      session.latestReading = reading;
      session.lastSeen = now.toISOString();
      session.clientIp = data.clientIp;
      session.packetsCount++;
      session.isOnline = true;
      session.history.unshift(reading);
      if (session.history.length > 25) {
        session.history.pop();
      }
    }

    store.stats.totalRequests++;
    if (data.source === 'esp32') {
      store.stats.esp32Packets++;
    } else {
      store.stats.simulatorPackets++;
    }

    return { reading, session: store.students[studentId] };
  },

  getAllStudents(): StudentSession[] {
    const now = Date.now();
    const list = Object.values(store.students);

    return list.map((s) => {
      const diffMs = now - new Date(s.lastSeen).getTime();
      const isOnline = diffMs < 25000; // En línea si envió datos en los últimos 25s
      return {
        ...s,
        isOnline,
      };
    }).sort((a, b) => b.packetsCount - a.packetsCount);
  },

  getStudent(studentId: string): StudentSession | null {
    const cleanId = studentId.trim().toLowerCase().replace(/\s+/g, '-');
    const s = store.students[cleanId];
    if (!s) return null;
    const isOnline = Date.now() - new Date(s.lastSeen).getTime() < 25000;
    return { ...s, isOnline };
  },

  getClassroomSummary(): ClassroomSummary {
    const students = this.getAllStudents();
    const online = students.filter((s) => s.isOnline);

    if (students.length === 0) {
      return {
        totalStudents: 0,
        onlineStudents: 0,
        avgTemperature: 0,
        avgHumidity: 0,
        maxTemp: null,
        minTemp: null,
        maxHumidity: null,
        minHumidity: null,
        lastUpdate: new Date().toISOString(),
      };
    }

    const sumTemp = students.reduce((acc, s) => acc + s.latestReading.temperature, 0);
    const sumHum = students.reduce((acc, s) => acc + s.latestReading.humidity, 0);

    const sortedByTemp = [...students].sort((a, b) => b.latestReading.temperature - a.latestReading.temperature);
    const sortedByHum = [...students].sort((a, b) => b.latestReading.humidity - a.latestReading.humidity);

    return {
      totalStudents: students.length,
      onlineStudents: online.length,
      avgTemperature: Math.round((sumTemp / students.length) * 10) / 10,
      avgHumidity: Math.round((sumHum / students.length) * 10) / 10,
      maxTemp: {
        studentName: sortedByTemp[0].studentName,
        studentId: sortedByTemp[0].studentId,
        value: sortedByTemp[0].latestReading.temperature,
      },
      minTemp: {
        studentName: sortedByTemp[sortedByTemp.length - 1].studentName,
        studentId: sortedByTemp[sortedByTemp.length - 1].studentId,
        value: sortedByTemp[sortedByTemp.length - 1].latestReading.temperature,
      },
      maxHumidity: {
        studentName: sortedByHum[0].studentName,
        studentId: sortedByHum[0].studentId,
        value: sortedByHum[0].latestReading.humidity,
      },
      minHumidity: {
        studentName: sortedByHum[sortedByHum.length - 1].studentName,
        studentId: sortedByHum[sortedByHum.length - 1].studentId,
        value: sortedByHum[sortedByHum.length - 1].latestReading.humidity,
      },
      lastUpdate: new Date().toISOString(),
    };
  },

  setStudentLed(studentId: string, state: boolean) {
    const cleanId = studentId.trim().toLowerCase().replace(/\s+/g, '-');
    if (store.students[cleanId]) {
      store.students[cleanId].ledTarget = state;
      return true;
    }
    return false;
  },

  broadcastClassroomLed(state: boolean | null) {
    store.classroomLedBroadcast = state;
    if (state !== null) {
      Object.values(store.students).forEach((s) => {
        s.ledTarget = state;
      });
    }
  },

  resetClassroom() {
    store.students = {};
    store.classroomLedBroadcast = null;
  },

  // ==========================================
  // SENSORES DE LUZ Y PROXIMIDAD (LAB ANTERIOR)
  // ==========================================
  addTelemetry(data: Omit<SensorTelemetry, 'id' | 'timestamp' | 'status'> & { id?: string; timestamp?: string }) {
    const timestamp = data.timestamp || new Date().toISOString();
    const id = data.id || `tel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

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

    store.latestTelemetry = newTelemetry;
    store.telemetryHistory.unshift(newTelemetry);
    if (store.telemetryHistory.length > 80) {
      store.telemetryHistory.pop();
    }

    if (store.actuators.ledMode === 'auto') {
      const shouldLedTurnOn = newTelemetry.proximity < store.actuators.proximityThreshold ||
                              newTelemetry.light < store.actuators.lightThreshold;
      store.actuators.led = shouldLedTurnOn;
      store.actuators.buzzer = newTelemetry.proximity < (store.actuators.proximityThreshold / 2);
      store.actuators.lastUpdated = new Date().toISOString();
    }

    store.stats.totalRequests++;
    return newTelemetry;
  },

  getLatestTelemetry(): SensorTelemetry | null {
    return store.latestTelemetry;
  },

  getHistory(limit = 30): SensorTelemetry[] {
    return store.telemetryHistory.slice(0, limit);
  },

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

  // ==========================================
  // AUDITORÍA Y REGISTRO DE PAQUETES HTTP
  // ==========================================
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
      studentsCount: Object.keys(store.students).length,
      historyCount: store.telemetryHistory.length,
    };
  },
};
