import { NextRequest, NextResponse } from 'next/server';
import { LabStore } from '@/lib/store';

// GET /api/proximity - Obtener estado actual de todos los sensores de distancia HY-SR05
export async function GET() {
  const proximities = LabStore.getAllProximities();
  const summary = LabStore.getProximitySummary();

  return NextResponse.json(
    {
      success: true,
      summary,
      totalStudents: proximities.length,
      proximities,
      serverTime: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

// POST /api/proximity - Recibir lectura de distancia del sensor HY-SR05 / HC-SR04
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const cleanIp = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0];

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'JSON malformado en la petición' },
      { status: 400 }
    );
  }

  const studentId = typeof body.studentId === 'string' && body.studentId.trim().length > 0
    ? body.studentId.trim()
    : `sr05-${cleanIp.replace(/[^0-9]/g, '').slice(-4) || 'node'}`;

  const studentName = typeof body.studentName === 'string' && body.studentName.trim().length > 0
    ? body.studentName.trim()
    : `Alumno (${studentId})`;

  const deskNumber = typeof body.deskNumber === 'string' ? body.deskNumber.trim() : undefined;

  // La distancia puede venir como "distanceCm" o "distance"
  let distanceCm = typeof body.distanceCm === 'number'
    ? body.distanceCm
    : (typeof body.distance === 'number' ? body.distance : Number(body.distanceCm || body.distance));

  const durationUs = typeof body.durationUs === 'number'
    ? body.durationUs
    : (body.durationUs ? Number(body.durationUs) : undefined);

  // Si no viene distancia pero sí duración del pulso Echo en microsegundos: dist = (t * 0.0343) / 2
  if (isNaN(distanceCm) && durationUs !== undefined && !isNaN(durationUs)) {
    distanceCm = Math.round(((durationUs * 0.0343) / 2) * 10) / 10;
  }

  if (isNaN(distanceCm)) {
    return NextResponse.json(
      {
        success: false,
        error: 'El campo "distanceCm" (en cm) o "durationUs" (en µs) es obligatorio',
        format: {
          studentId: 'texto (ej: alumno-01)',
          studentName: 'texto (ej: Brandon Zarate)',
          distanceCm: 'número decimal o entero en centímetros (ej: 45.2)',
          durationUs: 'opcional, duración del pulso Echo en microsegundos',
          deskNumber: 'opcional, texto (ej: Mesa 1)',
        },
      },
      { status: 422 }
    );
  }

  const { proximity, summary } = LabStore.registerProximity({
    studentId,
    studentName,
    deskNumber,
    distanceCm,
    durationUs,
    clientIp: cleanIp,
  });

  return NextResponse.json(
    {
      status: 'success',
      code: 201,
      message: `Distancia registrada para ${proximity.studentName}: ${proximity.distanceCm} cm`,
      student: proximity.studentName,
      distanceCm: proximity.distanceCm,
      alertZone: proximity.alertZone,
      summary: {
        avgDistanceCm: summary.avgDistanceCm,
        activeSensors: summary.onlineStudents,
        criticalAlertsCount: summary.criticalAlertsCount,
      },
      latencyMs: Date.now() - startTime,
    },
    {
      status: 201,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

// DELETE /api/proximity - Reiniciar lecturas de radar y sensores
export async function DELETE() {
  LabStore.resetProximities();
  return NextResponse.json({
    success: true,
    message: 'Radar reiniciado. Todos los sensores de proximidad desconectados.',
  });
}
