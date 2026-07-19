import { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetVoucher, 
  useSubmitVoucher, 
  useApproveVoucher, 
  useRejectVoucher, 
  useDeleteVoucher,
  getGetVoucherQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Printer, Upload, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "@/lib/auth";

export default function VoucherDetail() {
  const { id } = useParams<{ id: string }>();
  const voucherId = parseInt(id, 10);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploadingSig, setUploadingSig] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directorFileInputRef = useRef<HTMLInputElement>(null);

  const { data: voucher, isLoading, error } = useGetVoucher(voucherId, {
    query: { enabled: !!voucherId, queryKey: getGetVoucherQueryKey(voucherId) }
  });

  const submitMutation = useSubmitVoucher();
  const approveMutation = useApproveVoucher();
  const rejectMutation = useRejectVoucher();
  const deleteMutation = useDeleteVoucher();

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !voucher) return <div className="p-8 text-center text-destructive">Error loading voucher</div>;

  const isEmployee = user?.role === "employee";
  const isDirector = user?.role === "director";
  const isAccounts = user?.role === "accounts";
  
  const isOwner = isEmployee && voucher.employeeUserId === user?.id;
  const isDraft = voucher.status === "draft";
  const isPending = voucher.status === "pending_approval";
  const isApproved = voucher.status === "approved";
  
  // Actions
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>, isDirectorSig = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSig(true);
      const token = getToken();
      const fd = new FormData();
      fd.append("signature", file);
      
      const endpoint = isDirectorSig 
        ? `/api/vouchers/${voucherId}/director-signature`
        : `/api/vouchers/${voucherId}/signature`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      toast({ title: "Signature uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: getGetVoucherQueryKey(voucherId) });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingSig(false);
    }
  };

  const handleSubmit = async () => {
    if (!voucher.employeeSignatureUrl) {
      toast({ title: "Signature required", description: "Please upload your signature first.", variant: "destructive" });
      return;
    }
    try {
      await submitMutation.mutateAsync({ id: voucherId });
      toast({ title: "Submitted", description: "Voucher submitted for approval." });
      queryClient.invalidateQueries({ queryKey: getGetVoucherQueryKey(voucherId) });
    } catch (e) {}
  };

  const handleApprove = async () => {
    if (!voucher.directorSignatureUrl) {
      toast({ title: "Signature required", description: "Please upload your signature first.", variant: "destructive" });
      return;
    }
    try {
      await approveMutation.mutateAsync({ id: voucherId, data: { directorSignatureUrl: voucher.directorSignatureUrl } });
      toast({ title: "Approved", description: "Voucher has been approved." });
      queryClient.invalidateQueries({ queryKey: getGetVoucherQueryKey(voucherId) });
    } catch (e) {}
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({ title: "Reason required", description: "Provide a rejection reason.", variant: "destructive" });
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id: voucherId, data: { rejectionReason: rejectReason } });
      toast({ title: "Rejected", description: "Voucher has been rejected." });
      setShowRejectModal(false);
      queryClient.invalidateQueries({ queryKey: getGetVoucherQueryKey(voucherId) });
    } catch (e) {}
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this draft?")) {
      try {
        await deleteMutation.mutateAsync({ id: voucherId });
        toast({ title: "Deleted", description: "Draft deleted." });
        setLocation("/vouchers");
      } catch (e) {}
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vouchers">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Voucher {voucher.voucherNumber}</h1>
              <Badge variant={voucher.status === "approved" ? "success" : voucher.status === "rejected" ? "destructive" : "secondary"}>
                {voucher.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">{voucher.expenseTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAccounts && isApproved && (
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
          )}
          {isOwner && isDraft && (
            <>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
              <Link href={`/vouchers/${voucher.id}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" /> Edit
                </Button>
              </Link>
              <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                Submit for Approval
              </Button>
            </>
          )}
          {isDirector && isPending && (
            <>
              <Button variant="destructive" onClick={() => setShowRejectModal(true)}>
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApprove} disabled={approveMutation.isPending}>
                <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
            </>
          )}
        </div>
      </div>

      {voucher.rejectionReason && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg">
          <p className="font-semibold mb-1 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Rejection Reason
          </p>
          <p className="text-sm">{voucher.rejectionReason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-lg">Expense Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employee</p>
                  <p className="font-medium">{voucher.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="font-medium">{voucher.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Expense Date</p>
                  <p className="font-medium">{format(new Date(voucher.expenseDate), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-medium">{voucher.expenseCategory}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm bg-black/20 p-3 rounded border border-border whitespace-pre-wrap">
                    {voucher.expenseDescription || "No description provided."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm">Employee Signature</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col items-center justify-center min-h-[120px]">
                {voucher.employeeSignatureUrl ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-emerald-400 font-medium">Signed</p>
                  </div>
                ) : isOwner && isDraft ? (
                  <div className="text-center w-full">
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleSignatureUpload} accept="image/*" />
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={uploadingSig}>
                      <Upload className="w-4 h-4 mr-2" /> Upload Signature
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Pending signature</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm">Director Approval</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col items-center justify-center min-h-[120px]">
                {voucher.directorSignatureUrl ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-emerald-400 font-medium">Approved by {voucher.approvedByName}</p>
                  </div>
                ) : isDirector && isPending ? (
                  <div className="text-center w-full">
                    <input type="file" className="hidden" ref={directorFileInputRef} onChange={(e) => handleSignatureUpload(e, true)} accept="image/*" />
                    <Button variant="outline" className="w-full border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10" onClick={() => directorFileInputRef.current?.click()} disabled={uploadingSig}>
                      <Upload className="w-4 h-4 mr-2" /> Upload Signature
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Pending review</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-primary font-medium mb-1">Total Amount</p>
              <p className="text-4xl font-bold tracking-tight text-white">${voucher.amount.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-primary bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-primary">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-border bg-card">
                    <p className="text-xs font-semibold">Created</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(voucher.createdAt), "MMM dd, yyyy HH:mm")}</p>
                  </div>
                </div>

                {voucher.status !== "draft" && (
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-primary bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-primary">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-border bg-card">
                      <p className="text-xs font-semibold">Submitted</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>Reject Voucher</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
                  placeholder="Explain why this voucher is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>Confirm Rejection</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Just an icon missing from lucide above
function XCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
