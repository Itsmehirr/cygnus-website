import { SoundToggle } from "@/components/chrome/SoundToggle";

/** The Menu's pages: the Sound switch at the bottom right, as everywhere. It
 *  steps aside while the foot's own switch is on screen, which is whenever
 *  the page fits the window. */
export default function MenuLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <SoundToggle />
    </>
  );
}
