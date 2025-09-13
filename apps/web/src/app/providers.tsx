"use client";
import { useRouter } from "next/navigation";
import { HeroUIProvider } from "@heroui/system";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <HeroUIProvider navigate={(href) => router.push(href.toString())}>
      {children}
    </HeroUIProvider>
  );
}
