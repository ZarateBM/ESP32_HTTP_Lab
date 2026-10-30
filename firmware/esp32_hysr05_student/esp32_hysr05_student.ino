/*
 ============================================================================
  PROYECTO: ESP32 HTTP LAB - RADAR DE PROXIMIDAD (SENSOR ULTRASÓNICO HY-SR05)
  OBJETIVO: Cada estudiante conecta un sensor de ultrasonido HY-SR05 (o HC-SR04)
            a su ESP32 para medir distancia en tiempo real (ToF) y transmitirla
            vía HTTP POST al servidor Dokploy. La pantalla del aula ubica a cada
            estudiante en un radar táctico interactivo con zonas de alerta.
 ============================================================================
  CONEXIÓN DE HARDWARE (SENSOR HY-SR05 / HC-SR04):
  - Pin VCC       -->  5V / VIN (o 3V3 si tu módulo es compatible con 3.3V)
  - Pin TRIG      -->  GPIO 5 del ESP32 (Salida del pulso de disparo de 10µs)
  - Pin ECHO      -->  GPIO 18 del ESP32 (Entrada del pulso reflejado)
  - Pin OUT       -->  (Sin conectar / Modo 4 pines)
  - Pin GND       -->  GND común del ESP32
  - LED Integrado -->  GPIO 2 (Indica transmisión de datos)

  NOTA PEDAGÓGICA SOBRE EL PRINCIPIO FÍSICO:
  El sensor emite un tren de 8 pulsos ultrasónicos a 40 kHz. La onda viaja por
  el aire a ~343 m/s (0.0343 cm/µs), choca con el obstáculo y rebota hacia el
  receptor. El tiempo total de ida y vuelta (duración del pulso Echo) se calcula como:
       Distancia (cm) = (Tiempo en µs × 0.0343) / 2
 ============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>

// --------------------------------------------------------------------------
// 1. IDENTIFICACIÓN DEL ESTUDIANTE (¡Cada alumno debe poner sus datos!)
// --------------------------------------------------------------------------
const char* STUDENT_ID   = "208420915";       // Tu carné o ID único de estudiante
const char* STUDENT_NAME = "Brandon Zarate";  // Tu nombre visible en la pantalla
const char* DESK_NUMBER  = "Mesa 1";          // Tu puesto de laboratorio

// --------------------------------------------------------------------------
// 2. CONFIGURACIÓN DE RED WIFI (Misma red del servidor Dokploy / Aula)
// --------------------------------------------------------------------------
const char* WIFI_SSID     = "";
const char* WIFI_PASSWORD = "";

// --------------------------------------------------------------------------
// 3. IP LOCAL DEL SERVIDOR DOKPLOY / DOCKER
//    Reemplaza con la IP del servidor de clase (ej: http://192.168.100.2:3000)
// --------------------------------------------------------------------------
const char* SERVER_BASE_URL = "http://192.168.100.2:3000";

// --------------------------------------------------------------------------
// 4. PINES DEL SENSOR ULTRASÓNICO
// --------------------------------------------------------------------------
const int PIN_TRIG = 5;         // Pin Trigger (Emisión)
const int PIN_ECHO = 18;        // Pin Echo (Recepción)
const int PIN_LED_STATUS = 2;   // LED integrado del ESP32

// Control de transmisión inteligente:
// - Transmite si el obstáculo se mueve más de 3.0 cm
// - O transmite un pulso "latido" (heartbeat) cada 2.5 segundos
const float THRESHOLD_CM = 3.0;
const unsigned long HEARTBEAT_INTERVAL_MS = 2500;

float lastSentDistance = -1.0;
unsigned long lastSendTime = 0;

// ==========================================================================
// FUNCIÓN: LECTURA DE DISTANCIA DEL SENSOR HY-SR05
// ==========================================================================
struct ProximityResult {
  float distanceCm;
  long durationUs;
  bool isValid;
};

ProximityResult medirDistancia() {
  ProximityResult res;
  res.distanceCm = 0;
  res.durationUs = 0;
  res.isValid = false;

  // 1. Limpiar el pin TRIG
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);

  // 2. Disparar pulso ultrasónico de 10 microsegundos
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // 3. Medir duración del pulso de retorno en ECHO (Timeout de 30ms = ~5 metros)
  long duration = pulseIn(PIN_ECHO, HIGH, 30000);

  if (duration > 0) {
    // Velocidad del sonido = 343 m/s = 0.0343 cm/us (dividido entre 2 por ida y vuelta)
    float distance = (duration * 0.0343) / 2.0;

    // Rango confiable del sensor HY-SR05 (2 cm a 450 cm)
    if (distance >= 2.0 && distance <= 450.0) {
      res.distanceCm = round(distance * 10.0) / 10.0;
      res.durationUs = duration;
      res.isValid = true;
    }
  }

  return res;
}

// ==========================================================================
// FUNCIÓN: ENVIAR DISTANCIA AL SERVIDOR VÍA HTTP POST
// ==========================================================================
void enviarDistanciaAlServidor(float distanceCm, long durationUs) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Desconectado. Reintentando reconexión...");
    return;
  }

  digitalWrite(PIN_LED_STATUS, HIGH); // Encender LED de actividad

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/proximity";

  Serial.println("\n--------------------------------------------------");
  Serial.printf("[HTTP] Enviando distancia: %.1f cm (Pulso: %ld µs) -> %s\n", distanceCm, durationUs, url.c_str());

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Construir JSON del payload
  String payload = "{";
  payload += "\"studentId\":\"" + String(STUDENT_ID) + "\",";
  payload += "\"studentName\":\"" + String(STUDENT_NAME) + "\",";
  payload += "\"deskNumber\":\"" + String(DESK_NUMBER) + "\",";
  payload += "\"distanceCm\":" + String(distanceCm, 1) + ",";
  payload += "\"durationUs\":" + String(durationUs);
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
  Serial.println("  ESP32 HTTP LAB · RADAR DE PROXIMIDAD (HY-SR05)");
  Serial.println("=======================================================");
  Serial.printf(" Estudiante: %s (%s)\n", STUDENT_NAME, STUDENT_ID);
  Serial.printf(" Mesa:       %s\n", DESK_NUMBER);
  Serial.printf(" Pin Trig:   GPIO %d\n", PIN_TRIG);
  Serial.printf(" Pin Echo:   GPIO %d\n", PIN_ECHO);
  Serial.println("=======================================================\n");

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LED_STATUS, OUTPUT);
  digitalWrite(PIN_TRIG, LOW);
  digitalWrite(PIN_LED_STATUS, LOW);

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

  // 1. Medir distancia ultrasónica
  ProximityResult res = medirDistancia();

  if (res.isValid) {
    unsigned long now = millis();
    bool cambioSignificativo = abs(res.distanceCm - lastSentDistance) >= THRESHOLD_CM;
    bool tiempoLatidoCumplido = (now - lastSendTime) >= HEARTBEAT_INTERVAL_MS;

    if (cambioSignificativo || tiempoLatidoCumplido) {
      enviarDistanciaAlServidor(res.distanceCm, res.durationUs);
      lastSentDistance = res.distanceCm;
      lastSendTime = now;
    }
  }

  // Medir cada 120 ms
  delay(120);
}
