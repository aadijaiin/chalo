"use client";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";

function AppToaster() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <Toaster
      theme={currentTheme === "dark" ? "dark" : "light"}
      richColors
      closeButton
      position="top-right"
    />
  );
}

export default AppToaster;
