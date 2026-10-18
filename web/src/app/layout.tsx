import type { Metadata } from 'next';
import './globals.css';
import './design-system.css';
import RouteExperience from './route-experience';
import SiteFooter from './site-footer';

export const metadata: Metadata = {
  title: 'SATARK — Digital Security Workspace',
  description: 'Investigate suspicious digital content with evidence-backed security checks.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><RouteExperience />{children}<SiteFooter /></body></html>;
}
