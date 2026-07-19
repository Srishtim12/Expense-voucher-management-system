import { useAuth } from "@/lib/auth-context";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({ component: Component, path }: { component: any, path: string }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  return <Route path={path} component={Component} />;
}
