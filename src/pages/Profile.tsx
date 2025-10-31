import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, Bookmark, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
}

interface Post {
  id: string;
  media_url: string;
  media_type: string;
  likes: { id: string }[];
  comments: { id: string }[];
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // Fetch posts
      const { data: postsData } = await supabase
        .from("posts")
        .select(
          `
          id,
          media_url,
          media_type,
          likes (id),
          comments (id)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);

      // Fetch saved posts
      const { data: savedData } = await supabase
        .from("saves")
        .select(
          `
          posts (
            id,
            media_url,
            media_type,
            likes (id),
            comments (id)
          )
        `
        )
        .eq("user_id", user.id);

      setSavedPosts(savedData?.map((s: any) => s.posts) || []);

      // Fetch stats
      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);

      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id);

      setStats({
        postsCount: postsData?.length || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20 md:pb-6">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32 border-4 border-gradient-to-br from-accent to-primary">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-accent to-primary text-white">
                {profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <p className="font-bold text-lg">{stats.postsCount}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{stats.followersCount}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{stats.followingCount}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>

              {profile.full_name && (
                <p className="font-semibold">{profile.full_name}</p>
              )}
              {profile.bio && <p className="text-sm">{profile.bio}</p>}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {profile.website}
                </a>
              )}
            </div>
          </div>
        </Card>

        {/* Posts Grid */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="posts" className="gap-2">
              <Grid className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square bg-muted overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    <img
                      src={post.media_url}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {savedPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No saved posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {savedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square bg-muted overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    <img
                      src={post.media_url}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;