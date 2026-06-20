// @ts-nocheck
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const disp = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-disp' });
const bodyFont = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body-text' });
const dataFont = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-data' });

export const metadata = {
  title: 'Fursa — your opportunity, scored',
  description: 'Fursa matches Kenyan university students to jobs, internships and scholarships using a weighted skills, education, location and interest score.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${disp.variable} ${bodyFont.variable} ${dataFont.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}