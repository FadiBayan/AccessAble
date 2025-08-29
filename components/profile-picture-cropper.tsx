"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, ZoomIn, ZoomOut, Crop, Undo2, Check } from "lucide-react"
import { useAccessibility } from "@/components/accessibility-provider"

interface ProfilePictureCropperProps {
  isOpen: boolean
  onClose: () => void
  onSave: (croppedImage: string) => void
  originalImage: string
}

export function ProfilePictureCropper({ 
  isOpen, 
  onClose, 
  onSave, 
  originalImage 
}: ProfilePictureCropperProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { settings } = useAccessibility()
  const isDarkMode = settings.highContrast

  // Profile picture display size (matches w-24 h-24 = 96x96px)
  const PROFILE_SIZE = 96

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
      setImageLoaded(false)
    }
  }, [isOpen])

  // Handle image load to get dimensions
  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      setImageDimensions({ width: naturalWidth, height: naturalHeight })
      setImageLoaded(true)
    }
  }

  const handleSave = () => {
    if (canvasRef.current && imageRef.current && containerRef.current && imageLoaded) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Set canvas size to match profile display size
        canvas.width = PROFILE_SIZE
        canvas.height = PROFILE_SIZE
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Create circular clipping path
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI)
        ctx.clip()
        
        // Get container dimensions
        const containerRect = containerRef.current.getBoundingClientRect()
        const containerWidth = containerRect.width
        const containerHeight = containerRect.height
        
        // Calculate the crop circle size - make it much larger to match profile picture display
        // The crop circle should be about 80% of the container size to match the visual profile picture size
        const cropCircleSize = Math.min(containerWidth, containerHeight) * 0.8
        
        // Calculate the scale factor between display and canvas
        const displayToCanvasScale = PROFILE_SIZE / cropCircleSize
        
        // Apply transformations
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.scale(scale * displayToCanvasScale, scale * displayToCanvasScale)
        
        // Calculate position offset (convert from display coordinates to canvas coordinates)
        const scaledPositionX = position.x * displayToCanvasScale
        const scaledPositionY = position.y * displayToCanvasScale
        ctx.translate(scaledPositionX, scaledPositionY)
        
        // Draw image to fill the entire crop circle area (like object-cover)
        // This matches how the Avatar component displays images
        const { width: imgWidth, height: imgHeight } = imageDimensions
        const aspectRatio = imgWidth / imgHeight
        
        let drawWidth, drawHeight
        
        if (aspectRatio > 1) {
          // Landscape image - fit height, crop width
          drawHeight = cropCircleSize
          drawWidth = cropCircleSize * aspectRatio
        } else {
          // Portrait or square image - fit width, crop height
          drawWidth = cropCircleSize
          drawHeight = cropCircleSize / aspectRatio
        }
        
        // Draw image centered (this matches object-cover behavior)
        ctx.drawImage(
          imageRef.current, 
          -drawWidth / 2, 
          -drawHeight / 2, 
          drawWidth, 
          drawHeight
        )
        
        ctx.restore()
        
        // Get cropped image as data URL
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
        onSave(croppedImage)
        onClose()
      }
    }
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // Calculate crop circle size based on container - make it much larger
  const getCropCircleSize = () => {
    if (!containerRef.current) return 200
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height
    return Math.min(containerWidth, containerHeight) * 0.8
  }

  const cropCircleSize = getCropCircleSize()

  // Calculate the base image size that fits within the crop circle
  const getBaseImageSize = () => {
    if (!imageLoaded) return { width: 0, height: 0 }
    
    const { width: imgWidth, height: imgHeight } = imageDimensions
    const aspectRatio = imgWidth / imgHeight
    
    if (aspectRatio > 1) {
      // Landscape image - fit height, crop width
      return {
        width: cropCircleSize * aspectRatio,
        height: cropCircleSize
      }
    } else {
      // Portrait or square image - fit width, crop height
      return {
        width: cropCircleSize,
        height: cropCircleSize / aspectRatio
      }
    }
  }

  const baseImageSize = getBaseImageSize()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-lg ${isDarkMode ? 'bg-[#1f2937] text-white border-white/10' : ''}`}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? 'text-white' : ''}>
            Adjust Profile Picture
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div 
            ref={containerRef}
            className={`relative rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`} 
            style={{ height: '280px', width: '100%' }}
          >
            {/* Image container with proper aspect ratio handling */}
            <div
              className="absolute inset-0 cursor-move"
              onMouseDown={handleMouseDown}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                width: `${baseImageSize.width}px`,
                height: `${baseImageSize.height}px`,
                left: '50%',
                top: '50%',
                marginLeft: `-${baseImageSize.width / 2}px`,
                marginTop: `-${baseImageSize.height / 2}px`
              }}
            >
              <img
                ref={imageRef}
                src={originalImage}
                alt="Profile picture"
                className="w-full h-full object-cover"
                style={{ 
                  maxWidth: 'none', 
                  maxHeight: 'none',
                  objectFit: 'cover'
                }}
                draggable={false}
                onLoad={handleImageLoad}
              />
            </div>
            
            {/* Crop overlay with larger circle to match profile picture display */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/50'}`}></div>
              {/* Larger crop circle that matches the actual profile picture display size */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full shadow-lg"
                style={{ 
                  width: `${cropCircleSize}px`, 
                  height: `${cropCircleSize}px`,
                  borderRadius: '50%'
                }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomOut}
                className={isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <Slider
                  value={[scale]}
                  onValueChange={(value) => setScale(value[0])}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomIn}
                className={isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Rotation Controls */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRotate}
                className={isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Rotation: {rotation}°
              </span>
            </div>

            {/* Reset Button */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className={isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className={isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!imageLoaded}
              className={isDarkMode ? 'bg-mustard hover:bg-mustard/90 text-white' : ''}
            >
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
} 