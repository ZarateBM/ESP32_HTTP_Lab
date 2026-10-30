'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Copy,
  Check,
  Terminal,
  Server,
  Cpu,
  Wifi,
  ShieldCheck,
  ArrowRight,
  Send,
  Sliders,
} from 'lucide-react';

export default function GuidePage() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const arduinoCode = `/*
 ============================================================================
  ESP32 HTTP LAB - CLIENTE IOT EDUCATIVO
  Aprende cómo funciona el protocolo HTTP enviando datos de sensores (POST)
  y recibiendo comandos para el LED integrado (GPIO 2).
 ============================================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>

// 1. CONFIGURACIÓN WIFI LOCAL (Misma red del servidor Dokploy)
const char* WIFI_SSID     = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_PASSWORD";

// 2. IP DEL SERVIDOR DOKPLOY / DOCKER (Reemplaza con tu IP local real)
//    Ejemplo: http://192.168.1.100:3000
const char* SERVER_BASE_URL = "http://192.168.1.100:3000";
const char* DEVICE_ID       = "esp32-aula-lab1";

// 3. PINES DE SENSORES Y ACTUADORES
// NOTA: El sensor LDR debe ir a ADC1 (GPIO 34) porque ADC2 se inhabilita con WiFi
const int PIN_LDR_LIGHT       = 34; // Entrada analógica ADC1
const int PIN_TRIG_ULTRASONIC = 5;  // Trigger HC-SR04
const int PIN_ECHO_ULTRASONIC = 18; // Echo HC-SR04
const int PIN_LED_ACTUATOR    = 2;  // LED integrado en placa

const unsigned long SEND_INTERVAL_MS = 3000;
unsigned long lastSendTime = 0;

float leerSensorLuz() {
  int raw = analogRead(PIN_LDR_LIGHT); // 0 a 4095 (12 bits)
  float lux = map(raw, 0, 4095, 20, 1200);
  return (lux < 0) ? 0 : lux;
}

float leerProximidadCm() {
  digitalWrite(PIN_TRIG_ULTRASONIC, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG_ULTRASONIC, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG_ULTRASONIC, LOW);

  long duracion = pulseIn(PIN_ECHO_ULTRASONIC, HIGH, 30000);
  if (duracion == 0) return 100.0;
  return (duracion * 0.0343) / 2.0;
}

void enviarTelemetriaHttp(float luz, float proximidad) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Desconectado. Reintentando...");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/sensors";

  Serial.println("\\n--------------------------------------------------");
  Serial.print("[HTTP] Enviando POST hacia: ");
  Serial.println(url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-HTTP-Client/1.0");
  http.setTimeout(4000);

  // Armamos el JSON manualmente
  String payload = "{";
  payload += "\\"deviceId\\":\\"" + String(DEVICE_ID) + "\\",";
  payload += "\\"light\\":" + String(luz, 1) + ",";
  payload += "\\"lightUnit\\":\\"lux\\",";
  payload += "\\"proximity\\":" + String(proximidad, 1) + ",";
  payload += "\\"proximityUnit\\":\\"cm\\",";
  payload += "\\"battery\\":95";
  payload += "}";

  unsigned long tStart = millis();
  int httpCode = http.POST(payload);
  unsigned long latencia = millis() - tStart;

  Serial.print("[HTTP] Codigo de respuesta: ");
  Serial.print(httpCode);
  Serial.print(" (Latencia: ");
  Serial.print(latencia);
  Serial.println(" ms)");

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP] Cuerpo devuelto: ");
    Serial.println(response);

    // Revisar si el servidor ordenó encender el LED en la respuesta
    if (response.indexOf("\\"led\\":true") != -1) {
      digitalWrite(PIN_LED_ACTUATOR, HIGH);
      Serial.println("[ACTUADOR] -> Servidor ordeno: ENCENDER LED (HIGH)");
    } else if (response.indexOf("\\"led\\":false") != -1) {
      digitalWrite(PIN_LED_ACTUATOR, LOW);
      Serial.println("[ACTUADOR] -> Servidor ordeno: APAGAR LED (LOW)");
    }
  } else {
    Serial.print("[HTTP ERROR] ");
    Serial.println(http.errorToString(httpCode).c_str());
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_LDR_LIGHT, INPUT);
  pinMode(PIN_TRIG_ULTRASONIC, OUTPUT);
  pinMode(PIN_ECHO_ULTRASONIC, INPUT);
  pinMode(PIN_LED_ACTUATOR, OUTPUT);
  digitalWrite(PIN_LED_ACTUATOR, LOW);

  Serial.print("[WIFI] Conectando a: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\\n[WIFI] ¡Conectado!");
  Serial.print("[WIFI] IP del ESP32: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;
    float luz = leerSensorLuz();
    float prox = leerProximidadCm();
    enviarTelemetriaHttp(luz, prox);
  }
  delay(10);
}`;

  const curlExample = `curl -X POST http://192.168.1.100:3000/api/sensors \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId":"terminal-prueba","light":350,"proximity":14.2}'`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="card-header-row" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Guía Didáctica y Código ESP32</span>
            <span className="badge-pill badge-emerald">Material de Clase</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Fundamentos del protocolo HTTP para Internet de las Cosas (IoT), esquemático de pines y despliegue en Dokploy.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/simulator" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Send size={16} />
            <span>Simulador POST</span>
          </Link>
          <Link href="/control" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Sliders size={16} />
            <span>Control de LED</span>
          </Link>
        </div>
      </div>

      {/* Sección 1: ¿Cómo funciona HTTP en IoT? */}
      <div className="card-glass" style={{ marginBottom: '2rem' }}>
        <div className="card-title" style={{ marginBottom: '1rem' }}>
          <BookOpen size={20} color="var(--cyan-primary)" />
          <span>1. Conceptos Fundamentales: ¿Cómo viaja la información por HTTP?</span>
        </div>

        <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1.1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 700, color: 'var(--cyan-primary)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              Petición (HTTP Request)
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              El ESP32 actúa como <strong>Cliente</strong>. Abre una conexión TCP en el puerto 3000 de la IP del servidor y envía el método (<code>POST</code>), la ruta (<code>/api/sensors</code>), cabeceras y el cuerpo JSON.
            </p>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1.1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 700, color: 'var(--emerald-accent)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              Respuesta (HTTP Response)
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              El servidor Next.js procesa la telemetría, responde con un código de estado <code>201 Created</code> y envía comandos en el JSON para que el ESP32 encienda o apague el LED.
            </p>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1.1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 700, color: 'var(--amber-accent)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              Cabeceras (Headers)
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              <code>Content-Type: application/json</code> le avisa al servidor que el cuerpo contiene datos estructurados en formato JSON para que los pueda interpretar automáticamente.
            </p>
          </div>
        </div>

        {/* Prueba rápida con cURL para terminal */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
              Prueba desde la Terminal de cualquier Alumno (cURL):
            </span>
            <button
              onClick={() => copyToClipboard(curlExample, setCopiedCurl)}
              className="code-badge-copy"
              style={{ position: 'static' }}
            >
              {copiedCurl ? '¡Copiado!' : 'Copiar comando cURL'}
            </button>
          </div>
          <pre className="code-block" style={{ fontSize: '0.78rem' }}>{curlExample}</pre>
        </div>
      </div>

      {/* Sección 2: Diagrama de Hardware y Pines */}
      <div className="card-glass" style={{ marginBottom: '2rem' }}>
        <div className="card-title" style={{ marginBottom: '1rem' }}>
          <Cpu size={20} color="var(--blue-primary)" />
          <span>2. Esquemático de Pines y Conexión de Sensores</span>
        </div>

        <div className="grid-2">
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--amber-accent)', marginBottom: '0.5rem' }}>
              Sensor de Luz (LDR + Resistencia 10k):
            </div>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '1rem' }}>
              <li><strong>Pata 1 del LDR:</strong> Conectada a <strong>3V3</strong>.</li>
              <li><strong>Pata 2 del LDR:</strong> Conectada al pin <strong>GPIO 34 (ADC1)</strong>.</li>
              <li><strong>Resistencia de 10k:</strong> Entre <strong>GPIO 34</strong> y <strong>GND</strong> (divisor pull-down).</li>
            </ul>

            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan-primary)', marginBottom: '0.5rem' }}>
              Sensor de Proximidad (HC-SR04 Ultrasónico):
            </div>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
              <li><strong>VCC:</strong> Conectado a <strong>VIN (5V)</strong> del ESP32.</li>
              <li><strong>GND:</strong> Conectado a <strong>GND</strong> común.</li>
              <li><strong>Trigger:</strong> Conectado al pin <strong>GPIO 5</strong> (Salida digital).</li>
              <li><strong>Echo:</strong> Conectado al pin <strong>GPIO 18</strong> (Entrada de pulso).</li>
              <li><strong>LED Actuador:</strong> LED azul integrado en placa en <strong>GPIO 2</strong>.</li>
            </ul>
          </div>

          <div
            style={{
              background: '#040609',
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#38bdf8',
              lineHeight: '1.6',
            }}
          >
            <div style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>// Resumen de Pines ESP32:</div>
            <div>[GPIO 34] &lt;--- Señal Analógica LDR (ADC1)</div>
            <div>[GPIO 5]  ---&gt; Trigger HC-SR04</div>
            <div>[GPIO 18] &lt;--- Echo HC-SR04</div>
            <div>[GPIO 2]  ---&gt; LED Integrado (Actuador)</div>
            <br />
            <div style={{ color: '#f59e0b' }}>⚠️ REGLA DE ORO DE HARDWARE:</div>
            <div style={{ color: '#cbd5e1' }}>
              Nunca uses pines de <strong>ADC2</strong> (GPIOs 0, 2, 4, 12-15, 25-27) para sensores analógicos si el WiFi está encendido. Usa siempre <strong>ADC1</strong> (GPIOs 32-39).
            </div>
          </div>
        </div>
      </div>

      {/* Sección 3: Código Arduino C++ Completo */}
      <div className="card-glass" style={{ marginBottom: '2rem' }}>
        <div className="card-header-row">
          <div>
            <div className="card-title">
              <Terminal size={20} color="var(--emerald-accent)" />
              <span>3. Firmware ESP32 (.ino) Completo para Arduino IDE</span>
            </div>
            <div className="card-description">
              Copia este código en Arduino IDE, ajusta tu SSID, Password e IP local, y flashea tu ESP32.
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(arduinoCode, setCopiedCode)}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            {copiedCode ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedCode ? '¡Código Copiado!' : 'Copiar Código .ino'}</span>
          </button>
        </div>

        <pre className="code-block" style={{ maxHeight: '420px', fontSize: '0.78rem', color: '#e2e8f0' }}>
          {arduinoCode}
        </pre>
      </div>

      {/* Sección 4: Despliegue con Dokploy en Red Local */}
      <div className="card-glass">
        <div className="card-title" style={{ marginBottom: '1rem' }}>
          <Server size={20} color="var(--purple-accent)" />
          <span>4. Cómo Desplegar con Dokploy en la Red Local</span>
        </div>

        <div className="grid-2">
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Paso 1: Obtén la IP Local del Servidor Dokploy
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1rem' }}>
              En la máquina Linux donde corre Dokploy, abre la terminal y ejecuta:
            </p>
            <div className="code-block" style={{ marginBottom: '1rem' }}>
              hostname -I || ip a
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Anotarás una IP tipo <code>192.168.1.100</code> o <code>10.0.0.X</code>. Esa es la IP que colocarás en el ESP32.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Paso 2: Configuración en Dokploy
            </div>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
              <li>Crea una nueva <strong>Aplicación</strong> en Dokploy.</li>
              <li>Selecciona tipo de construcción: <strong>Dockerfile</strong> (usando el Dockerfile de este repositorio).</li>
              <li>Asegúrate de exponer el puerto <strong>3000</strong>.</li>
              <li>Variables de entorno incluidas en Dockerfile: <code>PORT=3000</code> y <code>HOSTNAME=0.0.0.0</code>.</li>
              <li>El ESP32 debe estar conectado exactamente a la misma red WiFi que la máquina del servidor Dokploy.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
