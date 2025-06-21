
import React from 'react';
import { parseResumeContent } from '../utils/parseResumeContent';

interface ClassicTemplateProps {
  resumeData: string;
}

export const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ resumeData }) => {
  const parsedData = parseResumeContent(resumeData);

  return (
    <div className="min-h-[800px] bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div className="text-center mb-8 pb-6">
        <h1 className="text-4xl font-bold text-black mb-4">{parsedData.name || 'Your Name'}</h1>
        <div className="text-sm text-gray-700 space-y-1">
          {parsedData.email && <p>{parsedData.email}</p>}
          {parsedData.phone && <p>{parsedData.phone}</p>}
          {parsedData.location && <p>{parsedData.location}</p>}
        </div>
        <hr className="border-t-2 border-black mt-4" />
      </div>

      {/* Summary */}
      {parsedData.summary && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-black mb-3 uppercase tracking-wide">Professional Summary</h2>
          <hr className="border-t border-gray-400 mb-4" />
          <p className="text-gray-800 leading-relaxed">{parsedData.summary}</p>
        </div>
      )}

      {/* Experience */}
      {parsedData.experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-black mb-3 uppercase tracking-wide">Professional Experience</h2>
          <hr className="border-t border-gray-400 mb-4" />
          <div className="space-y-6">
            {parsedData.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-black">{exp.title}</h3>
                    <p className="text-md font-semibold text-gray-700">{exp.company}</p>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">{exp.duration}</span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="ml-4 space-y-1">
                    {exp.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="text-gray-800 leading-relaxed list-disc">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {parsedData.skills.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-black mb-3 uppercase tracking-wide">Core Competencies</h2>
          <hr className="border-t border-gray-400 mb-4" />
          <div className="space-y-3">
            {parsedData.skills.map((skillGroup, index) => (
              <div key={index}>
                <h3 className="font-bold text-black mb-1">{skillGroup.category}:</h3>
                <p className="text-gray-800 ml-4">{skillGroup.items.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {parsedData.education.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-black mb-3 uppercase tracking-wide">Education</h2>
          <hr className="border-t border-gray-400 mb-4" />
          <div className="space-y-3">
            {parsedData.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-black">{edu.degree}</h3>
                  <p className="text-gray-700">{edu.school}</p>
                </div>
                <span className="text-sm text-gray-600">{edu.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
