
import React from 'react';
import { templateConfigs } from '../templateConfigs';
import { parseResumeContent } from '../utils/parseResumeContent';

interface ExecutiveTemplateProps {
  resumeData: string;
}

export const ExecutiveTemplate: React.FC<ExecutiveTemplateProps> = ({ resumeData }) => {
  const config = templateConfigs.executive;
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
      <div className="mb-8">
        <h1 
          className="text-5xl font-light mb-3"
          style={{ 
            fontFamily: config.fonts.heading,
            color: config.colors.primary
          }}
        >
          {parsedData.name || 'Your Name'}
        </h1>
        <div 
          className="text-lg border-l-4 pl-4"
          style={{ 
            borderColor: config.colors.accent,
            color: config.colors.secondary
          }}
        >
          {parsedData.email && <span>{parsedData.email}</span>}
          {parsedData.phone && <span> • {parsedData.phone}</span>}
          {parsedData.location && <span> • {parsedData.location}</span>}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Summary */}
        {parsedData.summary && (
          <section>
            <h2 
              className="text-2xl font-light mb-4 pb-2 border-b"
              style={{ 
                color: config.colors.primary,
                borderColor: config.colors.accent,
                fontFamily: config.fonts.heading
              }}
            >
              Executive Summary
            </h2>
            <p className="text-base leading-relaxed italic" style={{ fontFamily: config.fonts.heading }}>
              {parsedData.summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {parsedData.experience.length > 0 && (
          <section>
            <h2 
              className="text-2xl font-light mb-4 pb-2 border-b"
              style={{ 
                color: config.colors.primary,
                borderColor: config.colors.accent,
                fontFamily: config.fonts.heading
              }}
            >
              Professional Experience
            </h2>
            <div className="space-y-6">
              {parsedData.experience.map((exp, index) => (
                <div key={index}>
                  <div className="mb-3">
                    <h3 
                      className="text-xl font-medium"
                      style={{ 
                        color: config.colors.primary,
                        fontFamily: config.fonts.heading
                      }}
                    >
                      {exp.title}
                    </h3>
                    <div className="flex justify-between items-baseline">
                      <p className="text-lg font-medium" style={{ color: config.colors.accent }}>
                        {exp.company}
                      </p>
                      <span className="text-sm" style={{ color: config.colors.secondary }}>
                        {exp.duration}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start">
                        <span 
                          className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                          style={{ backgroundColor: config.colors.accent }}
                        ></span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-8">
          {/* Education */}
          {parsedData.education.length > 0 && (
            <section>
              <h2 
                className="text-2xl font-light mb-4 pb-2 border-b"
                style={{ 
                  color: config.colors.primary,
                  borderColor: config.colors.accent,
                  fontFamily: config.fonts.heading
                }}
              >
                Education
              </h2>
              <div className="space-y-3">
                {parsedData.education.map((edu, index) => (
                  <div key={index}>
                    <h3 className="font-semibold text-base">{edu.degree}</h3>
                    <p style={{ color: config.colors.accent }}>{edu.school}</p>
                    <p className="text-sm" style={{ color: config.colors.secondary }}>
                      {edu.year}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {parsedData.skills.length > 0 && (
            <section>
              <h2 
                className="text-2xl font-light mb-4 pb-2 border-b"
                style={{ 
                  color: config.colors.primary,
                  borderColor: config.colors.accent,
                  fontFamily: config.fonts.heading
                }}
              >
                Core Competencies
              </h2>
              <div className="space-y-3">
                {parsedData.skills.map((skill, index) => (
                  <div key={index}>
                    <h3 className="font-semibold text-sm mb-1" style={{ color: config.colors.accent }}>
                      {skill.category}
                    </h3>
                    <p className="text-sm">{skill.items.join(' • ')}</p>
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
