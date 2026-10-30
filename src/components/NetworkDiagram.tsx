'use client';

import React, { useState } from 'react';
import { Wifi, Server, Smartphone, Cpu, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface DiagramNode {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  ipExample: string;
  role: string;
  keyConcepts: string[];
  tipsForStudents: string;
}

export default function NetworkDiagram() {
  const [activeNodeId, setActiveNodeId] = useState<string>('esp32');

  const nodes: DiagramNode[] = [
    {
      id: 'esp32',
      title: 'ESP32 (Cliente IoT)',
      subtitle: 'Microcontrolador C++',
      icon: Cpu,
      ipExample: '192.168.1.120 (DHCP)',
      role: 'Lee los sensores físicos (LDR y Ultrasónico) y actúa como Cliente HTTP realizando peticiones POST.',
      keyConcepts: [
        'Usa la librería HTTPClient.h de Arduino',
        'Genera un JSON en memoria y lo serializa',
        'Envía cabecera Content-Type: application/json',
        'Analiza la respuesta HTTP 201 Created recibida'
      ],
      tipsForStudents: '¡Atención! El ESP32 solo soporta redes WiFi de 2.4 GHz. Si tu router tiene red dual (2.4G y 5G), conéctate a la de 2.4G.',
    },
    {
      id: 'wifi',
      title: 'Router WiFi Local',
      subtitle: 'Red de Área Local (LAN)',
      icon: Wifi,
      ipExample: '192.168.1.1 (Gateway)',
      role: 'Interconecta el ESP32 y la computadora del servidor dentro de la misma subred mediante paquetes IP.',
      keyConcepts: [
        'Asigna IPs automáticamente por DHCP',
        'Permite comunicación directa entre dispositivos locales sin salir a Internet',
        'No requiere conexión a Internet externa para que el ESP32 hable con el servidor Dokploy'
      ],
      tipsForStudents: 'Verifica que la red WiFi no tenga "Aislamiento de clientes" (AP Isolation), ya que impediría que el ESP32 hable con tu computadora.',
    },
    {
      id: 'dokploy',
      title: 'Servidor Dokploy / Docker',
      subtitle: 'Host Linux / Servidor',
      icon: Server,
      ipExample: '192.168.1.100:3000',
      role: 'Ejecuta el contenedor Docker con Next.js y mapea el puerto 3000 hacia la red local.',
      keyConcepts: [
        'Despliegue automatizado con el Dockerfile multi-stage',
        'El contenedor escucha en HOSTNAME 0.0.0.0:3000 para aceptar conexiones externas',
        'Traefik / Dokploy gestiona el enrutamiento interno'
      ],
      tipsForStudents: 'Asegúrate de que el firewall de tu sistema operativo permita el tráfico entrante en el puerto 3000 (o el puerto configurado en Dokploy).',
    },
    {
      id: 'browser',
      title: 'Navegador Web (Docente/Alumnos)',
      subtitle: 'Panel React / Next.js',
      icon: Smartphone,
      ipExample: 'Cualquier dispositivo en la red',
      role: 'Consume la API REST para visualizar las señales de los sensores y enviar comandos a los actuadores.',
      keyConcepts: [
        'Actualización en tiempo real vía sondeo (polling)',
        'Inspección visual de cabeceras y payloads HTTP',
        'Permite simular telemetría sin hardware físico'
      ],
      tipsForStudents: 'Cualquier alumno conectado al mismo WiFi puede abrir http://192.168.1.100:3000 en su teléfono o laptop para ver el laboratorio en vivo.',
    },
  ];

  const activeNode = nodes.find((n) => n.id === activeNodeId) || nodes[0];
  const ActiveIcon = activeNode.icon;

  return (
    <div className="card-glass" style={{ marginBottom: '2rem' }}>
      <div className="card-header-row">
        <div>
          <div className="card-title">
            <ShieldCheck size={20} color="var(--cyan-primary)" />
            <span>Mapa de Red y Flujo HTTP en Tiempo Real</span>
          </div>
          <div className="card-description">
            Haz clic en cualquier nodo para explorar cómo viajan los datos desde los pines del microcontrolador hasta la pantalla.
          </div>
        </div>
        <span className="badge-pill badge-cyan">Arquitectura Dokploy + LAN</span>
      </div>

      {/* Flujo de Nodos */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.5rem',
        }}
      >
        {nodes.map((node, index) => {
          const NodeIcon = node.icon;
          const isSelected = node.id === activeNodeId;
          return (
            <React.Fragment key={node.id}>
              <div
                onClick={() => setActiveNodeId(node.id)}
                style={{
                  flex: '1 1 200px',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(79, 172, 254, 0.15))'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid var(--cyan-primary)' : '1px solid var(--border-light)',
                  boxShadow: isSelected ? '0 0 15px rgba(0, 242, 254, 0.25)' : 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--cyan-primary)' : 'rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#06080e' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <NodeIcon size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                      {node.title.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{node.subtitle}</div>
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: isSelected ? 'var(--cyan-primary)' : 'var(--text-muted)',
                  }}
                >
                  {node.ipExample}
                </div>
              </div>

              {index < nodes.length - 1 && (
                <div style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
                  <ArrowRight size={18} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Detalle Explicativo del Nodo Seleccionado */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.15)',
              color: 'var(--cyan-primary)',
            }}
          >
            <ActiveIcon size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{activeNode.title}</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{activeNode.role}</p>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan-primary)', marginBottom: '0.5rem' }}>
              Conceptos Clave para Estudiantes:
            </div>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
              {activeNode.keyConcepts.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--amber-accent)', fontWeight: 700, fontSize: '0.82rem' }}>
              <HelpCircle size={16} />
              <span>Consejo del Docente / Solución de Problemas:</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#fde68a', lineHeight: '1.5' }}>
              {activeNode.tipsForStudents}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
