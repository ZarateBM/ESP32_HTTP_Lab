// ==========================================
// MODELOS PARA EL AULA EN VIVO CON ESP32 & DHT11
// ==========================================
export interface StudentDHT11Reading {
  id: string;
  studentId: string;
  studentName: string;
  deskNumber: string;
  temperature: number;      // Grados Celsius (°C)
  humidity: number;         // Humedad relativa (%)
  heatIndex: number;        // Sensación térmica calculada (°C)
  timestamp: string;
  clientIp: string;
  source: 'esp32' | 'simulator';
  status: 'optimal' | 'warning_heat' | 'warning_cold' | 'warning_humidity';
  ledCommand?: boolean;
}

export interface StudentSession {
  studentId: string;
  studentName: string;
  deskNumber: string;
  latestReading: StudentDHT11Reading;
  history: StudentDHT11Reading[];
  firstSeen: string;
  lastSeen: string;
  packetsCount: number;
  isOnline: boolean;
  clientIp: string;
}

export interface ClassroomSummary {
  totalStudents: number;
  onlineStudents: number;
  avgTemperature: number;
  avgHumidity: number;
  maxTemp: { studentName: string; studentId: string; value: number } | null;
  minTemp: { studentName: string; studentId: string; value: number } | null;
  maxHumidity: { studentName: string; studentId: string; value: number } | null;
  minHumidity: { studentName: string; studentId: string; value: number } | null;
  lastUpdate: string;
}
