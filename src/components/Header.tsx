'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, Users, Send, Activity, Sliders, Radio, BookOpen } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [stats, setStats] = useState({
    status: 'online',
    totalRequests: 0,
    uptimeSeconds: 0,
  });

  // Polling de salud del servidor y estadísticas para la clase
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setStats({
            status: data.status === 'healthy' ? 'online' : 'warn',
            totalRequests: data.totalRequests || 0,
            uptimeSeconds: data.uptimeSeconds || 0,
          });
        }
      } catch {
        setStats((prev) => ({ ...prev, status: 'offline' }));
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const navItems = [
    { href: '/', label: 'Aula DHT11 (En Vivo)', icon: Users },
    { href: '/dht11-simulador', label: 'Simulador Alumno', icon: Send },
    { href: '/dashboard', label: 'Luz y Proximidad', icon: Activity },
    { href: '/control', label: 'Control Actuadores', icon: Sliders },
    { href: '/inspector', label: 'Inspector HTTP', icon: Radio },
    { href: '/guide', label: 'Código ESP32', icon: BookOpen },
  ];

  return (
    <header className="top-header">
      <div className="header-container">
        {/* Marca y Estado */}
        <div className="brand-wrapper">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-icon-chip">
              <Cpu size={22} />
            </div>
            <div>
              <div className="brand-title">ESP32 HTTP Classroom</div>
              <div className="brand-subtitle">
                <span>Dokploy + Next.js</span>
                <span className="badge-pill badge-cyan">Multi-Estudiantes</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navegación de Pestañas */}
        <nav className="nav-tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Estado en vivo para la clase */}
        <div className="status-indicator-box">
          <div className="pulse-dot" style={{ backgroundColor: stats.status === 'online' ? '#10b981' : '#f43f5e' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.78rem' }}>
              {stats.status === 'online' ? 'Servidor Activo' : 'Desconectado'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {stats.totalRequests} peticiones · Up: {formatUptime(stats.uptimeSeconds)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
