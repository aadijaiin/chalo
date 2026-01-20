"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function CallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get("code");

  useEffect(() => {
    if (!code) {
      router.replace("/login");
      return;
    }

    const exchange = async () => {
      try {
        await api.post("/auth/github/callback", { code });
        router.replace("/");
      } catch (err) {
        router.replace("/login");
      }
    };

    exchange();
  }, [code, router]);

  return <p className="text-center mt-10">Processing GitHub login…</p>;
}
