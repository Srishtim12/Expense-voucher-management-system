import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { User, useLogin, LoginInput } from "@workspace/api-client-react";
import { getToken, setToken, removeToken, getUser } from "./auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginInput) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useLogin();

  useEffect(() => {
    const t = getToken();
    if (t) {
      setTokenState(t);
      setUser(getUser());
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginInput) => {
    try {
      const res = await loginMutation.mutateAsync({ data });
      setToken(res.token);
      setTokenState(res.token);
      setUser(getUser());
    } catch (e: any) {
      toast({
        title: "Login failed",
        description: e.message || "Invalid credentials",
        variant: "destructive",
      });
      throw e;
    }
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
