
import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { parseResumeContent } from '../utils/parseResumeContent';

interface ClassicTemplateProps {
  resumeData: string | StructuredResumeData;
}

export const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ resumeData }) => {
  // Handle both structured data and legacy text parsing
  const parsedData = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;

  return (
    <div className="min-h-[800px] bg-white p-6 max-w-4xl mx-auto text-sm leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header - Left aligned with contact info on one line */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black mb-2">{parsedData.name}</h1>
        <div className="text-sm text-gray-800">
          {[parsedData.phone, parsedData.email, parsedData.location].filter(Boolean).join(' | ')}
        </div>
      </div>

      {/* Summary */}
      {parsedData.summary && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-black mb-2 uppercase tracking-wide">SUMMARY</h2>
          <hr className="border-t border-black mb-3" />
          <p className="text-gray-800 leading-relaxed text-sm">{parsedData.summary}</p>
        </div>
      )}

      {/* Skills */}
      {parsedData.skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-black mb-2 uppercase tracking-wide">SKILLS</h2>
          <hr className="border-t border-black mb-3" />
          <div className="space-y-2">
            {parsedData.skills.map((skillGroup, index) => (
              <div key={index}>
                <span className="font-semibold text-black">{skillGroup.category}: </span>
                <span className="text-gray-800">{skillGroup.items.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {parsedData.experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-black mb-2 uppercase tracking-wide">EXPERIENCE</h2>
          <hr className="border-t border-black mb-3" />
          <div className="space-y-4">
            {parsedData.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-black text-sm">{exp.title}</h3>
                    <p className="text-sm text-gray-800">{exp.company}</p>
                  </div>
                  <span className="text-sm text-gray-700">{exp.duration}</span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="ml-4 space-y-1 mt-2">
                    {exp.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="text-gray-800 leading-relaxed text-sm" style={{ listStyleType: 'disc' }}>
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

      {/* Education */}
      {parsedData.education.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-black mb-2 uppercase tracking-wide">EDUCATION</h2>
          <hr className="border-t border-black mb-3" />
          <div className="space-y-2">
            {parsedData.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-black text-sm">{edu.degree}</h3>
                  <p className="text-gray-800 text-sm">{edu.school}</p>
                </div>
                <span className="text-sm text-gray-700">{edu.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {parsedData.certifications && parsedData.certifications.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-bold text-black mb-2 uppercase tracking-wide">CERTIFICATIONS</h2>
          <hr className="border-t border-black mb-3" />
          <div className="space-y-2">
            {parsedData.certifications.map((cert, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-black text-sm">{cert.name}</h3>
                  <p className="text-gray-800 text-sm">{cert.issuer}</p>
                </div>
                <span className="text-sm text-gray-700">{cert.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
