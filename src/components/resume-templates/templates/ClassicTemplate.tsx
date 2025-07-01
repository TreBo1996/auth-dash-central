
import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { parseResumeContent } from '../utils/parseResumeContent';

interface ClassicTemplateProps {
  resumeData: string | StructuredResumeData;
}

export const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ resumeData }) => {
  // Handle both structured data and legacy text parsing
  const parsedData = typeof resumeData === 'string' ? parseResumeContent(resumeData) : resumeData;

  // Helper function to get desired role from summary or experience
  const getDesiredRole = () => {
    if (parsedData.experience.length > 0) {
      return parsedData.experience[0].title;
    }
    return 'Professional Role';
  };

  // Split skills into two columns for display
  const skillsInTwoColumns = () => {
    const allSkills: string[] = [];
    parsedData.skills.forEach(skillGroup => {
      skillGroup.items.forEach(skill => {
        allSkills.push(skill);
      });
    });
    
    const mid = Math.ceil(allSkills.length / 2);
    return {
      left: allSkills.slice(0, mid),
      right: allSkills.slice(mid)
    };
  };

  const skillColumns = skillsInTwoColumns();

  return (
    <div 
      className="bg-white font-helvetica text-black leading-normal w-full max-w-4xl mx-auto p-12"
      style={{ 
        fontSize: '10px',
        lineHeight: '14px',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        minHeight: '800px'
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        {/* Full Name - 22pt, Bold, ALL CAPS, Centered */}
        <h1 
          className="font-bold uppercase text-center mb-0"
          style={{ 
            fontSize: '22px', 
            lineHeight: '26px',
            fontWeight: 'bold',
            letterSpacing: '0px'
          }}
        >
          {parsedData.name}
        </h1>
        
        {/* Desired Role - 11pt, Bold, Small-Caps, Centered, 2pt letter-spacing */}
        <div 
          className="font-bold uppercase text-center"
          style={{ 
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            marginTop: '2px',
            fontVariant: 'small-caps'
          }}
        >
          {getDesiredRole()}
        </div>
        
        {/* Thin horizontal rule - 0.75pt black, full width, 6pt below role */}
        <div 
          className="w-full bg-black mx-auto"
          style={{ 
            height: '0.75px',
            marginTop: '6px',
            marginBottom: '6px'
          }}
        ></div>
        
        {/* Contact Row - single line, centered, 9pt Regular */}
        <div 
          className="text-center"
          style={{ 
            fontSize: '9px',
            fontWeight: 'normal'
          }}
        >
          {[parsedData.phone, parsedData.email, parsedData.location]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>

      {/* Professional Summary - 10pt Italic, 14pt leading, centered */}
      {parsedData.summary && (
        <div 
          className="mb-6 text-center italic mx-auto"
          style={{ 
            marginTop: '12px',
            fontSize: '10px',
            lineHeight: '14px',
            maxWidth: '100%',
            margin: '12px auto 24px auto',
            textAlign: 'center'
          }}
        >
          {parsedData.summary}
        </div>
      )}

      {/* Skills Section */}
      {parsedData.skills.length > 0 && (
        <div className="mb-6">
          {/* Section Heading */}
          <div className="mb-2">
            <h2 
              className="font-bold uppercase text-center"
              style={{ 
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginTop: '12px',
                marginBottom: '4px',
                textAlign: 'center'
              }}
            >
              SKILLS
            </h2>
            <div 
              className="w-full bg-black"
              style={{ height: '0.5px' }}
            ></div>
          </div>
          
          {/* Two-column bullet list - centered container */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-8 mt-2 max-w-2xl">
              <div className="space-y-1">
                {skillColumns.left.map((skill, index) => (
                  <div 
                    key={index}
                    className="flex items-start pl-4"
                    style={{ 
                      fontSize: '9px'
                    }}
                  >
                    <span className="mr-2 -ml-4">▪</span>
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {skillColumns.right.map((skill, index) => (
                  <div 
                    key={index}
                    className="flex items-start pl-4"
                    style={{ 
                      fontSize: '9px'
                    }}
                  >
                    <span className="mr-2 -ml-4">▪</span>
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experience Section */}
      {parsedData.experience.length > 0 && (
        <div className="mb-6">
          {/* Section Heading */}
          <div className="mb-2">
            <h2 
              className="font-bold uppercase text-center"
              style={{ 
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginTop: '12px',
                marginBottom: '4px',
                textAlign: 'center'
              }}
            >
              EXPERIENCE
            </h2>
            <div 
              className="w-full bg-black"
              style={{ height: '0.5px' }}
            ></div>
          </div>
          
          <div className="space-y-4 mt-2">
            {parsedData.experience.map((exp, index) => (
              <div key={index} className="mb-4">
                {/* Job Title and Date */}
                <div className="flex justify-between items-baseline mb-0">
                  <h3 
                    className="font-bold uppercase"
                    style={{ 
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}
                  >
                    {exp.title}
                  </h3>
                  <span 
                    style={{ 
                      fontSize: '10px',
                      fontWeight: 'normal'
                    }}
                  >
                    {exp.duration.replace('-', '–')}
                  </span>
                </div>
                
                {/* Company/Location */}
                <p 
                  className="italic mb-1"
                  style={{ 
                    fontSize: '10px',
                    fontStyle: 'italic',
                    marginBottom: '2px'
                  }}
                >
                  {exp.company}
                </p>
                
                {/* Bullets */}
                {exp.bullets.length > 0 && (
                  <ul className="space-y-1 pl-4">
                    {exp.bullets.map((bullet, bulletIndex) => (
                      <li 
                        key={bulletIndex}
                        className="flex items-start"
                        style={{ 
                          fontSize: '9px',
                          marginBottom: '4px'
                        }}
                      >
                        <span className="mr-2 -ml-4">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {parsedData.education.length > 0 && (
        <div className="mb-6">
          {/* Section Heading */}
          <div className="mb-2">
            <h2 
              className="font-bold uppercase text-center"
              style={{ 
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginTop: '12px',
                marginBottom: '4px',
                textAlign: 'center'
              }}
            >
              EDUCATION
            </h2>
            <div 
              className="w-full bg-black"
              style={{ height: '0.5px' }}
            ></div>
          </div>
          
          <div className="space-y-3 mt-2">
            {parsedData.education.map((edu, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <h3 
                    className="font-bold"
                    style={{ 
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}
                  >
                    {edu.degree}
                  </h3>
                  <span 
                    style={{ 
                      fontSize: '10px',
                      fontWeight: 'normal'
                    }}
                  >
                    {edu.year}
                  </span>
                </div>
                <p 
                  style={{ 
                    fontSize: '10px',
                    fontWeight: 'normal'
                  }}
                >
                  {edu.school}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications Section */}
      {parsedData.certifications && parsedData.certifications.length > 0 && (
        <div className="mb-6">
          {/* Section Heading */}
          <div className="mb-2">
            <h2 
              className="font-bold uppercase text-center"
              style={{ 
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginTop: '12px',
                marginBottom: '4px',
                textAlign: 'center'
              }}
            >
              CERTIFICATIONS
            </h2>
            <div 
              className="w-full bg-black"
              style={{ height: '0.5px' }}
            ></div>
          </div>
          
          <div className="space-y-3 mt-2">
            {parsedData.certifications.map((cert, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <h3 
                    className="font-bold"
                    style={{ 
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}
                  >
                    {cert.name}
                  </h3>
                  <span 
                    style={{ 
                      fontSize: '10px',
                      fontWeight: 'normal'
                    }}
                  >
                    {cert.year}
                  </span>
                </div>
                <p 
                  style={{ 
                    fontSize: '10px',
                    fontWeight: 'normal'
                  }}
                >
                  {cert.issuer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
