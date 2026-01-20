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
      router.replace("/signIn");
      return;
    }

    const exchange = async () => {
      try {
        await api.post("/accounts/social/login/github/", { code });
        router.replace("/");
      } catch (err) {
        router.replace("/signIn");
      }
    };

    exchange();
  }, [code, router]);

  return <p className="text-center mt-10">Processing GitHub login…</p>;
}
