import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, InsertCampaign, CustomerList } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useCampaigns() {
  const { toast } = useToast();

  // Get all campaigns
  const {
    data: campaigns = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  // Get customer lists for a specific campaign
  const useCampaignLists = (campaignId: string) => {
    return useQuery<CustomerList[]>({
      queryKey: ["/api/campaigns", campaignId, "lists"],
      queryFn: async () => {
        const res = await fetch(`/api/campaigns/${campaignId}/lists`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch campaign lists");
        }
        return res.json();
      },
      enabled: !!campaignId,
    });
  };

  // Create a new campaign
  const createCampaignMutation = useMutation({
    mutationFn: async ({
      campaign,
      listIds,
    }: {
      campaign: InsertCampaign;
      listIds: string[];
    }) => {
      const res = await apiRequest("POST", "/api/campaigns", { campaign, listIds });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Campaign created successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update a campaign
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCampaign> }) => {
      const res = await apiRequest("PUT", `/api/campaigns/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Success",
        description: "Campaign updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete a campaign
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    campaigns,
    isLoading,
    error,
    refetch,
    useCampaignLists,
    createCampaignMutation,
    updateCampaignMutation,
    deleteCampaignMutation,
  };
}
