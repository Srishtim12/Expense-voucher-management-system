import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "./lib/auth";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { AppLayout } from "./components/layout/app-layout";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import VouchersList from "./pages/vouchers/list";
import VoucherCreate from "./pages/vouchers/create";
import VoucherEdit from "./pages/vouchers/edit";
import VoucherDetail from "./pages/vouchers/detail";

const queryClient = new QueryClient();

// Configure the generated API client to always send the JWT token
setAuthTokenGetter(() => getToken());

function ProtectedLayout({ children }: { children: React.ReactNode }) {
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

  return <AppLayout>{children}</AppLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        {() => (
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/vouchers/new">
        {() => (
          <ProtectedLayout>
            <VoucherCreate />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/vouchers/:id/edit">
        {() => (
          <ProtectedLayout>
            <VoucherEdit />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/vouchers/:id">
        {() => (
          <ProtectedLayout>
            <VoucherDetail />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/vouchers">
        {() => (
          <ProtectedLayout>
            <VouchersList />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '')}>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
