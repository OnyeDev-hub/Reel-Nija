import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  created_at: string;
  is_read: boolean;
  actor_profile: {
    username: string;
    avatar_url: string | null;
  };
  post?: {
    media_url: string;
  };
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    markAllAsRead();
  }, []);

  const fetchNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          actor_profile:profiles!notifications_actor_id_fkey (username, avatar_url),
          post:posts (media_url)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data as any) || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" fill="currentColor" />;
      case "comment":
        return <MessageCircle className="h-5 w-5 text-primary" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-accent" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const username = notification.actor_profile.username;
    switch (notification.type) {
      case "like":
        return `${username} liked your post`;
      case "comment":
        return `${username} commented on your post`;
      case "follow":
        return `${username} started following you`;
      case "mention":
        return `${username} mentioned you in a comment`;
      default:
        return `${username} interacted with your content`;
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  !notification.is_read ? "bg-accent/5" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-gradient-to-br from-accent to-primary">
                    <AvatarImage
                      src={notification.actor_profile.avatar_url || undefined}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white">
                      {notification.actor_profile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">
                        {notification.actor_profile.username}
                      </span>{" "}
                      {getNotificationText(notification).split(notification.actor_profile.username)[1]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {getNotificationIcon(notification.type)}
                    {notification.post && (
                      <img
                        src={notification.post.media_url}
                        alt="Post"
                        className="h-12 w-12 object-cover rounded"
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;