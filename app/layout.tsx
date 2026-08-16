import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'MasjidPay · Masjid Financial Management SaaS Engine',
  description: 'Multi-tenant financial management SaaS for masjids. Track member collections, donations, expenses, staff payroll, PDF reports, and WhatsApp receipts.',
  manifest: '/manifest.json',
  icons: {
    icon: 'https://img.icons8.com/color/96/mosque.png',
    apple: 'https://img.icons8.com/color/192/mosque.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MasjidPay SaaS',
  },
};

export const viewport: Viewport = {
  themeColor: '#064E3B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="https://img.icons8.com/color/96/mosque.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="https://img.icons8.com/color/192/mosque.png" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('✅ [PWA ServiceWorker] Registered successfully with scope:', registration.scope);
                    },
                    function(err) {
                      console.log('⚠️ [PWA ServiceWorker] Registration note:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#FFF9EC] text-[#1c2e28] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
