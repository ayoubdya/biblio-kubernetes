"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { BookOpen, Search, User, LogOut, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoading = status === "loading";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">Biblio</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/books"
              className="flex items-center gap-1 text-gray-600 transition-colors hover:text-indigo-600"
            >
              <Search className="h-4 w-4" />
              Search Books
            </Link>
            
            {session?.user && (
              <Link
                href="/profile"
                className="flex items-center gap-1 text-gray-600 transition-colors hover:text-indigo-600"
              >
                <User className="h-4 w-4" />
                My Reviews
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
            ) : session?.user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("keycloak")}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "border-b border-gray-200 bg-white md:hidden",
          mobileMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="space-y-1 px-4 py-3">
          <Link
            href="/books"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Search className="h-5 w-5" />
            Search Books
          </Link>
          
          {session?.user && (
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="h-5 w-5" />
              My Reviews
            </Link>
          )}

          <div className="border-t border-gray-200 pt-3">
            {session?.user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signIn("keycloak");
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white"
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
