import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppLayout } from '@/components/layout/app-layout';
import { Customer, InsertCustomer, insertCustomerSchema, CustomerList } from '@shared/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Fetch customer details
  const { 
    data: customer, 
    isLoading: isLoadingCustomer,
    error: customerError
  } = useQuery<Customer>({
    queryKey: [`/api/customers/${params.id}`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Customer not found');
        }
        throw new Error('Failed to fetch customer details');
      }
      
      return response.json();
    },
  });
  
  // Fetch customer lists for dropdown
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
  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema.partial()),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      status: 'active',
      customerListId: '',
    },
  });
  
  // Update form when customer data is loaded
  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phoneNumber || '',
        status: customer.status || 'active',
        customerListId: customer.customerListId,
      });
    }
  }, [customer, form]);
  
  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (customerData: Partial<InsertCustomer>) => {
      const response = await apiRequest('PUT', `/api/customers/${params.id}`, customerData);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      
      // If customer list changed, invalidate related queries
      if (customer && data.customerListId !== customer.customerListId) {
        queryClient.invalidateQueries({ queryKey: [`/api/customer-lists/${customer.customerListId}/customers`] });
        queryClient.invalidateQueries({ queryKey: [`/api/customer-lists/${data.customerListId}/customers`] });
      }
      
      toast({
        title: 'Customer updated',
        description: `${data.name} has been successfully updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update customer',
        variant: 'destructive',
      });
    },
  });
  
  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/customers/${params.id}`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      if (customer) {
        queryClient.invalidateQueries({ queryKey: [`/api/customer-lists/${customer.customerListId}/customers`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      toast({
        title: 'Customer deleted',
        description: 'The customer has been successfully deleted.',
      });
      
      // Navigate back to customers page
      navigate('/customers');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete customer',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: InsertCustomer) => {
    updateCustomerMutation.mutate(data);
  };
  
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    deleteCustomerMutation.mutate();
    setDeleteDialogOpen(false);
  };
  
  // Handle loading states and errors
  if (isLoadingCustomer) {
    return (
      <AppLayout title="Loading Customer...">
        <div className="py-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={() => navigate('/customers')}
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
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (customerError) {
    return (
      <AppLayout title="Error">
        <div className="py-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {customerError instanceof Error ? customerError.message : 'Failed to load customer details'}
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/customers')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Customers
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title={customer ? `Edit ${customer.name}` : 'Edit Customer'}>
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={() => navigate('/customers')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold text-gray-800">
                {customer?.name}
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Edit customer information
            </p>
          </div>
          
          {/* Edit customer form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
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
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email address" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customerListId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer List</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isLoadingLists}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer list" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingLists ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading lists...</span>
                              </div>
                            ) : customerLists && customerLists.length > 0 ? (
                              customerLists.map((list) => (
                                <SelectItem key={list.id} value={list.id}>
                                  {list.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-gray-500">
                                No customer lists available. Please create one first.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-between w-full">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={handleDelete}
                      disabled={deleteCustomerMutation.isPending}
                    >
                      {deleteCustomerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Customer'
                      )}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/customers')}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateCustomerMutation.isPending || isLoadingLists}
                      >
                        {updateCustomerMutation.isPending ? (
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
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete {customer?.name}? This will remove them from all
            campaigns they are part of. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? (
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
