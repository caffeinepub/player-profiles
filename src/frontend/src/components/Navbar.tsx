import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Shield, UserPlus } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

export function Navbar() {
  const { login, clear, identity, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();

  const isLoggedIn = !!identity;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-xl font-display font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
            PLAYER<span className="text-primary">PROFILES</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin" data-ocid="nav.admin_link">
                <Shield className="h-4 w-4 mr-1.5" />
                Admin
              </Link>
            </Button>
          )}

          {isLoggedIn && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/register" data-ocid="nav.register_link">
                <UserPlus className="h-4 w-4 mr-1.5" />
                My Profile
              </Link>
            </Button>
          )}

          {isInitializing ? (
            <Skeleton className="h-9 w-24 rounded" />
          ) : isLoggedIn ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Logout
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="nav.login_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              {isLoggingIn ? "Connecting..." : "Login"}
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
