import { NextResponse } from 'next/server';
import { LabStore } from '@/lib/store';

export async function GET() {
  const stats = LabStore.getStats();

  return NextResponse.json({
    status: 'healthy',
    service: 'esp32-http-lab',
    uptimeSeconds: stats.uptimeSeconds,
    totalRequests: stats.totalRequests,
    dokployReady: true,
    localEndpoints: {
      sensorsTelemetryPost: 'POST /api/sensors',
      sensorsHistoryGet: 'GET /api/sensors',
      actuatorsGet: 'GET /api/actuators',
      actuatorsPost: 'POST /api/actuators',
      httpLogsGet: 'GET /api/logs',
    },
    educationalGuide: 'Envía peticiones HTTP POST con JSON {"deviceId":"esp32-aula","light":500,"proximity":20}',
    timestamp: new Date().toISOString(),
  });
}
