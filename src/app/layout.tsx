import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ThemeProvider } from '@/components/theme';
import './globals.css';
import './eldial.css';
const jakarta = localFont({ src: './fonts/plus-jakarta-sans.woff2', weight: '400 800', display: 'swap', variable: '--font-jakarta' });
const montserrat = localFont({ src: './fonts/montserrat.woff2', weight: '300 800', display: 'swap', variable: '--font-montserrat' });
const roboto = localFont({ src: './fonts/roboto.woff2', weight: '400 700', display: 'swap', variable: '--font-roboto' });
export const metadata: Metadata = { title: 'NotariaOS · Espacio de trabajo', description: 'Gestión notarial. Entorno local de prueba con acceso protegido.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body className={`${jakarta.variable} ${montserrat.variable} ${roboto.variable}`}><ThemeProvider>{children}</ThemeProvider></body></html>;
}
