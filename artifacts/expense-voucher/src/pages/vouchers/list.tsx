import { useState } from "react";
import { useListVouchers } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Search, Plus, SlidersHorizontal, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";

export default function VouchersList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data, isLoading } = useListVouchers({
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
  });

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vouchers</h1>
          <p className="text-muted-foreground mt-1">Manage and track expense vouchers.</p>
        </div>
        
        {user?.role === "employee" && (
          <Link href="/vouchers/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Create Voucher
            </Button>
          </Link>
        )}
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, title, or employee..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </Card>

      <Card className="overflow-hidden border-border bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-black/20 hover:bg-black/20">
              <TableHead>Voucher No.</TableHead>
              <TableHead>Date</TableHead>
              {user?.role !== "employee" && <TableHead>Employee</TableHead>}
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : data?.vouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No vouchers found.
                </TableCell>
              </TableRow>
            ) : (
              data?.vouchers.map((voucher: any) => (
                <TableRow key={voucher.id} className="group">
                  <TableCell className="font-medium font-mono text-xs">{voucher.voucherNumber}</TableCell>
                  <TableCell>{format(new Date(voucher.expenseDate), "MMM dd, yyyy")}</TableCell>
                  {user?.role !== "employee" && (
                    <TableCell>
                      <div className="text-sm">{voucher.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{voucher.department}</div>
                    </TableCell>
                  )}
                  <TableCell>{voucher.expenseCategory}</TableCell>
                  <TableCell className="font-semibold">${voucher.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(voucher.status) as any} className="text-[10px]">
                      {getStatusLabel(voucher.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/vouchers/${voucher.id}`}>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        View <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
