import './globals.css';
import type { Metadata, Viewport } from 'next';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import { LanguageProvider } from '@/context/LanguageContext';
import MaintenanceGate from '@/components/MaintenanceGate';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masjidpay.in';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'MasjidPay · Masjid Financial Management SaaS Engine',
    template: '%s | MasjidPay',
  },
  description: 'Multi-tenant financial management SaaS for masjids. Track member collections, donations, expenses, staff payroll, PDF reports, and WhatsApp receipts with transparency and amanah.',
  keywords: [
    'Masjid Management Software',
    'Mosque Finance SaaS',
    'MasjidPay',
    'Islamic Accounting',
    'Zakat and Sadaqah Ledger',
    'Mosque Donation Software',
    'WhatsApp Mosque Receipt',
    'Masjid Payroll Management',
  ],
  authors: [{ name: 'MasjidPay Team' }],
  creator: 'MasjidPay',
  publisher: 'MasjidPay',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'MasjidPay',
    title: 'MasjidPay · Building Trust. Strengthening Communities.',
    description: 'A digital platform designed to help mosques manage finances with simplicity, transparency, and amanah.',
    images: [
      {
        url: '/images/masjid_hero_sunset.jpg',
        width: 1200,
        height: 630,
        alt: 'MasjidPay - Modern Islamic Financial SaaS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MasjidPay · Modern Islamic Financial Management',
    description: 'Empowering mosques with simple, trustworthy financial technology rooted in Islamic values.',
    images: ['/images/masjid_hero_sunset.jpg'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'googleb74e93733a7ea848',
  },
  manifest: '/manifest.json',
  icons: {
    icon: 'https://img.icons8.com/color/96/mosque.png',
    apple: 'https://img.icons8.com/color/192/mosque.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MasjidPay',
  },
  applicationName: 'MasjidPay',
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#064E3B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
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
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MasjidPay" />
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
                      registration.update();
                      console.log('✅ [PWA ServiceWorker] Registered successfully with scope:', registration.scope);
                    },
                    function(err) {
                      console.log('⚠️ [PWA ServiceWorker] Registration note:', err);
                    }
                  );
                });
              }

              // Google Translate Initialization
              function googleTranslateElementInit() {
                if (window.google && window.google.translate) {
                  new window.google.translate.TranslateElement(
                    {
                      pageLanguage: 'en',
                      includedLanguages: 'en,ta,hi,ml,ur,ar',
                      autoDisplay: false,
                      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                    },
                    'google_translate_element'
                  );
                }
              }
            `,
          }}
        />
        <script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          async
          defer
        />
      </head>
      <body className="min-h-screen bg-[#FFF9EC] text-[#1c2e28] antialiased font-sans">
        <div id="google_translate_element" style={{ display: 'none' }}></div>
        <MaintenanceGate>
          <LanguageProvider>
            {children}
            <PwaInstallPrompt />
          </LanguageProvider>
        </MaintenanceGate>
      </body>
    </html>
  );
}

