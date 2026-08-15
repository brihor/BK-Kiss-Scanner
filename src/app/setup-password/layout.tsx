import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup | BK KiSS",
};

export default function SetupPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}