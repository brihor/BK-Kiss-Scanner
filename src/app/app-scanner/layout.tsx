import type { Viewport } from "next";

export const viewport: Viewport = {
  width: 1700,
  initialScale: 1,
  minimumScale: 0.1,
  maximumScale: 1,
  userScalable: false,
};

export default function AppScannerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}