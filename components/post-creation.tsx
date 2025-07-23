"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Video, Mic, Send, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { filterContent, hasBadWords } from "@/lib/content-filter";
import { useAccessibility } from "@/components/accessibility-provider";

export function PostCreation() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { settings } = useAccessibility();
  const highContrast = settings.highContrast;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      // Clear video if image is selected
      setVideoFile(null);
      setVideoUrl(null);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      // Clear image if video is selected
      setImageFile(null);
      setImageUrl(null);
    }
  };

  const handlePost = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to post.");
      setLoading(false);
      return;
    }

    // Check for bad words
    if (hasBadWords(title) || hasBadWords(content)) {
      alert("Your post contains inappropriate language. Please review and edit your content.");
      setLoading(false);
      return;
    }

    // Filter content
    const filteredTitle = filterContent(title);
    const filteredContent = filterContent(content);

    let uploadedImageUrl = null;
    let uploadedVideoUrl = null;

    // Upload image if selected
    if (imageFile) {
      const imageFileName = `${user.id}/${Date.now()}_${imageFile.name}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from("post-media")
        .upload(imageFileName, imageFile);

      if (imageError) {
        console.error("Error uploading image:", imageError);
        alert("Error uploading image");
        setLoading(false);
        return;
      }

      const { data: imageUrlData } = supabase.storage
        .from("post-media")
        .getPublicUrl(imageFileName);
      uploadedImageUrl = imageUrlData.publicUrl;
    }

    // Upload video if selected
    if (videoFile) {
      const videoFileName = `${user.id}/${Date.now()}_${videoFile.name}`;
      const { data: videoData, error: videoError } = await supabase.storage
        .from("post-media")
        .upload(videoFileName, videoFile);

      if (videoError) {
        console.error("Error uploading video:", videoError);
        alert("Error uploading video");
        setLoading(false);
        return;
      }

      const { data: videoUrlData } = supabase.storage
        .from("post-media")
        .getPublicUrl(videoFileName);
      uploadedVideoUrl = videoUrlData.publicUrl;
    }

    const { error } = await supabase.from("posts").insert([{
      user_id: user.id,
      title: filteredTitle,
      content: filteredContent,
      image_url: uploadedImageUrl,
      video_url: uploadedVideoUrl,
      is_job_post: false, // Always false for general posts
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      tags: [],
    }]);

    if (error) {
      console.error("Error creating post:", error);
      alert("Error creating post");
    } else {
      setTitle("");
      setContent("");
      setImageFile(null);
      setVideoFile(null);
      setImageUrl(null);
      setVideoUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      alert("Post created successfully!");
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50">
          <Loader2 className="animate-spin h-8 w-8 text-mustard" />
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-mustard to-forest-green rounded-full flex items-center justify-center text-white font-semibold text-sm">
              ME
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${highContrast ? "placeholder:text-gray-100 text-white" : ""} focus:ring-2 focus:ring-mustard focus:ring-offset-2 transition-colors`}
              aria-label="Post title"
            />
            <Textarea
              placeholder="Share an accessible post, article, or opportunity..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${highContrast ? "placeholder:text-gray-100 text-white" : ""} focus:ring-2 focus:ring-mustard focus:ring-offset-2 transition-colors`}
              rows={3}
              aria-label="Post content"
            />
            
            {/* Media Preview */}
            {imageUrl && (
              <div className="mb-3">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-w-full h-auto rounded-lg max-h-48 object-cover"
                />
              </div>
            )}
            
            {videoUrl && (
              <div className="mb-3">
                <video
                  src={videoUrl}
                  controls
                  className="max-w-full h-auto rounded-lg max-h-48"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-gray-600 hover:bg-mustard/10 hover:text-mustard"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  aria-label="Add photo"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-gray-600 hover:bg-mustard/10 hover:text-mustard"
                  onClick={() => videoInputRef.current?.click()}
                  type="button"
                  aria-label="Add video"
                >
                  <Video className="h-5 w-5" />
                  <span className="hidden sm:inline">Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    ref={videoInputRef}
                    style={{ display: "none" }}
                    onChange={handleVideoChange}
                  />
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-gray-600 hover:bg-mustard/10 hover:text-mustard"
                  disabled
                  aria-label="Add audio (coming soon)"
                >
                  <Mic className="h-5 w-5" />
                  <span className="hidden sm:inline">Audio</span>
                </Button>
              </div>
              <Button
                onClick={handlePost}
                disabled={loading || (!title.trim() && !content.trim())}
                className="bg-mustard hover:bg-forest-green text-white"
                aria-label="Create post"
              >
                {loading ? "Posting..." : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
