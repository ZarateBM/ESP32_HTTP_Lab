import type { Metadata } from 'next';
import Header from '@/components/Header';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ESP32 HTTP Lab - Arquitectura Web e IoT con Dokploy',
  description: 'Laboratorio educativo interactivo para enseñar el funcionamiento del protocolo HTTP, APIs REST y microcontroladores ESP32 con Next.js y Dokploy.',
  keywords: ['ESP32', 'Next.js', 'Dokploy', 'HTTP', 'IoT', 'API REST', 'Educación'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main className="main-wrapper">{children}</main>
        <footer
          style={{
            borderTop: '1px solid var(--border-light)',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
            background: 'rgba(6, 8, 14, 0.9)',
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong>ESP32 HTTP Lab</strong> · Plataforma didáctica para estudiantes de telemática, electrónica y desarrollo de software.
            </div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>
              Basado en Next.js + Dockerfile Dokploy · Red Local (LAN)
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
