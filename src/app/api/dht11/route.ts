import { NextRequest, NextResponse } from 'next/server';
import { LabStore } from '@/lib/store';

// GET /api/dht11 - Obtener lista de todos los estudiantes y resumen del aula
export async function GET() {
  const students = LabStore.getAllStudents();
  const summary = LabStore.getClassroomSummary();

  return NextResponse.json(
    {
      success: true,
      summary,
      totalStudents: students.length,
      students,
      serverTime: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

// POST /api/dht11 - Recibir telemetría de DHT11 desde el ESP32 o simulador de un alumno
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const cleanIp = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0];
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'JSON inválido en el cuerpo de la petición',
        tip: 'Asegúrate de enviar Content-Type: application/json',
      },
      { status: 400 }
    );
  }

  // Identificación del estudiante
  const studentId = typeof body.studentId === 'string' && body.studentId.trim().length > 0
    ? body.studentId.trim()
    : (body.deviceId as string) || `esp32-${cleanIp.replace(/[^0-9]/g, '').slice(-4) || 'node'}`;

  const studentName = typeof body.studentName === 'string' && body.studentName.trim().length > 0
    ? body.studentName.trim()
    : `Estudiante (${studentId})`;

  const deskNumber = typeof body.deskNumber === 'string' ? body.deskNumber.trim() : undefined;

  const tempNum = typeof body.temperature === 'number' ? body.temperature : Number(body.temperature);
  const humNum = typeof body.humidity === 'number' ? body.humidity : Number(body.humidity);

  if (isNaN(tempNum) || isNaN(humNum)) {
    const errorRes = {
      success: false,
      error: 'Valores numéricos de temperatura o humedad inválidos o ausentes',
      requiredFormat: {
        studentId: 'texto (ej: alumno-01)',
        studentName: 'texto (ej: Juan Pérez)',
        temperature: 'número (ej: 24.5 en °C)',
        humidity: 'número (ej: 60 en %)',
      },
      received: body,
    };

    LabStore.addHttpLog({
      method: 'POST',
      path: '/api/dht11',
      statusCode: 422,
      clientIp: cleanIp,
      userAgent,
      requestHeaders: Object.fromEntries(request.headers.entries()),
      requestBody: body,
      responseBody: errorRes,
      latencyMs: Date.now() - startTime,
      source: userAgent.toLowerCase().includes('esp32') ? 'esp32' : 'browser_sim',
      studentName,
    });

    return NextResponse.json(errorRes, { status: 422 });
  }

  const isEsp32 = userAgent.toLowerCase().includes('esp32') || body.source === 'esp32';
  const source = isEsp32 ? 'esp32' : 'browser_sim';

  // Registrar lectura en el aula
  const { reading } = LabStore.registerStudentDHT11({
    studentId,
    studentName,
    deskNumber,
    temperature: tempNum,
    humidity: humNum,
    clientIp: cleanIp,
    source: isEsp32 ? 'esp32' : 'simulator',
  });

  const summary = LabStore.getClassroomSummary();

  const successResponse = {
    status: 'success',
    code: 201,
    message: `Telemetría recibida de ${studentName}`,
    studentId: reading.studentId,
    studentName: reading.studentName,
    metrics: {
      temperature: reading.temperature,
      humidity: reading.humidity,
      heatIndex: reading.heatIndex,
      status: reading.status,
    },
    // Comando para el hardware ESP32 del alumno
    ledCommand: reading.ledCommand,
    classroom: {
      totalConnected: summary.onlineStudents,
      avgTemperature: summary.avgTemperature,
      avgHumidity: summary.avgHumidity,
    },
    educationalTip: 'El ESP32 del alumno lee "ledCommand" y enciende su LED (GPIO 2) si hay alerta térmica o si el profesor lo activó.',
    timestamp: reading.timestamp,
  };

  LabStore.addHttpLog({
    method: 'POST',
    path: '/api/dht11',
    statusCode: 201,
    clientIp: cleanIp,
    userAgent,
    requestHeaders: Object.fromEntries(request.headers.entries()),
    requestBody: body,
    responseBody: successResponse,
    latencyMs: Date.now() - startTime,
    source,
    studentName: reading.studentName,
  });

  return NextResponse.json(successResponse, {
    status: 201,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Processed-Time': `${Date.now() - startTime}ms`,
    },
  });
}

// DELETE /api/dht11 - Reiniciar sesión del aula para una nueva clase
export async function DELETE() {
  LabStore.resetClassroom();
  return NextResponse.json({
    success: true,
    message: 'Aula reiniciada con éxito. Lista de estudiantes en cero para la nueva clase.',
  });
}
