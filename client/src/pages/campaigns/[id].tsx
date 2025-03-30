import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppLayout } from '@/components/layout/app-layout';
import { insertCampaignSchema, InsertCampaign, Campaign, CustomerList, Customer } from '@shared/schema';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Loader2, ArrowLeft, AlertCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  
  // Fetch campaign details
  const { 
    data: campaignData, 
    isLoading: isLoadingCampaign,
    error: campaignError
  } = useQuery({
    queryKey: [`/api/campaigns/${params.id}`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/campaigns/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Campaign not found');
        }
        throw new Error('Failed to fetch campaign details');
      }
      
      return response.json();
    },
  });
  
  // Fetch all customer lists for editing
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
  
  // Fetch customers in the campaign
  const { 
    data: customers, 
    isLoading: isLoadingCustomers,
    error: customersError
  } = useQuery<Customer[]>({
    queryKey: [`/api/campaigns/${params.id}/customers`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/campaigns/${params.id}/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers for this campaign');
      }
      
      return response.json();
    },
    enabled: activeTab === 'customers',
  });
  
  // Setup form with campaign data
  const form = useForm<InsertCampaign>({
    resolver: zodResolver(insertCampaignSchema.partial()),
    defaultValues: {
      name: '',
      description: '',
      status: 'inactive',
    },
  });
  
  // Update form when campaign data is loaded
  useEffect(() => {
    if (campaignData) {
      form.reset({
        name: campaignData.name,
        description: campaignData.description,
        status: campaignData.status,
      });
      
      // Initialize selected customer lists if available
      if (campaignData.customerLists) {
        setSelectedListIds(campaignData.customerLists.map((list: CustomerList) => list.id));
      }
    }
  }, [campaignData, form]);
  
  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async (data: { campaignData: Partial<InsertCampaign>; customerListIds?: string[] }) => {
      const { campaignData, customerListIds } = data;
      
      const response = await apiRequest('PUT', `/api/campaigns/${params.id}`, {
        ...campaignData,
        customerListIds,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${params.id}/customers`] });
      
      toast({
        title: 'Campaign updated',
        description: `"${data.name}" has been successfully updated.`,
      });
      
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update campaign',
        variant: 'destructive',
      });
    },
  });
  
  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/campaigns/${params.id}`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      toast({
        title: 'Campaign deleted',
        description: 'The campaign has been successfully deleted.',
      });
      
      // Navigate back to campaigns page
      navigate('/campaigns');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete campaign',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: InsertCampaign) => {
    // For campaign updates, we need to include customer list IDs if they've changed
    if (selectedListIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one customer list',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if customer lists have changed
    const currentListIds = campaignData.customerLists?.map((list: CustomerList) => list.id) || [];
    const listIdsChanged = JSON.stringify(currentListIds.sort()) !== JSON.stringify([...selectedListIds].sort());
    
    updateCampaignMutation.mutate({
      campaignData: data,
      customerListIds: listIdsChanged ? selectedListIds : undefined,
    });
  };
  
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    deleteCampaignMutation.mutate();
    setDeleteDialogOpen(false);
  };
  
  const handleListSelection = (listId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedListIds((prev) => [...prev, listId]);
    } else {
      setSelectedListIds((prev) => prev.filter((id) => id !== listId));
    }
  };
  
  // Handle loading states and errors
  if (isLoadingCampaign) {
    return (
      <AppLayout title="Loading Campaign...">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={() => navigate('/campaigns')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Skeleton className="h-8 w-64" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (campaignError) {
    return (
      <AppLayout title="Error">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {campaignError instanceof Error ? campaignError.message : 'Failed to load campaign details'}
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/campaigns')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Campaigns
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title={campaignData ? campaignData.name : 'Campaign Details'}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
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
              <h1 className="text-2xl font-semibold text-gray-800">
                {campaignData?.name}
              </h1>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2" 
                  onClick={() => setIsEditing(true)}
                >
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit
                </Button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {campaignData?.description || 'No description provided'}
            </p>
          </div>
          
          {/* Campaign details and customers */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="details">Campaign Details</TabsTrigger>
              <TabsTrigger value="customers">Targeted Customers</TabsTrigger>
            </TabsList>
            
            {/* Details tab */}
            <TabsContent value="details">
              {isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Edit Campaign</CardTitle>
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
                                  {...field}
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
                                defaultValue={field.value}
                                value={field.value}
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
                                Set as inactive to pause the campaign.
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
                        <div className="flex justify-between w-full">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={handleDelete}
                            disabled={deleteCampaignMutation.isPending}
                          >
                            {deleteCampaignMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              'Delete Campaign'
                            )}
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditing(false);
                                form.reset({
                                  name: campaignData.name,
                                  description: campaignData.description,
                                  status: campaignData.status,
                                });
                                setSelectedListIds(campaignData.customerLists?.map((list: CustomerList) => list.id) || []);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={updateCampaignMutation.isPending || selectedListIds.length === 0}
                            >
                              {updateCampaignMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                'Save Changes'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardFooter>
                    </form>
                  </Form>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Campaign Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Campaign Name</h3>
                      <p className="mt-1">{campaignData?.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1">{campaignData?.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <div className="mt-1">
                        <Badge 
                          variant={campaignData?.status === 'active' ? 'success' : 'secondary'}
                          className={campaignData?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {campaignData?.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created</h3>
                      <p className="mt-1">
                        {campaignData?.createdAt && new Date(campaignData.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Target Customer Lists</h3>
                      <div className="mt-2 space-y-2">
                        {campaignData?.customerLists && campaignData.customerLists.length > 0 ? (
                          campaignData.customerLists.map((list: CustomerList) => (
                            <div key={list.id} className="flex items-center space-x-2">
                              <span className="h-2 w-2 rounded-full bg-primary"></span>
                              <span className="text-sm">{list.name}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No customer lists selected</p>
                        )}
                      </div>
                    </div>
                    <div className="pt-4">
                      <div className="flex space-x-2">
                        <Button onClick={() => setIsEditing(true)}>
                          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit Campaign
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                          Delete Campaign
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Customers tab */}
            <TabsContent value="customers">
              <Card>
                <CardHeader className="border-b border-gray-200 bg-gray-50">
                  <CardTitle className="text-base">
                    Targeted Customers
                    {customers && customers.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{customers.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingCustomers ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : customersError ? (
                    <div className="p-6">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {customersError instanceof Error ? customersError.message : 'Failed to load customers'}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : customers && customers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>List</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">
                              <a 
                                href={`/customers/${customer.id}`} 
                                className="text-primary hover:underline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/customers/${customer.id}`);
                                }}
                              >
                                {customer.name}
                              </a>
                            </TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.phoneNumber || '-'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={customer.status === 'active' ? 'success' : 'secondary'}
                                className={customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                              >
                                {customer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <a 
                                href={`/customer-lists/${customer.customerListId}`} 
                                className="text-primary hover:underline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/customer-lists/${customer.customerListId}`);
                                }}
                              >
                                View List
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No customers in this campaign</h3>
                      <p className="text-sm text-gray-500 max-w-sm mt-1">
                        This campaign doesn't have any customers yet. Edit the campaign to select customer lists.
                      </p>
                      <Button className="mt-4" onClick={() => setActiveTab('details')}>
                        View Campaign Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete this campaign? This will remove all customer associations. 
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteCampaignMutation.isPending}
            >
              {deleteCampaignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
