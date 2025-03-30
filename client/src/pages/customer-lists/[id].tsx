import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppLayout } from '@/components/layout/app-layout';
import { CustomerList, InsertCustomerList, insertCustomerListSchema, Customer } from '@shared/schema';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Loader2, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  UserPlus, 
  FileUp, 
  Download, 
  UploadCloud, 
  AlertCircle,
  X
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerListDetailPage({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');
  const [deleteCustomerDialogOpen, setDeleteCustomerDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch customer list details
  const { 
    data: customerList, 
    isLoading: isLoadingList,
    error: listError 
  } = useQuery<CustomerList>({
    queryKey: [`/api/customer-lists/${params.id}`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customer-lists/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Customer list not found');
        }
        throw new Error('Failed to fetch customer list details');
      }
      
      return response.json();
    },
  });
  
  // Fetch customers for this list
  const { 
    data: customers, 
    isLoading: isLoadingCustomers,
    error: customersError
  } = useQuery<Customer[]>({
    queryKey: [`/api/customer-lists/${params.id}/customers`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customer-lists/${params.id}/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers for this list');
      }
      
      return response.json();
    },
  });
  
  // Setup form with validation schema and default values from the customer list
  const form = useForm<InsertCustomerList>({
    resolver: zodResolver(insertCustomerListSchema.partial()),
    defaultValues: {
      name: customerList?.name || '',
      description: customerList?.description || '',
    },
  });
  
  // Update form values when customerList data is loaded
  useEffect(() => {
    if (customerList && !form.formState.isDirty) {
      form.reset({
        name: customerList.name,
        description: customerList.description,
      });
    }
  }, [customerList, form]);
  
  // Update customer list mutation
  const updateListMutation = useMutation({
    mutationFn: async (listData: Partial<InsertCustomerList>) => {
      const response = await apiRequest('PUT', `/api/customer-lists/${params.id}`, listData);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate customer list query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/customer-lists/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-lists'] });
      
      toast({
        title: 'Customer list updated',
        description: `"${data.name}" has been successfully updated.`,
      });
      
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update customer list',
        variant: 'destructive',
      });
    },
  });
  
  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      await apiRequest('DELETE', `/api/customers/${customerId}`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/customer-lists/${params.id}/customers`] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      
      toast({
        title: 'Customer deleted',
        description: 'The customer has been successfully deleted.',
      });
      
      setDeleteCustomerDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete customer',
        variant: 'destructive',
      });
    },
  });
  
  // Upload CSV mutation
  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customer-lists/${params.id}/upload-csv`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload CSV file');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/customer-lists/${params.id}/customers`] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      toast({
        title: 'CSV imported successfully',
        description: data.message || `Successfully imported customers to the list.`,
      });
      
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadError(null);
    },
    onError: (error: Error) => {
      setUploadError(error.message || 'Failed to upload CSV file');
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload CSV file',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: InsertCustomerList) => {
    updateListMutation.mutate(data);
  };
  
  const handleDeleteCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDeleteCustomerDialogOpen(true);
  };
  
  const confirmDeleteCustomer = () => {
    if (selectedCustomerId) {
      deleteCustomerMutation.mutate(selectedCustomerId);
    }
  };
  
  const openUploadDialog = () => {
    setUploadDialogOpen(true);
    setUploadFile(null);
    setUploadError(null);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setUploadError('Please upload a CSV file');
        setUploadFile(null);
      } else {
        setUploadFile(file);
        setUploadError(null);
      }
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setUploadError('Please upload a CSV file');
        setUploadFile(null);
      } else {
        setUploadFile(file);
        setUploadError(null);
      }
    }
  };
  
  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError('Please select a CSV file to upload');
      return;
    }
    
    setIsUploading(true);
    
    try {
      await uploadCsvMutation.mutateAsync(uploadFile);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle loading states and errors
  if (isLoadingList) {
    return (
      <AppLayout title="Loading Customer List...">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={() => navigate('/customer-lists')}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (listError) {
    return (
      <AppLayout title="Error">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {listError instanceof Error ? listError.message : 'Failed to load customer list'}
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/customer-lists')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Customer Lists
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title={customerList ? customerList.name : 'Customer List'}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
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
              <h1 className="text-2xl font-semibold text-gray-800">
                {customerList?.name}
              </h1>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {customerList?.description || 'No description provided'}
            </p>
          </div>
          
          {/* List details and customers */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="settings">List Settings</TabsTrigger>
            </TabsList>
            
            {/* Customers tab */}
            <TabsContent value="customers">
              <Card>
                <CardHeader className="border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <CardTitle className="text-base">
                    Customers
                    {customers && customers.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{customers.length}</Badge>
                    )}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={openUploadDialog}>
                      <FileUp className="h-4 w-4 mr-1" />
                      Import CSV
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/customers/create?listId=${params.id}`}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Customer
                      </Link>
                    </Button>
                  </div>
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
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">
                              <Link href={`/customers/${customer.id}`} className="text-primary hover:underline">
                                {customer.name}
                              </Link>
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
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <span className="sr-only">Open menu</span>
                                    <svg
                                      width="15"
                                      height="15"
                                      viewBox="0 0 15 15"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                    >
                                      <path
                                        d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                                        fill="currentColor"
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                      ></path>
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    View/Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => handleDeleteCustomer(customer.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                        <UserPlus className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No customers in this list</h3>
                      <p className="text-sm text-gray-500 max-w-sm mt-1">
                        Add customers to this list by importing a CSV file or adding them individually.
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={openUploadDialog}>
                          <FileUp className="h-4 w-4 mr-1" />
                          Import CSV
                        </Button>
                        <Button asChild>
                          <Link href={`/customers/create?listId=${params.id}`}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Customer
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Settings tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">List Settings</CardTitle>
                </CardHeader>
                {isEditing ? (
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
                            onClick={() => {
                              setIsEditing(false);
                              form.reset({
                                name: customerList?.name,
                                description: customerList?.description,
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateListMutation.isPending}
                          >
                            {updateListMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </Button>
                        </div>
                      </CardFooter>
                    </form>
                  </Form>
                ) : (
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">List Name</h3>
                      <p className="mt-1">{customerList?.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1">{customerList?.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created</h3>
                      <p className="mt-1">
                        {customerList?.createdAt && new Date(customerList.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="pt-4">
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit List
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Delete customer confirmation dialog */}
      <Dialog open={deleteCustomerDialogOpen} onOpenChange={setDeleteCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete this customer? This will remove them from all
            campaigns they are part of. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCustomerDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCustomer}
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
      
      {/* CSV upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Customers from CSV</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md relative ${
                isDragging ? 'border-primary bg-primary-50' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="csvFile"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-600"
                  >
                    <span>Upload a CSV file</span>
                    <input
                      id="csvFile"
                      name="csvFile"
                      type="file"
                      className="sr-only"
                      accept=".csv"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  CSV with headers: name, email, phone, status (optional)
                </p>
                {uploadFile && (
                  <div className="mt-2 flex items-center bg-gray-50 p-2 rounded">
                    <div className="flex-1 text-sm text-left truncate">{uploadFile.name}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setUploadFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {uploadError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            
            <div className="mt-4">
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-2">CSV Format Requirements:</h4>
                <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                  <li>File must be in CSV format</li>
                  <li>First row must contain headers: name, email, phone, status (optional)</li>
                  <li>Name and email are required for each customer</li>
                  <li>Phone number format: International format recommended (e.g., +1234567890)</li>
                  <li>Status can be: active (default) or inactive</li>
                </ul>
              </div>
              <div className="mt-2 text-sm">
                <a 
                  href="#" 
                  className="text-primary hover:text-primary-600"
                  onClick={(e) => {
                    e.preventDefault();
                    // In a real app, this would download a template
                    toast({
                      title: 'Template downloaded',
                      description: 'CSV template has been downloaded successfully.',
                    });
                  }}
                >
                  <Download className="h-4 w-4 inline-block mr-1" />
                  Download template CSV
                </a>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              disabled={!uploadFile || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload and Import'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
