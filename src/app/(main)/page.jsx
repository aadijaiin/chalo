"use client";
import { useRouter } from "next/navigation";
import Features from "@/components/landingComponents/Features";

// import { useEffect } from "react";
// import ModeToggle from "@/components/themeButton";
import ForWho from "@/components/landingComponents/ForWho";
import Hero from "@/components/landingComponents/Hero";
import Privacy from "@/components/landingComponents/Privacy";
import BuiltFor from "@/components/landingComponents/BuiltFor";

export default function Home() {
  const router = useRouter();

  return (
    <>
      {/* <ModeToggle /> */}
      <Hero />
      <Features />
      <ForWho />
      <BuiltFor />
      <Privacy />
    </>
  );
}
