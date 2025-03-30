import { useQuery, useMutation } from "@tanstack/react-query";
import { CustomerList, InsertCustomerList } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useCustomerLists() {
  const { toast } = useToast();

  // Get all customer lists
  const {
    data: customerLists = [],
    isLoading,
    error,
    refetch,
  } = useQuery<CustomerList[]>({
    queryKey: ["/api/customer-lists"],
  });

  // Create a new customer list
  const createListMutation = useMutation({
    mutationFn: async (list: InsertCustomerList) => {
      const res = await apiRequest("POST", "/api/customer-lists", list);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-lists"] });
      toast({
        title: "Success",
        description: "Customer list created successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create customer list: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update a customer list
  const updateListMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCustomerList> }) => {
      const res = await apiRequest("PUT", `/api/customer-lists/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-lists"] });
      toast({
        title: "Success",
        description: "Customer list updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update customer list: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete a customer list
  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customer-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-lists"] });
      toast({
        title: "Success",
        description: "Customer list deleted successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete customer list: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Import customers via CSV
  const importCustomersMutation = useMutation({
    mutationFn: async ({ listId, formData }: { listId: string; formData: FormData }) => {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to import customers");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Import successful",
        description: `${data.importedCount} customers imported (${data.errorCount} errors)`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    customerLists,
    isLoading,
    error,
    refetch,
    createListMutation,
    updateListMutation,
    deleteListMutation,
    importCustomersMutation,
  };
}
