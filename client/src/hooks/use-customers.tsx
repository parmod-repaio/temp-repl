import { useQuery, useMutation } from "@tanstack/react-query";
import { Customer, InsertCustomer } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useCustomers(listId?: string) {
  const { toast } = useToast();
  const queryKey = listId 
    ? ["/api/customers", { listId }] 
    : ["/api/customers"];

  // Get customers, optionally filtered by list
  const {
    data: customers = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Customer[]>({
    queryKey,
  });

  // Create a new customer
  const createCustomerMutation = useMutation({
    mutationFn: async (customer: InsertCustomer) => {
      const res = await apiRequest("POST", "/api/customers", customer);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Customer created successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create customer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update a customer
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCustomer> }) => {
      const res = await apiRequest("PUT", `/api/customers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update customer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete a customer
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete customer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    customers,
    isLoading,
    error,
    refetch,
    createCustomerMutation,
    updateCustomerMutation,
    deleteCustomerMutation,
  };
}
