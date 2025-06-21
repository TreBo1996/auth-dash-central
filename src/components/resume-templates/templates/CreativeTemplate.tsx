
import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { templateConfigs } from '../templateConfigs';
import { parseResumeContent } from '../utils/parseResumeContent';

interface CreativeTemplateProps {
  resumeData: string | StructuredResumeData;
}

export const CreativeTemplate: React.FC<CreativeTemplateProps> = ({ resumeData }) => {
  const config = templateConfigs.creative;
  // Handle both structured data and legacy text parsing
  const parsedData = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;

  return (
    <div 
      className="max-w-4xl mx-auto bg-white"
      style={{ 
        fontFamily: config.fonts.body,
        color: config.colors.text
      }}
    >
      {/* Header with colored background */}
      <div 
        className="p-8 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${config.colors.primary} 0%, ${config.colors.secondary} 100%)`
        }}
      >
        <h1 
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: config.fonts.heading }}
        >
          {parsedData.name || 'Your Name'}
        </h1>
        <div className="text-lg opacity-90">
          {parsedData.email && <span>{parsedData.email}</span>}
          {parsedData.phone && <span className="ml-4">{parsedData.phone}</span>}
          {parsedData.location && <span className="ml-4">{parsedData.location}</span>}
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Summary */}
            {parsedData.summary && (
              <section>
                <h2 
                  className="text-2xl font-bold mb-4 flex items-center"
                  style={{ 
                    color: config.colors.primary,
                    fontFamily: config.fonts.heading
                  }}
                >
                  <div 
                    className="w-1 h-8 mr-3"
                    style={{ backgroundColor: config.colors.accent }}
                  ></div>
                  About Me
                </h2>
                <p className="text-sm leading-relaxed">{parsedData.summary}</p>
              </section>
            )}

            {/* Experience */}
            {parsedData.experience.length > 0 && (
              <section>
                <h2 
                  className="text-2xl font-bold mb-4 flex items-center"
                  style={{ 
                    color: config.colors.primary,
                    fontFamily: config.fonts.heading
                  }}
                >
                  <div 
                    className="w-1 h-8 mr-3"
                    style={{ backgroundColor: config.colors.accent }}
                  ></div>
                  Experience
                </h2>
                <div className="space-y-5">
                  {parsedData.experience.map((exp, index) => (
                    <div key={index} className="relative pl-6">
                      <div 
                        className="absolute left-0 top-2 w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.colors.accent }}
                      ></div>
                      <div className="mb-2">
                        <h3 className="font-bold text-lg" style={{ color: config.colors.text }}>
                          {exp.title}
                        </h3>
                        <p className="font-semibold text-base" style={{ color: config.colors.primary }}>
                          {exp.company}
                        </p>
                        <span className="text-sm" style={{ color: config.colors.secondary }}>
                          {exp.duration}
                        </span>
                      </div>
                      <ul className="space-y-1 text-sm">
                        {exp.bullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start">
                            <span 
                              className="w-2 h-2 rounded-full mt-2 mr-2 flex-shrink-0"
                              style={{ backgroundColor: config.colors.secondary }}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {parsedData.skills.length > 0 && (
              <section>
                <h2 
                  className="text-xl font-bold mb-4"
                  style={{ 
                    color: config.colors.primary,
                    fontFamily: config.fonts.heading
                  }}
                >
                  Skills
                </h2>
                <div className="space-y-3">
                  {parsedData.skills.map((skill, index) => (
                    <div key={index}>
                      <h3 
                        className="font-semibold text-sm mb-1"
                        style={{ color: config.colors.accent }}
                      >
                        {skill.category}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {skill.items.map((item, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 text-xs rounded-full"
                            style={{ 
                              backgroundColor: `${config.colors.primary}20`,
                              color: config.colors.primary
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {parsedData.education.length > 0 && (
              <section>
                <h2 
                  className="text-xl font-bold mb-4"
                  style={{ 
                    color: config.colors.primary,
                    fontFamily: config.fonts.heading
                  }}
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
    </div>
  );
};
