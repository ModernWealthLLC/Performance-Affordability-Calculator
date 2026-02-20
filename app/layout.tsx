import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Performance Affordability Calculator",
  description: "Can you really afford that performance car?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0f487f] flex items-center justify-center font-bold text-sm text-white">
              PA
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-[#0f487f]">
              Performance Affordability Calculator
            </h1>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
