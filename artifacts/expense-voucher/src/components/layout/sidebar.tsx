import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, FileText, PlusCircle, LogOut, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vouchers", label: "Vouchers", icon: FileText },
  ];

  if (user.role === "employee") {
    navItems.push({ href: "/vouchers/new", label: "New Voucher", icon: PlusCircle });
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card/50 backdrop-blur-md shrink-0">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3 font-bold text-xl text-primary tracking-tight">
          <Hexagon className="w-6 h-6 fill-primary/20 text-primary stroke-[1.5]" />
          <span>VoucherPro</span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-1.5">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-3">Menu</div>
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}>
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                )}
                <item.icon className={cn("w-4 h-4 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-border p-4 bg-background/30">
        <div className="flex items-center gap-3 px-2 py-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/80 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg border border-white/10">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="text-sm font-semibold text-foreground truncate leading-tight">{user.name}</div>
            <div className="text-[11px] text-muted-foreground capitalize tracking-wide font-medium">{user.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
