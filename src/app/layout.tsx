import type { Metadata, Viewport } from "next";
import { bodyFont, displayFont } from "./fonts";
import { SITE_URL, site } from "@/content/site";
import { JsonLd } from "@/components/JsonLd";
import { ScrollProvider } from "@/components/motion/ScrollProvider";
import { Cursor } from "@/components/chrome/Cursor";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} — Contemporary High Jewellery, Engineered from Grown Carbon`,
    template: `%s — ${site.name}`,
  },
  description: site.definition,
  applicationName: site.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    siteName: site.name,
    type: "website",
    locale: "en_GB",
  },
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#fcf3e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <a href="#main" className="skip">
          Skip to content
        </a>
        <ScrollProvider>{children}</ScrollProvider>
        <Cursor />
      </body>
    </html>
  );
}
