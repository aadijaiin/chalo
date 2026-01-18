"use client"
import { useRouter } from "next/navigation";
import Features from "@/components/landingComponents/Features"

import { useEffect } from "react";
import ModeToggle from "@/components/themeButton";

export default function Home() {
  const router = useRouter()


  return (
    <>
      <ModeToggle/>
      <Features/>
    </>
    
  );
}
