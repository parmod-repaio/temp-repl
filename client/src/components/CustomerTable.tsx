import { useState } from "react";
import { Customer, CustomerList } from "@shared/schema";
import { useCustomers } from "@/hooks/use-customers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Pencil, Trash, Filter } from "lucide-react";
import CreateCustomerModal from "./modals/CreateCustomerModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";

interface CustomerTableProps {
  customerLists: CustomerList[];
}

export default function CustomerTable({ customerLists }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedList, setSelectedList] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Fetch customers based on selected list
  const {
    customers,
    isLoading,
    createCustomerMutation,
    updateCustomerMutation,
    deleteCustomerMutation,
  } = useCustomers(selectedList);

  // Filter customers by search term and status
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      searchTerm === "" ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));

    const matchesStatus =
      selectedStatus === "" || customer.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Find list name by ID
  const getListNameById = (listId: string) => {
    const list = customerLists.find((list) => list.id === listId);
    return list ? list.name : "Unknown List";
  };

  // Handle customer creation
  const handleCreateCustomer = (data: any) => {
    createCustomerMutation.mutate(data);
    setShowCreateModal(false);
  };

  // Handle customer update
  const handleUpdateCustomer = (data: any) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({
        id: editingCustomer.id,
        data,
      });
      setEditingCustomer(null);
    }
  };

  // Handle customer deletion
  const handleDeleteCustomer = () => {
    if (customerToDelete) {
      deleteCustomerMutation.mutate(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Customer
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 items-end mb-6">
        <div className="w-full md:w-64">
          <label
            htmlFor="search-customers"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Eye className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="search-customers"
              placeholder="Name, email or phone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-48">
          <label
            htmlFor="filter-list"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Customer List
          </label>
          <Select value={selectedList} onValueChange={setSelectedList}>
            <SelectTrigger>
              <SelectValue placeholder="All Lists" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Lists</SelectItem>
              {customerLists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48">
          <label
            htmlFor="filter-status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="md:self-center">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>List</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No customers found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>{getListNameById(customer.listId)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.status === "active" ? "default" : "secondary"
                        }
                        className={
                          customer.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {customer.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCustomer(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCustomer(customer)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomerToDelete(customer)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination can be added here */}
      </div>

      {/* Modals */}
      <CreateCustomerModal
        open={showCreateModal || !!editingCustomer}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCustomer(null);
        }}
        onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
        customerLists={customerLists}
        customer={editingCustomer}
      />

      <ConfirmDeleteModal
        open={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        description={
          customerToDelete
            ? `Are you sure you want to delete customer "${customerToDelete.name}"? This action cannot be undone.`
            : ""
        }
      />
    </>
  );
}
