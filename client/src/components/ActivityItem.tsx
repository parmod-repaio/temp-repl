import { Activity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { 
  FileUp, 
  Plus, 
  Edit, 
  Trash, 
  Megaphone, 
  Users, 
  User 
} from "lucide-react";

interface ActivityItemProps {
  activity: Activity;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case "create_list":
        return <Plus className="h-4 w-4" />;
      case "update_list":
        return <Edit className="h-4 w-4" />;
      case "delete_list":
        return <Trash className="h-4 w-4" />;
      case "import_customers":
        return <FileUp className="h-4 w-4" />;
      case "create_customer":
        return <User className="h-4 w-4" />;
      case "update_customer":
        return <Edit className="h-4 w-4" />;
      case "delete_customer":
        return <Trash className="h-4 w-4" />;
      case "create_campaign":
        return <Megaphone className="h-4 w-4" />;
      case "update_campaign":
        return <Edit className="h-4 w-4" />;
      case "delete_campaign":
        return <Trash className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getActivityColor = (actionType: string) => {
    if (actionType.includes("create")) return "bg-blue-100 text-blue-600";
    if (actionType.includes("import")) return "bg-green-100 text-green-600";
    if (actionType.includes("update")) return "bg-orange-100 text-orange-600";
    if (actionType.includes("delete")) return "bg-red-100 text-red-600";
    if (actionType.includes("campaign")) return "bg-purple-100 text-purple-600";
    return "bg-gray-100 text-gray-600";
  };

  const timeAgo = activity.createdAt
    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
    : "";

  return (
    <div className="px-6 py-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getActivityColor(activity.actionType)}`}>
            {getActivityIcon(activity.actionType)}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              {activity.actionType.split("_").map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(" ")}
            </h3>
            <p className="text-sm text-gray-500">{timeAgo}</p>
          </div>
          <p className="text-sm text-gray-500">{activity.description}</p>
        </div>
      </div>
    </div>
  );
}
