import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { AdminPage } from "./pages/AdminPage";
import { IndexPage } from "./pages/IndexPage";
import { PlayerDetailPage } from "./pages/PlayerDetailPage";
import { RegisterPage } from "./pages/RegisterPage";
import { getPersistedUrlParameter } from "./utils/urlParams";

// ── Embed detection ───────────────────────────────────────────────────

function useEmbedMode() {
  const [isEmbed, setIsEmbed] = useState(false);
  useEffect(() => {
    const val = getPersistedUrlParameter("embed");
    setIsEmbed(val === "true" || val === "1");
  }, []);
  return isEmbed;
}

// ── Layout ────────────────────────────────────────────────────────────

function Layout() {
  const isEmbed = useEmbedMode();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isEmbed && <Navbar />}
      <div className="flex-1">
        <Outlet />
      </div>
      {!isEmbed && <Footer />}
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

// ── Routes ────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexPage,
});

const playerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/player/$id",
  component: PlayerDetailPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  playerRoute,
  registerRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
