import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import Spinner from "./Spinner";

// Only logged-in users can see the nested routes.
export function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession();
  const location = useLocation();

  if (isPending) return <Spinner />;
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// Only logged-out users can see the nested routes (login, signup).
export function GuestRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <Spinner />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
