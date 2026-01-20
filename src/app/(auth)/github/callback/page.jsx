"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
export default function GitHubCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get("code");

  useEffect(() => {
    if (!code) return;

    const exchangeCode = async () => {
      try {
        await api.post("/auth/github/callback", { code });
        router.replace("/"); // or /dashboard
      } catch (err) {
        router.replace("/login");
      }
    };

    exchangeCode();
  }, [code, router]);

  return <p className="text-center mt-10">Processing GitHub login...</p>;
}
