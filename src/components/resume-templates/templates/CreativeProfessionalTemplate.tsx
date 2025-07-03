import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { newTemplateConfigs } from '../configs/newTemplateConfigs';

interface CreativeProfessionalTemplateProps {
  resumeData: StructuredResumeData;
}

export const CreativeProfessionalTemplate: React.FC<CreativeProfessionalTemplateProps> = ({
  resumeData
}) => {
  const config = newTemplateConfigs['creative-professional'];

  return (
    <div 
      className="w-full max-w-[8.5in] mx-auto bg-white p-12 text-sm leading-normal"
      style={{
        fontFamily: config.fonts.body,
        color: config.colors.text,
        minHeight: '11in'
      }}
    >
      {/* Header - Creative Modern Style */}
      <header className="mb-8 relative">
        <div 
          className="absolute left-0 top-0 w-2 h-full rounded"
          style={{ backgroundColor: config.colors.accent }}
        ></div>
        
        <div className="ml-6">
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
          
          <div 
            className="flex flex-wrap gap-4 text-sm"
            style={{ color: config.colors.textSecondary }}
          >
            {resumeData.phone && <span>{resumeData.phone}</span>}
            {resumeData.email && <span>{resumeData.email}</span>}
            {resumeData.location && <span>{resumeData.location}</span>}
          </div>
        </div>
      </header>

      {/* Professional Profile */}
      {resumeData.summary && (
        <section className="mb-8">
          <div className="flex items-center mb-4">
            <div 
              className="w-8 h-0.5 mr-4"
              style={{ backgroundColor: config.colors.accent }}
            ></div>
            <h2 
              className="text-lg font-bold"
              style={{ 
                fontFamily: config.fonts.heading,
                color: config.colors.primary
              }}
            >
              PROFESSIONAL PROFILE
            </h2>
          </div>
          <p 
            className="leading-relaxed ml-12"
            style={{ color: config.colors.text }}
          >
            {resumeData.summary}
          </p>
        </section>
      )}

      {/* Skills & Expertise */}
      {resumeData.skills.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center mb-4">
            <div 
              className="w-8 h-0.5 mr-4"
              style={{ backgroundColor: config.colors.accent }}
            ></div>
            <h2 
              className="text-lg font-bold"
              style={{ 
                fontFamily: config.fonts.heading,
                color: config.colors.primary
              }}
            >
              SKILLS & EXPERTISE
            </h2>
          </div>
          <div className="ml-12 space-y-4">
            {resumeData.skills.map((skillGroup, groupIndex) => (
              <div key={groupIndex}>
                <h3 
                  className="font-semibold mb-2"
                  style={{ color: config.colors.secondary }}
                >
                  {skillGroup.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${config.colors.accent}15`,
                        color: config.colors.accent,
                        border: `1px solid ${config.colors.accent}30`
                      }}
                    >
                      {skill}
                    </span>
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
          <div className="flex items-center mb-4">
            <div 
              className="w-8 h-0.5 mr-4"
              style={{ backgroundColor: config.colors.accent }}
            ></div>
            <h2 
              className="text-lg font-bold"
              style={{ 
                fontFamily: config.fonts.heading,
                color: config.colors.primary
              }}
            >
              PROFESSIONAL EXPERIENCE
            </h2>
          </div>
          
          <div className="ml-12 space-y-6">
            {resumeData.experience.map((exp, index) => (
              <div key={index} className="job-entry avoid-page-break relative">
                <div 
                  className="absolute -left-12 top-2 w-3 h-3 rounded-full border-2 bg-white"
                  style={{ borderColor: config.colors.accent }}
                ></div>
                {index < resumeData.experience.length - 1 && (
                  <div 
                    className="absolute -left-10.5 top-5 w-0.5 h-full"
                    style={{ backgroundColor: config.colors.border }}
                  ></div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 
                      className="text-base font-bold"
                      style={{ color: config.colors.primary }}
                    >
                      {exp.title}
                    </h3>
                    <h4 
                      className="text-base font-medium"
                      style={{ color: config.colors.accent }}
                    >
                      {exp.company}
                    </h4>
                  </div>
                  <div 
                    className="text-sm font-medium px-3 py-1 rounded-full"
                    style={{ 
                      color: config.colors.secondary,
                      backgroundColor: `${config.colors.secondary}10`
                    }}
                  >
                    {exp.duration}
                  </div>
                </div>
                
                <ul className="space-y-1.5">
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <li 
                      key={bulletIndex} 
                      className="flex items-start"
                      style={{ color: config.colors.text }}
                    >
                      <span 
                        className="w-1.5 h-1.5 rounded-full mt-2 mr-3 flex-shrink-0"
                        style={{ backgroundColor: config.colors.accent }}
                      ></span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education & Certifications - Side by Side */}
      <div className="grid grid-cols-2 gap-8">
        {/* Education */}
        {resumeData.education.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <div 
                className="w-6 h-0.5 mr-3"
                style={{ backgroundColor: config.colors.accent }}
              ></div>
              <h2 
                className="text-base font-bold"
                style={{ 
                  fontFamily: config.fonts.heading,
                  color: config.colors.primary
                }}
              >
                EDUCATION
              </h2>
            </div>
            
            <div className="ml-9 space-y-3">
              {resumeData.education.map((edu, index) => (
                <div key={index}>
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
                    className="text-xs"
                    style={{ color: config.colors.textSecondary }}
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
            <div className="flex items-center mb-4">
              <div 
                className="w-6 h-0.5 mr-3"
                style={{ backgroundColor: config.colors.accent }}
              ></div>
              <h2 
                className="text-base font-bold"
                style={{ 
                  fontFamily: config.fonts.heading,
                  color: config.colors.primary
                }}
              >
                CERTIFICATIONS
              </h2>
            </div>
            
            <div className="ml-9 space-y-3">
              {resumeData.certifications.map((cert, index) => (
                <div key={index}>
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
                    className="text-xs"
                    style={{ color: config.colors.textSecondary }}
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