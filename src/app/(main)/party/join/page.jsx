"use client";
import React from "react";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinPartySchema } from "@/lib/validators/joinParty.schema";
import { joinParty } from "@/services/party.service";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const Page = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(joinPartySchema),
  });
  const onSubmit = async (data) => {
    const { confirm_password, ...payload } = data;

    try {
      await joinParty(data);
      toast.success("Account created successfully!");
    } catch {}
  };
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12 lg:py-24 dreamwave-bg">
      <div className="w-full max-w-125">
        <div className="mb-8">
          <Link
            className="inline-flex items-center gap-2 text-sage font-semibold text-sm hover:text-earth transition-colors"
            href="/dashboard"
            replace
          >
            <ArrowBackIcon />
            Dashboard
          </Link>
        </div>
        <div className="bg-card rounded-[2.5rem] p-10 lg:p-14 shadow-xl shadow-earth/5 border border-sage/10 text-center">
          <div className="w-16 h-16 bg-sage/10 rounded-2xl flex items-center justify-center text-sage mx-auto mb-8">
            <GroupAddIcon />
          </div>
          <h1 className="text-3xl font-extrabold text-earth mb-2">
            Join a Party
          </h1>
          <p className="text-earth/60 mb-10">
            Enter the 6-digit code shared by your group leader to start sharing
            your location.
          </p>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2 text-left">
              <label
                className="block text-sm font-bold text-earth/80 px-1"
                htmlFor="party-code"
              >
                Party Code
              </label>
              <input
                {...register("code")}
                id="party-code"
                type="text"
                maxLength={7}
                placeholder="E.g. 882 194"
                className="
    w-full h-16
    rounded-2xl
    border border-sage/50
    bg-transparent

    text-center text-2xl font-bold
    tracking-[0.5em]
    text-earth
    placeholder:text-earth/20
    placeholder:tracking-normal

    outline-none ring-0
    focus:outline-none
    focus:ring-2 focus:ring-primary-foreground/20
    focus:border-primary-foreground

    active:outline-none
    active:ring-0

    transition-all
  "
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.code.message}
                </p>
              )}
            </div>
            <Button
              className="w-full h-16 bg-primary-foreground hover:bg-primary-foreground text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              type="submit"
            >
              <span>Join Now</span>
              <ArrowForwardIcon />
            </Button>
          </form>
          {/* <div className="mt-8 pt-8 border-t border-sage/10">
            <a
              className="text-sm font-bold text-sage hover:text-primary-foreground transition-colors flex items-center justify-center gap-2"
              href="#"
            >
              <InsertLinkIcon />
              Need a link instead?
            </a>
          </div> */}
        </div>
        <p className="text-center mt-8 text-earth/40 text-sm">
          Don&apos;t have a code?{" "}
          <Link
            className="text-earth/60 font-bold hover:text-primary-foreground underline decoration-sage/30 underline-offset-4"
            href="/party/create"
          >
            Create your own party
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Page;
