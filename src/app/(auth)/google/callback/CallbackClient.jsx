"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import LocationOnIcon from "@mui/icons-material/LocationOn";

export default function CallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get("code");

  useEffect(() => {
    if (!code) {
      router.replace("/signin");
      return;
    }

    const exchange = async () => {
      try {
        await api.post("/auth/google/callback/", { code });
        router.replace("/");
      } catch {
        router.replace("/signin");
      }
    };

    exchange();
  }, [code, router]);

  return (
    <div className="relative flex w-full min-h-[calc(100vh-100px)] items-center justify-center">
      <div className="flex flex-col items-center max-w-sm w-full">
        <div className="relative mb-12 h-32 w-32 flex items-center justify-center">
          <span className="absolute h-10 w-10 rounded-full ring-2 ring-primary/60 dark:ring-primary/40 blur-[1px] ripple" />
          <span className="absolute h-10 w-10 rounded-full ring-2 ring-primary/40 dark:ring-primary/25 blur-[1px] ripple ripple-delay" />

          <div className="relative z-10 float-icon">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-background-dark border border-primary/10 shadow-sm">
              <LocationOnIcon fontSize="large" htmlColor="#e2725b" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-2xl font-semibold text-[#1a110f] dark:text-white">
            Authenticating with Google...
          </h3>
          <p className="text-base text-[#1a110f]/60 dark:text-white/60 px-6">
            Connecting to your account to get you back on the road.
          </p>
        </div>

        <div className="w-56 mt-10">
          <div className="relative h-1 w-full bg-primary-foreground/10 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/3 bg-primary-foreground rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ping-ripple {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(3.5);
            opacity: 0;
          }
        }
        @keyframes subtle-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }

        .ripple {
          animation: ping-ripple 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .ripple-delay {
          animation-delay: 1s;
        }

        .float-icon {
          animation: subtle-float 3s ease-in-out infinite;
        }

        .animate-loading-bar {
          animation: loading 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
