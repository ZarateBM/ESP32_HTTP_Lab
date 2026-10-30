import { NextRequest, NextResponse } from 'next/server';
import { LabStore } from '@/lib/store';

// GET /api/logs - Ver solicitudes HTTP en tiempo real
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '40', 10);

  const logs = LabStore.getHttpLogs(limit);
  const stats = LabStore.getStats();

  return NextResponse.json(
    {
      success: true,
      count: logs.length,
      logs,
      stats,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

// DELETE /api/logs - Limpiar registros para nueva sesión de clase
export async function DELETE() {
  LabStore.clearHttpLogs();
  return NextResponse.json({
    success: true,
    message: 'Historial de solicitudes HTTP limpiado con éxito para la clase',
  });
}
