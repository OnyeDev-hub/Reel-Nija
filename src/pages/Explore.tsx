import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface Post {
  id: string;
  media_url: string;
  likes: { id: string }[];
  comments: { id: string }[];
}

const Explore = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          id,
          media_url,
          likes (id),
          comments (id)
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching explore posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-20 md:pb-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users, hashtags, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Explore Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts to explore yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="aspect-square bg-muted overflow-hidden cursor-pointer hover:opacity-75 transition-opacity group relative"
              >
                <img
                  src={post.media_url}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{post.likes.length}</span>
                    <span className="text-sm">likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{post.comments.length}</span>
                    <span className="text-sm">comments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Explore;