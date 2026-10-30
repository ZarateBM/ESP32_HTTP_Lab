'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Sun,
  Ruler,
  Terminal,
  Activity,
  Send,
} from 'lucide-react';
import { ActuatorState } from '@/types';

export default function ControlPage() {
  const [actuators, setActuators] = useState<ActuatorState>({
    led: false,
    buzzer: false,
    ledMode: 'auto',
    proximityThreshold: 15,
    lightThreshold: 200,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Cargar estado inicial de los actuadores
  const fetchActuators = async () => {
    try {
      const res = await fetch('/api/actuators');
      if (res.ok) {
        const data = await res.json();
        setActuators(data.actuators);
      }
    } catch (err) {
      console.error('Error fetching actuators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActuators();
  }, []);

  // Enviar cambio al servidor mediante POST /api/actuators
  const updateServerActuators = async (partial: Partial<ActuatorState>) => {
    setUpdating(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/actuators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });

      if (res.ok) {
        const data = await res.json();
        setActuators(data.actuators);
        setFeedbackMsg('¡Comando registrado! El ESP32 lo aplicará en su próxima petición HTTP.');
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error updating actuators:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleLed = () => {
    updateServerActuators({ led: !actuators.led, ledMode: 'manual' });
  };

  const handleToggleBuzzer = () => {
    updateServerActuators({ buzzer: !actuators.buzzer });
  };

  const handleSetMode = (mode: 'auto' | 'manual') => {
    updateServerActuators({ ledMode: mode });
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="card-header-row" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Control de Actuadores y Reglas IoT</span>
            <span className="badge-pill badge-amber">GPIO 2 (LED Físico)</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Controla remotamente el hardware del ESP32 a través de peticiones HTTP.
            Aprende cómo el servidor le ordena al microcontrolador encender o apagar componentes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/dashboard" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Activity size={16} />
            <span>Ver Sensores</span>
          </Link>
          <Link href="/simulator" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Send size={16} />
            <span>Simulador</span>
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            color: '#a7f3d0',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {feedbackMsg}
        </div>
      )}

      <div className="grid-2">
        {/* Panel 1: Estado del LED y Buzzer */}
        <div className="card-glass">
          <div className="card-header-row">
            <div className="card-title">
              <Sliders size={20} color="var(--amber-accent)" />
              <span>Actuador Físico: LED Integrado (GPIO 2)</span>
            </div>
            <span className={`badge-pill ${actuators.led ? 'badge-emerald' : 'badge-cyan'}`}>
              {actuators.led ? 'ESTADO: HIGH (1)' : 'ESTADO: LOW (0)'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1.5rem',
            }}
          >
            {/* Indicador visual del LED */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: actuators.led
                  ? 'radial-gradient(circle, #38bdf8 20%, #0284c7 80%)'
                  : 'rgba(255, 255, 255, 0.05)',
                boxShadow: actuators.led
                  ? '0 0 35px rgba(56, 189, 248, 0.9), 0 0 60px rgba(14, 165, 233, 0.5)'
                  : 'inset 0 0 10px rgba(0, 0, 0, 0.8)',
                border: actuators.led ? '2px solid #ffffff' : '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                transition: 'all 0.3s ease',
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>{actuators.led ? '💡' : '🌑'}</span>
            </div>

            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.3rem' }}>
              LED Azul ESP32: {actuators.led ? 'ENCENDIDO' : 'APAGADO'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Pin físico: GPIO 2 (en tarjeta ESP32 DevKit)
            </div>
          </div>

          {/* Selector de Modo: Automático vs Manual */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Modo de Operación:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                onClick={() => handleSetMode('auto')}
                className={actuators.ledMode === 'auto' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.82rem' }}
              >
                🤖 Automático (Por Umbrales)
              </button>
              <button
                onClick={() => handleSetMode('manual')}
                className={actuators.ledMode === 'manual' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.82rem' }}
              >
                🖐️ Control Manual
              </button>
            </div>
          </div>

          {/* Botón de alternancia manual */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              onClick={handleToggleLed}
              disabled={updating}
              className={actuators.led ? 'btn-danger' : 'btn-primary'}
              style={{ padding: '0.75rem', fontSize: '0.85rem' }}
            >
              {actuators.led ? 'Apagar LED (LOW)' : 'Encender LED (HIGH)'}
            </button>

            <button
              onClick={handleToggleBuzzer}
              disabled={updating}
              className={actuators.buzzer ? 'btn-danger' : 'btn-secondary'}
              style={{ padding: '0.75rem', fontSize: '0.85rem' }}
            >
              {actuators.buzzer ? 'Silenciar Buzzer' : 'Sonar Buzzer'}
            </button>
          </div>
        </div>

        {/* Panel 2: Calibración de Umbrales Didácticos */}
        <div className="card-glass">
          <div className="card-header-row">
            <div className="card-title">
              <Sliders size={20} color="var(--cyan-primary)" />
              <span>Reglas de Automatización en el Servidor</span>
            </div>
            <span className="badge-pill badge-cyan">Lógica de Servidor</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Cuando el modo está en <strong>Automático</strong>, el servidor Next.js evalúa las lecturas
            recibidas por el ESP32. Si se sobrepasan estos umbrales, el servidor responde ordenando
            encender el LED en la respuesta HTTP.
          </p>

          {/* Umbral de Proximidad */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                <Ruler size={16} color="var(--cyan-primary)" />
                <span>Distancia Crítica para Activar Alerta</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--cyan-primary)', fontSize: '1rem' }}>
                {actuators.proximityThreshold} cm
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={actuators.proximityThreshold}
              onChange={(e) => updateServerActuators({ proximityThreshold: Number(e.target.value) })}
              className="range-slider"
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
              Si un objeto se acerca a menos de {actuators.proximityThreshold} cm, el LED se encenderá.
            </div>
          </div>

          {/* Umbral de Luz */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                <Sun size={16} color="var(--amber-accent)" />
                <span>Umbral de Oscuridad para Encender Luz</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--amber-accent)', fontSize: '1rem' }}>
                {actuators.lightThreshold} lux
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="600"
              step="10"
              value={actuators.lightThreshold}
              onChange={(e) => updateServerActuators({ lightThreshold: Number(e.target.value) })}
              className="range-slider"
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
              Si la luz ambiente cae por debajo de {actuators.lightThreshold} lux, el servidor ordenará encender iluminación.
            </div>
          </div>

          {/* Nota Didáctica */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: '1.6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cyan-primary)', fontWeight: 700, marginBottom: '0.3rem' }}>
              <Terminal size={14} />
              <span>¿Cómo se comunica esto con el ESP32?</span>
            </div>
            El ESP32 puede consultar <code>GET /api/actuators</code> o simplemente leer la propiedad <code>actuators</code> que el servidor incluye en la respuesta del <code>POST /api/sensors</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
