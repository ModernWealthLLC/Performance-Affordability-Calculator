import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "The APEX Report\u2122 | APEX Financial Performance Engine",
  description: "Are you hitting the financial apex? Affordability, Positioning, Efficiency, eXecution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <header className="bg-white pt-16 pb-10">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-light tracking-wide" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <span className="text-gray-800">The APEX</span>{" "}
              <span className="text-[#0f487f]">Report&trade;</span>
            </h1>
            <div className="mt-8 mx-auto w-16 border-t border-gray-300" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
