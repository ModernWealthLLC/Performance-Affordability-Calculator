import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "The APEX Report™ | APEX Financial Performance Engine",
  description:
    "Modern Wealth's APEX Calculator™ reveals the true financial cost of your next vehicle purchase. Analyze affordability, opportunity cost, savings impact, and financial independence timeline — get your free personalized APEX Report instantly.",
  openGraph: {
    title: "The APEX Report™ | Are You Hitting the Financial Apex?",
    description:
      "Discover the true financial cost of your next vehicle. Analyze affordability, opportunity cost, savings impact, and your financial independence timeline with Modern Wealth's free APEX Calculator.",
    siteName: "Modern Wealth",
    type: "website",
    url: "https://www.modernwealthllc.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "The APEX Report™ | APEX Financial Performance Engine",
    description:
      "Discover the true financial cost of your next vehicle. Analyze affordability, opportunity cost, savings impact, and your financial independence timeline.",
  },
  keywords: [
    "car affordability calculator",
    "vehicle financial impact",
    "opportunity cost calculator",
    "financial independence",
    "APEX Report",
    "Modern Wealth",
    "performance vehicle affordability",
    "car buying calculator",
    "wealth impact analysis",
    "financial planning tool",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function postHeight() {
                  var height = document.documentElement.scrollHeight;
                  window.parent.postMessage({ type: 'apex-resize', height: height }, '*');
                }
                window.addEventListener('load', postHeight);
                window.addEventListener('resize', postHeight);
                var observer = new MutationObserver(postHeight);
                document.addEventListener('DOMContentLoaded', function() {
                  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
                });
                setInterval(postHeight, 500);
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white text-gray-900 antialiased">
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
