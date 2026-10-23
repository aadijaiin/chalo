"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { signinSchema } from "@/lib/validators/signin.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signin } from "@/services/auth.service";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import GithubAuthButton from "@/components/common/GithubAuthButton";
import GoogleAuthButton from "@/components/common/GoogleAuthButton";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
const Page = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signinSchema),
  });
  const onSubmit = async (data) => {
    try {
      await signin(data);
      toast.success("Logged in successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to log in. Please try again.");
    }
  };
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-card rounded-3xl shadow-xl shadow-earth/5 border border-sage/10 p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-earth mb-3">
              Welcome back
            </h1>
            <p className="text-earth/60">
              Log in to your account to continue exploring.
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-semibold text-earth/80 mb-2"
                  htmlFor="login-identity"
                >
                  Username
                </label>
                <input
                  {...register("username")}
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 bg-transparent text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                  id="login-identity"
                  placeholder="Ex. johndoe"
                  type="text"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-semibold text-earth/80 mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  {...register("password")}
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 bg-transparent text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
            <div className="pt-2">
              <Button className="w-full h-14 bg-primary-foreground hover:bg-primary-foreground text-white font-bold rounded-xl shadow-lg shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                {isSubmitting ? "Logging in..." : "Log in"}
              </Button>
            </div>
            <div className="relative py-2 flex items-center">
              <div className="grow border-t border-earth/10"></div>
              <span className="shrink mx-4 text-earth/40 text-xs font-bold uppercase tracking-wider">
                or
              </span>
              <div className="grow border-t border-earth/10"></div>
            </div>
            <div className="grid grid-cols-1 mt-5 sm:grid-cols-2 gap-4">
              <GoogleAuthButton />
              <GithubAuthButton />
            </div>
            <div className="flex flex-col items-center gap-3 pt-6 border-t border-earth/5 mt-6">
              <Link
                className="text-xs font-bold text-primary-foreground hover:underline"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
              <p className="text-earth/60 text-sm font-medium">
                Don&apos;t have an account yet?
                <Link
                  className="text-primary-foreground font-bold hover:underline ml-1"
                  href="/signup"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-8 text-xs text-earth/40 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-2">
            <VerifiedUserOutlinedIcon />
            Encrypted Data
          </div>
          <div className="flex items-center gap-2">
            <ScheduleOutlinedIcon />
            Auto-Expiry Sessions
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
