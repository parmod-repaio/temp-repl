import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/app-layout';
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
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, UserPlus, FileUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CustomerList } from '@shared/schema';

export default function CustomerListsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Fetch customer lists
  const { data: customerLists, isLoading } = useQuery<CustomerList[]>({
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

  // Delete customer list
  const handleDeleteList = async () => {
    if (!selectedListId) return;
    
    try {
      await apiRequest('DELETE', `/api/customer-lists/${selectedListId}`);
      
      // Invalidate the customer lists query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/customer-lists'] });
      
      toast({
        title: 'Customer list deleted',
        description: 'The customer list has been successfully deleted.',
      });
      
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete customer list',
        variant: 'destructive',
      });
    }
  };

  // Confirm delete dialog
  const openDeleteDialog = (id: string) => {
    setSelectedListId(id);
    setDeleteDialogOpen(true);
  };

  return (
    <AppLayout title="Customer Lists">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Page header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Customer Lists</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your customer lists and organize your contacts
              </p>
            </div>
            <Button asChild>
              <Link href="/customer-lists/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create List
              </Link>
            </Button>
          </div>

          {/* Content */}
          <Card>
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className="text-base">Your Lists</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : customerLists && customerLists.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerLists.map((list) => (
                      <TableRow key={list.id}>
                        <TableCell className="font-medium">
                          <Link href={`/customer-lists/${list.id}`} className="text-primary hover:underline">
                            {list.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {list.description || 'No description'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}
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
                              <DropdownMenuItem onClick={() => navigate(`/customer-lists/${list.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                View/Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/customer-lists/${list.id}`)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Customer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/customer-lists/${list.id}`)}>
                                <FileUp className="mr-2 h-4 w-4" />
                                Upload CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onClick={() => openDeleteDialog(list.id)}
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
                  <h3 className="text-lg font-medium text-gray-900">No customer lists yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm mt-1">
                    Create your first customer list to start organizing your contacts.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/customer-lists/create">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create List
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer List</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete this customer list? This will also delete all customers in this list and remove them from any associated campaigns. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteList}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
