"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Reply,
  ThumbsUp,
  Briefcase
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation"
import { useAccessibility } from "@/components/accessibility-provider";

interface Comment {
  id: string
  content: string
  author_name: string
  created_at: string
  user_id: string
}

interface FeedPostProps {
  postId: string
  author: string
  title: string
  time: string
  content: string
  likes: number
  comments: number
  shares: number
  avatar?: string
  isVerified: boolean
  imageUrl?: string
  videoUrl?: string
  isJobPost?: boolean
  currentUserId?: string
  postUserId?: string
}

export function FeedPost({ 
  postId, 
  author, 
  title, 
  time, 
  content, 
  likes, 
  comments, 
  shares, 
  avatar, 
  isVerified,
  imageUrl,
  videoUrl,
  isJobPost = false,
  currentUserId,
  postUserId
}: FeedPostProps) {
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [userLiked, setUserLiked] = useState(false); // Track if user liked this post
  const [likeCount, setLikeCount] = useState(likes);
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [postComments, setPostComments] = useState<Comment[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [editTitle, setEditTitle] = useState(title)
  const router = useRouter()
  const { settings } = useAccessibility();
  const highContrast = settings.highContrast;

  const isOwnPost = currentUserId === postUserId

  const handleLike = async () => {
    if (likeInProgress) return;
    setLikeInProgress(true);
    if (!userLiked) {
      setLikeCount(prev => prev + 1);
      setUserLiked(true);
      // Update in Supabase (add like record)
      // await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId });
    } else {
      setLikeCount(prev => Math.max(0, prev - 1));
      setUserLiked(false);
      // Update in Supabase (remove like record)
      // await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
    }
    setLikeInProgress(false);
  };

  const handleComment = async () => {
    if (!commentText.trim() || !currentUserId) return

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: currentUserId,
          content: commentText,
          author_name: author
        }])
        .select()

      if (error) throw error

      setCommentText("")
      // Refresh comments
      fetchComments()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const fetchComments = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setPostComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
      
      fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleDeletePost = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      
      // Refresh the page to remove the post
      window.location.reload()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handleEditPost = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('posts')
        .update({
          title: editTitle,
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
      
      setIsEditing(false)
      // Refresh the page to show updated content
      window.location.reload()
    } catch (error) {
      console.error('Error updating post:', error)
    }
  }

  const handleShare = async () => {
    try {
      // Create share URL
      const shareUrl = `${window.location.origin}/post/${postId}`;
      
      // Try to use native share API first
      if (navigator.share) {
        await navigator.share({
          title: title || 'Check out this post on AccessAble',
          text: content,
          url: shareUrl,
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copying to clipboard
      try {
        const shareUrl = `${window.location.origin}/post/${postId}`;
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        alert('Unable to share. Please try again.');
      }
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  return (
    <Card className={`${highContrast ? 'bg-[#1f2937] text-white border border-white/10 rounded-2xl shadow-md shadow-white/5 p-4 transition-all hover:scale-[1.01]' : 'bg-card border text-card-foreground shadow-lg hover:bg-accent focus-within:ring-2 focus-within:ring-mustard transition-colors rounded-2xl'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 ring-2 ring-mustard">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-gradient-to-br from-mustard to-forest-green text-white">
              {author.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className={`${highContrast ? 'text-white font-semibold' : 'text-card-foreground font-semibold text-base'}`}>{author}</p>
            <p className={`${highContrast ? 'text-sm text-gray-400' : 'text-xs text-muted-foreground'}`}>{time}{isJobPost ? ' · Job' : ''}</p>
          </div>
        </div>
        {isOwnPost && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            aria-label="Post options menu"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Title"
          />
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full"
            placeholder="Content"
          />
          <div className="flex space-x-2">
            <Button onClick={handleEditPost} size="sm">
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          {title && (
            <h4 className={`${highContrast ? 'text-white font-semibold text-base' : 'text-card-foreground font-semibold text-base'} mb-2`}>{title}</h4>
          )}
          <p className={`${highContrast ? 'text-gray-100' : 'text-card-foreground text-sm'} mb-3`}>{content}</p>
          
          {imageUrl && (
            <div className="mb-3">
              <img 
                src={imageUrl} 
                alt={`Post image shared by ${author}`}
                className="max-w-full h-auto rounded-lg"
                onError={(e) => {
                  console.error('Image failed to load:', imageUrl)
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
          {videoUrl && (
            <div className="mb-3">
              <video 
                src={videoUrl} 
                controls 
                className="max-w-full h-auto rounded-lg"
                aria-label={`Video shared by ${author}`}
                onError={(e) => {
                  console.error('Video failed to load:', videoUrl)
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-3 border-t">
        <div className={`flex items-center gap-4 mt-3 text-xs ${highContrast ? 'text-gray-200' : 'text-muted-foreground'}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeInProgress}
            className={`flex items-center space-x-1 ${
              userLiked ? "text-mustard" : "text-gray-400"
            }`}
            aria-label={`${userLiked ? 'Unlike' : 'Like'} this post. ${likeCount} likes`}
            aria-pressed={userLiked}
          >
            <Heart className={`h-4 w-4 ${userLiked ? "fill-current" : ""}`} aria-hidden="true" />
            <span>{likeCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleComments}
            className="flex items-center space-x-1 text-gray-500"
            aria-label={`${showComments ? 'Hide' : 'Show'} comments. ${postComments.length} comments`}
            aria-expanded={showComments}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>{postComments.length}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex items-center space-x-1 text-gray-500"
            aria-label={`Share this post. ${shares} shares`}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>{shares}</span>
          </Button>
        </div>
      </div>

      {showComments && (
        <div className="mt-4 space-y-3">
          <div className="flex space-x-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
              rows={2}
            />
            <Button onClick={handleComment} disabled={!commentText.trim()} aria-label="Post comment">
              Comment
            </Button>
          </div>
          
          <div className="space-y-2">
            {postComments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{comment.author_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  {currentUserId === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Delete this comment"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  )}
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
