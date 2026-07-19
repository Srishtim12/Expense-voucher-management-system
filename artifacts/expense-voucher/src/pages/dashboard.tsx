import { useAuth } from "@/lib/auth-context";
import { 
  useGetEmployeeDashboard, 
  useGetDirectorDashboard, 
  useGetAccountsDashboard 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { FileText, Clock, CheckCircle2, XCircle, DollarSign, Activity } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();

  const isEmployee = user?.role === "employee";
  const isDirector = user?.role === "director";
  const isAccounts = user?.role === "accounts";

  const { data: employeeData, isLoading: empLoading } = useGetEmployeeDashboard({
    query: { enabled: isEmployee }
  });
  const { data: directorData, isLoading: dirLoading } = useGetDirectorDashboard({
    query: { enabled: isDirector }
  });
  const { data: accountsData, isLoading: accLoading } = useGetAccountsDashboard({
    query: { enabled: isAccounts }
  });

  const isLoading = empLoading || dirLoading || accLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Map data to unified format
  let stats: any[] = [];
  let recentActivity: any[] = [];
  let chartData: any[] = [];

  if (isEmployee && employeeData) {
    stats = [
      { label: "Total Amount", value: `$${employeeData.totalAmount.toFixed(2)}`, icon: DollarSign, color: "text-primary" },
      { label: "Pending", value: employeeData.pendingApproval, icon: Clock, color: "text-amber-500" },
      { label: "Approved", value: employeeData.approved, icon: CheckCircle2, color: "text-emerald-500" },
      { label: "Drafts", value: employeeData.draft, icon: FileText, color: "text-blue-400" },
    ];
    recentActivity = employeeData.recentVouchers || [];
    chartData = [
      { name: "Draft", value: employeeData.draft, fill: "#60a5fa" },
      { name: "Submitted", value: employeeData.submitted, fill: "#818cf8" },
      { name: "Pending", value: employeeData.pendingApproval, fill: "#f59e0b" },
      { name: "Approved", value: employeeData.approved, fill: "#10b981" },
      { name: "Rejected", value: employeeData.rejected, fill: "#ef4444" },
    ];
  } else if (isDirector && directorData) {
    stats = [
      { label: "Pending Approvals", value: directorData.pendingApprovals, icon: Clock, color: "text-amber-500" },
      { label: "Pending Amount", value: `$${directorData.pendingAmount.toFixed(2)}`, icon: DollarSign, color: "text-primary" },
      { label: "Approved Today", value: directorData.approvedToday, icon: CheckCircle2, color: "text-emerald-500" },
      { label: "Rejected Today", value: directorData.rejectedToday, icon: XCircle, color: "text-destructive" },
    ];
    recentActivity = directorData.recentActivity || [];
    chartData = [
      { name: "Pending", value: directorData.pendingApprovals, fill: "#f59e0b" },
      { name: "Approved (Today)", value: directorData.approvedToday, fill: "#10b981" },
      { name: "Rejected (Today)", value: directorData.rejectedToday, fill: "#ef4444" },
    ];
  } else if (isAccounts && accountsData) {
    stats = [
      { label: "Total Approved", value: `$${accountsData.totalApprovedAmount.toFixed(2)}`, icon: DollarSign, color: "text-emerald-500" },
      { label: "Pending Processing", value: accountsData.pending, icon: Clock, color: "text-amber-500" },
      { label: "Approved Vouchers", value: accountsData.approved, icon: CheckCircle2, color: "text-emerald-500" },
      { label: "Total Vouchers", value: accountsData.total, icon: FileText, color: "text-primary" },
    ];
    recentActivity = accountsData.recentReimbursements || [];
    chartData = [
      { name: "Pending", value: accountsData.pending, fill: "#f59e0b" },
      { name: "Approved", value: accountsData.approved, fill: "#10b981" },
      { name: "Rejected", value: accountsData.rejected, fill: "#ef4444" },
    ];
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "success";
      case "rejected": return "destructive";
      case "pending_approval": return "warning";
      case "submitted": return "info";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} 
                  itemStyle={{ color: '#fff' }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <Link key={activity.id} href={`/vouchers/${activity.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-border">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{activity.voucherNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {isEmployee ? "Submitted" : activity.employeeName}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-semibold">${activity.amount.toFixed(2)}</div>
                        <Badge variant={getStatusColor(activity.status) as any} className="text-[10px] px-1.5 py-0">
                          {getStatusLabel(activity.status)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                <FileText className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
