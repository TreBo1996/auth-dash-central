import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { newTemplateConfigs, ColorScheme } from '../configs/newTemplateConfigs';

interface AcademicResearchTemplateProps {
  resumeData: StructuredResumeData;
  colorScheme?: ColorScheme;
}

export const AcademicResearchTemplate: React.FC<AcademicResearchTemplateProps> = ({
  resumeData,
  colorScheme
}) => {
  const config = newTemplateConfigs['academic-research'];
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
      {/* Header - Traditional Academic Style */}
      <header className="text-center mb-10 pb-6 border-b border-gray-300">
        <h1 className="text-2xl font-bold mb-3" style={{
          fontFamily: config.fonts.heading,
          color: colors.primary
        }}>
          {resumeData.name}
        </h1>
        
        <div className="text-sm mb-2" style={{
          color: colors.textSecondary
        }}>
          {[resumeData.phone, resumeData.email, resumeData.location].filter(Boolean).join(' • ')}
        </div>
        
        {resumeData.experience.length > 0 && (
          <h2 className="text-base font-medium italic" style={{
            color: colors.secondary
          }}>
            {resumeData.experience[0].title}
          </h2>
        )}
      </header>

      {/* Research Interests / Summary */}
      {resumeData.summary && (
        <section className="mb-8">
          <p className="text-justify leading-relaxed" style={{
            color: colors.text
          }}>
            {resumeData.summary}
          </p>
        </section>
      )}

      {/* Education - Prominent for Academic CVs */}
      {resumeData.education.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold mb-4 text-center border-b pb-2" style={{
            fontFamily: config.fonts.heading,
            color: colors.primary,
            borderColor: colors.border
          }}>
            EDUCATION
          </h2>
          
          <div className="space-y-4">
            {resumeData.education.map((edu, index) => (
              <div key={index} className="flex justify-between">
                <div className="flex-1">
                  <h3 className="font-bold" style={{
                    color: colors.primary
                  }}>
                    {edu.degree}
                  </h3>
                  <p className="italic" style={{
                    color: colors.secondary
                  }}>
                    {edu.school}
                  </p>
                </div>
                <div className="text-right font-medium" style={{
                  color: colors.textSecondary
                }}>
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
          <h2 className="text-base font-bold mb-4 text-center border-b pb-2" style={{
            fontFamily: config.fonts.heading,
            color: colors.primary,
            borderColor: colors.border
          }}>
            EXPERIENCE
          </h2>
          
          <div className="space-y-5">
            {resumeData.experience.map((exp, index) => (
              <div key={index} className="job-entry">
                <div className="job-header flex justify-between">
                  <div>
                    <h3 className="font-bold" style={{
                      color: colors.primary
                    }}>
                      {exp.title}
                    </h3>
                    <h4 className="italic" style={{
                      color: colors.secondary
                    }}>
                      {exp.company}
                    </h4>
                  </div>
                  <div className="job-meta text-right font-medium" style={{
                    color: colors.textSecondary
                  }}>
                    {exp.duration}
                  </div>
                </div>
                
                <ul className="space-y-1 list-disc list-inside ml-4">
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="bullet-point" style={{
                      color: colors.text
                    }}>
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
          <h2 className="text-base font-bold mb-4 text-center border-b pb-2" style={{
            fontFamily: config.fonts.heading,
            color: colors.primary,
            borderColor: colors.border
          }}>
            SKILLS
          </h2>
          
          <div className="space-y-4">
            {resumeData.skills.map((skillGroup, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="font-bold mb-2" style={{
                  color: colors.secondary
                }}>
                  {skillGroup.category}:
                </h3>
                <p className="ml-4" style={{
                  color: colors.text
                }}>
                  {skillGroup.items.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications & Professional Development */}
      {resumeData.certifications && resumeData.certifications.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold mb-4 text-center border-b pb-2" style={{
            fontFamily: config.fonts.heading,
            color: colors.primary,
            borderColor: colors.border
          }}>
            PROFESSIONAL DEVELOPMENT
          </h2>
          
          <div className="space-y-3">
            {resumeData.certifications.map((cert, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <h3 className="font-bold" style={{
                    color: colors.primary
                  }}>
                    {cert.name}
                  </h3>
                  <p className="italic" style={{
                    color: colors.secondary
                  }}>
                    {cert.issuer}
                  </p>
                </div>
                <div className="text-right font-medium" style={{
                  color: colors.textSecondary
                }}>
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