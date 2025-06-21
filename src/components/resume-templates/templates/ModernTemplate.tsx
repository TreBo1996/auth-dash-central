
import React from 'react';
import { templateConfigs } from '../templateConfigs';
import { parseResumeContent } from '../utils/parseResumeContent';

interface ModernTemplateProps {
  resumeData: string;
}

export const ModernTemplate: React.FC<ModernTemplateProps> = ({ resumeData }) => {
  const config = templateConfigs.modern;
  const parsedData = parseResumeContent(resumeData);

  return (
    <div 
      className="max-w-4xl mx-auto p-8 bg-white"
      style={{ 
        fontFamily: config.fonts.body,
        color: config.colors.text
      }}
    >
      {/* Header */}
      <div className="mb-8 pb-6 border-b-2" style={{ borderColor: config.colors.primary }}>
        <h1 
          className="text-4xl font-bold mb-2"
          style={{ 
            fontFamily: config.fonts.heading,
            color: config.colors.primary
          }}
        >
          {parsedData.name || 'Your Name'}
        </h1>
        <div className="text-lg" style={{ color: config.colors.secondary }}>
          {parsedData.email && <span>{parsedData.email}</span>}
          {parsedData.phone && <span className="ml-4">{parsedData.phone}</span>}
          {parsedData.location && <span className="ml-4">{parsedData.location}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Summary */}
          {parsedData.summary && (
            <section>
              <h2 
                className="text-2xl font-semibold mb-3 pb-1 border-b"
                style={{ 
                  color: config.colors.primary,
                  borderColor: config.colors.accent
                }}
              >
                Professional Summary
              </h2>
              <p className="text-sm leading-relaxed">{parsedData.summary}</p>
            </section>
          )}

          {/* Experience */}
          {parsedData.experience.length > 0 && (
            <section>
              <h2 
                className="text-2xl font-semibold mb-3 pb-1 border-b"
                style={{ 
                  color: config.colors.primary,
                  borderColor: config.colors.accent
                }}
              >
                Experience
              </h2>
              <div className="space-y-4">
                {parsedData.experience.map((exp, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg" style={{ color: config.colors.text }}>
                          {exp.title}
                        </h3>
                        <p className="font-medium" style={{ color: config.colors.accent }}>
                          {exp.company}
                        </p>
                      </div>
                      <span className="text-sm" style={{ color: config.colors.secondary }}>
                        {exp.duration}
                      </span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {exp.bullets.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Skills */}
          {parsedData.skills.length > 0 && (
            <section>
              <h2 
                className="text-xl font-semibold mb-3"
                style={{ color: config.colors.primary }}
              >
                Skills
              </h2>
              <div className="space-y-2">
                {parsedData.skills.map((skill, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{skill.category}:</span>
                    <p className="text-xs mt-1">{skill.items.join(', ')}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {parsedData.education.length > 0 && (
            <section>
              <h2 
                className="text-xl font-semibold mb-3"
                style={{ color: config.colors.primary }}
              >
                Education
              </h2>
              <div className="space-y-3">
                {parsedData.education.map((edu, index) => (
                  <div key={index} className="text-sm">
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p style={{ color: config.colors.accent }}>{edu.school}</p>
                    <p className="text-xs" style={{ color: config.colors.secondary }}>
                      {edu.year}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
