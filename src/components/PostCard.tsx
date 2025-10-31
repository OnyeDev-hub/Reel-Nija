import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    media_url: string;
    media_type: string;
    caption: string | null;
    location: string | null;
    created_at: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    };
    likes: { id: string }[];
    comments: { id: string }[];
    saves: { id: string }[];
  };
  onUpdate: () => void;
}

const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUserInteractions();
  }, [post.id]);

  const checkUserInteractions = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    
    setCurrentUserId(user.id);

    // Check if user liked the post
    const { data: likeData } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .single();

    setIsLiked(!!likeData);

    // Check if user saved the post
    const { data: saveData } = await supabase
      .from("saves")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .single();

    setIsSaved(!!saveData);
  };

  const handleLike = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
        setLikesCount(likesCount - 1);
      } else {
        await supabase
          .from("likes")
          .insert({ post_id: post.id, user_id: user.id });
        setLikesCount(likesCount + 1);
        
        // Create notification if liking someone else's post
        if (post.user_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: "like",
            post_id: post.id,
          });
        }
      }
      setIsLiked(!isLiked);
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (isSaved) {
        await supabase
          .from("saves")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("saves")
          .insert({ post_id: post.id, user_id: user.id });
        toast.success("Post saved");
      }
      setIsSaved(!isSaved);
    } catch (error) {
      toast.error("Failed to save post");
    }
  };

  return (
    <Card className="overflow-hidden border-border">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-gradient-to-br from-accent to-primary">
            <AvatarImage src={post.profiles.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white">
              {post.profiles.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{post.profiles.username}</p>
            {post.location && (
              <p className="text-xs text-muted-foreground">{post.location}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Post Media */}
      <div className="aspect-square bg-muted">
        {post.media_type === "image" ? (
          <img
            src={post.media_url}
            alt="Post"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={post.media_url}
            controls
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className={isLiked ? "text-red-500 hover:text-red-600" : ""}
            >
              <Heart
                className="h-6 w-6"
                fill={isLiked ? "currentColor" : "none"}
              />
            </Button>
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Send className="h-6 w-6" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className={isSaved ? "text-primary" : ""}
          >
            <Bookmark
              className="h-6 w-6"
              fill={isSaved ? "currentColor" : "none"}
            />
          </Button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold text-sm">
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-2">{post.profiles.username}</span>
            {post.caption}
          </p>
        )}

        {/* Comments Count */}
        {post.comments.length > 0 && (
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all {post.comments.length} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </div>
    </Card>
  );
};

export default PostCard;