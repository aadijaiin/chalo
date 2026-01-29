"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/lib/validators/signup.schema";
import { Button } from "@/components/ui/button";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import { signup } from "@/services/auth.service";
import { toast } from "sonner";
import GithubAuthButton from "@/components/common/GithubAuthButton";
import GoogleAuthButton from "@/components/common/GoogleAuthButton";
import Link from "next/link";
const Page = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });
  const onSubmit = async (data) => {
    const { confirm_password, ...payload } = data;

    try {
      await signup(data);
      toast.success("Account created successfully!");
    } catch {}
  };
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-card rounded-3xl shadow-xl shadow-earth/5 border border-sage/10 p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-earth mb-3">
              Create your account
            </h1>
            <p className="text-earth/60">
              Join the community of explorers and stay connected.
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="block text-sm font-semibold text-earth/80 mb-2"
                  htmlFor="first-name"
                >
                  First Name
                </label>
                <input
                  {...register("first_name")}
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 bg-transparent text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                  id="first-name"
                  placeholder="Alex"
                  type="text"
                />
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.first_name.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-semibold text-earth/80 mb-2"
                  htmlFor="last-name"
                >
                  Last Name
                </label>
                <input
                  {...register("last_name")}
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 bg-transparent text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                  id="last-name"
                  placeholder="Rivera"
                  type="text"
                />
                {errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-semibold text-earth/80 mb-2"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                {...register("email")}
                className="w-full px-4 py-3 rounded-xl border border-sage/20 bg-transparent text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                id="email"
                placeholder="alex@example.com"
                type="email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-semibold text-earth/80 mb-2"
                htmlFor="username"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-earth/40 font-medium">
                  @
                </span>
                <input
                  {...register("username")}
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 bg-transparent text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all pl-9"
                  id="username"
                  placeholder="alex_finds_way"
                  type="text"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div>
                <label
                  className="block text-sm font-semibold text-earth/80 mb-2"
                  htmlFor="confirm-password"
                >
                  Confirm Password
                </label>
                <input
                  {...register("confirm_password")}
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 bg-transparent text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                  id="confirm-password"
                  placeholder="••••••••"
                  type="password"
                />
                {errors.confirm_password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>
            <div className="pt-4">
              <Button className="w-full h-14 bg-primary-foreground text-white font-bold rounded-xl shadow-lg shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] hover:bg-primary-foreground transition-all flex items-center justify-center gap-2">
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </Button>
            </div>
            <div className="text-center">
              <div className="flex items-center">
                <div className="grow border-t border-earth/10"></div>
                <span className="mx-4 text-earth/40 text-sm font-medium">
                  or
                </span>
                <div className="grow border-t border-earth/10"></div>
              </div>
              <div className="grid grid-cols-1 mt-5 sm:grid-cols-2 gap-4">
                <GoogleAuthButton />
                <GithubAuthButton />
              </div>
              <p className="text-earth/60 text-sm mt-5">
                Already have an account?
                <Link
                  className="text-primary-foreground font-bold hover:underline ml-1"
                  href="/signin"
                >
                  Sign in
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
          <div className="flex items-center gap-2">
            <PublicOutlinedIcon />
            Global Coverage
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
