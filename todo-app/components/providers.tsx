"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
            <SidebarProvider
              style={
                {
                  "--sidebar-width": "350px",
                } as React.CSSProperties
              }
            >
                {children}
            </SidebarProvider>
        </TooltipProvider>
    </ThemeProvider>
  )
}