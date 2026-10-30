import { NextRequest, NextResponse } from 'next/server';
import { LabStore } from '@/lib/store';

// POST /api/dht11/command - Control remoto del actuador LED de los alumnos
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 });
  }

  // Caso 1: Broadcast a toda el aula
  if (body.broadcast === true) {
    const ledState = typeof body.led === 'boolean' ? body.led : null;
    LabStore.broadcastClassroomLed(ledState);

    return NextResponse.json({
      success: true,
      message: ledState !== null
        ? `Broadcast enviado: Todos los ESP32 del aula pondrán su LED en ${ledState ? 'ENCENDIDO (HIGH)' : 'APAGADO (LOW)'}`
        : 'Broadcast liberado: Los ESP32 vuelven al modo automático por confort',
      broadcastState: ledState,
    });
  }

  // Caso 2: Comando a un estudiante individual
  const studentId = typeof body.studentId === 'string' ? body.studentId : null;
  const ledState = typeof body.led === 'boolean' ? body.led : false;

  if (!studentId) {
    return NextResponse.json({ success: false, error: 'studentId requerido' }, { status: 400 });
  }

  const ok = LabStore.setStudentLed(studentId, ledState);
  if (!ok) {
    return NextResponse.json({ success: false, error: 'Estudiante no encontrado en el aula' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: `Comando enviado al ESP32 de ${studentId}: LED -> ${ledState ? 'ENCENDIDO' : 'APAGADO'}`,
    studentId,
    led: ledState,
  });
}
