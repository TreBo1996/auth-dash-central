
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
      className="bg-white font-helvetica text-black leading-normal max-w-none mx-auto"
      style={{ 
        width: '8.5in',
        minHeight: '11in',
        padding: '1in',
        fontSize: '10px',
        lineHeight: '14px',
        fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif'
      }}
    >
      {/* Header */}
      <div className="text-center mb-3">
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

      {/* Professional Summary - 10pt Regular, 14pt leading, no heading */}
      {parsedData.summary && (
        <div 
          className="mb-3"
          style={{ 
            marginTop: '12px',
            fontSize: '10px',
            lineHeight: '14px',
            maxWidth: '6.25in',
            margin: '12px auto 12px auto',
            textAlign: 'justify'
          }}
        >
          {parsedData.summary}
        </div>
      )}

      {/* Skills Section */}
      {parsedData.skills.length > 0 && (
        <div className="mb-4">
          {/* Section Heading */}
          <div className="mb-1">
            <h2 
              className="font-bold uppercase"
              style={{ 
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginTop: '12px',
                marginBottom: '4px'
              }}
            >
              SKILLS
            </h2>
            <div 
              className="w-full bg-black"
              style={{ height: '0.5px' }}
            ></div>
          </div>
          
          {/* Two-column bullet list */}
          <div className="grid grid-cols-2 gap-4" style={{ marginTop: '4px' }}>
            <div className="space-y-3">
              {skillColumns.left.map((skill, index) => (
                <div 
                  key={index}
                  className="flex items-start"
                  style={{ 
                    fontSize: '9px',
                    paddingLeft: '0.25in'
                  }}
                >
                  <span className="mr-2" style={{ marginLeft: '-0.25in' }}>▪</span>
                  <span>{skill}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {skillColumns.right.map((skill, index) => (
                <div 
                  key={index}
                  className="flex items-start"
                  style={{ 
                    fontSize: '9px',
                    paddingLeft: '0.25in'
                  }}
                >
                  <span className="mr-2" style={{ marginLeft: '-0.25in' }}>▪</span>
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Experience Section */}
      {parsedData.experience.length > 0 && (
        <div className="mb-4">
          {/* Section Heading */}
          <div className="mb-1">
            <h2 
              className="font-bold uppercase"
              style={{ 
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginTop: '12px',
                marginBottom: '4px'
              }}
            >
              EXPERIENCE
            </h2>
            <div 
              className="w-full bg-black"
              style={{ height: '0.5px' }}
            ></div>
          </div>
          
          <div className="space-y-2" style={{ marginTop: '4px' }}>
            {parsedData.experience.map((exp, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
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
                  <ul className="space-y-1" style={{ paddingLeft: '0.25in' }}>
                    {exp.bullets.map((bullet, bulletIndex) => (
                      <li 
                        key={bulletIndex}
                        className="flex items-start"
                        style={{ 
                          fontSize: '9px',
                          marginBottom: '4px'
                        }}
                      >
                        <span className="mr-2" style={{ marginLeft: '-0.25in' }}>•</span>
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
        <div className="mb-4">
          {/* Section Heading */}
          <div className="mb-1">
            <h2 
              className="font-bold uppercase"
              style={{ 
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginTop: '12px',
                marginBottom: '4px'
              }}
            >
              EDUCATION
            </h2>
            <div 
              className="w-full bg-black"
              style={{ height: '0.5px' }}
            ></div>
          </div>
          
          <div className="space-y-2" style={{ marginTop: '4px' }}>
            {parsedData.education.map((edu, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
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
        <div className="mb-4">
          {/* Section Heading */}
          <div className="mb-1">
            <h2 
              className="font-bold uppercase"
              style={{ 
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginTop: '12px',
                marginBottom: '4px'
              }}
            >
              CERTIFICATIONS
            </h2>
            <div 
              className="w-full bg-black"
              style={{ height: '0.5px' }}
            ></div>
          </div>
          
          <div className="space-y-2" style={{ marginTop: '4px' }}>
            {parsedData.certifications.map((cert, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
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
