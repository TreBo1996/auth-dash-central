import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ApplyCounterProps {
  count: number;
  className?: string;
}

export const ApplyCounter = ({ count, className }: ApplyCounterProps) => {
  if (count === 0) return null;

  return (
    <Card className={`bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 ${className}`}>
      <div className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            ✨ {count.toLocaleString()} Job Seekers Applied for This Position
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Stand out by optimizing your resume with AI for better ATS compatibility
          </p>
        </div>
      </div>
    </Card>
  );
};