
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

interface ResumeSectionProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  title,
  value,
  onChange,
  placeholder = "Enter content..."
}) => {
  return (
    <Card className="rounded-xl shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[120px] resize-none"
        />
      </CardContent>
    </Card>
  );
};
