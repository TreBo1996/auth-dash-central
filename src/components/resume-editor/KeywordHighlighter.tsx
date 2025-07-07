import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface KeywordHighlighterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  matchedKeywords?: string[];
  addedKeywords?: string[];
  missingKeywords?: string[];
  minHeight?: string;
}

export const KeywordHighlighter: React.FC<KeywordHighlighterProps> = ({
  value,
  onChange,
  placeholder,
  className,
  matchedKeywords = [],
  addedKeywords = [],
  missingKeywords = [],
  minHeight = "60px"
}) => {
  const [showHighlighting, setShowHighlighting] = useState(true);

  const highlightText = (text: string) => {
    if (!showHighlighting) return text;

    let highlightedText = text;
    
    // Highlight added keywords (blue background)
    addedKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<mark class="px-1 rounded" style="background-color: hsl(var(--keyword-added)); color: hsl(var(--keyword-added-text));">$1</mark>`);
    });

    // Highlight matched keywords (green background) 
    matchedKeywords.forEach(keyword => {
      if (!addedKeywords.includes(keyword)) {
        const regex = new RegExp(`\\b(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
        highlightedText = highlightedText.replace(regex, `<mark class="px-1 rounded" style="background-color: hsl(var(--keyword-matched)); color: hsl(var(--keyword-matched-text));">$1</mark>`);
      }
    });

    return highlightedText;
  };

  const hasKeywords = matchedKeywords.length > 0 || addedKeywords.length > 0 || missingKeywords.length > 0;

  return (
    <div className="space-y-2">
      {/* Controls */}
      {hasKeywords && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHighlighting(!showHighlighting)}
              className="h-7 px-2 text-xs"
            >
              {showHighlighting ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide Keywords
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Show Keywords
                </>
              )}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Info className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="top">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Keyword Legend</h4>
                  <div className="space-y-2 text-xs">
                    {addedKeywords.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border" style={{ 
                          backgroundColor: 'hsl(var(--keyword-added))', 
                          borderColor: 'hsl(var(--keyword-added-text))' 
                        }}></div>
                        <span>Added during optimization ({addedKeywords.length})</span>
                      </div>
                    )}
                    {matchedKeywords.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border" style={{ 
                          backgroundColor: 'hsl(var(--keyword-matched))', 
                          borderColor: 'hsl(var(--keyword-matched-text))' 
                        }}></div>
                        <span>Job description matches ({matchedKeywords.length})</span>
                      </div>
                    )}
                    {missingKeywords.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border" style={{ 
                          backgroundColor: 'hsl(var(--keyword-missing))', 
                          borderColor: 'hsl(var(--keyword-missing-text))' 
                        }}></div>
                        <span>Missing keywords ({missingKeywords.length})</span>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Textarea with highlighting overlay */}
      <div className="relative">
        {showHighlighting && hasKeywords ? (
          <div className="relative">
            {/* Hidden div with highlighted text for visual reference */}
            <div 
              className={cn(
                "absolute inset-0 pointer-events-none z-10 p-3 text-sm leading-6 font-sans whitespace-pre-wrap break-words overflow-hidden",
                "border border-input bg-transparent rounded-md resize-none",
                className
              )}
              style={{ minHeight }}
              dangerouslySetInnerHTML={{ __html: highlightText(value) }}
            />
            {/* Actual textarea */}
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={cn("bg-transparent text-transparent caret-black relative z-20", className)}
              style={{ minHeight }}
            />
          </div>
        ) : (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={className}
            style={{ minHeight }}
          />
        )}
      </div>

      {/* Keyword Summary */}
      {hasKeywords && (
        <div className="flex flex-wrap gap-1 text-xs">
          {addedKeywords.slice(0, 3).map(keyword => (
            <Badge 
              key={keyword} 
              variant="secondary" 
              className="border"
              style={{ 
                backgroundColor: 'hsl(var(--keyword-added))', 
                color: 'hsl(var(--keyword-added-text))',
                borderColor: 'hsl(var(--keyword-added-text))'
              }}
            >
              +{keyword}
            </Badge>
          ))}
          {matchedKeywords.slice(0, 3).map(keyword => (
            <Badge 
              key={keyword} 
              variant="secondary" 
              className="border"
              style={{ 
                backgroundColor: 'hsl(var(--keyword-matched))', 
                color: 'hsl(var(--keyword-matched-text))',
                borderColor: 'hsl(var(--keyword-matched-text))'
              }}
            >
              ✓{keyword}
            </Badge>
          ))}
          {missingKeywords.slice(0, 2).map(keyword => (
            <Badge 
              key={keyword} 
              variant="outline" 
              className="border"
              style={{ 
                borderColor: 'hsl(var(--keyword-missing-text))', 
                color: 'hsl(var(--keyword-missing-text))'
              }}
            >
              {keyword}
            </Badge>
          ))}
          {(addedKeywords.length + matchedKeywords.length + missingKeywords.length) > 8 && (
            <Badge variant="secondary" className="text-muted-foreground">
              +{(addedKeywords.length + matchedKeywords.length + missingKeywords.length) - 8} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};