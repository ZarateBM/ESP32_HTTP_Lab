import { NextRequest, NextResponse } from 'next/server';
import { LabStore } from '@/lib/store';

// GET /api/actuators - El ESP32 puede consultar esto periódicamente para saber el estado deseado
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const cleanIp = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0];

  const actuators = LabStore.getActuators();
  const responseBody = {
    success: true,
    actuators,
    serverTime: new Date().toISOString(),
  };

  const isEsp32 = userAgent.toLowerCase().includes('esp32');

  LabStore.addHttpLog({
    method: 'GET',
    path: '/api/actuators',
    statusCode: 200,
    clientIp: cleanIp,
    userAgent,
    requestHeaders: Object.fromEntries(request.headers.entries()),
    responseBody,
    latencyMs: Date.now() - startTime,
    source: isEsp32 ? 'esp32' : 'other',
  });

  return NextResponse.json(responseBody, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// POST /api/actuators - La interfaz web o un cliente cambia el estado del LED o Buzzer
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const cleanIp = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0];

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'JSON malformado' },
      { status: 400 }
    );
  }

  const updates: Parameters<typeof LabStore.updateActuators>[0] = {};

  if (typeof body.led === 'boolean') updates.led = body.led;
  if (typeof body.buzzer === 'boolean') updates.buzzer = body.buzzer;
  if (body.ledMode === 'auto' || body.ledMode === 'manual') updates.ledMode = body.ledMode;
  if (typeof body.proximityThreshold === 'number') updates.proximityThreshold = body.proximityThreshold;
  if (typeof body.lightThreshold === 'number') updates.lightThreshold = body.lightThreshold;

  const updatedActuators = LabStore.updateActuators(updates);

  const responseBody = {
    success: true,
    message: 'Estado de actuadores actualizado',
    actuators: updatedActuators,
    note: 'El ESP32 recibirá este estado en su próxima consulta HTTP GET o en la respuesta de su próximo POST.',
  };

  LabStore.addHttpLog({
    method: 'POST',
    path: '/api/actuators',
    statusCode: 200,
    clientIp: cleanIp,
    userAgent,
    requestHeaders: Object.fromEntries(request.headers.entries()),
    requestBody: body,
    responseBody,
    latencyMs: Date.now() - startTime,
    source: 'browser_sim',
  });

  return NextResponse.json(responseBody, { status: 200 });
}
