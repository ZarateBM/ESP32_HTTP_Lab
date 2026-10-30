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
  Send,
  Users,
  Thermometer,
  Activity,
} from 'lucide-react';

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<'dht11' | 'sensors' | 'dokploy'>('dht11');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const dht11Code = `/*
 ============================================================================
  PROYECTO: ESP32 HTTP LAB - ESTACIÓN DE ALUMNO (DHT11)
  Cada alumno conecta su ESP32 a la misma red WiFi y envía su telemetría.
  El servidor proyecta en la pantalla del aula a cada estudiante en vivo.
 ============================================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

// 1. IDENTIFICACIÓN DEL ESTUDIANTE (¡Pon tu nombre real!)
const char* STUDENT_ID   = "alumno-01";         // Identificador único sin espacios
const char* STUDENT_NAME = "Tu Nombre y Apellido"; // Visible en la pantalla del aula
const char* DESK_NUMBER  = "Mesa 1";            // Ubicación en el aula

// 2. CONFIGURACIÓN WIFI LOCAL (Misma red del aula)
const char* WIFI_SSID     = "WIFI_DEL_AULA";
const char* WIFI_PASSWORD = "PASSWORD_AULA";

// 3. IP LOCAL DEL SERVIDOR DOKPLOY (IP de la computadora del profesor)
//    Ejemplo: http://192.168.1.100:3000
const char* SERVER_BASE_URL = "http://192.168.1.100:3000";

// 4. PINES DE HARDWARE
#define DHTPIN 4           // Pin DATA del DHT11 conectado a GPIO 4
#define DHTTYPE DHT11      // Tipo de sensor
const int PIN_LED_ACTUATOR = 2; // LED azul integrado en el ESP32

DHT dht(DHTPIN, DHTTYPE);
const unsigned long SEND_INTERVAL_MS = 3000;
unsigned long lastSendTime = 0;

void enviarLecturaDHT11(float temperatura, float humedad) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/dht11";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-DHT11-Student/1.0");
  http.setTimeout(4000);

  // Armamos el JSON con la identidad del estudiante
  String payload = "{";
  payload += "\\"studentId\\":\\"" + String(STUDENT_ID) + "\\",";
  payload += "\\"studentName\\":\\"" + String(STUDENT_NAME) + "\\",";
  payload += "\\"deskNumber\\":\\"" + String(DESK_NUMBER) + "\\",";
  payload += "\\"temperature\\":" + String(temperatura, 1) + ",";
  payload += "\\"humidity\\":" + String(humedad, 1) + ",";
  payload += "\\"source\\":\\"esp32\\"";
  payload += "}";

  Serial.println("\\n[HTTP POST] Transmitiendo al servidor del aula...");
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP " + String(httpCode) + "] Respuesta: ");
    Serial.println(response);

    // Si el servidor ordenó activar el LED en la respuesta:
    if (response.indexOf("\\"ledCommand\\":true") != -1) {
      digitalWrite(PIN_LED_ACTUATOR, HIGH);
      Serial.println("[ACTUADOR] -> Servidor ordeno: ENCENDER LED (HIGH)");
    } else if (response.indexOf("\\"ledCommand\\":false") != -1) {
      digitalWrite(PIN_LED_ACTUATOR, LOW);
      Serial.println("[ACTUADOR] -> Servidor ordeno: APAGAR LED (LOW)");
    }
  } else {
    Serial.print("[ERROR] ");
    Serial.println(http.errorToString(httpCode).c_str());
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_LED_ACTUATOR, OUTPUT);
  digitalWrite(PIN_LED_ACTUATOR, LOW);
  dht.begin();

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

  // Triple parpadeo de confirmación
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_LED_ACTUATOR, HIGH);
    delay(100);
    digitalWrite(PIN_LED_ACTUATOR, LOW);
    delay(100);
  }
}

void loop() {
  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;
    float hum = dht.readHumidity();
    float temp = dht.readTemperature();

    if (!isnan(hum) && !isnan(temp)) {
      Serial.print("[DHT11] Temp: " + String(temp, 1) + " C | Hum: " + String(hum, 1) + " % -> ");
      enviarLecturaDHT11(temp, hum);
    }
  }
  delay(10);
}`;

  const curlExample = `curl -X POST http://192.168.1.100:3000/api/dht11 \\
  -H "Content-Type: application/json" \\
  -d '{"studentId":"terminal-01","studentName":"Prueba Terminal","deskNumber":"Mesa 1","temperature":25.2,"humidity":60}'`;

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
            <span>Guía de Hardware y Código ESP32</span>
            <span className="badge-pill badge-emerald">Manual para Estudiantes</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Aprende cómo conectar el sensor DHT11 o los sensores de Luz y Proximidad y cómo se transmiten los datos vía HTTP.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/" className="btn-primary" style={{ fontSize: '0.85rem' }}>
            <Users size={16} />
            <span>Ver Aula DHT11</span>
          </Link>
          <Link href="/dht11-simulador" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Send size={16} />
            <span>Simulador Alumno</span>
          </Link>
        </div>
      </div>

      {/* Selector de Pestaña Didáctica */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('dht11')}
          className={activeTab === 'dht11' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem' }}
        >
          <Thermometer size={16} />
          <span>1. Sensor DHT11 (Multi-Estudiantes)</span>
        </button>

        <button
          onClick={() => setActiveTab('sensors')}
          className={activeTab === 'sensors' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem' }}
        >
          <Activity size={16} />
          <span>2. Sensores Luz (LDR) & Proximidad (HC-SR04)</span>
        </button>

        <button
          onClick={() => setActiveTab('dokploy')}
          className={activeTab === 'dokploy' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem' }}
        >
          <Server size={16} />
          <span>3. Despliegue en Dokploy (LAN)</span>
        </button>
      </div>

      {activeTab === 'dht11' && (
        <>
          {/* Hardware DHT11 */}
          <div className="card-glass" style={{ marginBottom: '1.75rem' }}>
            <div className="card-title" style={{ marginBottom: '1rem' }}>
              <Cpu size={20} color="var(--cyan-primary)" />
              <span>Conexión del Sensor DHT11 al ESP32</span>
            </div>

            <div className="grid-2">
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1rem' }}>
                  El DHT11 mide temperatura ambiental (0-50°C) y humedad relativa (20-90%).
                  Utiliza un protocolo digital de 1 solo cable (*Single-Wire*) para enviar los 40 bits de lectura.
                </p>

                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
                  Esquemático de Conexión:
                </div>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                  <li><strong>VCC (+)</strong>: Conectar al pin <strong>3V3</strong> (o VIN 5V) del ESP32.</li>
                  <li><strong>DATA / OUT (S)</strong>: Conectar al pin <strong>GPIO 4</strong> del ESP32.</li>
                  <li><strong>GND (-)</strong>: Conectar a <strong>GND</strong> común del ESP32.</li>
                  <li><strong>LED Físico</strong>: Usamos el LED azul integrado en placa en <strong>GPIO 2</strong>.</li>
                </ul>
              </div>

              <div
                style={{
                  background: '#030508',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: '#38bdf8',
                  lineHeight: '1.6',
                }}
              >
                <div style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>// Diagrama de Pines:</div>
                <div>DHT11 VCC  ---&gt; ESP32 3V3</div>
                <div>DHT11 DATA ---&gt; ESP32 GPIO 4</div>
                <div>DHT11 GND  ---&gt; ESP32 GND</div>
                <div>LED Alerta ---&gt; ESP32 GPIO 2 (Integrado)</div>
                <br />
                <div style={{ color: '#f59e0b' }}>💡 LIBRERÍA NECESARIA:</div>
                <div style={{ color: '#cbd5e1' }}>
                  En Arduino IDE ve a <em>Programa &gt; Incluir Librería &gt; Administrar Bibliotecas</em> y busca: <strong>DHT sensor library by Adafruit</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Código Arduino DHT11 */}
          <div className="card-glass" style={{ marginBottom: '1.75rem' }}>
            <div className="card-header-row">
              <div>
                <div className="card-title">
                  <Terminal size={20} color="var(--emerald-accent)" />
                  <span>Código Arduino C++ (.ino) para la Estación de Alumno</span>
                </div>
                <div className="card-description">
                  Copia este código en tu Arduino IDE, ingresa tu nombre y la IP del profesor.
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(dht11Code, setCopiedCode)}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedCode ? '¡Código Copiado!' : 'Copiar Código .ino'}</span>
              </button>
            </div>

            <pre className="code-block" style={{ maxHeight: '420px', fontSize: '0.78rem', color: '#e2e8f0' }}>
              {dht11Code}
            </pre>
          </div>

          {/* Prueba cURL */}
          <div className="card-glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                Prueba rápida por consola de comandos (cURL):
              </span>
              <button
                onClick={() => copyToClipboard(curlExample, setCopiedCurl)}
                className="code-badge-copy"
                style={{ position: 'static' }}
              >
                {copiedCurl ? '¡Copiado!' : 'Copiar cURL'}
              </button>
            </div>
            <pre className="code-block" style={{ fontSize: '0.78rem' }}>{curlExample}</pre>
          </div>
        </>
      )}

      {activeTab === 'sensors' && (
        <div className="card-glass">
          <div className="card-title" style={{ marginBottom: '1rem' }}>
            <Activity size={20} color="var(--amber-accent)" />
            <span>Laboratorio de Luz (LDR) y Proximidad (HC-SR04)</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1rem' }}>
            También dispones del módulo de telemetría de luz analógica y radar de ultrasonido.
            Puedes ver las lecturas en la pestaña <Link href="/dashboard" style={{ color: 'var(--cyan-primary)' }}>Luz y Proximidad</Link> o probarlas en el <Link href="/simulator" style={{ color: 'var(--cyan-primary)' }}>Simulador de Luz/Prox</Link>.
          </p>

          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: '1.6',
            }}
          >
            <strong>Pines para Luz y Proximidad:</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem' }}>
              <li><strong>LDR</strong>: Pin analógico <strong>GPIO 34 (ADC1)</strong> con divisor de tensión y resistencia de 10k.</li>
              <li><strong>HC-SR04 Trigger</strong>: Pin digital <strong>GPIO 5</strong>.</li>
              <li><strong>HC-SR04 Echo</strong>: Pin digital <strong>GPIO 18</strong>.</li>
              <li><strong>Endpoint</strong>: <code>POST /api/sensors</code> con payload <code>{`{"light": 450, "proximity": 18.5}`}</code>.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'dokploy' && (
        <div className="card-glass">
          <div className="card-title" style={{ marginBottom: '1rem' }}>
            <Server size={20} color="var(--purple-accent)" />
            <span>Despliegue con Dokploy en la Red Local del Aula</span>
          </div>
          <div className="grid-2">
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
                1. Saber la IP de la máquina de Dokploy:
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '0.8rem' }}>
                En la terminal Linux del servidor ejecuta:
              </p>
              <div className="code-block" style={{ marginBottom: '1rem' }}>
                hostname -I
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Obtendrás una IP como <code>192.168.1.100</code> o <code>192.168.100.2</code>.
                Esa es la dirección que todos los estudiantes deben colocar en su código ESP32.
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
                2. Configuración del Dockerfile en Dokploy:
              </div>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                <li>El proyecto incluye el <code>Dockerfile</code> multi-stage (idéntico al de MotorScope Web).</li>
                <li>Mapea el puerto <code>3000:3000</code>.</li>
                <li>Next.js corre con <code>HOSTNAME=0.0.0.0</code> para escuchar peticiones de la red local.</li>
                <li>Los ESP32 deben estar conectados a la banda <strong>WiFi 2.4 GHz</strong> del router.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
