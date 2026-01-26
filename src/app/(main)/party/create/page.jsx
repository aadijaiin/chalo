"use client";
import React from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import GroupsIcon from "@mui/icons-material/Groups";
import LabelIcon from "@mui/icons-material/Label";
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPartySchema } from "@/lib/validators/createParty.schema";
import { createParty } from "@/services/party.service";
import { toast } from "sonner";

const Page = () => {
  const form = useForm({
    resolver: zodResolver(createPartySchema),
    defaultValues: {
      partyName: "",
      duration: "2h",
    },
  });
  const { control, register, handleSubmit, formState } = form;
  const { errors } = formState;

  const onSubmit = async (data) => {
    try {
      await createParty(data);
      toast.success("Party created successfully!");
    } catch {}
  };
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12 lg:py-20">
      <div className="max-w-xl w-full">
        <div className="mb-8">
          <a
            className="inline-flex items-center gap-2 text-sage font-semibold text-sm hover:text-earth transition-colors"
            href="#"
          >
            <ArrowBackIcon />
            Back to home
          </a>
        </div>
        <div className="bg-card rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-earth/5 border border-sage/5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 text-sage/5 pointer-events-none">
            <GroupsIcon />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col gap-2 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-primary-foreground/10 text-primary-foreground flex items-center justify-center mb-2">
                <AddLocationAltIcon />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-earth">
                Create a Party
              </h1>
              <p className="text-earth/60">
                Set up your shared session and start exploring together.
              </p>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label
                  className="block text-sm font-bold text-earth/80 ml-1"
                  htmlFor="party-name"
                >
                  Party Name
                </label>

                <div className="relative">
                  <LabelIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-earth/40" />

                  <input
                    {...register("name")}
                    id="party-name"
                    type="text"
                    placeholder="e.g., Weekend Hike, Tokyo Trip..."
                    className="
    w-full h-14 pl-12 pr-4
    bg-transparent
    border border-sage/20
    rounded-2xl

    outline-none
    ring-0

    focus:outline-none
    focus:ring-2 focus:ring-primary-foreground/20
    focus:border-primary-foreground

    active:outline-none
    active:ring-0

    transition-all
    text-earth placeholder:text-earth/30
  "
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-bold text-earth/80 ml-1"
                  htmlFor="duration"
                >
                  Sharing Duration
                </label>

                <div className="relative">
                  <WatchLaterIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-earth/40" />

                  <Controller
                    name="duration"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className="
          h-14 pl-12 pr-4
          border border-sage/30
          rounded-2xl
          text-earth
        "
                        >
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>

                        <SelectContent className="rounded-2xl border border-sage/20 shadow-xl bg-card p-2">
                          <SelectItem
                            className={
                              "cursor-pointer rounded-md focus:bg-primary-foreground/10"
                            }
                            value="1h"
                          >
                            1 Hour
                          </SelectItem>
                          <SelectItem
                            className={
                              "cursor-pointer rounded-md focus:bg-primary-foreground/10"
                            }
                            value="2h"
                          >
                            2 Hours
                          </SelectItem>
                          <SelectItem
                            className={
                              "cursor-pointer rounded-md focus:bg-primary-foreground/10"
                            }
                            value="4h"
                          >
                            4 Hours
                          </SelectItem>
                          <SelectItem
                            className={
                              "cursor-pointer rounded-md focus:bg-primary-foreground/10"
                            }
                            value="8h"
                          >
                            8 Hours
                          </SelectItem>
                          <SelectItem
                            className={
                              "cursor-pointer rounded-md focus:bg-primary-foreground/10"
                            }
                            value="1d"
                          >
                            1 Day
                          </SelectItem>
                          <SelectItem
                            className={
                              "cursor-pointer rounded-md focus:bg-primary-foreground/10"
                            }
                            value="3d"
                          >
                            3 Days
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {errors.duration && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.duration.message}
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-sage font-medium ml-1">
                  Session will automatically expire and delete location data
                  after this time.
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-sage/5 rounded-2xl border border-sage/10">
                <VerifiedUserIcon />
                <p className="text-xs text-earth/70 leading-snug">
                  <span className="font-bold">Privacy First:</span> Only people
                  with the unique link can join your party. Your data remains
                  ephemeral.
                </p>
              </div>
              <Button
                className="w-full h-16 bg-primary-foreground hover:bg-primary-foreground text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8"
                type="submit"
              >
                Create Party
                <ArrowForwardIcon />
              </Button>
            </form>
          </div>
        </div>
        <p className="text-center mt-8 text-sm text-earth/50">
          By creating a party, you agree to Wayfind&apos;s{" "}
          <a className="underline hover:text-primary-foreground" href="#">
            Safety Terms
          </a>
          .
        </p>
      </div>
    </main>
  );
};

export default Page;
