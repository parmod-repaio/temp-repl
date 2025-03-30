import { Switch, Route, useParams } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import CustomerListsPage from "@/pages/customer-lists";
import CreateCustomerListPage from "@/pages/customer-lists/create";
import CustomerListDetailPage from "@/pages/customer-lists/[id]";
import CustomersPage from "@/pages/customers";
import CreateCustomerPage from "@/pages/customers/create";
import CustomerDetailPage from "@/pages/customers/[id]";
import CampaignsPage from "@/pages/campaigns";
import CreateCampaignPage from "@/pages/campaigns/create";
import CampaignDetailPage from "@/pages/campaigns/[id]";
import ProfilePage from "@/pages/profile";

// Wrapper components for routes with params
const CustomerListDetailWrapper = () => {
  const params = useParams();
  return <CustomerListDetailPage params={{ id: params.id || "" }} />;
};

const CustomerDetailWrapper = () => {
  const params = useParams();
  return <CustomerDetailPage params={{ id: params.id || "" }} />;
};

const CampaignDetailWrapper = () => {
  const params = useParams();
  return <CampaignDetailPage params={{ id: params.id || "" }} />;
};

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
      {/* Customer Lists Routes */}
      <ProtectedRoute path="/customer-lists" component={CustomerListsPage} />
      <ProtectedRoute path="/customer-lists/create" component={CreateCustomerListPage} />
      <ProtectedRoute path="/customer-lists/:id" component={CustomerListDetailWrapper} />
      
      {/* Customers Routes */}
      <ProtectedRoute path="/customers" component={CustomersPage} />
      <ProtectedRoute path="/customers/create" component={CreateCustomerPage} />
      <ProtectedRoute path="/customers/:id" component={CustomerDetailWrapper} />
      
      {/* Campaigns Routes */}
      <ProtectedRoute path="/campaigns" component={CampaignsPage} />
      <ProtectedRoute path="/campaigns/create" component={CreateCampaignPage} />
      <ProtectedRoute path="/campaigns/:id" component={CampaignDetailWrapper} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
