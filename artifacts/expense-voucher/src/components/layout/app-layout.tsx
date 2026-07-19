import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto relative">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        
        <div className="h-full flex flex-col p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
