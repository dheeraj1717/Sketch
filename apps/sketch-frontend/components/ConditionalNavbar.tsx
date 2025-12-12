"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide navbar on canvas/room pages
  const isCanvasPage = pathname?.startsWith("/canvas/");

  if (isCanvasPage) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="pt-16" />
    </>
  );
}
