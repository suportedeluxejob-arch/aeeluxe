"use client"

import type React from "react"
import { SidebarDesktop } from "./sidebar-desktop"
import { DesktopSuggestionsPanel } from "./suggestions-panel-desktop"
import { DesktopMessagesWidget } from "./messages-widget"

interface ResponsiveLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  showSuggestions?: boolean
  showMessages?: boolean
}

export function ResponsiveLayout({
  children,
  showSidebar = true,
  showSuggestions = true,
  showMessages = true,
}: ResponsiveLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {showSidebar && <SidebarDesktop />}

      {/* Main content - adjusts based on sidebar visibility */}
      <main className="flex-1 lg:ml-64">
        {/* // Redesigned desktop layout to maximize screen space usage */}
        <div className="hidden lg:flex w-full h-full">
          {/* Feed/Content - expanded width for better content display */}
          <div className="flex-1 max-w-3xl px-6 py-6">{children}</div>

          {/* Right sidebar - fixed width, extends to edge */}
          {showSuggestions && (
            <aside className="hidden xl:block w-[360px] flex-shrink-0 py-6 pr-6">
              <div className="sticky top-6 space-y-6">
                <DesktopSuggestionsPanel />
                {showMessages && <DesktopMessagesWidget />}
              </div>
            </aside>
          )}
        </div>

        {/* Mobile/Tablet layout: full width */}
        <div className="lg:hidden">{children}</div>
      </main>
    </div>
  )
}
