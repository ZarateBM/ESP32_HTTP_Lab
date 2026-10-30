'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  Sun,
  Sparkles,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Sliders,
  Zap,
} from 'lucide-react';
import { StudentDimmerReading, DimmerClassroomSummary } from '@/types';

export default function VirtualRoomPage() {
  const [dimmers, setDimmers] = useState<StudentDimmerReading[]>([]);
  const [summary, setSummary] = useState<DimmerClassroomSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Control local para simular perilla en pantalla
  const [testStudentName, setTestStudentName] = useState('Mi Potenciómetro');
  const [testBrightness, setTestBrightness] = useState(65);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const fetchRoom = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/dimmer');
      if (res.ok) {
        const data = await res.json();
        setDimmers(data.dimmers || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching virtual room dimmer:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRoom();
    if (!autoRefresh) return;
    const interval = setInterval(fetchRoom, 1500);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchRoom]);

  // Enviar ajuste manual de prueba
  const handleSendTestDimmer = async (val: number) => {
    setTestBrightness(val);
    setIsSendingTest(true);
    try {
      await fetch('/api/dimmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'simulador-aula',
          studentName: testStudentName,
          deskNumber: 'Mesa Demo',
          brightness: val,
        }),
      });
      fetchRoom();
    } catch (err) {
      console.error('Error sending test dimmer:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleResetRoom = async () => {
    if (!confirm('¿Deseas reiniciar la sala virtual y desconectar todas las lámparas?')) return;
    try {
      await fetch('/api/dimmer', { method: 'DELETE' });
      fetchRoom();
    } catch (err) {
      console.error('Error resetting room:', err);
    }
  };

  const avgBrightness = summary?.avgBrightness ?? 50;
  // Factor de iluminación ambiental (0.1 a 1.0)
  const ambientOpacity = Math.max(0.08, avgBrightness / 100);

  const filteredDimmers = dimmers.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.studentName.toLowerCase().includes(q) ||
      d.studentId.toLowerCase().includes(q) ||
      d.deskNumber.toLowerCase().includes(q)
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
              <span className="badge-pill badge-amber">Potenciómetro Rotativo</span>
              <span className="badge-pill badge-cyan">Entrada Analógica ADC (GPIO 34)</span>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '0.6rem' }}>
              Sala Virtual Colaborativa: <span style={{ color: 'var(--amber-accent)' }}>Control de Brillo e Iluminación</span>
            </h1>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '820px', lineHeight: '1.6' }}>
              Al girar el potenciómetro analógico en su ESP32, cada alumno regula en tiempo real la intensidad de su lámpara.
              Toda la sala responde iluminándose o atenuándose según el promedio del aula.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/" className="btn-secondary">
              <Users size={16} />
              <span>Ver Aula DHT11 (Clima)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Métricas Globales de la Sala */}
      <div className="grid-metrics" style={{ marginBottom: '1.75rem' }}>
        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Iluminación General</span>
            <Sun size={18} color="var(--amber-accent)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--amber-accent)', fontFamily: 'var(--font-mono)' }}>
              {avgBrightness}
            </span>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>%</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            Promedio lumínico de la sala
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lámparas Conectadas</span>
            <Lightbulb size={18} color="var(--cyan-primary)" />
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
            <span>Potenciómetros transmitiendo</span>
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mayor Intensidad</span>
            <Zap size={18} color="var(--amber-accent)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem' }}>
            {summary?.highestBrightness ? `${summary.highestBrightness.studentName.split(' ')[0]}` : '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--amber-accent)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
            Nivel: {summary?.highestBrightness ? `${summary.highestBrightness.brightness}%` : '--'}
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Menor Intensidad</span>
            <Sparkles size={18} color="var(--cyan-primary)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem' }}>
            {summary?.lowestBrightness ? `${summary.lowestBrightness.studentName.split(' ')[0]}` : '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
            Nivel: {summary?.lowestBrightness ? `${summary.lowestBrightness.brightness}%` : '--'}
          </div>
        </div>
      </div>

      {/* LA SALA FALSA (HABITACIÓN VIRTUAL INTERACTIVA) */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          minHeight: '440px',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
          overflow: 'hidden',
          transition: 'background 0.5s ease, box-shadow 0.5s ease',
          background: `radial-gradient(ellipse at 50% 30%, rgba(251, 191, 36, ${ambientOpacity * 0.45}) 0%, rgba(15, 23, 42, 0.95) 80%), #050811`,
          boxShadow: `inset 0 0 100px rgba(0, 0, 0, 0.8), 0 0 ${avgBrightness * 0.8}px rgba(251, 191, 36, ${ambientOpacity * 0.3})`,
        }}
      >


        {/* Título de la Sala */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--amber-accent)', fontWeight: 700 }}>
              Simulador de Iluminación Arquitectónica
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
              Habitación Colaborativa de los Estudiantes
            </h3>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: '#f8fafc',
            }}
          >
            <span>Brillo Sala:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--amber-accent)', fontSize: '1rem' }}>
              {avgBrightness}%
            </span>
          </div>
        </div>

        {/* Lámparas Colgantes de los Alumnos */}
        {filteredDimmers.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '220px',
              textAlign: 'center',
              color: 'var(--text-dim)',
            }}
          >
            <Lightbulb size={48} style={{ opacity: 0.35, marginBottom: '1rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
              No hay potenciómetros enviando señales todavía
            </div>
            <p style={{ fontSize: '0.85rem', maxWidth: '420px', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Conecta tu potenciómetro al pin <strong>GPIO 34</strong> del ESP32 o prueba con el regulador virtual de abajo para ver encenderse tu lámpara.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '2.5rem',
              padding: '1rem 0 2rem',
            }}
          >
            {filteredDimmers.map((dimmer) => {
              const b = dimmer.brightness;
              const intensity = Math.max(0.05, b / 100);
              const color = dimmer.lampColor || '#fbbf24';
              // Rotación visual de la perilla de 0 a 270 grados
              const knobRotation = Math.round((b / 100) * 270);

              return (
                <div
                  key={dimmer.studentId}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '150px',
                    position: 'relative',
                  }}
                >
                  {/* Cable colgante */}
                  <div
                    style={{
                      width: '2px',
                      height: '40px',
                      background: 'rgba(255, 255, 255, 0.25)',
                      marginBottom: '0',
                    }}
                  />

                  {/* Lámpara colgante */}
                  <div
                    style={{
                      width: '46px',
                      height: '24px',
                      background: '#1e293b',
                      borderRadius: '16px 16px 4px 4px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: color,
                        opacity: intensity,
                        boxShadow: `0 0 ${b * 0.4}px ${color}, 0 0 ${b * 0.8}px ${color}`,
                        transition: 'all 0.15s ease',
                      }}
                    />
                  </div>

                  {/* Cono de Luz sobre la mesa */}
                  <div
                    style={{
                      width: '140px',
                      height: '130px',
                      background: `radial-gradient(ellipse at 50% 0%, ${color} ${intensity * 45}%, transparent 75%)`,
                      opacity: intensity,
                      filter: 'blur(3px)',
                      pointerEvents: 'none',
                      transition: 'all 0.15s ease',
                      marginBottom: '-40px',
                    }}
                  />

                  {/* Estación del Alumno con Perilla */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${dimmer.isOnline ? color : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      boxShadow: dimmer.isOnline ? `0 4px 20px -5px ${color}66` : 'none',
                      minWidth: '150px',
                      zIndex: 3,
                    }}
                  >
                    {/* Perilla analógica visual */}
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#090d16',
                        border: `2px solid ${color}`,
                        boxShadow: `0 0 10px ${color}44`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        marginBottom: '0.5rem',
                      }}
                      title={`Potenciómetro en ${b}% (ADC: ${dimmer.rawAdc})`}
                    >
                      {/* Indicador de posición de la perilla giratoria */}
                      <div
                        style={{
                          width: '4px',
                          height: '14px',
                          background: color,
                          borderRadius: '2px',
                          position: 'absolute',
                          top: '4px',
                          transformOrigin: '50% 18px',
                          transform: `rotate(${knobRotation - 135}deg)`,
                          transition: 'transform 0.15s ease',
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', zIndex: 1 }}>
                        {b}%
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc', textAlign: 'center' }}>
                      {dimmer.studentName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {dimmer.deskNumber}
                    </div>

                    <div style={{ fontSize: '0.68rem', color: dimmer.isOnline ? 'var(--emerald-accent)' : 'var(--text-dim)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span className={dimmer.isOnline ? 'pulse-online' : 'pulse-offline'} style={{ width: '6px', height: '6px' }} />
                      <span>{dimmer.isOnline ? 'En vivo' : 'Inactivo'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel Inferior: Regulador de Prueba Rápida y Acciones */}
      <div className="grid-2">
        {/* Potenciómetro Virtual de Prueba */}
        <div className="card-glass">
          <div className="card-header-row">
            <div className="card-title">
              <Sliders size={18} color="var(--amber-accent)" />
              <span>Probar Potenciómetro en Pantalla</span>
            </div>
            <span className="badge-pill badge-amber">Regulador Manual</span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
            ¿Aún no has conectado el potenciómetro físico? Mueve este control para probar cómo se ilumina tu lámpara en la sala falsa:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.3rem', fontWeight: 600 }}>
                Nombre de la Lámpara:
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
                Brillo ({testBrightness}%):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '36px' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={testBrightness}
                  onChange={(e) => handleSendTestDimmer(Number(e.target.value))}
                  className="range-slider"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[10, 40, 75, 100].map((preset) => (
              <button
                key={preset}
                onClick={() => handleSendTestDimmer(preset)}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        {/* Guía de Conexión del Potenciómetro para los Alumnos */}
        <div className="card-glass">
          <div className="card-header-row">
            <div className="card-title">
              <Zap size={18} color="var(--cyan-primary)" />
              <span>Conexión de Pines del Potenciómetro</span>
            </div>
            <span className="badge-pill badge-cyan">GPIO 34 (ADC1)</span>
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
            <div>[Pin 1 Pot] ---&gt; 3V3 del ESP32</div>
            <div>[Pin 2 Wiper Central] ---&gt; GPIO 34 (Entrada Analógica ADC1)</div>
            <div>[Pin 3 Pot] ---&gt; GND del ESP32</div>
            <div style={{ color: '#94a3b8', marginTop: '0.4rem' }}>
              {'// Envía: POST /api/dimmer con {"brightness": 75}'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Código disponible en <code>firmware/esp32_potentiometer_student.ino</code>
            </span>
            <button
              onClick={handleResetRoom}
              className="btn-danger"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
            >
              <Trash2 size={13} />
              <span>Limpiar Sala</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
