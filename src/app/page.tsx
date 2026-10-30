'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Thermometer,
  Droplets,
  Zap,
  RefreshCw,
  Search,
  Trash2,
  Send,
  Flame,
  Snowflake,
} from 'lucide-react';
import { StudentSession, ClassroomSummary } from '@/types';

export default function ClassroomDashboardPage() {
  const [students, setStudents] = useState<StudentSession[]>([]);
  const [summary, setSummary] = useState<ClassroomSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClassroom = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/dht11');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching classroom DHT11 data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClassroom();
    if (!autoRefresh) return;
    const interval = setInterval(fetchClassroom, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchClassroom]);

  // Reiniciar aula
  const handleResetClassroom = async () => {
    if (!confirm('¿Deseas reiniciar la lista de alumnos para una nueva sesión de clase?')) return;
    try {
      await fetch('/api/dht11', { method: 'DELETE' });
      fetchClassroom();
    } catch (err) {
      console.error('Error resetting classroom:', err);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.deskNumber.toLowerCase().includes(q) ||
      s.clientIp.includes(q)
    );
  });

  return (
    <div>
      {/* Banner Principal del Aula */}
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
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="badge-pill badge-cyan">Red Local de Aula (WiFi)</span>
              <span className="badge-pill badge-emerald">Dokploy + Next.js</span>
            </div>

            <h1
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: '0.6rem',
              }}
            >
              Tablero del Aula: <span style={{ color: 'var(--cyan-primary)' }}>Estudiantes con ESP32 & DHT11</span>
            </h1>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '780px', lineHeight: '1.6' }}>
              Cada estudiante conecta su microcontrolador ESP32 a la misma red WiFi y transmite mediante{' '}
              <code style={{ color: 'var(--cyan-primary)' }}>HTTP POST /api/dht11</code>.
              Cada estación aparece proyectada en tiempo real con su <strong>Temperatura</strong>, <strong>Humedad</strong> y estado de conexión.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/dht11-simulador" className="btn-primary">
              <Send size={16} />
              <span>Simulador del Alumno</span>
            </Link>
            <Link href="/guide" className="btn-secondary">
              <Zap size={16} />
              <span>Código Arduino (.ino)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Globales del Aula */}
      <div className="grid-metrics">
        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Alumnos en Línea</span>
            <Users size={18} color="var(--cyan-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
              {summary?.onlineStudents ?? 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
              / {summary?.totalStudents ?? 0} registrados
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald-accent)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span className="pulse-online" />
            <span>Actualización en tiempo real</span>
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Temperatura Promedio</span>
            <Thermometer size={18} color="var(--amber-accent)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--amber-accent)', fontFamily: 'var(--font-mono)' }}>
              {summary?.avgTemperature ?? '--'}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>°C</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            Media del sensor DHT11 en el aula
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Humedad Promedio</span>
            <Droplets size={18} color="var(--blue-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--blue-primary)', fontFamily: 'var(--font-mono)' }}>
              {summary?.avgHumidity ?? '--'}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            Humedad relativa promedio
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Extremos Térmicos</span>
            <Flame size={18} color="var(--rose-accent)" />
          </div>
          <div style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
            <div>
              <span style={{ color: 'var(--rose-accent)', fontWeight: 700 }}>Más caliente: </span>
              {summary?.maxTemp ? `${summary.maxTemp.studentName.split(' ')[0]} (${summary.maxTemp.value}°C)` : '--'}
            </div>
            <div>
              <span style={{ color: 'var(--cyan-primary)', fontWeight: 700 }}>Más fresco: </span>
              {summary?.minTemp ? `${summary.minTemp.studentName.split(' ')[0]} (${summary.minTemp.value}°C)` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Control */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.65)',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.75rem',
        }}
      >
        {/* Buscador de alumnos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(0, 0, 0, 0.4)', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', flex: '1 1 250px', maxWidth: '380px' }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Buscar por nombre, ID o mesa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              width: '100%',
            }}
          />
        </div>

        {/* Acciones de Aula */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
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
            {autoRefresh ? 'Sondeo Activo (2s)' : 'Pausado'}
          </button>

          <button
            onClick={fetchClassroom}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleResetClassroom}
            className="btn-danger"
            style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
            title="Reiniciar lista para otra clase"
          >
            <Trash2 size={13} />
            <span>Limpiar Aula</span>
          </button>
        </div>
      </div>

      {/* Grid de Todos los Estudiantes Conectados */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Estaciones de los Alumnos ({filteredStudents.length})</span>
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Actualización cada 2 seg · Cada tarjeta corresponde a un ESP32
        </span>
      </div>

      {filteredStudents.length === 0 ? (
        <div
          className="card-glass"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            color: 'var(--text-dim)',
          }}
        >
          <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '0.5rem' }}>
            No hay estudiantes que coincidan con la búsqueda
          </h3>
          <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Diles a los alumnos que compilen el código Arduino en su ESP32 o ingresen al simulador para registrar su estación.
          </p>
          <Link href="/dht11-simulador" className="btn-primary">
            <Send size={16} />
            <span>Abrir Simulador del Alumno</span>
          </Link>
        </div>
      ) : (
        <div className="grid-classroom">
          {filteredStudents.map((student) => {
            const reading = student.latestReading;
            const isHot = reading.temperature > 28;
            const isCold = reading.temperature < 19;

            const tempColor = isHot
              ? 'var(--rose-accent)'
              : isCold
              ? 'var(--cyan-primary)'
              : 'var(--emerald-accent)';

            return (
              <div
                key={student.studentId}
                className={`student-card ${student.isOnline ? 'online' : 'offline'}`}
              >
                {/* Cabecera de la Tarjeta del Estudiante */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={student.isOnline ? 'pulse-online' : 'pulse-offline'} />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                          {student.studentName}
                        </h3>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                        {student.deskNumber} · ID: {student.studentId}
                      </div>
                    </div>

                    <span className={`badge-pill ${student.isOnline ? 'badge-emerald' : 'badge-dim'}`}>
                      {student.isOnline ? 'EN LÍNEA' : 'INACTIVO'}
                    </span>
                  </div>

                  {/* Bloques de Mediciones DHT11 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    {/* Temperatura */}
                    <div className="temp-stat-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Temperatura</span>
                        {isHot ? <Flame size={14} color="var(--rose-accent)" /> : isCold ? <Snowflake size={14} color="var(--cyan-primary)" /> : <Thermometer size={14} color="var(--emerald-accent)" />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: tempColor, fontFamily: 'var(--font-mono)' }}>
                          {reading.temperature.toFixed(1)}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>°C</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                        Sensación: {reading.heatIndex}°C
                      </div>
                    </div>

                    {/* Humedad */}
                    <div className="temp-stat-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Humedad</span>
                        <Droplets size={14} color="var(--blue-primary)" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--blue-primary)', fontFamily: 'var(--font-mono)' }}>
                          {reading.humidity.toFixed(0)}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>%</span>
                      </div>
                      {/* Barra de progreso de humedad */}
                      <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.35rem' }}>
                        <div
                          style={{
                            width: `${Math.min(100, reading.humidity)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estado de Confort & Alertas */}
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span className={`badge-pill ${reading.status === 'optimal' ? 'badge-emerald' : reading.status === 'warning_heat' ? 'badge-rose' : 'badge-amber'}`} style={{ fontSize: '0.68rem' }}>
                      {reading.status === 'optimal'
                        ? '🌿 Confort Óptimo'
                        : reading.status === 'warning_heat'
                        ? '🔥 Alerta Calor (>28°C)'
                        : reading.status === 'warning_cold'
                        ? '❄️ Ambiente Frío (<19°C)'
                        : '💧 Humedad Fuera de Rango'}
                    </span>

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {reading.source === 'esp32' ? 'ESP32 Real ⚡' : 'Simulador 💻'}
                    </span>
                  </div>
                </div>

                {/* Pie de la Tarjeta: Red y paquetes */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    <span>IP: {student.clientIp}</span>
                    <span>{student.packetsCount} paquetes recibidos</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
