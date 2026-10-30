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

// ==========================================
// MODELOS PARA LA SALA VIRTUAL CON POTENCIÓMETRO (DIMMER)
// ==========================================
export interface StudentDimmerReading {
  studentId: string;
  studentName: string;
  deskNumber: string;
  brightness: number;       // Nivel de brillo de 0 a 100%
  rawAdc: number;           // Valor analógico crudo de 0 a 4095
  lampColor: string;        // Color característico de la lámpara del alumno
  timestamp: string;
  lastSeen: string;
  clientIp: string;
  isOnline: boolean;
  packetsCount: number;
}

export interface DimmerClassroomSummary {
  avgBrightness: number;    // Promedio de brillo de toda la sala (0-100%)
  totalStudents: number;
  onlineStudents: number;
  highestBrightness: { studentName: string; brightness: number } | null;
  lowestBrightness: { studentName: string; brightness: number } | null;
  roomMode: 'cine' | 'calido' | 'trabajo';
  lastUpdate: string;
}
