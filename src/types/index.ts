export interface SensorTelemetry {
  id: string;
  deviceId: string;
  timestamp: string;
  light: number;            // Lux o porcentaje (0-100% o 0-4095 ADC)
  lightUnit: 'lux' | '%' | 'raw';
  proximity: number;        // Distancia en centímetros
  proximityUnit: 'cm' | 'inch';
  battery?: number;         // Porcentaje de batería 0-100
  clientIp?: string;
  status: 'normal' | 'alert_proximity' | 'alert_light';
  notes?: string;
}

export interface ActuatorState {
  led: boolean;             // LED físico (GPIO 2 en ESP32)
  buzzer: boolean;          // Zumbador o alarma sonora
  ledMode: 'manual' | 'auto'; // Si 'auto', se enciende automáticamente con baja luz o proximidad corta
  proximityThreshold: number; // Umbral en cm para disparar alerta
  lightThreshold: number;     // Umbral de lux para encender luz
  lastUpdated: string;
}

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
  source: 'esp32' | 'browser_sim' | 'curl' | 'other';
}

export interface NetworkConfigInfo {
  serverTime: string;
  endpoints: {
    telemetryPost: string;
    telemetryGet: string;
    actuatorsGet: string;
    actuatorsPost: string;
    logsGet: string;
  };
  samplePayload: Record<string, unknown>;
}
