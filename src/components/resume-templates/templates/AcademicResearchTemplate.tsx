import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { newTemplateConfigs } from '../configs/newTemplateConfigs';

interface AcademicResearchTemplateProps {
  resumeData: StructuredResumeData;
}

export const AcademicResearchTemplate: React.FC<AcademicResearchTemplateProps> = ({
  resumeData
}) => {
  const config = newTemplateConfigs['academic-research'];

  return (
    <div 
      className="w-full max-w-[8.5in] mx-auto bg-white p-12 text-sm leading-normal"
      style={{
        fontFamily: config.fonts.body,
        color: config.colors.text,
        minHeight: '11in'
      }}
    >
      {/* Header - Traditional Academic Style */}
      <header className="text-center mb-10 pb-6 border-b border-gray-300">
        <h1 
          className="text-2xl font-bold mb-3"
          style={{ 
            fontFamily: config.fonts.heading,
            color: config.colors.primary
          }}
        >
          {resumeData.name}
        </h1>
        
        <div 
          className="text-sm mb-2"
          style={{ color: config.colors.textSecondary }}
        >
          {[resumeData.phone, resumeData.email, resumeData.location].filter(Boolean).join(' • ')}
        </div>
        
        {resumeData.experience.length > 0 && (
          <h2 
            className="text-base font-medium italic"
            style={{ color: config.colors.secondary }}
          >
            {resumeData.experience[0].title}
          </h2>
        )}
      </header>

      {/* Research Interests / Summary */}
      {resumeData.summary && (
        <section className="mb-8">
          <h2 
            className="text-base font-bold mb-3 text-center"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary
            }}
          >
            RESEARCH INTERESTS
          </h2>
          <p 
            className="text-justify leading-relaxed"
            style={{ color: config.colors.text }}
          >
            {resumeData.summary}
          </p>
        </section>
      )}

      {/* Education - Prominent for Academic CVs */}
      {resumeData.education.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-base font-bold mb-4 text-center border-b pb-2"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary,
              borderColor: config.colors.border
            }}
          >
            EDUCATION
          </h2>
          
          <div className="space-y-4">
            {resumeData.education.map((edu, index) => (
              <div key={index} className="flex justify-between">
                <div className="flex-1">
                  <h3 
                    className="font-bold"
                    style={{ color: config.colors.primary }}
                  >
                    {edu.degree}
                  </h3>
                  <p 
                    className="italic"
                    style={{ color: config.colors.secondary }}
                  >
                    {edu.school}
                  </p>
                </div>
                <div 
                  className="text-right font-medium"
                  style={{ color: config.colors.textSecondary }}
                >
                  {edu.year}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Academic Experience / Positions */}
      {resumeData.experience.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-base font-bold mb-4 text-center border-b pb-2"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary,
              borderColor: config.colors.border
            }}
          >
            ACADEMIC APPOINTMENTS
          </h2>
          
          <div className="space-y-5">
            {resumeData.experience.map((exp, index) => (
              <div key={index} className="job-entry">
                <div className="job-header flex justify-between">
                  <div>
                    <h3 
                      className="font-bold"
                      style={{ color: config.colors.primary }}
                    >
                      {exp.title}
                    </h3>
                    <h4 
                      className="italic"
                      style={{ color: config.colors.secondary }}
                    >
                      {exp.company}
                    </h4>
                  </div>
                  <div 
                    className="job-meta text-right font-medium"
                    style={{ color: config.colors.textSecondary }}
                  >
                    {exp.duration}
                  </div>
                </div>
                
                <ul className="space-y-1 list-disc list-inside ml-4">
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <li 
                      key={bulletIndex}
                      className="bullet-point"
                      style={{ color: config.colors.text }}
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Research Skills & Expertise */}
      {resumeData.skills.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-base font-bold mb-4 text-center border-b pb-2"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary,
              borderColor: config.colors.border
            }}
          >
            RESEARCH SKILLS & EXPERTISE
          </h2>
          
          <div className="space-y-4">
            {resumeData.skills.map((skillGroup, groupIndex) => (
              <div key={groupIndex}>
                <h3 
                  className="font-bold mb-2"
                  style={{ color: config.colors.secondary }}
                >
                  {skillGroup.category}:
                </h3>
                <p 
                  className="ml-4"
                  style={{ color: config.colors.text }}
                >
                  {skillGroup.items.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Publications Section (Placeholder) */}
      <section className="mb-8">
        <h2 
          className="text-base font-bold mb-4 text-center border-b pb-2"
          style={{ 
            fontFamily: config.fonts.heading,
            color: config.colors.primary,
            borderColor: config.colors.border
          }}
        >
          PUBLICATIONS
        </h2>
        <p 
          className="italic text-center"
          style={{ color: config.colors.textSecondary }}
        >
          Publications section would be populated from structured academic data
        </p>
      </section>

      {/* Conference Presentations (Placeholder) */}
      <section className="mb-8">
        <h2 
          className="text-base font-bold mb-4 text-center border-b pb-2"
          style={{ 
            fontFamily: config.fonts.heading,
            color: config.colors.primary,
            borderColor: config.colors.border
          }}
        >
          CONFERENCE PRESENTATIONS
        </h2>
        <p 
          className="italic text-center"
          style={{ color: config.colors.textSecondary }}
        >
          Conference presentations would be populated from structured academic data
        </p>
      </section>

      {/* Certifications & Professional Development */}
      {resumeData.certifications && resumeData.certifications.length > 0 && (
        <section className="mb-8">
          <h2 
            className="text-base font-bold mb-4 text-center border-b pb-2"
            style={{ 
              fontFamily: config.fonts.heading,
              color: config.colors.primary,
              borderColor: config.colors.border
            }}
          >
            PROFESSIONAL DEVELOPMENT
          </h2>
          
          <div className="space-y-3">
            {resumeData.certifications.map((cert, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <h3 
                    className="font-bold"
                    style={{ color: config.colors.primary }}
                  >
                    {cert.name}
                  </h3>
                  <p 
                    className="italic"
                    style={{ color: config.colors.secondary }}
                  >
                    {cert.issuer}
                  </p>
                </div>
                <div 
                  className="text-right font-medium"
                  style={{ color: config.colors.textSecondary }}
                >
                  {cert.year}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer for multi-page support */}
      <footer className="mt-8 pt-4 border-t border-gray-200 text-center">
        <p 
          className="text-xs"
          style={{ color: config.colors.textSecondary }}
        >
          Curriculum Vitae - {resumeData.name}
        </p>
      </footer>
    </div>
  );
};