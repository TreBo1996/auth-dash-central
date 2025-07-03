import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { newTemplateConfigs } from '../configs/newTemplateConfigs';

interface TechnicalEngineeringTemplateProps {
  resumeData: StructuredResumeData;
}

export const TechnicalEngineeringTemplate: React.FC<TechnicalEngineeringTemplateProps> = ({
  resumeData
}) => {
  const config = newTemplateConfigs['technical-engineering'];

  return (
    <div 
      className="w-full max-w-[8.5in] mx-auto bg-white p-12 text-sm leading-normal"
      style={{
        fontFamily: config.fonts.body,
        color: config.colors.text,
        minHeight: '11in'
      }}
    >
      {/* Header - Technical Professional Style */}
      <header className="mb-8 pb-6 border-b-2" style={{ borderColor: config.colors.accent }}>
        <h1 
          className="text-3xl font-bold mb-2"
          style={{ 
            fontFamily: config.fonts.heading,
            color: config.colors.primary
          }}
        >
          {resumeData.name}
        </h1>
        
        {resumeData.experience.length > 0 && (
          <h2 
            className="text-lg mb-4 font-medium"
            style={{ color: config.colors.accent }}
          >
            {resumeData.experience[0].title}
          </h2>
        )}
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          {resumeData.phone && (
            <div className="flex items-center">
              <span 
                className="font-mono text-xs mr-2 px-2 py-1 rounded"
                style={{ 
                  backgroundColor: `${config.colors.accent}10`,
                  color: config.colors.accent
                }}
              >
                TEL
              </span>
              <span style={{ color: config.colors.textSecondary }}>{resumeData.phone}</span>
            </div>
          )}
          {resumeData.email && (
            <div className="flex items-center">
              <span 
                className="font-mono text-xs mr-2 px-2 py-1 rounded"
                style={{ 
                  backgroundColor: `${config.colors.accent}10`,
                  color: config.colors.accent
                }}
              >
                EMAIL
              </span>
              <span style={{ color: config.colors.textSecondary }}>{resumeData.email}</span>
            </div>
          )}
          {resumeData.location && (
            <div className="flex items-center">
              <span 
                className="font-mono text-xs mr-2 px-2 py-1 rounded"
                style={{ 
                  backgroundColor: `${config.colors.accent}10`,
                  color: config.colors.accent
                }}
              >
                LOC
              </span>
              <span style={{ color: config.colors.textSecondary }}>{resumeData.location}</span>
            </div>
          )}
        </div>
      </header>

      {/* Technical Summary */}
      {resumeData.summary && (
        <section className="mb-8">
          <h2 
            className="text-lg font-bold mb-4 flex items-center"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary
            }}
          >
            <span 
              className="w-6 h-6 flex items-center justify-center rounded mr-3 font-mono text-xs"
              style={{ 
                backgroundColor: config.colors.accent,
                color: 'white'
              }}
            >
              01
            </span>
            TECHNICAL SUMMARY
          </h2>
          <p 
            className="leading-relaxed ml-9"
            style={{ color: config.colors.text }}
          >
            {resumeData.summary}
          </p>
        </section>
      )}

      {/* Technical Skills Matrix */}
      {resumeData.skills.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-lg font-bold mb-4 flex items-center"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary
            }}
          >
            <span 
              className="w-6 h-6 flex items-center justify-center rounded mr-3 font-mono text-xs"
              style={{ 
                backgroundColor: config.colors.accent,
                color: 'white'
              }}
            >
              02
            </span>
            TECHNICAL SKILLS
          </h2>
          
          <div className="ml-9 space-y-4">
            {resumeData.skills.map((skillGroup, groupIndex) => (
              <div key={groupIndex} className="border rounded-lg p-4" style={{ borderColor: config.colors.border }}>
                <h3 
                  className="font-bold mb-3 flex items-center"
                  style={{ color: config.colors.secondary }}
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: config.colors.accent }}
                  ></span>
                  {skillGroup.category.toUpperCase()}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {skillGroup.items.map((skill, index) => (
                    <div 
                      key={index}
                      className="px-3 py-1 rounded text-xs font-medium text-center"
                      style={{ 
                        backgroundColor: `${config.colors.accent}08`,
                        color: config.colors.text,
                        border: `1px solid ${config.colors.border}`
                      }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Professional Experience */}
      {resumeData.experience.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-lg font-bold mb-4 flex items-center"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary
            }}
          >
            <span 
              className="w-6 h-6 flex items-center justify-center rounded mr-3 font-mono text-xs"
              style={{ 
                backgroundColor: config.colors.accent,
                color: 'white'
              }}
            >
              03
            </span>
            PROFESSIONAL EXPERIENCE
          </h2>
          
          <div className="ml-9 space-y-6">
            {resumeData.experience.map((exp, index) => (
              <div key={index} className="job-entry avoid-page-break">
                <div className="border-l-4 pl-4" style={{ borderColor: config.colors.accent }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 
                        className="text-base font-bold"
                        style={{ color: config.colors.primary }}
                      >
                        {exp.title}
                      </h3>
                      <h4 
                        className="text-base font-medium flex items-center"
                        style={{ color: config.colors.secondary }}
                      >
                        <span 
                          className="w-3 h-3 rounded mr-2"
                          style={{ backgroundColor: config.colors.accent }}
                        ></span>
                        {exp.company}
                      </h4>
                    </div>
                    <div 
                      className="text-sm font-mono px-3 py-1 rounded border"
                      style={{ 
                        color: config.colors.accent,
                        borderColor: config.colors.accent,
                        backgroundColor: `${config.colors.accent}08`
                      }}
                    >
                      {exp.duration}
                    </div>
                  </div>
                  
                  <ul className="space-y-1.5 mt-3">
                    {exp.bullets.map((bullet, bulletIndex) => (
                      <li 
                        key={bulletIndex} 
                        className="flex items-start"
                        style={{ color: config.colors.text }}
                      >
                        <span 
                          className="font-mono text-xs mt-1 mr-3 px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ 
                            backgroundColor: `${config.colors.accent}15`,
                            color: config.colors.accent
                          }}
                        >
                          ▸
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education & Certifications Grid */}
      <div className="grid grid-cols-2 gap-8">
        {/* Education */}
        {resumeData.education.length > 0 && (
          <section className="mb-8">
            <h2 
              className="text-base font-bold mb-4 flex items-center"
              style={{ 
                fontFamily: config.fonts.heading,
                color: config.colors.primary
              }}
            >
              <span 
                className="w-5 h-5 flex items-center justify-center rounded mr-2 font-mono text-xs"
                style={{ 
                  backgroundColor: config.colors.accent,
                  color: 'white'
                }}
              >
                04
              </span>
              EDUCATION
            </h2>
            
            <div className="ml-7 space-y-3">
              {resumeData.education.map((edu, index) => (
                <div 
                  key={index} 
                  className="border rounded p-3"
                  style={{ borderColor: config.colors.border }}
                >
                  <h3 
                    className="font-bold text-sm"
                    style={{ color: config.colors.primary }}
                  >
                    {edu.degree}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: config.colors.secondary }}
                  >
                    {edu.school}
                  </p>
                  <p 
                    className="text-xs font-mono mt-1"
                    style={{ color: config.colors.accent }}
                  >
                    {edu.year}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {resumeData.certifications && resumeData.certifications.length > 0 && (
          <section>
            <h2 
              className="text-base font-bold mb-4 flex items-center"
              style={{ 
                fontFamily: config.fonts.heading,
                color: config.colors.primary
              }}
            >
              <span 
                className="w-5 h-5 flex items-center justify-center rounded mr-2 font-mono text-xs"
                style={{ 
                  backgroundColor: config.colors.accent,
                  color: 'white'
                }}
              >
                05
              </span>
              CERTIFICATIONS
            </h2>
            
            <div className="ml-7 space-y-3">
              {resumeData.certifications.map((cert, index) => (
                <div 
                  key={index}
                  className="border rounded p-3"
                  style={{ borderColor: config.colors.border }}
                >
                  <h3 
                    className="font-bold text-sm"
                    style={{ color: config.colors.primary }}
                  >
                    {cert.name}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: config.colors.secondary }}
                  >
                    {cert.issuer}
                  </p>
                  <p 
                    className="text-xs font-mono mt-1"
                    style={{ color: config.colors.accent }}
                  >
                    {cert.year}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};