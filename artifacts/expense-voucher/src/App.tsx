import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "./lib/auth";
import { AuthProvider } from "./lib/auth-context";
import { ProtectedRoute } from "./components/auth/protected-route";
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

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => (
          <AppLayout>
            <Switch>
              <ProtectedRoute path="/dashboard" component={Dashboard} />
              <ProtectedRoute path="/vouchers" component={VouchersList} />
              <ProtectedRoute path="/vouchers/new" component={VoucherCreate} />
              <ProtectedRoute path="/vouchers/:id/edit" component={VoucherEdit} />
              <ProtectedRoute path="/vouchers/:id" component={VoucherDetail} />
              <ProtectedRoute path="/" component={() => <Redirect to="/dashboard" />} />
            </Switch>
          </AppLayout>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// Temporary internal redirect helper
function Redirect({ to }: { to: string }) {
  import('wouter').then(({ useLocation }) => {
    const [, setLoc] = useLocation();
    setLoc(to);
  });
  return null;
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
