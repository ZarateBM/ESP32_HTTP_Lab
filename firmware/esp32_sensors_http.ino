/*
 ============================================================================
  PROYECTO: ESP32 HTTP Lab - Cliente IoT para Demostración Educativa
  OBJETIVO: Enseñar el funcionamiento del protocolo HTTP (Cliente -> Servidor),
            métodos POST y GET, cabeceras (Headers), JSON y códigos de estado.
  COMPATIBLE: ESP32 DevKit v1, ESP32-WROOM-32, NodeMCU ESP32.
  SERVIDOR: Next.js desplegado localmente con Dokploy o Docker (puerto 3000).
 ============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>

// --------------------------------------------------------------------------
// 1. CONFIGURACIÓN DE RED WIFI (Misma red donde corre Dokploy/Next.js)
// --------------------------------------------------------------------------
const char* WIFI_SSID     = "TU_NOMBRE_DE_WIFI";
const char* WIFI_PASSWORD = "TU_PASSWORD_WIFI";

// --------------------------------------------------------------------------
// 2. CONFIGURACIÓN DEL SERVIDOR DOKPLOY / NEXT.JS
//    IMPORTANTE: Coloca la IP local de la computadora/servidor que corre Dokploy.
//    Ejemplo: "http://192.168.1.100:3000"
//    (Puedes saber la IP ejecutando 'ip a' o 'hostname -I' en Linux/Dokploy)
// --------------------------------------------------------------------------
const char* SERVER_BASE_URL = "http://192.168.1.100:3000";

// Identificador único para este ESP32 en el aula
const char* DEVICE_ID = "esp32-aula-lab1";

// Intervalo de envío de telemetría en milisegundos (ej: cada 3 segundos)
const unsigned long SEND_INTERVAL_MS = 3000;
unsigned long lastSendTime = 0;

// --------------------------------------------------------------------------
// 3. PINES DE SENSORES Y ACTUADORES
//    NOTA DIDÁCTICA:
//    - El ESP32 tiene ADC1 (GPIOs 32-39) y ADC2 (GPIOs 0, 2, 4, 12-15, 25-27).
//    - El ADC2 NO puede usarse mientras el WiFi esté transmitiendo.
//    - Por eso, el sensor LDR DEBE conectarse a un pin de ADC1 (ej: GPIO 34 o 36).
// --------------------------------------------------------------------------
const int PIN_LDR_LIGHT      = 34; // Entrada analógica ADC1 para sensor de luz LDR
const int PIN_TRIG_ULTRASONIC = 5;  // Salida Trigger para HC-SR04
const int PIN_ECHO_ULTRASONIC = 18; // Entrada Echo para HC-SR04
const int PIN_LED_ACTUATOR    = 2;  // LED integrado del ESP32 (GPIO 2)

// ==========================================================================
// FUNCIONES DE HARDWARE (SENSORES Y ACTUADORES)
// ==========================================================================

// Leer sensor de luz LDR y convertir a valor representativo (0 a 1000 lux aprox.)
float leerSensorLuz() {
  int rawAdc = analogRead(PIN_LDR_LIGHT); // 0 a 4095 en ESP32 (12 bits)
  
  // Mapeo didáctico: mayor luminosidad = menor resistencia = lectura analógica
  // Ajuste según circuito de divisor de tensión (LDR + resistencia 10k)
  float lux = map(rawAdc, 0, 4095, 20, 1200);
  if (lux < 0) lux = 0;
  return lux;
}

// Leer sensor de proximidad ultrasónico HC-SR04 (distancia en centímetros)
float leerProximidadCm() {
  // Disparar pulso de 10 microsegundos en pin Trigger
  digitalWrite(PIN_TRIG_ULTRASONIC, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG_ULTRASONIC, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG_ULTRASONIC, LOW);

  // Medir el tiempo de ida y vuelta del rebote sónico en microsegundos
  // Timeout de 30000 µs (aprox. 5 metros)
  long duracionUs = pulseIn(PIN_ECHO_ULTRASONIC, HIGH, 30000);

  if (duracionUs == 0) {
    // Si no hay eco dentro del tiempo límite, devolvemos 100 cm (lejos)
    return 100.0;
  }

  // Velocidad del sonido = 343 m/s = 0.0343 cm/µs
  // Distancia = (tiempo * velocidad) / 2
  float distanciaCm = (duracionUs * 0.0343) / 2.0;
  return distanciaCm;
}

// ==========================================================================
// FUNCIONES DE COMUNICACIÓN HTTP
// ==========================================================================

// Enviar telemetría por HTTP POST al servidor Next.js
void enviarTelemetriaHttp(float luz, float proximidad) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi desconectado. Reintentando conexion...");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/sensors";

  Serial.println("\n--------------------------------------------------");
  Serial.print("[HTTP] 1. Iniciando peticion POST hacia: ");
  Serial.println(url);

  http.begin(url);
  
  // Cabeceras HTTP obligatorias para APIs REST
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-HTTP-Client/1.0 (Educativo)");
  http.setTimeout(4000); // 4 segundos de timeout

  // Construcción manual del JSON (sin necesidad de instalar librerías externas)
  String jsonPayload = "{";
  jsonPayload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"light\":" + String(luz, 1) + ",";
  jsonPayload += "\"lightUnit\":\"lux\",";
  jsonPayload += "\"proximity\":" + String(proximidad, 1) + ",";
  jsonPayload += "\"proximityUnit\":\"cm\",";
  jsonPayload += "\"battery\":95";
  jsonPayload += "}";

  Serial.print("[HTTP] 2. Enviando Headers & Payload JSON: ");
  Serial.println(jsonPayload);

  unsigned long requestStartTime = millis();

  // Ejecución de la petición HTTP POST
  int httpResponseCode = http.POST(jsonPayload);
  unsigned long latency = millis() - requestStartTime;

  Serial.print("[HTTP] 3. Codigo de Respuesta HTTP recibido: ");
  Serial.print(httpResponseCode);
  Serial.print(" (Tiempo de ida y vuelta: ");
  Serial.print(latency);
  Serial.println(" ms)");

  if (httpResponseCode > 0) {
    // Lectura de la respuesta enviada por Next.js
    String responseString = http.getString();
    Serial.print("[HTTP] 4. Cuerpo de la respuesta (JSON del servidor): ");
    Serial.println(responseString);

    // DIDÁCTICA: Inspección simple de comando para el LED recibido en la respuesta
    // El servidor devuelve: "actuators":{"led":true,"buzzer":false}
    if (responseString.indexOf("\"led\":true") != -1) {
      digitalWrite(PIN_LED_ACTUATOR, HIGH);
      Serial.println("[ACTUADOR] -> Servidor ordenó: ENCENDER LED (GPIO 2)");
    } else if (responseString.indexOf("\"led\":false") != -1) {
      digitalWrite(PIN_LED_ACTUATOR, LOW);
      Serial.println("[ACTUADOR] -> Servidor ordenó: APAGAR LED (GPIO 2)");
    }
  } else {
    Serial.print("[HTTP ERROR] Fallo al enviar peticion: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
    Serial.println("  Pistas de solucion:");
    Serial.println("  1. Verifica que la IP del servidor sea correcta y este en la misma red.");
    Serial.println("  2. Verifica que el puerto 3000 este abierto en el firewall de Dokploy.");
  }

  http.end(); // Liberar recursos del socket
}

// ==========================================================================
// CONFIGURACIÓN PRINCIPAL (SETUP)
// ==========================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==================================================");
  Serial.println("    ESP32 HTTP LAB - APRENDIENDO LA WEB CON IOT   ");
  Serial.println("==================================================");

  // Configuración de Pines
  pinMode(PIN_LDR_LIGHT, INPUT);
  pinMode(PIN_TRIG_ULTRASONIC, OUTPUT);
  pinMode(PIN_ECHO_ULTRASONIC, INPUT);
  pinMode(PIN_LED_ACTUATOR, OUTPUT);
  digitalWrite(PIN_LED_ACTUATOR, LOW);

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
    Serial.print("[WIFI] Direccion IP asignada al ESP32: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] Puerta de enlace (Router): ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("[WIFI] MAC Address: ");
    Serial.println(WiFi.macAddress());
    
    // Parpadeo de confirmación en el LED
    for (int i = 0; i < 3; i++) {
      digitalWrite(PIN_LED_ACTUATOR, HIGH);
      delay(100);
      digitalWrite(PIN_LED_ACTUATOR, LOW);
      delay(100);
    }
  } else {
    Serial.println("\n[WIFI ERROR] No se pudo conectar a la red WiFi.");
    Serial.println("Verifica el nombre SSID y la contrasena.");
  }
}

// ==========================================================================
// BUCLE PRINCIPAL (LOOP)
// ==========================================================================
void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    // 1. Tomar lecturas de los sensores físicos
    float luz = leerSensorLuz();
    float proximidad = leerProximidadCm();

    Serial.println("\n[SENSORES] Lecturas actuales:");
    Serial.print("  - Luz: ");
    Serial.print(luz, 1);
    Serial.println(" lux");
    Serial.print("  - Proximidad: ");
    Serial.print(proximidad, 1);
    Serial.println(" cm");

    // 2. Transmitir por HTTP al servidor Next.js
    enviarTelemetriaHttp(luz, proximidad);
  }

  // Pequeño descanso para el procesador y tareas de fondo de FreeRTOS
  delay(10);
}
