"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/validators/resetPassword.schema";
import { Button } from "@/components/ui/button";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ButtonLoader from "@/components/ui/buttonLoader";
import { resetPassword } from "@/services/auth.service";
import { useRouter, useSearchParams } from "next/navigation";

const Page = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const resetId = searchParams.get("id");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });
  const onSubmit = async (data) => {
    try {
      await resetPassword({
        new_password: data.password,
        confirm_password: data.confirmPassword,
        id: resetId,
      });
      toast.success("Updated password successfully!");
    } catch {}
  };

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

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                className="block text-sm font-semibold text-earth/80 mb-2"
                htmlFor="password"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  disabled={isSubmitting}
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-sage/40 text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}

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
                  disabled={isSubmitting}
                  {...register("confirmPassword")}
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-sage/40 text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}

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
              <Button
                disabled={isSubmitting}
                type="submit"
                className="w-full h-14 bg-primary-foreground hover:bg-primary-foreground text-white font-bold rounded-xl shadow-lg shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <ButtonLoader />
                    <span>Updating...</span>
                  </>
                ) : (
                  "Update password"
                )}
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
