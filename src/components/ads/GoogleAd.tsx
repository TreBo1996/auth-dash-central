import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface GoogleAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const GoogleAd: React.FC<GoogleAdProps> = ({
  adSlot,
  adFormat = 'auto',
  style,
  className = ''
}) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Initialize adsbygoogle if it doesn't exist
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('Error loading Google Ad:', error);
    }
  }, []);

  // Placeholder for development - shows ad space
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    return (
      <Card className={`bg-muted/30 border-dashed ${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <div className="text-sm font-medium mb-2">Advertisement Space</div>
            <div className="text-xs">Google Ad Slot: {adSlot}</div>
            <div className="text-xs">Format: {adFormat}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style
        }}
        data-ad-client="ca-pub-3586730785374238"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};