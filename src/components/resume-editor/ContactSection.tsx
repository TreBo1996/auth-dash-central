
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { User } from 'lucide-react';

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
}

interface ContactSectionProps {
  contactInfo: ContactInfo;
  onChange: (contactInfo: ContactInfo) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  contactInfo,
  onChange
}) => {
  const updateField = (field: keyof ContactInfo, value: string) => {
    onChange({ ...contactInfo, [field]: value });
  };

  return (
    <Card className="rounded-xl shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Full Name
            </label>
            <Input
              value={contactInfo.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Your full name"
              className="h-11"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={contactInfo.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="your.email@example.com"
              className="h-11"
            />
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Phone Number
            </label>
            <Input
              value={contactInfo.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="h-11"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Location
            </label>
            <Input
              value={contactInfo.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="City, State"
              className="h-11"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
