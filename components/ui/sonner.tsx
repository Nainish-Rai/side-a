"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
 const { theme } = useTheme();

 return (
  <Sonner
   theme={theme}
   className="toaster group"
   toastOptions={{
    classNames: {
     toast:
      "group toast border border-border bg-background text-foreground shadow-none rounded-none",
     title: "text-sm font-medium",
     description: "text-sm text-muted-foreground",
     actionButton:
      "bg-primary text-primary-foreground border border-border rounded-none",
     cancelButton:
      "bg-secondary text-secondary-foreground border border-border rounded-none",
     error: "border-destructive",
     success: "border-border",
    },
   }}
   {...props}
  />
 );
}
