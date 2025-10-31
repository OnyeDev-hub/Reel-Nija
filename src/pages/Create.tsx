import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const Create = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/quicktime"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Please select a valid image or video file");
      return;
    }

    // Validate file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("posts").getPublicUrl(fileName);

      // Create post record
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      
      const { error: insertError } = await supabase.from("posts").insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
        caption: caption.trim() || null,
        location: location.trim() || null,
      });

      if (insertError) throw insertError;

      toast.success("Post created successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            {/* File Upload */}
            {!preview ? (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Images or videos up to 50MB
                  </p>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="relative">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  {file?.type.startsWith("video/") ? (
                    <video src={preview} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
            )}
          </Card>

          {preview && (
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  maxLength={2200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {caption.length}/2200
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={100}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Share Post
                  </>
                )}
              </Button>
            </Card>
          )}
        </form>
      </div>
    </Layout>
  );
};

export default Create;