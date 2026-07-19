import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateVoucher, useGetVoucher, getGetVoucherQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const voucherSchema = z.object({
  voucherDate: z.string().min(1, "Required"),
  expenseDate: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
  expenseTitle: z.string().min(3, "Too short"),
  expenseCategory: z.string().min(1, "Required"),
  expenseDescription: z.string().optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

export default function VoucherEdit() {
  const { id } = useParams<{ id: string }>();
  const voucherId = parseInt(id, 10);
  const [loading, setLoading] = useState(false);
  
  const { data: voucher, isLoading } = useGetVoucher(voucherId, {
    query: { enabled: !!voucherId, queryKey: getGetVoucherQueryKey(voucherId) }
  });
  
  const updateMutation = useUpdateVoucher();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof voucherSchema>>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      voucherDate: "",
      expenseDate: "",
      department: "",
      expenseTitle: "",
      expenseCategory: "",
      expenseDescription: "",
      amount: 0,
    },
  });

  useEffect(() => {
    if (voucher) {
      form.reset({
        voucherDate: format(new Date(voucher.voucherDate), "yyyy-MM-dd"),
        expenseDate: format(new Date(voucher.expenseDate), "yyyy-MM-dd"),
        department: voucher.department,
        expenseTitle: voucher.expenseTitle,
        expenseCategory: voucher.expenseCategory,
        expenseDescription: voucher.expenseDescription || "",
        amount: voucher.amount,
      });
    }
  }, [voucher, form]);

  const onSubmit = async (data: z.infer<typeof voucherSchema>) => {
    try {
      setLoading(true);
      await updateMutation.mutateAsync({ id: voucherId, data });
      queryClient.setQueryData(getGetVoucherQueryKey(voucherId), (old: any) => 
        old ? { ...old, ...data } : old
      );
      toast({
        title: "Draft Updated",
        description: "Voucher changes saved successfully.",
      });
      setLocation(`/vouchers/${voucherId}`);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update voucher.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!voucher) return <div className="p-8 text-center">Not found</div>;
  if (voucher.status !== "draft") return <div className="p-8 text-center">Only draft vouchers can be edited</div>;

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/vouchers/${voucherId}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Draft Voucher</h1>
          <p className="text-muted-foreground text-sm">Update your expense details.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="expenseTitle"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Expense Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Client Dinner in SF" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Travel">Travel</SelectItem>
                          <SelectItem value="Accommodation">Accommodation</SelectItem>
                          <SelectItem value="Meals">Meals</SelectItem>
                          <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                          <SelectItem value="Medical">Medical</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Expense</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expenseDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide any additional details or justification..." 
                        className="h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Link href={`/vouchers/${voucherId}`}>
                  <Button variant="ghost" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
