
import React from 'react';
import { templateConfigs } from '../templateConfigs';
import { parseResumeContent } from '../utils/parseResumeContent';

interface AcademicTemplateProps {
  resumeData: string;
}

export const AcademicTemplate: React.FC<AcademicTemplateProps> = ({ resumeData }) => {
  const config = templateConfigs.academic;
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
      <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: config.colors.primary }}>
        <h1 
          className="text-4xl font-light mb-3"
          style={{ 
            fontFamily: config.fonts.heading,
            color: config.colors.primary
          }}
        >
          {parsedData.name || 'Your Name'}
        </h1>
        <div className="text-base" style={{ color: config.colors.secondary }}>
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
              className="text-2xl font-light mb-4 text-center"
              style={{ 
                color: config.colors.primary,
                fontFamily: config.fonts.heading
              }}
            >
              Research Interests & Summary
            </h2>
            <p className="text-base leading-relaxed text-justify italic" style={{ fontFamily: config.fonts.heading }}>
              {parsedData.summary}
            </p>
          </section>
        )}

        {/* Education (Prominent for Academic) */}
        {parsedData.education.length > 0 && (
          <section>
            <h2 
              className="text-2xl font-light mb-4 text-center pb-2 border-b"
              style={{ 
                color: config.colors.primary,
                borderColor: config.colors.accent,
                fontFamily: config.fonts.heading
              }}
            >
              Education
            </h2>
            <div className="space-y-4">
              {parsedData.education.map((edu, index) => (
                <div key={index} className="text-center">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: config.fonts.heading }}>
                    {edu.degree}
                  </h3>
                  <p className="text-base font-medium" style={{ color: config.colors.accent }}>
                    {edu.school}
                  </p>
                  <p className="text-sm" style={{ color: config.colors.secondary }}>
                    {edu.year}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {parsedData.experience.length > 0 && (
          <section>
            <h2 
              className="text-2xl font-light mb-4 text-center pb-2 border-b"
              style={{ 
                color: config.colors.primary,
                borderColor: config.colors.accent,
                fontFamily: config.fonts.heading
              }}
            >
              Academic & Professional Experience
            </h2>
            <div className="space-y-6">
              {parsedData.experience.map((exp, index) => (
                <div key={index}>
                  <div className="text-center mb-3">
                    <h3 
                      className="text-lg font-medium"
                      style={{ 
                        color: config.colors.primary,
                        fontFamily: config.fonts.heading
                      }}
                    >
                      {exp.title}
                    </h3>
                    <p className="font-medium" style={{ color: config.colors.accent }}>
                      {exp.company}
                    </p>
                    <span className="text-sm italic" style={{ color: config.colors.secondary }}>
                      {exp.duration}
                    </span>
                  </div>
                  <ul className="text-sm space-y-2 text-justify">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start">
                        <span 
                          className="mr-3 font-bold"
                          style={{ color: config.colors.accent }}
                        >
                          •
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {parsedData.skills.length > 0 && (
          <section>
            <h2 
              className="text-2xl font-light mb-4 text-center pb-2 border-b"
              style={{ 
                color: config.colors.primary,
                borderColor: config.colors.accent,
                fontFamily: config.fonts.heading
              }}
            >
              Skills & Competencies
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {parsedData.skills.map((skill, index) => (
                <div key={index} className="text-center">
                  <h3 
                    className="font-semibold text-base mb-2"
                    style={{ 
                      color: config.colors.accent,
                      fontFamily: config.fonts.heading
                    }}
                  >
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
  );
};
