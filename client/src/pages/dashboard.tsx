import { useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, UserCog, Users, Megaphone, FileText, Upload, Share } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      return response.json();
    },
  });
  
  // Get the first name for greeting
  const firstName = user?.name?.split(' ')[0] || '';
  
  const statsCards = [
    {
      title: 'Total Customer Lists',
      value: dashboardData?.customerLists || 0,
      icon: <UserCog className="h-5 w-5" />,
      bgColor: 'bg-primary-100',
      textColor: 'text-primary',
      href: '/customer-lists',
    },
    {
      title: 'Total Customers',
      value: dashboardData?.customers || 0,
      icon: <Users className="h-5 w-5" />,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      href: '/customers',
    },
    {
      title: 'Active Campaigns',
      value: dashboardData?.activeCampaigns || 0,
      icon: <Megaphone className="h-5 w-5" />,
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-600',
      href: '/campaigns',
    },
  ];
  
  const getActivityIcon = (title: string) => {
    if (title.includes('customer list')) return <FileText className="text-lg" />;
    if (title.includes('imported') || title.includes('CSV')) return <Upload className="text-lg" />;
    if (title.includes('campaign')) return <Megaphone className="text-lg" />;
    return <Share className="text-lg" />;
  };
  
  return (
    <AppLayout title="Dashboard">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Dashboard Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              Welcome back, {firstName}!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Here's an overview of your campaign activity.
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              // Skeleton loaders for stats cards
              Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-5">
                    <div className="flex items-center">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="ml-5 w-full">
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-6 w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 py-3">
                    <Skeleton className="h-4 w-1/4" />
                  </CardFooter>
                </Card>
              ))
            ) : (
              statsCards.map((card, index) => (
                <Card key={index}>
                  <CardContent className="pt-5">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 ${card.bgColor} rounded-md p-3 ${card.textColor}`}>
                        {card.icon}
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <div className="text-sm font-medium text-gray-500 truncate">
                          {card.title}
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {card.value}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 py-3">
                    <Link href={card.href} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                      View all
                    </Link>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
          
          {/* Recent Activity */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h2>
            <Card>
              {isLoading ? (
                // Skeleton loader for activity list
                <div className="divide-y divide-gray-200">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="min-w-0 flex-1 px-4">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : dashboardData?.recentActivities?.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {dashboardData.recentActivities.map((activity: any, index: number) => (
                    <li key={index}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center">
                          <div className="min-w-0 flex-1 flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                {getActivityIcon(activity.title)}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 px-4">
                              <div>
                                <p className="text-sm font-medium text-primary truncate">
                                  {activity.title}
                                </p>
                                {activity.description && (
                                  <p className="mt-1 flex text-sm text-gray-500">
                                    <span className="truncate">{activity.description}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Share className="h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">No activities yet</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Your recent activities will appear here once you start using the system.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
