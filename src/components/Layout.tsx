import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { Home, Search, PlusSquare, Heart, User as UserIcon, LogOut, Camera } from "lucide-react";
import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session && location.pathname !== "/auth") {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      if (!session && location.pathname !== "/auth") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-md">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              SocialHub
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button
              variant={isActive("/explore") ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/explore">
                <Search className="w-4 h-4 mr-2" />
                Explore
              </Link>
            </Button>
            <Button
              variant={isActive("/create") ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/create">
                <PlusSquare className="w-4 h-4 mr-2" />
                Create
              </Link>
            </Button>
            <Button
              variant={isActive("/notifications") ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/notifications">
                <Heart className="w-4 h-4 mr-2" />
                Notifications
              </Link>
            </Button>
            <Button
              variant={isActive("/profile") ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/profile">
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </Button>
          </nav>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="hidden md:flex"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around h-16 px-4">
          <Button
            variant={isActive("/") ? "secondary" : "ghost"}
            size="sm"
            asChild
            className="flex-1"
          >
            <Link to="/">
              <Home className="w-5 h-5" />
            </Link>
          </Button>
          <Button
            variant={isActive("/explore") ? "secondary" : "ghost"}
            size="sm"
            asChild
            className="flex-1"
          >
            <Link to="/explore">
              <Search className="w-5 h-5" />
            </Link>
          </Button>
          <Button
            variant={isActive("/create") ? "secondary" : "ghost"}
            size="sm"
            asChild
            className="flex-1"
          >
            <Link to="/create">
              <PlusSquare className="w-5 h-5" />
            </Link>
          </Button>
          <Button
            variant={isActive("/notifications") ? "secondary" : "ghost"}
            size="sm"
            asChild
            className="flex-1"
          >
            <Link to="/notifications">
              <Heart className="w-5 h-5" />
            </Link>
          </Button>
          <Button
            variant={isActive("/profile") ? "secondary" : "ghost"}
            size="sm"
            asChild
            className="flex-1"
          >
            <Link to="/profile">
              <UserIcon className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;