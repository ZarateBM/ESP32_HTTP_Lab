'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Send,
  Thermometer,
  Droplets,
  Terminal,
  CheckCircle2,
  Sparkles,
  Play,
  Square,
  Users,
  AlertTriangle,
  Activity,
} from 'lucide-react';

export default function Dht11SimulatorPage() {
  const [studentId, setStudentId] = useState('alumno-prueba');
  const [studentName, setStudentName] = useState('Mi Nombre (Alumno)');
  const [deskNumber, setDeskNumber] = useState('Mesa 5');
  const [temperature, setTemperature] = useState(25.4);
  const [humidity, setHumidity] = useState(55);
  const [isSending, setIsSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<Record<string, unknown> | null>(null);
  const [lastStatus, setLastStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Modo de bucle continuo (emula el loop() del microcontrolador)
  const [isLooping, setIsLooping] = useState(false);
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const payloadObject = {
    studentId,
    studentName,
    deskNumber,
    temperature: Number(temperature),
    humidity: Number(humidity),
    source: 'simulator',
  };

  const jsonString = JSON.stringify(payloadObject, null, 2);

  const sendPost = async (overrideTemp?: number, overrideHum?: number) => {
    setIsSending(true);
    const start = performance.now();

    const body = {
      ...payloadObject,
      temperature: overrideTemp !== undefined ? overrideTemp : Number(temperature),
      humidity: overrideHum !== undefined ? overrideHum : Number(humidity),
    };

    try {
      const res = await fetch('/api/dht11', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ESP32-DHT11-Student-Simulator/1.0',
        },
        body: JSON.stringify(body),
      });

      const end = performance.now();
      setLatency(Math.round(end - start));
      setLastStatus(res.status);

      const json = await res.json();
      setLastResponse(json);
    } catch (err) {
      console.error('Error sending DHT11 simulator POST:', err);
      setLastStatus(500);
      setLastResponse({ error: 'Fallo al conectar con el servidor' });
    } finally {
      setIsSending(false);
    }
  };

  const toggleLoop = () => {
    if (isLooping) {
      if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
      setIsLooping(false);
    } else {
      setIsLooping(true);
      sendPost();
      loopIntervalRef.current = setInterval(() => {
        // Simular ligeras fluctuaciones térmicas reales
        setTemperature((prev) => {
          const delta = (Math.random() - 0.5) * 0.4;
          return Math.max(16, Math.min(38, Math.round((prev + delta) * 10) / 10));
        });
        setHumidity((prev) => {
          const delta = (Math.random() - 0.5) * 1.5;
          return Math.max(25, Math.min(90, Math.round((prev + delta) * 10) / 10));
        });
        sendPost();
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
    };
  }, []);

  const presets = [
    { name: '🌿 Confort Óptimo (24°C / 50%)', temp: 24.0, hum: 50 },
    { name: '🔥 Calor de Aula (31.5°C / 70%)', temp: 31.5, hum: 70 },
    { name: '❄️ Aire Frío (17.5°C / 40%)', temp: 17.5, hum: 40 },
    { name: '💧 Humedad Alta (26°C / 85%)', temp: 26.0, hum: 85 },
  ];

  return (
    <div>
      {/* Encabezado */}
      <div className="card-header-row" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Simulador de Estación de Alumno (DHT11)</span>
            <span className="badge-pill badge-cyan">Petición HTTP POST</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            ¿No tienes el ESP32 o DHT11 a la mano? Personaliza tu nombre, ajusta tus valores y envíalos.
            Tu tarjeta aparecerá inmediatamente en el tablero del aula con los demás compañeros.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={toggleLoop}
            className={isLooping ? 'btn-danger' : 'btn-secondary'}
            style={{ fontSize: '0.85rem' }}
          >
            {isLooping ? (
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

          <Link href="/" className="btn-primary" style={{ fontSize: '0.85rem' }}>
            <Users size={16} />
            <span>Ver Tablero del Aula</span>
          </Link>
        </div>
      </div>

      <div className="grid-2">
        {/* Formulario de Entrada del Alumno */}
        <div>
          <div className="card-glass" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header-row">
              <div className="card-title">
                <Sparkles size={18} color="var(--cyan-primary)" />
                <span>1. Datos de mi Estación</span>
              </div>
              <span className="badge-pill badge-emerald">Identidad de Alumno</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Nombre del Estudiante:
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-light)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  ID Único (sin espacios):
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--cyan-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Ubicación / Número de Mesa:
              </label>
              <input
                type="text"
                value={deskNumber}
                onChange={(e) => setDeskNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-light)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Sliders de Temperatura y Humedad */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                  <Thermometer size={18} color="var(--amber-accent)" />
                  <span>Temperatura DHT11</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--amber-accent)' }}>
                  {temperature} °C
                </span>
              </div>
              <input
                type="range"
                min="15.0"
                max="40.0"
                step="0.2"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="range-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                <span>15°C (Frío)</span>
                <span>24°C (Confort)</span>
                <span>40°C (Calor extremo)</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                  <Droplets size={18} color="var(--blue-primary)" />
                  <span>Humedad Relativa DHT11</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--blue-primary)' }}>
                  {humidity} %
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(Number(e.target.value))}
                className="range-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                <span>20% (Seco)</span>
                <span>50% (Agradable)</span>
                <span>95% (Húmedo)</span>
              </div>
            </div>

            {/* Presets Didácticos */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
                Escenarios Rápidos:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTemperature(p.temp);
                      setHumidity(p.hum);
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.4rem', justifyContent: 'flex-start' }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              onClick={() => sendPost()}
              disabled={isSending}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              <Send size={18} />
              <span>{isSending ? 'Transmitiendo HTTP POST...' : 'Enviar Señal al Tablero del Aula'}</span>
            </button>
          </div>
        </div>

        {/* Inspección de Paquete HTTP */}
        <div>
          {/* Paquete Enviado */}
          <div className="card-glass" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header-row">
              <div className="card-title">
                <Terminal size={18} color="var(--blue-primary)" />
                <span>2. Paquete HTTP Request (Lo que transmite el ESP32)</span>
              </div>
              <span className="badge-http-post">POST /api/dht11</span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Cabeceras del protocolo:
            </div>
            <div className="code-block" style={{ marginBottom: '0.85rem' }}>
              <div><span style={{ color: '#94a3b8' }}>POST</span> /api/dht11 HTTP/1.1</div>
              <div><span style={{ color: '#94a3b8' }}>Host:</span> 192.168.1.100:3000</div>
              <div><span style={{ color: '#94a3b8' }}>Content-Type:</span> application/json</div>
              <div><span style={{ color: '#94a3b8' }}>User-Agent:</span> ESP32-DHT11-Student/1.0</div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Cuerpo JSON (Payload):
            </div>
            <pre className="code-block" style={{ color: '#a5f3fc' }}>
              {jsonString}
            </pre>
          </div>

          {/* Respuesta del Servidor */}
          <div className="card-glass">
            <div className="card-header-row">
              <div className="card-title">
                <CheckCircle2 size={18} color="var(--emerald-accent)" />
                <span>3. Respuesta del Servidor (HTTP 201 Response)</span>
              </div>
              {lastStatus && (
                <span className={`badge-pill ${lastStatus >= 200 && lastStatus < 300 ? 'badge-emerald' : 'badge-rose'}`}>
                  HTTP {lastStatus} ({latency} ms)
                </span>
              )}
            </div>

            {lastResponse ? (
              <>
                <pre className="code-block" style={{ color: '#86efac', maxHeight: '220px' }}>
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>

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
                  <strong>✨ ¡Estación Registrada!</strong>
                  <br />
                  Abre la pestaña{' '}
                  <Link href="/" style={{ color: 'var(--cyan-primary)', textDecoration: 'underline' }}>
                    Aula DHT11 (En Vivo)
                  </Link>{' '}
                  para ver tu tarjeta en la pantalla con tu nombre <strong>{studentName}</strong>.
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-dim)',
                  fontSize: '0.85rem',
                  border: '1px dashed var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Haz clic en <strong>&quot;Enviar Señal al Tablero del Aula&quot;</strong> para ver aquí la respuesta HTTP generada por Next.js en Dokploy.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
