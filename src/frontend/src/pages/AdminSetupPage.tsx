import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Shield, XCircle } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

export function AdminSetupPage() {
  const { identity, login } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!actor || !token.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await actor._initializeAccessControlWithSecret(token.trim());
      const granted = await actor.isCallerAdmin();
      if (granted) {
        await queryClient.invalidateQueries();
        setSuccess(true);
      } else {
        setError("Invalid token. Please check and try again.");
      }
    } catch {
      setError("Invalid token. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Not logged in ───────────────────────────────────────────────────
  if (!identity) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-card border border-border mx-auto">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-foreground mb-2">
              Admin Setup
            </h1>
            <p className="text-muted-foreground text-sm">
              You need to be logged in to claim admin privileges.
            </p>
          </div>
          <Button
            onClick={login}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
            data-ocid="admin_setup.submit_button"
          >
            Log In
          </Button>
        </div>
      </main>
    );
  }

  // ── Already admin ───────────────────────────────────────────────────
  if (!adminLoading && isAdmin) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div
          className="w-full max-w-md text-center space-y-5"
          data-ocid="admin_setup.success_state"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/30 mx-auto">
            <Shield className="h-8 w-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-foreground mb-2">
              Admin Setup
            </h1>
            <p className="text-muted-foreground text-sm">
              You already have administrator privileges for this application.
            </p>
          </div>
          <Link to="/admin">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
              Go to Admin Panel
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  // ── Success state after claiming ────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div
          className="w-full max-w-md text-center space-y-5"
          data-ocid="admin_setup.success_state"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/30 mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-foreground mb-2">
              Admin Privileges Granted
            </h1>
            <p className="text-muted-foreground text-sm">
              Admin privileges granted. You can now access the admin panel.
            </p>
          </div>
          <Link to="/admin">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
              Go to Admin Panel
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  // ── Token entry form ────────────────────────────────────────────────
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-card border border-border mx-auto">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-foreground mb-2">
              Admin Setup
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enter the admin token to claim administrator privileges for this
              application.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-5">
          <form onSubmit={handleClaim} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-token" className="text-sm font-medium">
                Admin Token
              </Label>
              <Input
                id="admin-token"
                type="password"
                placeholder="Enter admin token"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError(null);
                }}
                disabled={loading || isFetching}
                autoComplete="off"
                data-ocid="admin_setup.token.input"
              />
            </div>

            {/* Error state */}
            {error && (
              <div
                className="flex items-start gap-2.5 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2.5"
                data-ocid="admin_setup.error_state"
              >
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading || !token.trim() || isFetching}
              data-ocid="admin_setup.submit_button"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                "Claim Admin"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
