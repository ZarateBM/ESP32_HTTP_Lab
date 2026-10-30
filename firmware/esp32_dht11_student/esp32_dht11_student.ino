/*
 ============================================================================
  PROYECTO: ESP32 HTTP LAB - ESTACIÓN DE ALUMNO (DHT11)
  OBJETIVO: Cada estudiante conecta su ESP32 con sensor DHT11 a la misma red
 WiFi y envía su temperatura y humedad al servidor Dokploy vía HTTP POST. El
 servidor proyecta en la pantalla del aula a cada estudiante en vivo.
 ============================================================================
  LIBRERÍAS REQUERIDAS EN ARDUINO IDE:
  1. "DHT sensor library" por Adafruit (instalar desde el Gestor de Librerías)
  2. "Adafruit Unified Sensor" (dependencia automática de Adafruit)
 ============================================================================
*/

#include "DHT.h"
#include <HTTPClient.h>
#include <WiFi.h>

// --------------------------------------------------------------------------
// 1. IDENTIFICACIÓN DEL ESTUDIANTE (¡Cada alumno debe poner su nombre!)
// --------------------------------------------------------------------------
const char *STUDENT_ID =
    "208420915"; // Identificador único (ej: alumno-01, diego-z)
const char *STUDENT_NAME =
    "Brandon Zarate";               // Nombre visible en la pantalla del aula
const char *DESK_NUMBER = "Mesa 1"; // Número de mesa o pupitre

// --------------------------------------------------------------------------
// 2. CONFIGURACIÓN DE RED WIFI (Misma red del servidor Dokploy / Aula)
// --------------------------------------------------------------------------
const char *WIFI_SSID = "";
const char *WIFI_PASSWORD = "";

// --------------------------------------------------------------------------
// 3. IP LOCAL DEL SERVIDOR DOKPLOY / DOCKER
//    Reemplaza con la IP de la computadora del profesor (ej:
//    http://192.168.1.100:3000)
// --------------------------------------------------------------------------
const char *SERVER_BASE_URL = "http://192.168.100.2:3000";

// --------------------------------------------------------------------------
// 4. HARDWARE Y PINES
// --------------------------------------------------------------------------
#define DHTPIN 4      // Pin digital del ESP32 conectado al pin DATA del DHT11
#define DHTTYPE DHT11 // Tipo de sensor: DHT 11
const int PIN_LED_ACTUATOR = 2; // LED azul integrado en el ESP32 (GPIO 2)

DHT dht(DHTPIN, DHTTYPE);

// Intervalo de transmisión (ej: cada 3 segundos)
const unsigned long SEND_INTERVAL_MS = 3000;
unsigned long lastSendTime = 0;

// ==========================================================================
// FUNCIÓN: ENVIAR TELEMETRÍA VÍA HTTP POST
// ==========================================================================
void enviarLecturaDHT11(float temperatura, float humedad) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Desconectado. Reintentando reconexión...");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/dht11";

  Serial.println("\n==================================================");
  Serial.print("[HTTP] Enviando datos al Servidor del Aula: ");
  Serial.println(url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-DHT11-Student/1.0");
  http.setTimeout(4000); // 4 segundos de tiempo de espera

  // Construcción del JSON con la identidad del estudiante
  String jsonPayload = "{";
  jsonPayload += "\"studentId\":\"" + String(STUDENT_ID) + "\",";
  jsonPayload += "\"studentName\":\"" + String(STUDENT_NAME) + "\",";
  jsonPayload += "\"deskNumber\":\"" + String(DESK_NUMBER) + "\",";
  jsonPayload += "\"temperature\":" + String(temperatura, 1) + ",";
  jsonPayload += "\"humidity\":" + String(humedad, 1) + ",";
  jsonPayload += "\"source\":\"esp32\"";
  jsonPayload += "}";

  Serial.print("[HTTP] Payload JSON enviado: ");
  Serial.println(jsonPayload);

  unsigned long requestStart = millis();
  int httpResponseCode = http.POST(jsonPayload);
  unsigned long latency = millis() - requestStart;

  Serial.print("[HTTP] Código de Respuesta del Servidor: ");
  Serial.print(httpResponseCode);
  Serial.print(" (Latencia: ");
  Serial.print(latency);
  Serial.println(" ms)");

  if (httpResponseCode > 0) {
    String responseBody = http.getString();
    Serial.print("[HTTP] Respuesta recibida del servidor: ");
    Serial.println(responseBody);

    // DIDÁCTICA: Inspección del comando devuelto por el servidor para el LED
    // Si el servidor envía "ledCommand":true, el LED integrado se enciende
    if (responseBody.indexOf("\"ledCommand\":true") != -1) {
      digitalWrite(PIN_LED_ACTUATOR, HIGH);
      Serial.println("[ACTUADOR] -> El Servidor ordenó: ENCENDER LED (GPIO 2)");
    } else if (responseBody.indexOf("\"ledCommand\":false") != -1) {
      digitalWrite(PIN_LED_ACTUATOR, LOW);
      Serial.println("[ACTUADOR] -> El Servidor ordenó: APAGAR LED (GPIO 2)");
    }
  } else {
    Serial.print("[HTTP ERROR] Fallo en la petición: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
    Serial.println("  Verifica que estés en el mismo WiFi y la IP del servidor "
                   "sea correcta.");
  }

  http.end(); // Liberar socket
}

// ==========================================================================
// CONFIGURACIÓN INICIAL (SETUP)
// ==========================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n**************************************************");
  Serial.println("  ESP32 DHT11 CLASSROOM LAB - ESTACIÓN DE ALUMNO  ");
  Serial.print("  Estudiante: ");
  Serial.println(STUDENT_NAME);
  Serial.print("  ID: ");
  Serial.println(STUDENT_ID);
  Serial.println("**************************************************");

  // Configuración de Pines
  pinMode(PIN_LED_ACTUATOR, OUTPUT);
  digitalWrite(PIN_LED_ACTUATOR, LOW);

  // Iniciar sensor DHT11
  dht.begin();
  Serial.println("[DHT11] Sensor iniciado en GPIO 4.");

  // Conexión WiFi
  Serial.print("[WIFI] Conectando a red: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 30) {
    delay(500);
    Serial.print(".");
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] ¡Conectado exitosamente!");
    Serial.print("[WIFI] IP asignada al ESP32: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] Gateway: ");
    Serial.println(WiFi.gatewayIP());

    // Triple parpadeo de bienvenida
    for (int i = 0; i < 3; i++) {
      digitalWrite(PIN_LED_ACTUATOR, HIGH);
      delay(150);
      digitalWrite(PIN_LED_ACTUATOR, LOW);
      delay(150);
    }
  } else {
    Serial.println(
        "\n[WIFI ERROR] No se pudo conectar. Revisa el SSID y contraseña.");
  }
}

// ==========================================================================
// BUCLE PRINCIPAL (LOOP)
// ==========================================================================
void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    // Lectura del sensor DHT11
    float humedad = dht.readHumidity();
    float temperatura = dht.readTemperature(); // En grados Celsius

    // Comprobar si la lectura falló
    if (isnan(humedad) || isnan(temperatura)) {
      Serial.println("[DHT11 ERROR] Fallo al leer del sensor DHT11. Revisa "
                     "cables en GPIO 4.");
      return;
    }

    Serial.println("\n[SENSORES] Lectura actual de mi estación:");
    Serial.print("  - Temperatura: ");
    Serial.print(temperatura, 1);
    Serial.println(" °C");
    Serial.print("  - Humedad:     ");
    Serial.print(humedad, 1);
    Serial.println(" %");

    // Transmitir al servidor del aula
    enviarLecturaDHT11(temperatura, humedad);
  }

  delay(10);
}
