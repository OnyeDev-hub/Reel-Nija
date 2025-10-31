import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import { Loader2 } from "lucide-react";

interface Post {
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
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles (username, avatar_url),
          likes (id),
          comments (id),
          saves (id)
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts((data as any) || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No posts yet. Start following people or create your first post!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))
        )}
      </div>
    </Layout>
  );
};

export default Home;