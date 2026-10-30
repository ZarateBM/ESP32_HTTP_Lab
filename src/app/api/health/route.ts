import { NextResponse } from 'next/server';
import { LabStore } from '@/lib/store';

export async function GET() {
  const stats = LabStore.getStats();
  const summary = LabStore.getClassroomSummary();

  return NextResponse.json({
    status: 'healthy',
    uptime: stats.uptimeSeconds,
    activeStudents: summary.onlineStudents,
    totalRegistered: summary.totalStudents,
    avgTemperature: summary.avgTemperature,
    avgHumidity: summary.avgHumidity,
    timestamp: new Date().toISOString(),
  });
}
