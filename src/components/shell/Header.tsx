"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLogout, UserSession } from "@/hooks/useAuth";

interface HeaderProps {
  user?: UserSession | null;
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutMutation = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">RS TeleMedika AI</span>
          </Link>
          {user && (
            <Badge variant={user.role} className="capitalize text-xs font-semibold">
              {user.role}
            </Badge>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user && (
            <div className="hidden sm:flex items-center gap-3 border-l pl-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold leading-tight">{user.name}</div>
                  <div className="text-[10px] text-muted-foreground">{user.email}</div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 text-xs gap-1"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </Button>
            </div>
          )}

          {/* Mobile Hamburger Toggle for Doctor & Admin */}
          {user && user.role !== "pasien" && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Dropdown for Doctor & Admin */}
      {mobileMenuOpen && user && user.role !== "pasien" && (
        <div className="md:hidden border-b bg-card p-4 space-y-3">
          <div className="flex items-center gap-3 p-2 bg-muted/40 rounded-lg">
            <User className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="destructive"
              className="w-full justify-center gap-2 text-xs"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar dari Sistem</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
