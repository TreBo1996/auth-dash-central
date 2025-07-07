import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { newTemplateConfigs, ColorScheme } from '../configs/newTemplateConfigs';
interface MinimalistExecutiveTemplateProps {
  resumeData: StructuredResumeData;
  colorScheme?: ColorScheme;
}
export const MinimalistExecutiveTemplate: React.FC<MinimalistExecutiveTemplateProps> = ({
  resumeData,
  colorScheme
}) => {
  const config = newTemplateConfigs['minimalist-executive'];
  const colors = colorScheme?.colors || config.colors;
  return <div className="w-full max-w-[8.5in] mx-auto bg-white p-12 font-serif text-sm leading-relaxed" style={{
    fontFamily: config.fonts.body,
    color: colors.text,
    minHeight: '11in'
  }}>
      {/* Header - Centered Executive Style */}
      <header className="text-center mb-10 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold mb-3 tracking-wide" style={{
        fontFamily: config.fonts.heading,
        color: colors.primary
      }}>
          {resumeData.name.toUpperCase()}
        </h1>
        
        {resumeData.experience.length > 0 && <h2 className="text-lg mb-4 font-medium" style={{
        color: colors.secondary
      }}>
            {resumeData.experience[0].title}
          </h2>}
        
        <div className="text-sm flex justify-center items-center space-x-6" style={{
        color: colors.textSecondary
      }}>
          {resumeData.phone && <span>{resumeData.phone}</span>}
          {resumeData.email && <span>{resumeData.email}</span>}
          {resumeData.location && <span>{resumeData.location}</span>}
        </div>
      </header>

      {/* Executive Summary */}
      {resumeData.summary && <section className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold tracking-wider pb-2" style={{
          fontFamily: config.fonts.heading,
          color: colors.primary,
          borderBottom: `1px solid ${colors.border}`
        }}>
              EXECUTIVE SUMMARY
            </h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-center leading-relaxed" style={{
          color: colors.text
        }}>
              {resumeData.summary}
            </p>
          </div>
        </section>}

      {/* Core Competencies */}
      {resumeData.skills.length > 0 && <section className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold tracking-wider pb-2" style={{
          fontFamily: config.fonts.heading,
          color: colors.primary,
          borderBottom: `1px solid ${colors.border}`
        }}>
              CORE COMPETENCIES
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-w-4xl mx-auto">
            {resumeData.skills.flatMap(group => group.items).map((skill, index) => <div key={index} style={{
          color: colors.text
        }} className="flex items-center px-0 mx-[30px]">
                 <span className="w-2 h-2 rounded-full mr-3 mt-0.5" style={{
            backgroundColor: colors.accent
          }}></span>
                {skill}
              </div>)}
          </div>
        </section>}

      {/* Professional Experience */}
      {resumeData.experience.length > 0 && <section className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold tracking-wider pb-2" style={{
          fontFamily: config.fonts.heading,
          color: colors.primary,
          borderBottom: `1px solid ${colors.border}`
        }}>
              PROFESSIONAL EXPERIENCE
            </h2>
          </div>
          
          <div className="space-y-6">
            {resumeData.experience.map((exp, index) => <div key={index} className="job-entry">
                <div className="job-header flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold" style={{
                color: colors.primary
              }}>
                      {exp.title.toUpperCase()}
                    </h3>
                    <h4 className="text-base font-medium" style={{
                color: colors.secondary
              }}>
                      {exp.company}
                    </h4>
                  </div>
                  <div className="job-meta text-sm font-medium" style={{
              color: colors.textSecondary
            }}>
                    {exp.duration}
                  </div>
                </div>
                
                <ul className="space-y-1 ml-4">
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

      {/* Education */}
      {resumeData.education.length > 0 && <section className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold tracking-wider pb-2" style={{
          fontFamily: config.fonts.heading,
          color: colors.primary,
          borderBottom: `1px solid ${colors.border}`
        }}>
              EDUCATION
            </h2>
          </div>
          
          <div className="space-y-3 max-w-4xl mx-auto">
            {resumeData.education.map((edu, index) => <div key={index} className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold" style={{
              color: colors.primary
            }}>
                    {edu.degree}
                  </h3>
                  <p style={{
              color: colors.secondary
            }}>{edu.school}</p>
                </div>
                <div className="font-medium" style={{
            color: colors.textSecondary
          }}>
                  {edu.year}
                </div>
              </div>)}
          </div>
        </section>}

      {/* Certifications */}
      {resumeData.certifications && resumeData.certifications.length > 0 && <section>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold tracking-wider pb-2" style={{
          fontFamily: config.fonts.heading,
          color: colors.primary,
          borderBottom: `1px solid ${colors.border}`
        }}>
              CERTIFICATIONS
            </h2>
          </div>
          
          <div className="space-y-3 max-w-4xl mx-auto">
            {resumeData.certifications.map((cert, index) => <div key={index} className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold" style={{
              color: colors.primary
            }}>
                    {cert.name}
                  </h3>
                  <p style={{
              color: colors.secondary
            }}>{cert.issuer}</p>
                </div>
                <div className="font-medium" style={{
            color: colors.textSecondary
          }}>
                  {cert.year}
                </div>
              </div>)}
          </div>
        </section>}
    </div>;
};