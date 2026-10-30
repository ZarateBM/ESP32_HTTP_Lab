// ==========================================
// MODELOS PARA LABORATORIO MULTI-ESTUDIANTE DHT11
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
  ledCommand: boolean;      // Comando enviado al LED físico del ESP32 (GPIO 2)
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
  ledTarget: boolean;
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
// MODELOS PARA SENSORES DE LUZ Y PROXIMIDAD
// ==========================================
export interface SensorTelemetry {
  id: string;
  deviceId: string;
  timestamp: string;
  light: number;            // Lux o porcentaje
  lightUnit: 'lux' | '%' | 'raw';
  proximity: number;        // Distancia en centímetros
  proximityUnit: 'cm' | 'inch';
  battery?: number;
  clientIp?: string;
  status: 'normal' | 'alert_proximity' | 'alert_light';
  notes?: string;
}

export interface ActuatorState {
  led: boolean;             // LED físico (GPIO 2 en ESP32)
  buzzer: boolean;          // Zumbador o alarma
  ledMode: 'manual' | 'auto';
  proximityThreshold: number;
  lightThreshold: number;
  lastUpdated: string;
}

// ==========================================
// AUDITORÍA E INSPECCIÓN DE TRÁFICO HTTP
// ==========================================
export interface HttpLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';
  path: string;
  statusCode: number;
  clientIp: string;
  userAgent: string;
  requestHeaders: Record<string, string>;
  requestBody?: Record<string, unknown> | string | null;
  responseBody?: Record<string, unknown> | string | null;
  latencyMs: number;
  source: 'esp32' | 'browser_sim' | 'curl' | 'simulator' | 'other';
  studentName?: string;
}
