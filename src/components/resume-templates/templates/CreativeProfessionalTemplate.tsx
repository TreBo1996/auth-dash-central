import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { newTemplateConfigs, ColorScheme } from '../configs/newTemplateConfigs';

interface CreativeProfessionalTemplateProps {
  resumeData: StructuredResumeData;
  colorScheme?: ColorScheme;
}

export const CreativeProfessionalTemplate: React.FC<CreativeProfessionalTemplateProps> = ({
  resumeData,
  colorScheme
}) => {
  const config = newTemplateConfigs['creative-professional'];
  const colors = colorScheme?.colors || config.colors;
  return <div className="w-full max-w-[8.5in] mx-auto bg-white p-12 text-sm leading-normal" style={{
    fontFamily: config.fonts.body,
    color: colors.text,
    minHeight: '11in'
  }}>
      {/* Header - Creative Modern Style */}
      <header className="mb-8 relative">
        <div className="absolute left-0 top-0 w-2 h-full rounded" style={{
        backgroundColor: colors.accent
      }}></div>
        
        <div className="ml-6">
          <h1 className="text-3xl font-bold mb-2" style={{
          fontFamily: config.fonts.heading,
          color: colors.primary
        }}>
            {resumeData.name}
          </h1>
          
          {resumeData.experience.length > 0 && <h2 className="text-lg mb-4 font-medium" style={{
          color: colors.accent
        }}>
              {resumeData.experience[0].title}
            </h2>}
          
          <div className="flex flex-wrap gap-4 text-sm" style={{
          color: colors.textSecondary
        }}>
            {resumeData.phone && <span>{resumeData.phone}</span>}
            {resumeData.email && <span>{resumeData.email}</span>}
            {resumeData.location && <span>{resumeData.location}</span>}
          </div>
        </div>
      </header>

      {/* Professional Profile */}
      {resumeData.summary && <section className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-8 h-0.5 mr-4" style={{
          backgroundColor: colors.accent
        }}></div>
            <h2 className="text-lg font-bold" style={{
          fontFamily: config.fonts.heading,
          color: colors.primary
        }}>
              PROFESSIONAL PROFILE
            </h2>
          </div>
          <p className="leading-relaxed ml-12" style={{
        color: colors.text
      }}>
            {resumeData.summary}
          </p>
        </section>}

      {/* Skills & Expertise */}
      {resumeData.skills.length > 0 && <section className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-8 h-0.5 mr-4" style={{
          backgroundColor: colors.accent
        }}></div>
            <h2 className="text-lg font-bold" style={{
          fontFamily: config.fonts.heading,
          color: colors.primary
        }}>
              SKILLS & EXPERTISE
            </h2>
          </div>
          <div className="ml-12 space-y-4">
            {resumeData.skills.map((skillGroup, groupIndex) => <div key={groupIndex}>
                <h3 className="font-semibold mb-2" style={{
            color: colors.secondary
          }}>
                  {skillGroup.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((skill, index) => <span key={index} className="px-3 py-1 rounded-full text-xs font-medium" style={{
              backgroundColor: `${colors.accent}15`,
              color: colors.accent,
              border: `1px solid ${colors.accent}30`
            }}>
                      {skill}
                    </span>)}
                </div>
              </div>)}
          </div>
        </section>}

      {/* Professional Experience */}
      {resumeData.experience.length > 0 && <section className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-8 h-0.5 mr-4" style={{
          backgroundColor: colors.accent
        }}></div>
            <h2 className="text-lg font-bold" style={{
          fontFamily: config.fonts.heading,
          color: colors.primary
        }}>
              PROFESSIONAL EXPERIENCE
            </h2>
          </div>
          
          <div className="ml-12 space-y-6">
            {resumeData.experience.map((exp, index) => <div key={index} className="job-entry relative">
                <div className="absolute -left-12 top-2 w-3 h-3 rounded-full border-2 bg-white" style={{
            borderColor: colors.accent
          }}></div>
                {index < resumeData.experience.length - 1 && <div className="absolute -left-10.5 top-5 w-0.5 h-full bg-transparent"></div>}
                
                <div className="job-header flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold" style={{
                color: colors.primary
              }}>
                      {exp.title}
                    </h3>
                    <h4 className="text-base font-medium" style={{
                color: colors.accent
              }}>
                      {exp.company}
                    </h4>
                  </div>
                  <div className="job-meta text-sm font-medium px-3 py-1 rounded-full" style={{
              color: colors.secondary,
              backgroundColor: `${colors.secondary}10`
            }}>
                    {exp.duration}
                  </div>
                </div>
                
                <ul className="space-y-1.5">
                  {exp.bullets.map((bullet, bulletIndex) => <li key={bulletIndex} className="bullet-point flex items-start" style={{
              color: colors.text
            }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-2 mr-3 flex-shrink-0" style={{
                backgroundColor: colors.accent
              }}></span>
                      <span>{bullet}</span>
                    </li>)}
                </ul>
              </div>)}
          </div>
        </section>}

      {/* Education & Certifications - Side by Side */}
      <div className="grid grid-cols-2 gap-8">
        {/* Education */}
        {resumeData.education.length > 0 && <section className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-6 h-0.5 mr-3" style={{
            backgroundColor: colors.accent
          }}></div>
              <h2 className="text-base font-bold" style={{
            fontFamily: config.fonts.heading,
            color: colors.primary
          }}>
                EDUCATION
              </h2>
            </div>
            
            <div className="ml-9 space-y-3">
              {resumeData.education.map((edu, index) => <div key={index}>
                  <h3 className="font-bold text-sm" style={{
              color: colors.primary
            }}>
                    {edu.degree}
                  </h3>
                  <p className="text-sm" style={{
              color: colors.secondary
            }}>
                    {edu.school}
                  </p>
                  <p className="text-xs" style={{
              color: colors.textSecondary
            }}>
                    {edu.year}
                  </p>
                </div>)}
            </div>
          </section>}

        {/* Certifications */}
        {resumeData.certifications && resumeData.certifications.length > 0 && <section>
            <div className="flex items-center mb-4">
              <div className="w-6 h-0.5 mr-3" style={{
            backgroundColor: colors.accent
          }}></div>
              <h2 className="text-base font-bold" style={{
            fontFamily: config.fonts.heading,
            color: colors.primary
          }}>
                CERTIFICATIONS
              </h2>
            </div>
            
            <div className="ml-9 space-y-3">
              {resumeData.certifications.map((cert, index) => <div key={index}>
                  <h3 className="font-bold text-sm" style={{
              color: colors.primary
            }}>
                    {cert.name}
                  </h3>
                  <p className="text-sm" style={{
              color: colors.secondary
            }}>
                    {cert.issuer}
                  </p>
                  <p className="text-xs" style={{
              color: colors.textSecondary
            }}>
                    {cert.year}
                  </p>
                </div>)}
            </div>
          </section>}
      </div>
    </div>;
};