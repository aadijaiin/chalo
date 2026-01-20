"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

const Page = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="dark:bg-card bg-white rounded-3xl shadow-xl shadow-earth/5 border border-sage/10 p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary-foreground/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LockOpenOutlinedIcon sx={{ fontSize: 28 }} htmlColor="#e2725b" />
            </div>
            <h1 className="text-3xl font-extrabold text-earth mb-3">
              Create New Password
            </h1>
            <p className="text-earth/60 text-sm leading-relaxed">
              Your new password must be different from previously used
              passwords.
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label
                className="block text-sm font-semibold text-earth/80 mb-2"
                htmlFor="password"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-sage/40 text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-earth/40 hover:text-earth transition"
                >
                  {showPassword ? (
                    <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
                  )}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex gap-1.5">
                  <div className="h-1.5 flex-1 rounded-full bg-sage"></div>
                  <div className="h-1.5 flex-1 rounded-full bg-sage"></div>
                  <div className="h-1.5 flex-1 rounded-full bg-sage"></div>
                  <div className="h-1.5 flex-1 rounded-full bg-gray-200"></div>
                </div>
                <p className="text-[11px] font-bold text-sage uppercase tracking-wider">
                  Strong password
                </p>
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-earth/80 mb-2"
                htmlFor="confirm_password"
              >
                Confirm New Password
              </label>

              <div className="relative">
                <input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-sage/40 text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-earth/40 hover:text-earth transition"
                >
                  {showConfirmPassword ? (
                    <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button className="w-full h-14 bg-primary-foreground hover:bg-primary-foreground text-white font-bold rounded-xl shadow-lg shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] transition-all">
                Update Password
              </Button>
            </div>

            <div className="text-center pt-4">
              <a
                href="/signIn"
                className="inline-flex items-center gap-2 text-sage font-bold hover:text-earth transition-colors text-sm"
              >
                <ArrowBackOutlinedIcon sx={{ fontSize: 18 }} />
                Back to Login
              </a>
            </div>
          </form>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-8 text-xs text-earth/40 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-2">
            <ShieldIcon sx={{ fontSize: 16 }} />
            Secure Encryption
          </div>
          <div className="flex items-center gap-2">
            <VerifiedUserIcon sx={{ fontSize: 16 }} />
            Trusted Service
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
