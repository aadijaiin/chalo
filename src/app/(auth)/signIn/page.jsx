import React from "react";
import { Button } from "@/components/ui/button";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
const page = () => {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl shadow-earth/5 border border-sage/10 p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-earth mb-3">
              Welcome back
            </h1>
            <p className="text-earth/60">
              Log in to your account to continue exploring.
            </p>
          </div>
          <form className="space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-semibold text-earth/80 mb-2"
                  htmlFor="login-identity"
                >
                  Email or Username
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 bg-white text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                  id="login-identity"
                  placeholder="alex@example.com"
                  type="text"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-semibold text-earth/80 mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 bg-white text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
            </div>
            <div className="pt-2">
              <Button className="w-full h-14 bg-primary-foreground hover:bg-primary-foreground text-white font-bold rounded-xl shadow-lg shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                Log In
              </Button>
            </div>
            <div className="relative py-2 flex items-center">
              <div className="grow border-t border-earth/10"></div>
              <span className="shrink mx-4 text-earth/40 text-xs font-bold uppercase tracking-wider">
                or
              </span>
              <div className="grow border-t border-earth/10"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="w-full h-12 flex items-center justify-center gap-2 px-3 rounded-xl border border-earth/10 bg-white text-earth/80 text-sm font-semibold hover:bg-earth/5 transition-all active:scale-[0.98]"
                type="button"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  ></path>
                </svg>
                <span>Google</span>
              </Button>
              <Button
                className="w-full h-12 flex items-center justify-center gap-2 px-3 rounded-xl border border-earth/10 bg-white text-earth/80 text-sm font-semibold hover:bg-earth/5 transition-all active:scale-[0.98]"
                type="button"
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"></path>
                </svg>
                <span>GitHub</span>
              </Button>
            </div>
            <div className="flex flex-col items-center gap-3 pt-6 border-t border-earth/5 mt-6">
              <a
                className="text-xs font-bold text-primary-foreground hover:underline"
                href="#"
              >
                Forgot Password?
              </a>
              <p className="text-earth/60 text-sm font-medium">
                Don&apos;t have an account yet?
                <a
                  className="text-primary-foreground font-bold hover:underline ml-1"
                  href="#"
                >
                  Sign up
                </a>
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

export default page;
