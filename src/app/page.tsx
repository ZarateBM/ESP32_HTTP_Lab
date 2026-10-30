'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import NetworkDiagram from '@/components/NetworkDiagram';
import {
  Activity,
  Send,
  Sliders,
  Radio,
  BookOpen,
  ArrowUpRight,
  Sun,
  Ruler,
  Terminal,
  Zap,
} from 'lucide-react';
import { SensorTelemetry } from '@/types';

export default function HomePage() {
  const [latestData, setLatestData] = useState<SensorTelemetry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/sensors?limit=1&silent=true');
        if (res.ok) {
          const json = await res.json();
          setLatestData(json.latest || null);
        }
      } catch (err) {
        console.error('Error fetching latest telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, []);

  const featureCards = [
    {
      title: '1. Monitor de Sensores en Vivo',
      desc: 'Visualiza en tiempo real las lecturas de Luz (LDR) y Proximidad (HC-SR04) transmitidas por el ESP32 o el simulador.',
      href: '/dashboard',
      icon: Activity,
      color: 'var(--cyan-primary)',
      badge: 'Visualización',
    },
    {
      title: '2. Simulador de Señales POST',
      desc: '¿No tienes el ESP32 a la mano? Envía lecturas simuladas mediante HTTP POST real y visualiza el paquete exacto generado.',
      href: '/simulator',
      icon: Send,
      color: 'var(--blue-primary)',
      badge: 'Práctica Interactiva',
    },
    {
      title: '3. Control Remoto de Actuadores',
      desc: 'Enciende o apaga el LED físico del ESP32 (GPIO 2) y ajusta los umbrales automáticos de proximidad y luminosidad.',
      href: '/control',
      icon: Sliders,
      color: 'var(--amber-accent)',
      badge: 'IoT Bidireccional',
    },
    {
      title: '4. Inspector de Tráfico HTTP',
      desc: 'Analiza cada paquete HTTP: métodos (GET/POST), cabeceras (Headers), cuerpo JSON, IP del cliente y códigos de estado.',
      href: '/inspector',
      icon: Radio,
      color: 'var(--purple-accent)',
      badge: 'Depuración y Redes',
    },
    {
      title: '5. Guía Didáctica y Código ESP32',
      desc: 'Código Arduino C++ (.ino) completo listo para copiar, diagrama de pines en protoboard y tutorial de Dokploy.',
      href: '/guide',
      icon: BookOpen,
      color: 'var(--emerald-accent)',
      badge: 'Material Docente',
    },
  ];

  return (
    <div>
      {/* Hero Educativo */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(6, 8, 14, 0.95) 100%)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '850px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="badge-pill badge-cyan">Laboratorio Universitario & Escolar</span>
            <span className="badge-pill badge-emerald">Dokploy + Next.js</span>
          </div>

          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1rem',
              letterSpacing: '-0.03em',
            }}
          >
            Aprende cómo funciona la <span style={{ color: 'var(--cyan-primary)' }}>Web con HTTP</span> usando un{' '}
            <span style={{ color: 'var(--blue-primary)' }}>ESP32</span>
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: '1.75rem',
            }}
          >
            Conecta un microcontrolador ESP32 a la misma red WiFi local donde corre tu servidor con Dokploy.
            Descubre en vivo cómo viajan las solicitudes HTTP, los métodos <code>POST</code> y <code>GET</code>,
            las cabeceras JSON y cómo el hardware interactúa con una aplicación web moderna.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn-primary">
              <Activity size={18} />
              <span>Ver Telemetría en Vivo</span>
            </Link>
            <Link href="/simulator" className="btn-secondary">
              <Send size={18} />
              <span>Probar Simulador de Señales</span>
            </Link>
            <Link href="/guide" className="btn-secondary">
              <Terminal size={18} />
              <span>Ver Código Arduino C++</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card-glass">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Luz Actual</span>
            <Sun size={18} color="var(--amber-accent)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {loading ? '...' : `${latestData?.light ?? 0} ${latestData?.lightUnit ?? 'lux'}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            Sensor LDR (Divisor de tensión)
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Proximidad Actual</span>
            <Ruler size={18} color="var(--cyan-primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {loading ? '...' : `${latestData?.proximity ?? 0} ${latestData?.proximityUnit ?? 'cm'}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            Sensor Ultrasónico HC-SR04
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dispositivo Activo</span>
            <Zap size={18} color="var(--emerald-accent)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', wordBreak: 'break-all' }}>
            {loading ? '...' : (latestData?.deviceId || 'Esperando')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            IP: {latestData?.clientIp || '192.168.x.x'}
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estado Servidor</span>
            <span className="badge-pill badge-emerald">Dokploy OK</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--cyan-primary)' }}>
            Puerto 3000
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            Escuchando en 0.0.0.0
          </div>
        </div>
      </div>

      {/* Diagrama de Red Interactivo */}
      <NetworkDiagram />

      {/* Módulos de Aprendizaje */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Módulos del Laboratorio Práctico
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Selecciona una sección para interactuar con la API, inspeccionar paquetes o flashear el microcontrolador:
        </p>
      </div>

      <div className="grid-3">
        {featureCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="card-glass"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.color,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <span className="badge-pill badge-cyan">{card.badge}</span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f8fafc' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {card.desc}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: card.color,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginTop: '1.5rem',
                }}
              >
                <span>Acceder al módulo</span>
                <ArrowUpRight size={16} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
