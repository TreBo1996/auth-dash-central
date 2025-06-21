
import React from 'react';
import { templateConfigs } from '../templateConfigs';
import { parseResumeContent } from '../utils/parseResumeContent';

interface TechnicalTemplateProps {
  resumeData: string;
}

export const TechnicalTemplate: React.FC<TechnicalTemplateProps> = ({ resumeData }) => {
  const config = templateConfigs.technical;
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
      <div 
        className="mb-8 p-6 rounded-lg"
        style={{ backgroundColor: `${config.colors.primary}05` }}
      >
        <h1 
          className="text-3xl font-bold mb-2"
          style={{ 
            fontFamily: config.fonts.heading,
            color: config.colors.primary
          }}
        >
          {parsedData.name || 'Your Name'}
        </h1>
        <div className="text-base" style={{ color: config.colors.secondary }}>
          {parsedData.email && <span className="font-mono">{parsedData.email}</span>}
          {parsedData.phone && <span className="ml-4 font-mono">{parsedData.phone}</span>}
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
                className="text-xl font-bold mb-3 flex items-center"
                style={{ 
                  color: config.colors.primary,
                  fontFamily: config.fonts.heading
                }}
              >
                <span className="mr-2">//</span> Summary
              </h2>
              <div 
                className="p-4 rounded border-l-4 bg-gray-50"
                style={{ borderColor: config.colors.accent }}
              >
                <p className="text-sm leading-relaxed font-mono">{parsedData.summary}</p>
              </div>
            </section>
          )}

          {/* Experience */}
          {parsedData.experience.length > 0 && (
            <section>
              <h2 
                className="text-xl font-bold mb-3 flex items-center"
                style={{ 
                  color: config.colors.primary,
                  fontFamily: config.fonts.heading
                }}
              >
                <span className="mr-2">//</span> Experience
              </h2>
              <div className="space-y-5">
                {parsedData.experience.map((exp, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded border"
                    style={{ 
                      borderColor: config.colors.accent,
                      backgroundColor: `${config.colors.accent}05`
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 
                          className="font-bold text-lg"
                          style={{ 
                            color: config.colors.primary,
                            fontFamily: config.fonts.heading
                          }}
                        >
                          {exp.title}
                        </h3>
                        <p className="font-semibold" style={{ color: config.colors.accent }}>
                          {exp.company}
                        </p>
                      </div>
                      <span 
                        className="text-sm font-mono px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: config.colors.primary,
                          color: 'white'
                        }}
                      >
                        {exp.duration}
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {exp.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start">
                          <span 
                            className="mr-2 font-mono font-bold"
                            style={{ color: config.colors.accent }}
                          >
                            &gt;
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Skills */}
          {parsedData.skills.length > 0 && (
            <section>
              <h2 
                className="text-lg font-bold mb-3"
                style={{ 
                  color: config.colors.primary,
                  fontFamily: config.fonts.heading
                }}
              >
                <span className="mr-2">//</span> Skills
              </h2>
              <div className="space-y-4">
                {parsedData.skills.map((skill, index) => (
                  <div key={index}>
                    <h3 
                      className="font-semibold text-sm mb-2 font-mono"
                      style={{ color: config.colors.accent }}
                    >
                      {skill.category.toUpperCase()}
                    </h3>
                    <div className="space-y-1">
                      {skill.items.map((item, idx) => (
                        <div 
                          key={idx}
                          className="text-xs px-2 py-1 rounded font-mono"
                          style={{ 
                            backgroundColor: `${config.colors.primary}10`,
                            color: config.colors.text
                          }}
                        >
                          {item}
                        </div>
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
                className="text-lg font-bold mb-3"
                style={{ 
                  color: config.colors.primary,
                  fontFamily: config.fonts.heading
                }}
              >
                <span className="mr-2">//</span> Education
              </h2>
              <div className="space-y-3">
                {parsedData.education.map((edu, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded border"
                    style={{ 
                      borderColor: config.colors.secondary,
                      backgroundColor: `${config.colors.secondary}05`
                    }}
                  >
                    <h3 className="font-semibold text-sm">{edu.degree}</h3>
                    <p className="text-xs" style={{ color: config.colors.accent }}>{edu.school}</p>
                    <p className="text-xs font-mono" style={{ color: config.colors.secondary }}>
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
