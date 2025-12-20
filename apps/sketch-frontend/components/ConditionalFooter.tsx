"use client";
import { usePathname } from "next/navigation";
import Footer from "./Footer";

export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on canvas/room pages
  const isCanvasPage = pathname?.startsWith("/canvas/");

  if (isCanvasPage) {
    return null;
  }

  return <Footer />;
}
