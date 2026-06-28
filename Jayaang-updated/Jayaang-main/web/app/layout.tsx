import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jayaang | Secure Merkle Airdrops on Injective",
  description: "Build and claim gas-efficient Merkle airdrops on Injective. Create campaigns, upload CSVs, generate proofs, and let recipients claim securely.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}