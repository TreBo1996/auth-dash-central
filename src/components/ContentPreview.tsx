
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, Edit, Download, ZoomIn, ZoomOut, Maximize, Minimize, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContentPreviewProps {
  content: string;
  title: string;
  type: 'resume' | 'job-description' | 'cover-letter';
  onClose: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  title,
  type,
  onClose,
  onEdit,
  onDownload
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useIsMobile();

  const getIcon = () => {
    switch (type) {
      case 'cover-letter':
        return <Mail className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'cover-letter':
        return 'Preview of your cover letter content';
      case 'resume':
        return 'Preview of your resume content';
      case 'job-description':
        return 'Preview of your job description content';
      default:
        return 'Preview of your content';
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.6));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[98vw] max-h-[98vh]' : 'max-w-7xl max-h-[95vh]'} overflow-hidden transition-all duration-300`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getIcon()}
              {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {Math.round(zoomLevel * 100)}%
              </Badge>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-8 w-8 p-0">
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative flex-1 overflow-hidden">
          {/* Enhanced Preview Controls */}
          <div className="zoom-controls absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 0.6} className="h-7 w-7 p-0">
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetZoom} className="h-7 px-2 text-xs">
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 1.5} className="h-7 w-7 p-0">
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>

          <ScrollArea className={`${isFullscreen ? 'h-[85vh]' : 'h-[70vh]'} w-full rounded-md border p-4`}>
            <div 
              className="whitespace-pre-wrap text-sm leading-relaxed"
              style={{
                fontSize: `${zoomLevel}rem`,
                lineHeight: '1.6',
                // Enhanced rendering properties for crisp text
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                fontSmooth: 'always'
              }}
            >
              {content}
            </div>
          </ScrollArea>
        </div>
        
        {(onEdit || onDownload) && (
          <DialogFooter>
            <div className="flex gap-2">
              {onDownload && (
                <Button 
                  variant="outline" 
                  onClick={onDownload} 
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
              {onEdit && (
                <Button 
                  onClick={onEdit} 
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
