'use client';

import React, { useId } from 'react';

interface ForwardSonarProps {
  distanceCm: number;
  alertZone: 'safe' | 'warning' | 'danger';
  isOnline?: boolean;
  /** Alcance máximo dibujado en el sonar (cm) */
  maxRangeCm?: number;
}

// Geometría del sonar (coordenadas del viewBox)
const W = 260;
const H = 165;
const CX = W / 2; // posición del sensor (abajo al centro)
const CY = H - 18;
const R_MAX = 130; // radio en px que equivale a maxRangeCm
const HALF_ANGLE = 40; // apertura del cono hacia el frente (±grados)

const ZONE_COLORS = {
  danger: '#ef4444',
  warning: '#f59e0b',
  safe: '#10b981',
};

/** Ángulo 0° = al frente (arriba). Positivo hacia la derecha. */
function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
}

/** Sector anular entre r1 y r2 dentro de [-a, +a] */
function sectorPath(r1: number, r2: number, a: number) {
  const o1 = polar(r2, -a);
  const o2 = polar(r2, a);
  if (r1 <= 0) {
    return `M ${CX} ${CY} L ${o1.x} ${o1.y} A ${r2} ${r2} 0 0 1 ${o2.x} ${o2.y} Z`;
  }
  const i1 = polar(r1, a);
  const i2 = polar(r1, -a);
  return `M ${i2.x} ${i2.y} L ${o1.x} ${o1.y} A ${r2} ${r2} 0 0 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${r1} ${r1} 0 0 0 ${i2.x} ${i2.y} Z`;
}

/** Arco simple de radio r entre [-a, +a] */
function arcPath(r: number, a: number) {
  const p1 = polar(r, -a);
  const p2 = polar(r, a);
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
}

/**
 * Sonar frontal individual: representa el haz del sensor ultrasónico de un
 * estudiante apuntando hacia el frente y dibuja el obstáculo a la distancia medida.
 */
export default function ForwardSonar({
  distanceCm,
  alertZone,
  isOnline = true,
  maxRangeCm = 200,
}: ForwardSonarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const color = ZONE_COLORS[alertZone];
  const cmToPx = (cm: number) => (Math.min(cm, maxRangeCm) / maxRangeCm) * R_MAX;

  const outOfRange = distanceCm > maxRangeCm;
  const objR = Math.max(6, cmToPx(distanceCm));
  const rings = [20, 60, 120, 200].filter((r) => r <= maxRangeCm);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Sonar frontal: obstáculo a ${distanceCm} cm`}
      className={`fwd-sonar ${isOnline ? '' : 'fwd-sonar--offline'}`}
      style={{ display: 'block' }}
    >
      <defs>
        <radialGradient id={`cone-${uid}`} cx={CX} cy={CY} r={R_MAX} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
        </radialGradient>
        <linearGradient id={`sweep-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={sectorPath(0, R_MAX + 2, HALF_ANGLE)} />
        </clipPath>
        <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Cono del haz */}
      <path d={sectorPath(0, R_MAX, HALF_ANGLE)} fill={`url(#cone-${uid})`} stroke="rgba(56,189,248,0.35)" strokeWidth="1" />

      {/* Bandas de zona: peligro / atención */}
      <path d={sectorPath(0, cmToPx(20), HALF_ANGLE)} fill="rgba(239,68,68,0.14)" />
      <path d={sectorPath(cmToPx(20), cmToPx(60), HALF_ANGLE)} fill="rgba(245,158,11,0.08)" />

      {/* Anillos de distancia */}
      {rings.map((cm) => {
        const r = cmToPx(cm);
        const p = polar(r, HALF_ANGLE);
        const ringColor = cm === 20 ? '#ef4444' : cm === 60 ? '#f59e0b' : 'rgba(56,189,248,0.55)';
        return (
          <g key={cm}>
            <path d={arcPath(r, HALF_ANGLE)} fill="none" stroke={ringColor} strokeOpacity="0.55" strokeWidth="1" strokeDasharray={cm === maxRangeCm ? '0' : '3 3'} />
            <text x={p.x + 3} y={p.y + 4} fontSize="11" fill={ringColor} fontFamily="var(--font-mono)">
              {cm}
            </text>
          </g>
        );
      })}

      {/* Contenido animado recortado al cono */}
      <g clipPath={`url(#clip-${uid})`}>
        {/* Ondas de ultrasonido viajando hacia el obstáculo */}
        {isOnline &&
          [0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={outOfRange ? R_MAX : objR}
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="1.5"
              className="fwd-sonar__wave"
              style={{ animationDelay: `${i * 0.6}s`, transformOrigin: `${CX}px ${CY}px` }}
            />
          ))}

        {/* Barrido del haz */}
        {isOnline && (
          <g className="fwd-sonar__sweep" style={{ transformOrigin: `${CX}px ${CY}px` }}>
            <path d={sectorPath(0, R_MAX, 4)} fill={`url(#sweep-${uid})`} />
          </g>
        )}

        {/* Sombra detrás del obstáculo (zona no visible) */}
        {!outOfRange && <path d={sectorPath(objR, R_MAX + 2, HALF_ANGLE)} fill="rgba(3,7,18,0.55)" />}
      </g>

      {/* Línea de medición sensor → obstáculo */}
      <line x1={CX} y1={CY - 6} x2={CX} y2={CY - objR + 4} stroke={color} strokeOpacity="0.7" strokeWidth="1" strokeDasharray="2 3" />

      {/* Obstáculo detectado */}
      {!outOfRange ? (
        <g filter={`url(#glow-${uid})`} className={alertZone === 'danger' ? 'fwd-sonar__obj--danger' : ''}>
          <path d={arcPath(objR, 14)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
        </g>
      ) : (
        <text x={CX} y={CY - R_MAX + 14} textAnchor="middle" fontSize="13" fill="#94a3b8" fontFamily="var(--font-mono)">
          sin obstáculo &gt; {maxRangeCm} cm
        </text>
      )}

      {/* Sensor HY-SR05 (dos transductores) */}
      <g>
        <rect x={CX - 20} y={CY - 4} width="40" height="14" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
        <circle cx={CX - 10} cy={CY + 3} r="4.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
        <circle cx={CX + 10} cy={CY + 3} r="4.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      </g>
    </svg>
  );
}
