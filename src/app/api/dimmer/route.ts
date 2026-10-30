import { NextRequest, NextResponse } from 'next/server';
import { LabStore } from '@/lib/store';

// GET /api/dimmer - Obtener estado actual de todas las lámparas y brillo de la sala
export async function GET() {
  const dimmers = LabStore.getAllDimmers();
  const summary = LabStore.getDimmerSummary();

  return NextResponse.json(
    {
      success: true,
      summary,
      totalStudents: dimmers.length,
      dimmers,
      serverTime: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

// POST /api/dimmer - Recibir valor del potenciómetro rotativo de un estudiante
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
    : `pot-${cleanIp.replace(/[^0-9]/g, '').slice(-4) || 'node'}`;

  const studentName = typeof body.studentName === 'string' && body.studentName.trim().length > 0
    ? body.studentName.trim()
    : `Alumno (${studentId})`;

  const deskNumber = typeof body.deskNumber === 'string' ? body.deskNumber.trim() : undefined;

  // El brillo puede venir como "brightness" (0-100) o derivado de "rawAdc" (0-4095)
  let brightnessNum = typeof body.brightness === 'number' ? body.brightness : Number(body.brightness);
  const rawAdc = typeof body.rawAdc === 'number' ? body.rawAdc : (body.rawAdc ? Number(body.rawAdc) : undefined);

  if (isNaN(brightnessNum) && rawAdc !== undefined && !isNaN(rawAdc)) {
    brightnessNum = Math.round((rawAdc / 4095) * 100);
  }

  if (isNaN(brightnessNum)) {
    return NextResponse.json(
      {
        success: false,
        error: 'El campo "brightness" (0-100) o "rawAdc" (0-4095) es obligatorio',
        format: {
          studentId: 'texto (ej: alumno-01)',
          studentName: 'texto (ej: Brandon Zarate)',
          brightness: 'número de 0 a 100 (%)',
          rawAdc: 'opcional, valor de 0 a 4095',
        },
      },
      { status: 422 }
    );
  }

  const { dimmer, summary } = LabStore.registerDimmer({
    studentId,
    studentName,
    deskNumber,
    brightness: brightnessNum,
    rawAdc,
    clientIp: cleanIp,
  });

  return NextResponse.json(
    {
      status: 'success',
      code: 201,
      message: `Brillo actualizado para ${dimmer.studentName}: ${dimmer.brightness}%`,
      student: dimmer.studentName,
      brightness: dimmer.brightness,
      roomSummary: {
        avgBrightness: summary.avgBrightness,
        roomMode: summary.roomMode,
        activeLamps: summary.onlineStudents,
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

// DELETE /api/dimmer - Reiniciar sala virtual
export async function DELETE() {
  LabStore.resetDimmers();
  return NextResponse.json({
    success: true,
    message: 'Sala virtual reiniciada. Todas las lámparas desconectadas.',
  });
}
