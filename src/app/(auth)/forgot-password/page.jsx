"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
const ForgotPasswordEmail = () => {
  const [showOtpForm, setShowOtpForm] = useState(false);
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="dark:bg-card bg-white rounded-3xl shadow-xl shadow-earth/5 border border-sage/10 p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-sage/10 rounded-2xl text-3xl flex items-center justify-center mx-auto mb-6">
              <LockResetOutlinedIcon htmlColor="#8DA399" fontSize="large" />
            </div>
            <h1 className="text-3xl font-extrabold text-earth mb-3">
              Forgot your password?
            </h1>
            <p className="text-earth/60 text-sm leading-relaxed">
              Enter your email address and we will send you a link to reset your
              password.
            </p>
          </div>
          <form className="space-y-6">
            <div>
              <label
                className="block text-sm font-semibold text-earth/80 mb-2"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-sage/40 text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                id="email"
                placeholder="alex@example.com"
                required=""
                type="email"
              />
            </div>
            <div className="pt-2">
              <Button className="w-full h-14 bg-primary-foreground hover:bg-primary-foreground text-white font-bold rounded-xl shadow-lg shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                Send OTP
              </Button>
            </div>
            {showOtpForm && (
              <div className="space-y-6 pt-6 border-t border-sage/10">
                <div>
                  <label className="block text-sm font-semibold text-earth/80 text-center mb-5">
                    Enter 6-digit Verification Code
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    <input
                      className="w-full h-14 text-center text-xl font-bold rounded-xl border border-sage/40 text-earth focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                      maxLength="1"
                      type="text"
                    />
                    <input
                      className="w-full h-14 text-center text-xl font-bold rounded-xl border border-sage/40 text-earth focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                      maxLength="1"
                      type="text"
                    />
                    <input
                      className="w-full h-14 text-center text-xl font-bold rounded-xl border border-sage/40 text-earth focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                      maxLength="1"
                      type="text"
                    />
                    <input
                      className="w-full h-14 text-center text-xl font-bold rounded-xl border border-sage/40 text-earth focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                      maxLength="1"
                      type="text"
                    />
                    <input
                      className="w-full h-14 text-center text-xl font-bold rounded-xl border border-sage/40 text-earth focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                      maxLength="1"
                      type="text"
                    />
                    <input
                      className="w-full h-14 text-center text-xl font-bold rounded-xl border border-sage/40 text-earth focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                      maxLength="1"
                      type="text"
                    />
                  </div>
                </div>
                <Button
                  className="w-full h-14 bg-primary-foreground hover:bg-primary-foreground text-white font-bold rounded-xl shadow-lg shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  type="submit"
                >
                  Verify OTP
                </Button>
                <div className="text-center">
                  <p className="text-sm text-earth/60">
                    Didn&apos;t receive a code?
                    <Button
                      className="text-sage font-bold hover:text-earth transition-colors ml-1 bg-card hover:bg-card"
                      type="button"
                    >
                      Resend OTP{" "}
                      <span className="text-earth/40 font-normal">(0:59)</span>
                    </Button>
                  </p>
                </div>
              </div>
            )}
            <div className="text-center pt-4">
              <a
                className="inline-flex items-center gap-2 text-sage font-bold hover:text-earth transition-colors text-sm"
                href="#"
              >
                <ArrowBackOutlinedIcon />
                Back to Login
              </a>
            </div>
          </form>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-8 text-xs text-earth/40 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-2">
            <ShieldIcon />
            Secure Encryption
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">
              <VerifiedUserIcon />
            </span>
            Trusted Service
          </div>
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordEmail;
