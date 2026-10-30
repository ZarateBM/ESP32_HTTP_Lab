'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Send,
  Sun,
  Ruler,
  Terminal,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Activity,
  Play,
  Square,
} from 'lucide-react';

export default function SimulatorPage() {
  const [deviceId, setDeviceId] = useState('esp32-simulador-alumno');
  const [light, setLight] = useState(520);
  const [proximity, setProximity] = useState(24.5);
  const [battery, setBattery] = useState(90);
  const [isSending, setIsSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<Record<string, unknown> | null>(null);
  const [lastStatus, setLastStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Modo de transmisión continua (como un ESP32 en su loop())
  const [isStreaming, setIsStreaming] = useState(false);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Construcción del Payload JSON didáctico
  const payloadObject = {
    deviceId,
    light: Number(light),
    lightUnit: 'lux',
    proximity: Number(proximity),
    proximityUnit: 'cm',
    battery: Number(battery),
    source: 'simulator',
  };

  const jsonString = JSON.stringify(payloadObject, null, 2);

  // Función para disparar la petición HTTP POST
  const sendPostRequest = async (overrideLight?: number, overrideProximity?: number) => {
    setIsSending(true);
    const startTime = performance.now();

    const bodyToSend = {
      ...payloadObject,
      light: overrideLight !== undefined ? overrideLight : Number(light),
      proximity: overrideProximity !== undefined ? overrideProximity : Number(proximity),
    };

    try {
      const res = await fetch('/api/sensors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ESP32-WebSimulator/1.0 (Classroom)',
        },
        body: JSON.stringify(bodyToSend),
      });

      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setLastStatus(res.status);

      const data = await res.json();
      setLastResponse(data);
    } catch (err) {
      console.error('Error sending simulator POST:', err);
      setLastStatus(500);
      setLastResponse({ error: 'Fallo al comunicarse con el servidor' });
    } finally {
      setIsSending(false);
    }
  };

  // Manejo de transmisión continua
  const toggleStreaming = () => {
    if (isStreaming) {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      setIsStreaming(false);
    } else {
      setIsStreaming(true);
      sendPostRequest(); // Envío inicial
      streamIntervalRef.current = setInterval(() => {
        // Variación aleatoria realista para simular lecturas analógicas continuas
        setLight((prev) => {
          const delta = (Math.random() - 0.5) * 40;
          return Math.max(10, Math.min(1100, Math.round(prev + delta)));
        });
        setProximity((prev) => {
          const delta = (Math.random() - 0.5) * 3;
          return Math.max(2, Math.min(95, Math.round((prev + delta) * 10) / 10));
        });
        sendPostRequest();
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  // Presets didácticos
  const presets = [
    { name: '☀️ Luz Solar Directa', light: 950, proximity: 45 },
    { name: '💡 Aula Iluminada', light: 480, proximity: 30 },
    { name: '🌙 Oscuridad Total (Alerta)', light: 25, proximity: 50 },
    { name: '🚨 Objeto Crítico (< 10cm)', light: 400, proximity: 6.5 },
    { name: '⚠️ Obstáculo Medio (18cm)', light: 420, proximity: 18.0 },
    { name: '✅ Espacio Libre (80cm)', light: 450, proximity: 82.0 },
  ];

  return (
    <div>
      {/* Título y Explicación Didáctica */}
      <div className="card-header-row" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Simulador de Señales de Sensores</span>
            <span className="badge-pill badge-cyan">HTTP POST Lab</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Genera y envía señales de <strong>Luz (LDR)</strong> y <strong>Proximidad (HC-SR04)</strong> directamente al endpoint <code>/api/sensors</code>.
            Ideal para experimentar sin tener la placa física conectada.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={toggleStreaming}
            className={isStreaming ? 'btn-danger' : 'btn-secondary'}
            style={{ fontSize: '0.85rem' }}
          >
            {isStreaming ? (
              <>
                <Square size={14} />
                <span>Detener Transmisión Continua</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Simular Bucle Continuo (3s)</span>
              </>
            )}
          </button>

          <Link href="/dashboard" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Activity size={16} />
            <span>Ver en Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="grid-2">
        {/* Panel Izquierdo: Controles de los Sensores */}
        <div>
          <div className="card-glass" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header-row">
              <div className="card-title">
                <Sparkles size={18} color="var(--cyan-primary)" />
                <span>1. Ajuste de Señales de Sensores</span>
              </div>
              <span className="badge-pill badge-cyan">Entrada de Datos</span>
            </div>

            {/* Identificador del Dispositivo */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                Nombre / ID del Dispositivo (deviceId):
              </label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-light)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Slider Sensor de Luz */}
            <div style={{ marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                  <Sun size={18} color="var(--amber-accent)" />
                  <span>Nivel de Luz (LDR)</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--amber-accent)' }}>
                  {light} lux
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1200"
                step="5"
                value={light}
                onChange={(e) => setLight(Number(e.target.value))}
                className="range-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                <span>0 lux (Noche cerrada)</span>
                <span>500 lux (Aula/Oficina)</span>
                <span>1200 lux (Sol radiante)</span>
              </div>
            </div>

            {/* Slider Sensor de Proximidad */}
            <div style={{ marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                  <Ruler size={18} color="var(--cyan-primary)" />
                  <span>Distancia de Proximidad (HC-SR04)</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyan-primary)' }}>
                  {proximity} cm
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                step="0.5"
                value={proximity}
                onChange={(e) => setProximity(Number(e.target.value))}
                className="range-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                <span style={{ color: proximity < 15 ? 'var(--rose-accent)' : 'inherit' }}>2 cm (Crítico)</span>
                <span>20 cm (Alerta)</span>
                <span>100 cm (Libre)</span>
              </div>
            </div>

            {/* Presets Rápidos Didácticos */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                Escenarios Rápidos de Prueba para Clase:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {presets.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLight(preset.light);
                      setProximity(preset.proximity);
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.45rem 0.6rem', textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón de Envío Principal */}
            <button
              onClick={() => sendPostRequest()}
              disabled={isSending}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              <Send size={18} />
              <span>{isSending ? 'Transmitiendo HTTP POST...' : 'Enviar Señal HTTP POST al Servidor'}</span>
            </button>
          </div>
        </div>

        {/* Panel Derecho: Inspección del Paquete HTTP (Request y Response) */}
        <div>
          {/* Paquete HTTP Request */}
          <div className="card-glass" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header-row">
              <div className="card-title">
                <Terminal size={18} color="var(--blue-primary)" />
                <span>2. Paquete HTTP Request (Lo que envía el ESP32)</span>
              </div>
              <span className="badge-http-post">POST /api/sensors</span>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Cabeceras enviadas:
            </div>
            <div className="code-block" style={{ marginBottom: '0.85rem' }}>
              <div><span style={{ color: '#94a3b8' }}>POST</span> /api/sensors HTTP/1.1</div>
              <div><span style={{ color: '#94a3b8' }}>Host:</span> 192.168.1.100:3000</div>
              <div><span style={{ color: '#94a3b8' }}>Content-Type:</span> application/json</div>
              <div><span style={{ color: '#94a3b8' }}>User-Agent:</span> ESP32-WebSimulator/1.0</div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Cuerpo de la Petición (JSON Payload):
            </div>
            <pre className="code-block" style={{ color: '#a5f3fc' }}>
              {jsonString}
            </pre>
          </div>

          {/* Paquete HTTP Response del Servidor Next.js */}
          <div className="card-glass">
            <div className="card-header-row">
              <div className="card-title">
                <CheckCircle2 size={18} color="var(--emerald-accent)" />
                <span>3. Respuesta del Servidor (HTTP Response)</span>
              </div>
              {lastStatus && (
                <span className={`badge-pill ${lastStatus >= 200 && lastStatus < 300 ? 'badge-emerald' : 'badge-rose'}`}>
                  HTTP {lastStatus} ({latency} ms)
                </span>
              )}
            </div>

            {lastResponse ? (
              <>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Cuerpo devuelto por Next.js en Dokploy:
                </div>
                <pre className="code-block" style={{ color: '#86efac' }}>
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>

                {/* Resaltado didáctico de actuadores devueltos */}
                {lastResponse.actuators ? (
                  <div
                    style={{
                      marginTop: '1rem',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem',
                      fontSize: '0.8rem',
                      color: '#a7f3d0',
                    }}
                  >
                    <strong>💡 Lección Didáctica para Alumnos:</strong>
                    <br />
                    Fíjate que el servidor Next.js devolvió la propiedad <code>actuators.led</code>.
                    El ESP32 analiza este campo inmediatamente y enciende/apaga su LED (GPIO 2) sin necesidad de realizar una consulta adicional.
                  </div>
                ) : null}
              </>
            ) : (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-dim)',
                  fontSize: '0.85rem',
                  border: '1px dashed var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Presiona el botón <strong>&quot;Enviar Señal HTTP POST&quot;</strong> para ejecutar la petición y ver aquí la respuesta exacta devuelta por el servidor.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
