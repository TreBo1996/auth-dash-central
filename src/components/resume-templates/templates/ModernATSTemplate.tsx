import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { newTemplateConfigs, ColorScheme } from '../configs/newTemplateConfigs';

interface ModernATSTemplateProps {
  resumeData: StructuredResumeData;
  colorScheme?: ColorScheme;
}

export const ModernATSTemplate: React.FC<ModernATSTemplateProps> = ({
  resumeData,
  colorScheme
}) => {
  const config = newTemplateConfigs['modern-ats'];
  const colors = colorScheme?.colors || config.colors;

  return (
    <div 
      className="w-full max-w-[8.5in] mx-auto bg-white p-12 text-sm leading-normal"
      style={{
        fontFamily: config.fonts.body,
        color: colors.text,
        minHeight: '11in'
      }}
    >
      {/* Header - Modern Contact Bar */}
      <header className="mb-8">
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
            style={{ color: config.colors.secondary }}
          >
            {resumeData.experience[0].title}
          </h2>
        )}
        
        <div 
          className="flex flex-wrap gap-4 text-sm pb-4 border-b-2"
          style={{ 
            color: config.colors.textSecondary,
            borderColor: config.colors.accent
          }}
        >
          {resumeData.phone && (
            <div className="flex items-center">
              <span className="font-medium">Phone:</span>
              <span className="ml-1">{resumeData.phone}</span>
            </div>
          )}
          {resumeData.email && (
            <div className="flex items-center">
              <span className="font-medium">Email:</span>
              <span className="ml-1">{resumeData.email}</span>
            </div>
          )}
          {resumeData.location && (
            <div className="flex items-center">
              <span className="font-medium">Location:</span>
              <span className="ml-1">{resumeData.location}</span>
            </div>
          )}
        </div>
      </header>

      {/* Professional Summary */}
      {resumeData.summary && (
        <section className="mb-8">
          <h2 
            className="text-lg font-bold mb-4 pb-2 border-b"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary,
              borderColor: config.colors.border
            }}
          >
            PROFESSIONAL SUMMARY
          </h2>
          <p 
            className="leading-relaxed"
            style={{ color: config.colors.text }}
          >
            {resumeData.summary}
          </p>
        </section>
      )}

      {/* Core Skills */}
      {resumeData.skills.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-lg font-bold mb-4 pb-2 border-b"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary,
              borderColor: config.colors.border
            }}
          >
            CORE SKILLS
          </h2>
          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
            {resumeData.skills.flatMap(group => group.items).map((skill, index) => (
              <div 
                key={index} 
                className="flex items-center"
                style={{ color: config.colors.text }}
              >
                <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: config.colors.accent }}></div>
                {skill}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Professional Experience */}
      {resumeData.experience.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-lg font-bold mb-4 pb-2 border-b"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary,
              borderColor: config.colors.border
            }}
          >
            PROFESSIONAL EXPERIENCE
          </h2>
          
          <div className="space-y-6">
            {resumeData.experience.map((exp, index) => (
              <div key={index} className="job-entry">
                <div className="job-header flex justify-between items-start">
                  <div>
                    <h3 
                      className="text-base font-bold"
                      style={{ color: config.colors.primary }}
                    >
                      {exp.title}
                    </h3>
                    <h4 
                      className="text-base font-medium"
                      style={{ color: config.colors.secondary }}
                    >
                      {exp.company}
                    </h4>
                  </div>
                  <div 
                    className="job-meta text-sm font-medium px-3 py-1 rounded"
                    style={{ 
                      color: config.colors.accent,
                      backgroundColor: `${config.colors.accent}10`
                    }}
                  >
                    {exp.duration}
                  </div>
                </div>
                
                <ul className="space-y-1.5 ml-0">
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <li 
                      key={bulletIndex} 
                      className="bullet-point flex items-start"
                      style={{ color: config.colors.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: config.colors.accent }}></span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {resumeData.education.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-lg font-bold mb-4 pb-2 border-b"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary,
              borderColor: config.colors.border
            }}
          >
            EDUCATION
          </h2>
          
          <div className="space-y-3">
            {resumeData.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <h3 
                    className="font-bold"
                    style={{ color: config.colors.primary }}
                  >
                    {edu.degree}
                  </h3>
                  <p style={{ color: config.colors.secondary }}>{edu.school}</p>
                </div>
                <div 
                  className="font-medium px-3 py-1 rounded"
                  style={{ 
                    color: config.colors.accent,
                    backgroundColor: `${config.colors.accent}10`
                  }}
                >
                  {edu.year}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {resumeData.certifications && resumeData.certifications.length > 0 && (
        <section>
          <h2 
            className="text-lg font-bold mb-4 pb-2 border-b"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary,
              borderColor: config.colors.border
            }}
          >
            CERTIFICATIONS
          </h2>
          
          <div className="space-y-3">
            {resumeData.certifications.map((cert, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <h3 
                    className="font-bold"
                    style={{ color: config.colors.primary }}
                  >
                    {cert.name}
                  </h3>
                  <p style={{ color: config.colors.secondary }}>{cert.issuer}</p>
                </div>
                <div 
                  className="font-medium px-3 py-1 rounded"
                  style={{ 
                    color: config.colors.accent,
                    backgroundColor: `${config.colors.accent}10`
                  }}
                >
                  {cert.year}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};