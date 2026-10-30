import { NextRequest, NextResponse } from 'next/server';
import { LabStore } from '@/lib/store';

// GET /api/sensors - Obtener última lectura e historial
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown Client';

  const history = LabStore.getHistory(limit);
  const latest = LabStore.getLatestTelemetry();
  const stats = LabStore.getStats();

  const responseBody = {
    success: true,
    latest,
    history,
    stats,
    serverTime: new Date().toISOString(),
  };

  const latencyMs = Date.now() - startTime;

  // Registrar solicitud en los logs didácticos si no es sondeo masivo
  if (searchParams.get('silent') !== 'true') {
    LabStore.addHttpLog({
      method: 'GET',
      path: '/api/sensors',
      statusCode: 200,
      clientIp: Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0],
      userAgent,
      requestHeaders: Object.fromEntries(request.headers.entries()),
      responseBody,
      latencyMs,
      source: userAgent.toLowerCase().includes('esp32') ? 'esp32' : 'browser_sim',
    });
  }

  return NextResponse.json(responseBody, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Powered-By': 'ESP32-HTTP-Lab-NextJS',
    },
  });
}

// POST /api/sensors - Recibir lecturas de Luz y Proximidad del ESP32 o simulador
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const cleanIp = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0];

  let rawBody: Record<string, unknown> | null = null;
  try {
    rawBody = await request.json();
  } catch {
    const errorResponse = {
      success: false,
      error: 'Formato JSON inválido',
      tip: 'Asegúrate de enviar un cuerpo JSON válido y cabecera Content-Type: application/json',
    };

    LabStore.addHttpLog({
      method: 'POST',
      path: '/api/sensors',
      statusCode: 400,
      clientIp: cleanIp,
      userAgent,
      requestHeaders: Object.fromEntries(request.headers.entries()),
      requestBody: 'Invalid JSON',
      responseBody: errorResponse,
      latencyMs: Date.now() - startTime,
      source: userAgent.toLowerCase().includes('esp32') ? 'esp32' : 'other',
    });

    return NextResponse.json(errorResponse, { status: 400 });
  }

  // Validación de campos clave didáctica
  const light = typeof rawBody?.light === 'number' ? rawBody.light : Number(rawBody?.light);
  const proximity = typeof rawBody?.proximity === 'number' ? rawBody.proximity : Number(rawBody?.proximity);

  if (isNaN(light) || isNaN(proximity)) {
    const errorResponse = {
      success: false,
      error: 'Campos requeridos faltantes o no numéricos',
      required: {
        light: 'Número (ej: 450 en lux)',
        proximity: 'Número (ej: 18.5 en cm)',
      },
      received: rawBody,
    };

    LabStore.addHttpLog({
      method: 'POST',
      path: '/api/sensors',
      statusCode: 422,
      clientIp: cleanIp,
      userAgent,
      requestHeaders: Object.fromEntries(request.headers.entries()),
      requestBody: rawBody,
      responseBody: errorResponse,
      latencyMs: Date.now() - startTime,
      source: userAgent.toLowerCase().includes('esp32') ? 'esp32' : 'browser_sim',
    });

    return NextResponse.json(errorResponse, { status: 422 });
  }

  const deviceId = (rawBody?.deviceId as string) || 'esp32-node';
  const lightUnit = (rawBody?.lightUnit as 'lux' | '%' | 'raw') || 'lux';
  const proximityUnit = (rawBody?.proximityUnit as 'cm' | 'inch') || 'cm';
  const battery = typeof rawBody?.battery === 'number' ? rawBody.battery : undefined;

  // Guardar en el almacén de laboratorio
  const savedTelemetry = LabStore.addTelemetry({
    deviceId,
    light: Math.round(light * 10) / 10,
    lightUnit,
    proximity: Math.round(proximity * 10) / 10,
    proximityUnit,
    battery,
    clientIp: cleanIp,
    notes: (rawBody?.notes as string) || undefined,
  });

  // Identificar fuente (ESP32 real o simulador en la web)
  const isEsp32 = userAgent.toLowerCase().includes('esp32') || deviceId.toLowerCase().includes('esp32-hw');
  const source = isEsp32 ? 'esp32' : (rawBody?.source === 'simulator' ? 'browser_sim' : 'other');

  // Obtener estado actual de los actuadores para enviárselo al ESP32 en la misma respuesta
  const currentActuators = LabStore.getActuators();

  const successResponse = {
    status: 'success',
    code: 201,
    message: 'Telemetría registrada exitosamente en el servidor',
    telemetryId: savedTelemetry.id,
    serverTime: new Date().toISOString(),
    // Patrón IoT: piggybacking de comandos en la respuesta HTTP POST
    actuators: {
      led: currentActuators.led,
      buzzer: currentActuators.buzzer,
      ledMode: currentActuators.ledMode,
    },
    educationalNote: 'El ESP32 puede leer "actuators.led" para saber si encender o apagar su LED físico sin hacer una segunda petición.',
  };

  const latencyMs = Date.now() - startTime;

  LabStore.addHttpLog({
    method: 'POST',
    path: '/api/sensors',
    statusCode: 201,
    clientIp: cleanIp,
    userAgent,
    requestHeaders: Object.fromEntries(request.headers.entries()),
    requestBody: rawBody,
    responseBody: successResponse,
    latencyMs,
    source,
  });

  return NextResponse.json(successResponse, {
    status: 201,
    headers: {
      'Location': `/api/sensors/${savedTelemetry.id}`,
      'X-Processed-In-Ms': latencyMs.toString(),
    },
  });
}
