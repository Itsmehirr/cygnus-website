import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageFade } from "@/components/motion/PageFade";

/** Every page except the Menu: fixed header above, charcoal footer below. */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <PageFade>
        <main id="main">{children}</main>
        <SiteFooter />
      </PageFade>
    </>
  );
}
