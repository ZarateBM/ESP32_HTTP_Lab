'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Sun,
  Ruler,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Send,
  Zap,
} from 'lucide-react';
import { SensorTelemetry, ActuatorState } from '@/types';

export default function DashboardPage() {
  const [latest, setLatest] = useState<SensorTelemetry | null>(null);
  const [history, setHistory] = useState<SensorTelemetry[]>([]);
  const [actuators, setActuators] = useState<ActuatorState | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<string>('');

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/sensors?limit=15&silent=true');
      if (res.ok) {
        const data = await res.json();
        setLatest(data.latest || null);
        setHistory(data.history || []);
        setLastFetchTime(new Date().toLocaleTimeString());
      }

      // Obtener actuadores para contrastar
      const actRes = await fetch('/api/actuators');
      if (actRes.ok) {
        const actData = await actRes.json();
        setActuators(actData.actuators || null);
      }
    } catch (err) {
      console.error('Error fetching sensor data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Cálculos visuales para Luz (0 a 1000 lux)
  const currentLight = latest?.light ?? 0;
  const lightPercent = Math.min(100, Math.max(0, (currentLight / 1000) * 100));

  // Cálculos visuales para Proximidad (0 a 100 cm)
  const currentProximity = latest?.proximity ?? 50;
  const proximityPercent = Math.min(100, Math.max(0, (currentProximity / 100) * 100));
  const isProximityAlert = currentProximity < (actuators?.proximityThreshold ?? 15);
  const isLightAlert = currentLight < (actuators?.lightThreshold ?? 200);

  return (
    <div>
      {/* Barra superior de control de telemetría */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Monitor de Sensores en Vivo</span>
            <span className="badge-pill badge-cyan">ESP32 + Dokploy</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Recepción en tiempo real de señales de Luz y Proximidad vía HTTP POST.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: autoRefresh ? 'var(--emerald-accent)' : 'var(--text-dim)',
                display: 'inline-block',
                marginRight: '0.3rem',
              }}
            />
            {autoRefresh ? 'Sondeo Automático (2s)' : 'Pausado'}
          </button>

          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <Link href="/simulator" className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}>
            <Send size={14} />
            <span>Simular Señal</span>
          </Link>
        </div>
      </div>

      {/* Alerta contextual en caso de disparo de umbral */}
      {(isProximityAlert || isLightAlert) && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} color="var(--rose-accent)" />
            <div>
              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                ¡Condición de Alerta Detectada en el Servidor!
              </div>
              <div style={{ fontSize: '0.82rem', color: '#fca5a5' }}>
                {isProximityAlert && `Objeto muy cerca: ${currentProximity} cm (Umbral: ${actuators?.proximityThreshold} cm). `}
                {isLightAlert && `Luminosidad baja: ${currentLight} lux (Umbral: ${actuators?.lightThreshold} lux).`}
              </div>
            </div>
          </div>
          <div className="badge-pill badge-rose">
            LED Físico ESP32: {actuators?.led ? 'ENCENDIDO' : 'APAGADO'}
          </div>
        </div>
      )}

      {/* Tarjetas Principales de Sensores: Luz y Proximidad */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Sensor de Luz */}
        <div className="card-glass" style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div className="card-header-row">
            <div className="card-title">
              <Sun size={20} color="var(--amber-accent)" />
              <span>Sensor de Luz (LDR)</span>
            </div>
            <span className="badge-pill badge-amber">ADC1 GPIO 34</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {currentLight.toFixed(1)}
            </span>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{latest?.lightUnit || 'lux'}</span>
          </div>

          {/* Barra de progreso de luminosidad */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
              <span>Oscuridad (0 lux)</span>
              <span>Intensa (1000+ lux)</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '5px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${lightPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {/* Información Didáctica */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
            }}
          >
            <strong>Diagnóstico: </strong>
            {currentLight > 600
              ? '☀️ Luminosidad alta / Luz solar directa'
              : currentLight > 200
              ? '💡 Luz ambiental adecuada de oficina / aula'
              : '🌙 Ambiente tenue / Luz apagada (Activa alerta)'}
          </div>
        </div>

        {/* Sensor de Proximidad */}
        <div className="card-glass" style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div className="card-header-row">
            <div className="card-title">
              <Ruler size={20} color="var(--cyan-primary)" />
              <span>Sensor de Proximidad (HC-SR04)</span>
            </div>
            <span className="badge-pill badge-cyan">Trig 5 · Echo 18</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {currentProximity.toFixed(1)}
            </span>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{latest?.proximityUnit || 'cm'}</span>
          </div>

          {/* Visualizador de distancia tipo radar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
              <span>Cerca (0 cm)</span>
              <span>Lejos (100+ cm)</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '5px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${proximityPercent}%`,
                  height: '100%',
                  background: isProximityAlert
                    ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                    : 'linear-gradient(90deg, #00f2fe, #4facfe)',
                  boxShadow: isProximityAlert ? '0 0 10px rgba(244, 63, 94, 0.6)' : '0 0 10px rgba(0, 242, 254, 0.5)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {/* Información Didáctica */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
            }}
          >
            <strong>Diagnóstico: </strong>
            {currentProximity < 10
              ? '🚨 ¡Objeto a distancia crítica! (< 10 cm)'
              : currentProximity < 30
              ? '⚠️ Objeto cercano detectado en el campo sónico'
              : '✅ Zona despejada por delante del sensor (> 30 cm)'}
          </div>
        </div>
      </div>

      {/* Dispositivo Emisor y Estado del Actuador */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card-glass">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            ID del Dispositivo Emisor
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--cyan-primary)' }}>
            {latest?.deviceId || 'Sin conexión'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            IP Cliente: {latest?.clientIp || '192.168.x.x'}
          </div>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Estado Actuador LED (GPIO 2)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: actuators?.led ? 'var(--emerald-accent)' : 'var(--text-dim)',
                boxShadow: actuators?.led ? '0 0 10px rgba(16, 185, 129, 0.8)' : 'none',
              }}
            />
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: actuators?.led ? 'var(--emerald-accent)' : '#94a3b8' }}>
              {actuators?.led ? 'ENCENDIDO (HIGH)' : 'APAGADO (LOW)'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Modo: {actuators?.ledMode === 'auto' ? 'Automático por Umbrales' : 'Manual'}
          </div>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Última Actualización HTTP
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
            <Clock size={16} color="var(--blue-primary)" />
            <span>{lastFetchTime || '...'}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Intervalo de muestreo: ~3 seg
          </div>
        </div>
      </div>

      {/* Historial Reciente de Paquetes Recibidos */}
      <div className="card-glass">
        <div className="card-header-row">
          <div>
            <div className="card-title">
              <Zap size={20} color="var(--cyan-primary)" />
              <span>Historial de Telemetría Recibida (Últimos Paquetes)</span>
            </div>
            <div className="card-description">
              Cada fila representa una petición <code>POST /api/sensors</code> enviada por el ESP32 o el simulador.
            </div>
          </div>
          <Link href="/inspector" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>
            Ver en Inspector HTTP
          </Link>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Dispositivo</th>
                <th>IP Origen</th>
                <th>Luz (LDR)</th>
                <th>Proximidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                    No hay lecturas registradas todavía. Envía una señal desde el simulador o conecta el ESP32.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{item.deviceId}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan-primary)' }}>
                      {item.clientIp || '127.0.0.1'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fbbf24' }}>
                      {item.light} {item.lightUnit}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38bdf8' }}>
                      {item.proximity} {item.proximityUnit}
                    </td>
                    <td>
                      {item.status === 'normal' ? (
                        <span className="badge-pill badge-emerald">
                          <CheckCircle2 size={12} />
                          <span>Normal</span>
                        </span>
                      ) : (
                        <span className="badge-pill badge-rose">
                          <AlertTriangle size={12} />
                          <span>{item.status === 'alert_proximity' ? 'Cerca' : 'Baja Luz'}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
