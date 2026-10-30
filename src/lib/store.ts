import {
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

interface ClassroomStore {
  students: Record<string, StudentSession>;
  serverStartTime: number;
}

const createInitialState = (): ClassroomStore => {
  return {
    students: {},
    serverStartTime: Date.now(),
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __classroomStore: ClassroomStore | undefined;
}

if (!globalThis.__classroomStore || !globalThis.__classroomStore.students) {
  globalThis.__classroomStore = createInitialState();
}

const store = globalThis.__classroomStore;
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
      ledCommand: status !== 'optimal',
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
        clientIp: data.clientIp,
      };
    } else {
      // Actualización de telemetría de estudiante existente
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

  resetClassroom() {
    store.students = {};
  },

  getStats() {
    return {
      uptimeSeconds: Math.floor((Date.now() - store.serverStartTime) / 1000),
      studentsCount: Object.keys(store.students).length,
    };
  },
};
