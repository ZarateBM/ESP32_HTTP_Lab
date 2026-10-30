'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, Users, Thermometer, Lightbulb, Radar } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [stats, setStats] = useState({
    status: 'online',
    activeStudents: 0,
    totalRegistered: 0,
    uptime: 0,
  });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setStats({
            status: data.status === 'healthy' ? 'online' : 'warn',
            activeStudents: data.activeStudents || 0,
            totalRegistered: data.totalRegistered || 0,
            uptime: data.uptime || 0,
          });
        }
      } catch {
        setStats((prev) => ({ ...prev, status: 'offline' }));
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <header className="top-header">
      <div className="header-container">
        {/* Marca */}
        <div className="brand-wrapper">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div className="brand-icon-chip">
              <Cpu size={22} />
            </div>
            <div>
              <div className="brand-title">ESP32 Classroom · Red IoT</div>
              <div className="brand-subtitle">
                <span>Dokploy + Next.js</span>
                <span className="badge-pill badge-cyan">Red Local de Aula</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Pestañas de Navegación entre Salas */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              background: pathname === '/' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: pathname === '/' ? 'var(--cyan-primary)' : 'var(--text-muted)',
              border: pathname === '/' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-light)',
            }}
          >
            <Thermometer size={16} />
            <span>Aula DHT11 (Clima)</span>
          </Link>

          <Link
            href="/sala-virtual"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              background: pathname === '/sala-virtual' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: pathname === '/sala-virtual' ? 'var(--amber-accent)' : 'var(--text-muted)',
              border: pathname === '/sala-virtual' ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid var(--border-light)',
            }}
          >
            <Lightbulb size={16} />
            <span>Sala Virtual (Brillo)</span>
          </Link>

          <Link
            href="/radar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              background: pathname === '/radar' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: pathname === '/radar' ? 'var(--cyan-primary)' : 'var(--text-muted)',
              border: pathname === '/radar' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-light)',
            }}
          >
            <Radar size={16} />
            <span>Radar HY-SR05 (Distancia)</span>
          </Link>
        </nav>

        {/* Estado en Vivo del Servidor y Estudiantes Conectados */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.82rem',
              color: '#f8fafc',
              fontWeight: 600,
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
            }}
          >
            <Users size={16} color="var(--cyan-primary)" />
            <span>{stats.activeStudents} en línea ({stats.totalRegistered} registrados)</span>
          </div>

          <div className="status-indicator-box">
            <div className="pulse-dot" style={{ backgroundColor: stats.status === 'online' ? '#10b981' : '#f43f5e' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.78rem' }}>
                {stats.status === 'online' ? 'Servidor Activo' : 'Desconectado'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Up: {formatUptime(stats.uptime)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
