import '../index.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dev Tutor Simulator',
  description: 'An AI-powered website that simulates Hinglish mentor conversations and tech debates with Hitesh Choudhary and Piyush Garg.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
