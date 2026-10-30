/*
 ============================================================================
  PROYECTO: ESP32 HTTP LAB - SALA VIRTUAL (POTENCIÓMETRO ROTATIVO)
  OBJETIVO: Cada estudiante conecta un potenciómetro rotativo miniatura a su
            ESP32 para regular en vivo el brillo de su propia lámpara virtual
            y contribuir al nivel de iluminación de la sala falsa colaborativa.
 ============================================================================
  CONEXIÓN DE HARDWARE:
  - Terminal 1 del potenciómetro  -->  3.3V (3V3) del ESP32
  - Terminal 2 (Pin central/Wiper) -->  GPIO 34 (Canal ADC1 del ESP32)
  - Terminal 3 del potenciómetro  -->  GND del ESP32

  NOTA PEDAGÓGICA IMPORTANTE PARA EL AULA:
  En el ESP32, los pines ADC2 (GPIO 2, 4, 12-15, 25-27) quedan inhabilitados
  mientras el radio Wi-Fi está encendido. Por eso SIEMPRE usamos un pin del
  bloque ADC1 (GPIO 32, 33, 34, 35, 36 o 39) para leer sensores analógicos.
 ============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>

// --------------------------------------------------------------------------
// 1. IDENTIFICACIÓN DEL ESTUDIANTE (¡Cada alumno debe poner sus datos!)
// --------------------------------------------------------------------------
const char* STUDENT_ID   = "208420915";       // Identificador único de carné o usuario
const char* STUDENT_NAME = "Brandon Zarate";  // Tu nombre visible en la pantalla
const char* DESK_NUMBER  = "Mesa 1";          // Tu mesa o número de puesto

// --------------------------------------------------------------------------
// 2. CONFIGURACIÓN DE RED WIFI (Misma red del servidor Dokploy / Aula)
// --------------------------------------------------------------------------
const char* WIFI_SSID     = "";
const char* WIFI_PASSWORD = "";

// --------------------------------------------------------------------------
// 3. IP LOCAL DEL SERVIDOR DOKPLOY / DOCKER
//    Reemplaza con la IP de la computadora del profesor (ej: http://192.168.100.2:3000)
// --------------------------------------------------------------------------
const char* SERVER_BASE_URL = "http://192.168.100.2:3000";

// --------------------------------------------------------------------------
// 4. HARDWARE Y PINES ANALÓGICOS
// --------------------------------------------------------------------------
const int POT_PIN = 34;         // GPIO 34 (ADC1_CHANNEL_6)
const int PIN_LED_STATUS = 2;   // LED integrado del ESP32 (parpadea al transmitir)

// Control de transmisión inteligente:
// - Transmite si el potenciómetro cambia más del 2%
// - O transmite un pulso "latido" (heartbeat) cada 2.5 segundos para marcar presencia
const int THRESHOLD_PERCENT = 2;
const unsigned long HEARTBEAT_INTERVAL_MS = 2500;

int lastSentBrightness = -1;
unsigned long lastSendTime = 0;

// ==========================================================================
// FUNCIÓN: LECTURA Y FILTRADO DEL POTENCIÓMETRO (Promedio de 8 muestras)
// ==========================================================================
int leerAdcFiltrado(int pin) {
  long suma = 0;
  const int MUESTRAS = 8;
  for (int i = 0; i < MUESTRAS; i++) {
    suma += analogRead(pin);
    delayMicroseconds(500);
  }
  return (int)(suma / MUESTRAS);
}

// ==========================================================================
// FUNCIÓN: ENVIAR BRILLO AL SERVIDOR VÍA HTTP POST
// ==========================================================================
void enviarBrilloAlServidor(int brightness, int rawAdc) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Desconectado. Reintentando reconexión...");
    return;
  }

  digitalWrite(PIN_LED_STATUS, HIGH); // Encender LED de actividad

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/dimmer";

  Serial.println("\n--------------------------------------------------");
  Serial.printf("[HTTP] Enviando brillo: %d%% (ADC: %d) -> %s\n", brightness, rawAdc, url.c_str());

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Construir JSON del payload HTTP
  String payload = "{";
  payload += "\"studentId\":\"" + String(STUDENT_ID) + "\",";
  payload += "\"studentName\":\"" + String(STUDENT_NAME) + "\",";
  payload += "\"deskNumber\":\"" + String(DESK_NUMBER) + "\",";
  payload += "\"brightness\":" + String(brightness) + ",";
  payload += "\"rawAdc\":" + String(rawAdc);
  payload += "}";

  unsigned long t0 = millis();
  int httpResponseCode = http.POST(payload);
  unsigned long latencia = millis() - t0;

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Respuesta servidor (Código %d) en %lu ms:\n", httpResponseCode, latencia);
    Serial.printf("       %s\n", response.c_str());
  } else {
    Serial.printf("[HTTP ERROR] Código: %d -> %s\n", httpResponseCode, http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  digitalWrite(PIN_LED_STATUS, LOW); // Apagar LED de actividad
}

// ==========================================================================
// SETUP
// ==========================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n=======================================================");
  Serial.println("  ESP32 HTTP LAB · SALA VIRTUAL (POTENCIÓMETRO ADC)");
  Serial.println("=======================================================");
  Serial.printf(" Estudiante: %s (%s)\n", STUDENT_NAME, STUDENT_ID);
  Serial.printf(" Mesa:       %s\n", DESK_NUMBER);
  Serial.printf(" Pin ADC:    GPIO %d\n", POT_PIN);
  Serial.println("=======================================================\n");

  pinMode(PIN_LED_STATUS, OUTPUT);
  digitalWrite(PIN_LED_STATUS, LOW);

  // Configurar resolución de ADC a 12 bits (rango 0 a 4095) y atenuación de 11dB (0V a ~3.3V)
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // Conectar a la Red Wi-Fi
  Serial.printf("[WIFI] Conectando a la red '%s'...", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_LED_STATUS, LOW);
    Serial.println("\n[WIFI] ¡Conectado exitosamente!");
    Serial.print("[WIFI] Dirección IP asignada al ESP32: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] Dirección MAC: ");
    Serial.println(WiFi.macAddress());
    Serial.print("[WIFI] Intensidad de señal (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n[WIFI ERROR] No se pudo conectar a la red Wi-Fi. Verifica SSID y contraseña.");
  }
}

// ==========================================================================
// LOOP PRINCIPAL
// ==========================================================================
void loop() {
  // Revisa reconexión Wi-Fi si se pierde la señal
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Señal perdida. Reconectando...");
    WiFi.reconnect();
    delay(2000);
    return;
  }

  // 1. Leer el valor analógico del potenciómetro (0 a 4095)
  int rawAdc = leerAdcFiltrado(POT_PIN);

  // 2. Mapear de 0-4095 a porcentaje 0-100% de brillo
  int brightness = map(rawAdc, 0, 4095, 0, 100);
  brightness = constrain(brightness, 0, 100);

  // 3. Determinar si debemos transmitir por cambio o por latido de presencia
  unsigned long now = millis();
  bool cambioSignificativo = abs(brightness - lastSentBrightness) >= THRESHOLD_PERCENT;
  bool tiempoLatidoCumplido = (now - lastSendTime) >= HEARTBEAT_INTERVAL_MS;

  if (cambioSignificativo || tiempoLatidoCumplido) {
    enviarBrilloAlServidor(brightness, rawAdc);
    lastSentBrightness = brightness;
    lastSendTime = now;
  }

  // Pequeño retardo para no saturar el CPU
  delay(100);
}
