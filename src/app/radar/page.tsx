'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Radio,
  AlertTriangle,
  ShieldCheck,
  Radar,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Sliders,
  Cpu,
  Target,
} from 'lucide-react';
import { StudentProximityReading, ProximityClassroomSummary } from '@/types';
import ForwardSonar from '@/components/ForwardSonar';

export default function RadarProximityPage() {
  const [proximities, setProximities] = useState<StudentProximityReading[]>([]);
  const [summary, setSummary] = useState<ProximityClassroomSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Control local para simular sensor en pantalla
  const [testStudentName, setTestStudentName] = useState('Mi Sensor HY-SR05');
  const [testDistance, setTestDistance] = useState(35);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const fetchProximities = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/proximity');
      if (res.ok) {
        const data = await res.json();
        setProximities(data.proximities || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching proximity radar:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProximities();
    if (!autoRefresh) return;
    const interval = setInterval(fetchProximities, 1500);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchProximities]);

  const handleSendTestDistance = async (dist: number) => {
    setTestDistance(dist);
    setIsSendingTest(true);
    try {
      await fetch('/api/proximity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'simulador-hysr05',
          studentName: testStudentName,
          deskNumber: 'Mesa Demo',
          distanceCm: dist,
          durationUs: Math.round((dist * 2) / 0.0343),
        }),
      });
      fetchProximities();
    } catch (err) {
      console.error('Error sending test proximity:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleResetRadar = async () => {
    if (!confirm('¿Deseas reiniciar el radar y desconectar todos los sensores?')) return;
    try {
      await fetch('/api/proximity', { method: 'DELETE' });
      fetchProximities();
    } catch (err) {
      console.error('Error resetting radar:', err);
    }
  };

  const filteredProximities = proximities.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.studentName.toLowerCase().includes(q) ||
      p.studentId.toLowerCase().includes(q) ||
      p.deskNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Encabezado Principal */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(6, 9, 17, 0.95) 100%)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem 1.75rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="badge-pill badge-cyan">Sensor Ultrasónico HY-SR05</span>
              <span className="badge-pill badge-amber">40 kHz · Trig & Echo</span>
              <span className="badge-pill badge-green">Tiempo de Vuelo (ToF)</span>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '0.6rem' }}>
              Radar Táctico de Aula: <span style={{ color: 'var(--cyan-primary)' }}>Sensor HY-SR05 / Proximidad</span>
            </h1>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '820px', lineHeight: '1.6' }}>
              Cada estudiante transmite por HTTP la distancia de los obstáculos detectados por su sensor ultrasónico.
              Cada alumno tiene su propio sonar frontal que muestra a qué distancia está el objeto frente a su sensor (<span style={{ color: '#ef4444' }}>Crítico &lt;20cm</span>, <span style={{ color: '#f59e0b' }}>Advertencia 20-60cm</span>, <span style={{ color: '#10b981' }}>Seguro &gt;60cm</span>).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/" className="btn-secondary">
              <Users size={16} />
              <span>Aula DHT11</span>
            </Link>
            <Link href="/sala-virtual" className="btn-secondary">
              <Sliders size={16} />
              <span>Sala Brillo</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Métricas Globales del Radar */}
      <div className="grid-metrics" style={{ marginBottom: '1.75rem' }}>
        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Distancia Promedio</span>
            <Radar size={18} color="var(--cyan-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>
              {summary?.avgDistanceCm ?? 0}
            </span>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>cm</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            Media de detección de los alumnos
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sensores Conectados</span>
            <Radio size={18} color="var(--emerald-accent)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
              {summary?.onlineStudents ?? 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
              / {summary?.totalStudents ?? 0} alumnos
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald-accent)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span className="pulse-online" />
            <span>Midiendo ultrasonido en vivo</span>
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Alertas Críticas (&lt;20 cm)</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: (summary?.criticalAlertsCount ?? 0) > 0 ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
              {summary?.criticalAlertsCount ?? 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
              en peligro
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: (summary?.criticalAlertsCount ?? 0) > 0 ? '#ef4444' : 'var(--text-dim)', marginTop: '0.3rem' }}>
            {(summary?.criticalAlertsCount ?? 0) > 0 ? '¡Obstáculos detectados a corta distancia!' : 'Sin colisiones inminentes'}
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Obstáculo Más Cercano</span>
            <Target size={18} color="var(--amber-accent)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem' }}>
            {summary?.closestObstacle ? summary.closestObstacle.studentName.split(' ')[0] : '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--amber-accent)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
            Distancia: {summary?.closestObstacle ? `${summary.closestObstacle.distanceCm} cm` : '--'}
          </div>
        </div>
      </div>

      {/* PANTALLA PRINCIPAL: UN SONAR FRONTAL POR ESTUDIANTE */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
              Sonar Frontal por Estudiante
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              Cada sensor apunta hacia el frente y dibuja el objeto a la distancia medida (alcance 200 cm)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Buscar estudiante o mesa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.45rem 0.8rem 0.45rem 2.1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  width: '210px',
                }}
              />
            </div>

            <button onClick={fetchProximities} className="btn-secondary" style={{ padding: '0.45rem 0.75rem' }} title="Refrescar">
              <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>

        {filteredProximities.length === 0 ? (
          <div className="card-glass" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-dim)' }}>
            <Radio size={40} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
              No hay lecturas de HY-SR05 activas
            </div>
            <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
              Conecta tu sensor <strong>HY-SR05</strong> a los pines <strong>Trig (GPIO 5)</strong> y <strong>Echo (GPIO 18)</strong> de tu ESP32 o usa el simulador interactivo de abajo.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
            }}
          >
            {filteredProximities.map((item) => {
              const isDanger = item.alertZone === 'danger';
              const isWarning = item.alertZone === 'warning';
              const zoneColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

              return (
                <div
                  key={item.studentId}
                  title={`${item.studentName} · ${item.deskNumber}\nPulso Echo: ${item.durationUs} µs\nPaquetes: #${item.packetsCount}\nIP: ${item.clientIp}`}
                  style={{
                    background: 'radial-gradient(ellipse at 50% 100%, rgba(14,165,233,0.12) 0%, rgba(3,7,18,0.95) 70%)',
                    border: '1px solid rgba(56,189,248,0.18)',
                    borderTop: `2px solid ${zoneColor}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.55rem 0.45rem',
                    boxShadow: isDanger ? '0 0 14px rgba(239, 68, 68, 0.25)' : 'none',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  className="sonar-tile"
                >
                  {/* Nombre + estado */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', minWidth: 0 }}>
                    <span className={item.isOnline ? 'pulse-online' : 'pulse-offline'} />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.studentName}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {item.deskNumber}
                    </span>
                  </div>

                  {/* Sonar frontal individual */}
                  <ForwardSonar distanceCm={item.distanceCm} alertZone={item.alertZone} isOnline={item.isOnline} />

                  {/* Distancia */}
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: zoneColor, fontFamily: 'var(--font-mono)' }}>
                      {item.distanceCm}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>cm</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel Inferior: Simulador Manual y Guía de Conexión del HY-SR05 */}
      <div className="grid-2">
        {/* Simulador Manual de Proximidad */}
        <div className="card-glass">
          <div className="card-header-row">
            <div className="card-title">
              <Sliders size={18} color="var(--cyan-primary)" />
              <span>Probar Sensor HY-SR05 en Pantalla</span>
            </div>
            <span className="badge-pill badge-cyan">Simulador Local</span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
            Mueve este control para simular la aproximación de un obstáculo al sensor ultrasónico y observar la respuesta en el radar:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.3rem', fontWeight: 600 }}>
                Nombre del Estudiante:
              </label>
              <input
                type="text"
                value={testStudentName}
                onChange={(e) => setTestStudentName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-light)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.3rem', fontWeight: 600 }}>
                Distancia ({testDistance} cm):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '36px' }}>
                <input
                  type="range"
                  min="4"
                  max="200"
                  value={testDistance}
                  onChange={(e) => handleSendTestDistance(Number(e.target.value))}
                  className="range-slider"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { val: 10, label: '10cm (Peligro)' },
              { val: 35, label: '35cm (Atención)' },
              { val: 80, label: '80cm (Seguro)' },
              { val: 160, label: '160cm (Lejos)' },
            ].map((preset) => (
              <button
                key={preset.val}
                onClick={() => handleSendTestDistance(preset.val)}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.73rem', padding: '0.35rem 0.4rem' }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Guía de Conexión de Pines para Alumnos */}
        <div className="card-glass">
          <div className="card-header-row">
            <div className="card-title">
              <Cpu size={18} color="var(--amber-accent)" />
              <span>Conexión de Pines Sensor HY-SR05</span>
            </div>
            <span className="badge-pill badge-amber">ESP32 + ToF</span>
          </div>

          <div
            style={{
              background: '#040711',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: '#38bdf8',
              lineHeight: '1.6',
              marginBottom: '1rem',
            }}
          >
            <div>[VCC]  ---&gt; 5V / VIN (o 3V3 si es HY-SR05 3.3V compatible)</div>
            <div>[TRIG] ---&gt; GPIO 5 del ESP32 (Salida pulso de 10µs)</div>
            <div>[ECHO] ---&gt; GPIO 18 del ESP32 (Entrada pulso de retorno)</div>
            <div>[GND]  ---&gt; GND común del ESP32</div>
            <div style={{ color: '#94a3b8', marginTop: '0.4rem' }}>
              {'// Envía: POST /api/proximity con {"distanceCm": 35.4}'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Código en <code>firmware/esp32_hysr05_student.ino</code>
            </span>
            <button
              onClick={handleResetRadar}
              className="btn-danger"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
            >
              <Trash2 size={13} />
              <span>Limpiar Radar</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes sonarSweep {
          0% {
            transform: rotate(-36deg);
          }
          50% {
            transform: rotate(36deg);
          }
          100% {
            transform: rotate(-36deg);
          }
        }
        @keyframes sonarWave {
          0% {
            transform: scale(0.05);
            opacity: 0.9;
          }
          85% {
            opacity: 0.6;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        .fwd-sonar__sweep {
          animation: sonarSweep 3s ease-in-out infinite;
        }
        .fwd-sonar__wave {
          animation: sonarWave 1.8s ease-out infinite;
        }
        .fwd-sonar__obj--danger {
          animation: sonarBlink 0.8s ease-in-out infinite;
        }
        @keyframes sonarBlink {
          50% {
            opacity: 0.35;
          }
        }
        .fwd-sonar--offline {
          filter: grayscale(1);
          opacity: 0.45;
        }
        .sonar-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(56, 189, 248, 0.18) !important;
        }
        @keyframes pulseDanger {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.35);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
