import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Award, Plus, Trash2 } from 'lucide-react';
interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}
interface CertificationsSectionProps {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
}
export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  certifications,
  onChange
}) => {
  const addCertification = () => {
    const newCertification: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      year: ''
    };
    onChange([...certifications, newCertification]);
  };
  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    onChange(certifications.map(cert => cert.id === id ? {
      ...cert,
      [field]: value
    } : cert));
  };
  const removeCertification = (id: string) => {
    onChange(certifications.filter(cert => cert.id !== id));
  };
  return <Card className="rounded-xl shadow-md">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certifications
          </CardTitle>
          <Button onClick={addCertification} size="sm" className="self-start sm:self-auto bg-blue-800 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
        {certifications.map((cert, index) => <div key={cert.id} className="p-3 sm:p-4 border rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Certification {index + 1}</h4>
              <Button variant="ghost" size="sm" onClick={() => removeCertification(cert.id)} className="self-end sm:self-auto p-2 h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Certification Name
                </label>
                <Input value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} placeholder="Certification name" className="h-11" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Issuing Organization
                </label>
                <Input value={cert.issuer} onChange={e => updateCertification(cert.id, 'issuer', e.target.value)} placeholder="Issuing organization" className="h-11" />
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Year Obtained
                </label>
                <Input value={cert.year} onChange={e => updateCertification(cert.id, 'year', e.target.value)} placeholder="YYYY" className="h-11" />
              </div>
            </div>
          </div>)}
        
        {certifications.length === 0 && <div className="text-center py-8 text-gray-500">
            <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No certifications added yet</p>
            <Button onClick={addCertification} className="mt-2 bg-blue-800 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </div>}
      </CardContent>
    </Card>;
};