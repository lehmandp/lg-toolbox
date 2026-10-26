import type { Metadata } from "next";
import { Poppins, Oswald } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

/** Logo wordmark only — condensed grotesque for the LG monogram and lockup. */
const oswald = Oswald({
  weight: ["500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  title: "LG Loan Toolbox",
  description: "Your tools. All in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${oswald.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
