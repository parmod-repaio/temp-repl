import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppLayout } from '@/components/layout/app-layout';
import { insertCustomerListSchema, InsertCustomerList } from '@shared/schema';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

export default function CreateCustomerListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Setup form with validation schema
  const form = useForm<InsertCustomerList>({
    resolver: zodResolver(insertCustomerListSchema),
    defaultValues: {
      name: '',
      description: '',
      userId: user?.id || '',
    },
  });
  
  // Create customer list mutation
  const createListMutation = useMutation({
    mutationFn: async (listData: InsertCustomerList) => {
      const response = await apiRequest('POST', '/api/customer-lists', listData);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate customer lists query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/customer-lists'] });
      
      toast({
        title: 'Customer list created',
        description: `"${data.name}" has been successfully created.`,
      });
      
      // Navigate to the new list
      navigate(`/customer-lists/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create customer list',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: InsertCustomerList) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }
    
    createListMutation.mutate({
      ...data,
      userId: user.id,
    });
  };
  
  return (
    <AppLayout title="Create Customer List">
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={() => navigate('/customer-lists')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold text-gray-800">Create New Customer List</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Create a customer list to organize your contacts
            </p>
          </div>
          
          {/* Create list form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">List Details</CardTitle>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>List Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a unique name" {...field} />
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
                            placeholder="Add a description of this customer list"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/customer-lists')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createListMutation.isPending}
                    >
                      {createListMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create List'
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
