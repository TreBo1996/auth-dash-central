
import React from 'react';
import { parseResumeContent } from '../utils/parseResumeContent';
import { Mail, Phone, MapPin, Linkedin } from 'lucide-react';

interface ModernTemplateProps {
  resumeData: string;
}

export const ModernTemplate: React.FC<ModernTemplateProps> = ({ resumeData }) => {
  const parsedData = parseResumeContent(resumeData);

  return (
    <div className="min-h-[800px] bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">{parsedData.name}</h1>
        <div className="flex justify-center items-center gap-6 text-sm text-gray-600 mb-4 flex-wrap">
          {parsedData.email && (
            <div className="flex items-center gap-1">
              <Mail size={14} />
              <span>{parsedData.email}</span>
            </div>
          )}
          {parsedData.phone && (
            <div className="flex items-center gap-1">
              <Phone size={14} />
              <span>{parsedData.phone}</span>
            </div>
          )}
          {parsedData.location && (
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{parsedData.location}</span>
            </div>
          )}
        </div>
        {parsedData.summary && (
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
            {parsedData.summary}
          </p>
        )}
      </div>

      {/* Skills */}
      {parsedData.skills.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Competencies</h2>
          <div className="space-y-3">
            {parsedData.skills.map((skillGroup, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-800 mb-2">{skillGroup.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((skill, skillIndex) => (
                    <span 
                      key={skillIndex} 
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {parsedData.experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Experience</h2>
          <div className="space-y-6">
            {parsedData.experience.map((exp, index) => (
              <div key={index} className="pb-6 border-b border-gray-100 last:border-b-0">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{exp.title}</h3>
                    <p className="text-lg font-semibold text-gray-600">{exp.company}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded">
                    {exp.duration}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="space-y-2">
                    {exp.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex items-start gap-3 text-gray-700">
                        <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {parsedData.education.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Education</h2>
          <div className="space-y-4">
            {parsedData.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                  <p className="text-gray-700">{edu.school}</p>
                </div>
                <span className="text-sm font-medium text-gray-500">{edu.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
