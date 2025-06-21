
import React from 'react';
import { parseResumeContent } from '../utils/parseResumeContent';
import { Mail, Phone, MapPin } from 'lucide-react';

interface SidebarTemplateProps {
  resumeData: string;
}

export const SidebarTemplate: React.FC<SidebarTemplateProps> = ({ resumeData }) => {
  const parsedData = parseResumeContent(resumeData);

  return (
    <div className="min-h-[800px] bg-white flex" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Left Sidebar */}
      <div className="w-1/3 bg-gray-100 p-6 space-y-6">
        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wide">Contact</h3>
          <div className="space-y-3">
            {parsedData.email && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail size={14} />
                <span className="break-all">{parsedData.email}</span>
              </div>
            )}
            {parsedData.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone size={14} />
                <span>{parsedData.phone}</span>
              </div>
            )}
            {parsedData.location && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin size={14} />
                <span>{parsedData.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {parsedData.skills.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wide">Skills</h3>
            <div className="space-y-4">
              {parsedData.skills.map((skillGroup, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">{skillGroup.category}</h4>
                  <div className="space-y-1">
                    {skillGroup.items.map((skill, skillIndex) => (
                      <div key={skillIndex} className="text-sm text-gray-600">
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {parsedData.education.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wide">Education</h3>
            <div className="space-y-3">
              {parsedData.education.map((edu, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-gray-700 text-sm">{edu.degree}</h4>
                  <p className="text-sm text-gray-600">{edu.school}</p>
                  <p className="text-xs text-gray-500">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{parsedData.name}</h1>
          {parsedData.summary && (
            <p className="text-lg text-gray-600 leading-relaxed">{parsedData.summary}</p>
          )}
        </div>

        {/* Experience */}
        {parsedData.experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wide">Professional Experience</h2>
            <div className="space-y-6">
              {parsedData.experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-gray-300 pl-6 ml-2">
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{exp.title}</h3>
                    <p className="text-md font-semibold text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500">{exp.duration}</p>
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="space-y-1 text-sm text-gray-700">
                      {exp.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
