'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Radio,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  X,
  Send,
} from 'lucide-react';
import { HttpLog } from '@/types';
import Link from 'next/link';

export default function InspectorPage() {
  const [logs, setLogs] = useState<HttpLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<HttpLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterMethod, setFilterMethod] = useState<'ALL' | 'GET' | 'POST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs?limit=50');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching HTTP logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleClearLogs = async () => {
    if (!confirm('¿Deseas limpiar el historial de paquetes HTTP para reiniciar la clase?')) return;
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      setLogs([]);
      setSelectedLog(null);
    } catch (err) {
      console.error('Error clearing logs:', err);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesMethod = filterMethod === 'ALL' || log.method === filterMethod;
    const matchesSearch =
      searchQuery === '' ||
      log.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.clientIp.includes(searchQuery) ||
      log.userAgent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  return (
    <div>
      {/* Encabezado */}
      <div className="card-header-row" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Inspector de Tráfico HTTP en Vivo</span>
            <span className="badge-pill badge-cyan">Auditoría REST</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Observa en tiempo real cada paquete HTTP que llega desde el ESP32 o el simulador:
            cabeceras, cuerpo JSON, dirección IP y tiempos de respuesta.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
            {autoRefresh ? 'Monitoreo Activo' : 'Pausado'}
          </button>

          <button
            onClick={fetchLogs}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <RefreshCw size={14} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="btn-danger"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <Trash2 size={14} />
            <span>Limpiar Logs</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros Didácticos */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filtrar por Método:</span>
          {(['ALL', 'POST', 'GET'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMethod(m)}
              className={filterMethod === m ? 'badge-pill badge-cyan' : 'btn-secondary'}
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.7rem',
                border: filterMethod === m ? '1px solid var(--cyan-primary)' : '1px solid var(--border-light)',
              }}
            >
              {m === 'ALL' ? 'Todos' : m}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          <Search size={14} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Buscar por IP, ruta o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.82rem',
              width: '220px',
            }}
          />
        </div>
      </div>

      {/* Contenido Principal: Lista de Paquetes y Visor Detallado */}
      <div className="grid-2">
        {/* Lista de Registros HTTP */}
        <div className="card-glass" style={{ padding: '0' }}>
          <div style={{ padding: '1.25rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
              Paquetes Recibidos ({filteredLogs.length})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Haz clic en una fila para ver el detalle
            </span>
          </div>

          <div style={{ maxHeight: '620px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>Cargando paquetes...</div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No hay peticiones registradas con estos filtros.
                <div style={{ marginTop: '0.75rem' }}>
                  <Link href="/simulator" className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    <Send size={14} />
                    <span>Enviar una señal ahora</span>
                  </Link>
                </div>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--cyan-primary)' : '3px solid transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className={log.method === 'POST' ? 'badge-http-post' : 'badge-http-get'}>
                          {log.method}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                          {log.path}
                        </span>
                        {log.studentName && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontWeight: 600 }}>
                            · {log.studentName}
                          </span>
                        )}
                      </div>
                      <span className={`badge-pill ${log.statusCode >= 200 && log.statusCode < 300 ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.68rem' }}>
                        {log.statusCode}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>IP: <strong style={{ color: 'var(--text-muted)' }}>{log.clientIp}</strong></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        <span>{log.latencyMs} ms</span>
                        <span>·</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Visor Detallado del Paquete HTTP Seleccionado */}
        <div>
          {selectedLog ? (
            <div className="card-glass" style={{ position: 'sticky', top: '90px' }}>
              <div className="card-header-row" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={selectedLog.method === 'POST' ? 'badge-http-post' : 'badge-http-get'}>
                      {selectedLog.method}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                      {selectedLog.path}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    ID: {selectedLog.id} · Timestamp: {new Date(selectedLog.timestamp).toISOString()}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLog(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Métricas del paquete */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Código de Estado</div>
                  <div style={{ fontWeight: 700, color: selectedLog.statusCode >= 200 && selectedLog.statusCode < 300 ? 'var(--emerald-accent)' : 'var(--rose-accent)', fontSize: '0.9rem' }}>
                    {selectedLog.statusCode} {selectedLog.statusCode === 201 ? 'Created' : selectedLog.statusCode === 200 ? 'OK' : 'Error'}
                  </div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Tiempo Respuesta</div>
                  <div style={{ fontWeight: 700, color: 'var(--cyan-primary)', fontSize: '0.9rem' }}>
                    {selectedLog.latencyMs} ms
                  </div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Origen Detectado</div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem' }}>
                    {selectedLog.source === 'esp32' ? 'ESP32 Real ⚡' : 'Simulador Web'}
                  </div>
                </div>
              </div>

              {/* Cabeceras HTTP (Headers) */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Cabeceras HTTP de la Petición (Request Headers):
                </div>
                <div className="code-block" style={{ fontSize: '0.75rem', maxHeight: '130px' }}>
                  {Object.entries(selectedLog.requestHeaders).map(([k, v]) => (
                    <div key={k}>
                      <span style={{ color: '#94a3b8' }}>{k}:</span> {v}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cuerpo de la Petición (Request Body) */}
              {selectedLog.requestBody ? (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Cuerpo Enviado por el Cliente (Request Body JSON):
                  </div>
                  <pre className="code-block" style={{ fontSize: '0.75rem', color: '#a5f3fc', maxHeight: '140px' }}>
                    {typeof selectedLog.requestBody === 'string'
                      ? selectedLog.requestBody
                      : JSON.stringify(selectedLog.requestBody, null, 2)}
                  </pre>
                </div>
              ) : null}

              {/* Cuerpo de la Respuesta (Response Body) */}
              {selectedLog.responseBody ? (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Cuerpo Devuelto por el Servidor Next.js (Response Body):
                  </div>
                  <pre className="code-block" style={{ fontSize: '0.75rem', color: '#86efac', maxHeight: '140px' }}>
                    {typeof selectedLog.responseBody === 'string'
                      ? selectedLog.responseBody
                      : JSON.stringify(selectedLog.responseBody, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : (
            <div
              className="card-glass"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '380px',
                textAlign: 'center',
                color: 'var(--text-dim)',
              }}
            >
              <Radio size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Ningún paquete seleccionado
              </div>
              <p style={{ fontSize: '0.82rem', maxWidth: '320px', lineHeight: '1.5' }}>
                Selecciona cualquier fila de la lista de paquetes para analizar sus cabeceras, payload y tiempos de procesamiento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
