import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Booking Agent — Dashboard',
  description: 'AI-powered appointment booking agent dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%235e6ad2'/><text x='16' y='22' font-size='18' text-anchor='middle' fill='white' font-family='sans-serif'>B</text></svg>"
        />
      </head>
      <body>
        <header className="header">
          <div className="header-logo">Booking Agent</div>
          <nav className="header-nav">
            <a href="/" className="nav-link active">Dashboard</a>
            <a href="/#appointments" className="nav-link">Appointments</a>
            <a href="/#calls" className="nav-link">Calls</a>
            <a href="/#settings" className="nav-link">Settings</a>
          </nav>
        </header>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
