
import React from 'react';
import { parseResumeContent } from '../utils/parseResumeContent';
import { Mail, Phone, MapPin } from 'lucide-react';

interface ExecutiveTemplateProps {
  resumeData: string;
}

export const ExecutiveTemplate: React.FC<ExecutiveTemplateProps> = ({ resumeData }) => {
  const parsedData = parseResumeContent(resumeData);

  return (
    <div className="min-h-[800px] bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">{parsedData.name}</h1>
          <div className="flex flex-wrap gap-6 text-gray-300 mb-4">
            {parsedData.email && (
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>{parsedData.email}</span>
              </div>
            )}
            {parsedData.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>{parsedData.phone}</span>
              </div>
            )}
            {parsedData.location && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{parsedData.location}</span>
              </div>
            )}
          </div>
          {parsedData.summary && (
            <p className="text-lg text-gray-100 leading-relaxed max-w-3xl">
              {parsedData.summary}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        {/* Experience */}
        {parsedData.experience.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-800">
              Professional Experience
            </h2>
            <div className="space-y-8">
              {parsedData.experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{exp.title}</h3>
                      <p className="text-lg font-semibold text-gray-600">{exp.company}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded">
                        {exp.duration}
                      </span>
                    </div>
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="space-y-2 ml-4">
                      {exp.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-start gap-3 text-gray-700">
                          <span className="w-1.5 h-1.5 bg-gray-800 rounded-full mt-2.5 flex-shrink-0"></span>
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

        {/* Skills and Education Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Skills */}
          {parsedData.skills.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-800">
                Core Competencies
              </h2>
              <div className="space-y-4">
                {parsedData.skills.map((skillGroup, index) => (
                  <div key={index}>
                    <h3 className="font-bold text-gray-800 mb-2">{skillGroup.category}</h3>
                    <ul className="space-y-1">
                      {skillGroup.items.map((skill, skillIndex) => (
                        <li key={skillIndex} className="text-gray-700 flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-800 rounded-full"></span>
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {parsedData.education.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-800">
                Education
              </h2>
              <div className="space-y-4">
                {parsedData.education.map((edu, index) => (
                  <div key={index}>
                    <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                    <p className="text-gray-700 font-medium">{edu.school}</p>
                    <p className="text-sm text-gray-600">{edu.year}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
