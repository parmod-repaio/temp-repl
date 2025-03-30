import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppLayout } from '@/components/layout/app-layout';
import { insertCampaignSchema, InsertCampaign, CustomerList } from '@shared/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CreateCampaignPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  
  // Fetch customer lists
  const { 
    data: customerLists, 
    isLoading: isLoadingLists,
    error: listsError 
  } = useQuery<CustomerList[]>({
    queryKey: ['/api/customer-lists'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customer-lists', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer lists');
      }
      
      return response.json();
    },
  });
  
  // Setup form with validation schema
  const form = useForm<InsertCampaign>({
    resolver: zodResolver(insertCampaignSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'inactive',
      userId: user?.id || '',
    },
  });
  
  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: { campaignData: InsertCampaign; customerListIds: string[] }) => {
      const { campaignData, customerListIds } = data;
      
      const response = await apiRequest('POST', '/api/campaigns', {
        ...campaignData,
        customerListIds,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      toast({
        title: 'Campaign created',
        description: `"${data.name}" has been successfully created.`,
      });
      
      // Navigate to the campaign details page
      navigate(`/campaigns/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: InsertCampaign) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedListIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one customer list',
        variant: 'destructive',
      });
      return;
    }
    
    createCampaignMutation.mutate({
      campaignData: {
        ...data,
        userId: user.id,
      },
      customerListIds: selectedListIds,
    });
  };
  
  const handleListSelection = (listId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedListIds((prev) => [...prev, listId]);
    } else {
      setSelectedListIds((prev) => prev.filter((id) => id !== listId));
    }
  };
  
  return (
    <AppLayout title="Create Campaign">
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={() => navigate('/campaigns')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold text-gray-800">Create New Campaign</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Create a campaign targeting specific customer lists
            </p>
          </div>
          
          {/* Create campaign form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Details</CardTitle>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  {listsError && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {listsError instanceof Error ? listsError.message : 'Failed to load customer lists'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {customerLists?.length === 0 && (
                    <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                      <AlertTitle>No Customer Lists Available</AlertTitle>
                      <AlertDescription>
                        You need to create at least one customer list before creating a campaign.
                        <div className="mt-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/customer-lists/create">
                              Create Customer List
                            </Link>
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter campaign name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add a description of this campaign"
                            rows={3}
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set as inactive to prepare the campaign without activating it immediately.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-3">
                    <FormLabel>Target Customer Lists</FormLabel>
                    <FormDescription>
                      Select one or more customer lists to target with this campaign.
                      All customers in the selected lists will automatically be linked to this campaign.
                    </FormDescription>
                    
                    {isLoadingLists ? (
                      <div className="flex justify-center items-center p-4 border rounded-md">
                        <Loader2 className="h-5 w-5 animate-spin mr-2 text-gray-400" />
                        <span className="text-sm text-gray-500">Loading customer lists...</span>
                      </div>
                    ) : customerLists && customerLists.length > 0 ? (
                      <div className="border rounded-md p-4 space-y-3">
                        {customerLists.map((list) => (
                          <div key={list.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`list-${list.id}`}
                              checked={selectedListIds.includes(list.id)}
                              onCheckedChange={(checked) => 
                                handleListSelection(list.id, checked as boolean)
                              }
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={`list-${list.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {list.name}
                              </label>
                              {list.description && (
                                <p className="text-xs text-gray-500">{list.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {selectedListIds.length === 0 && (
                          <p className="text-sm text-red-500">Please select at least one customer list</p>
                        )}
                      </div>
                    ) : (
                      <div className="border rounded-md p-4 text-center">
                        <p className="text-sm text-gray-500">No customer lists available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/campaigns')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={
                        createCampaignMutation.isPending || 
                        isLoadingLists || 
                        !customerLists?.length ||
                        selectedListIds.length === 0
                      }
                    >
                      {createCampaignMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Campaign'
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
