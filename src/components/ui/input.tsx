import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary/10 selection:text-primary border-[#ABC0B9]/60 flex h-11 w-full min-w-0 rounded-xl border bg-white px-4 py-2.5 text-sm tracking-tight transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 shadow-input",
        "focus:border-[#5C2F0E]/50 focus:shadow-input-focus focus:bg-white",
        "hover:border-[#ABC0B9] hover:shadow-soft",
        "aria-invalid:border-destructive aria-invalid:focus:shadow-[0_0_0_3px_rgba(170,47,13,0.1)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
