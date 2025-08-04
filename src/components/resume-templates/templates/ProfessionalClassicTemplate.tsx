import React from 'react';
import { StructuredResumeData } from '../utils/fetchStructuredResumeData';
import { parseResumeContent } from '../utils/parseResumeContent';

interface ProfessionalClassicTemplateProps {
  resumeData: string | StructuredResumeData;
}

export const ProfessionalClassicTemplate: React.FC<ProfessionalClassicTemplateProps> = ({ resumeData }) => {
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
      className="bg-white text-black leading-normal w-full max-w-4xl mx-auto"
      style={{ 
        fontSize: '11pt',
        lineHeight: '1.4',
        fontFamily: 'Helvetica, Arial, sans-serif',
        minHeight: 'auto',
        width: '8.5in',
        padding: '0.5in',
        margin: '0 auto'
      }}
    >
      {/* Header Section */}
      <div className="text-center mb-6">
        {/* Full Name - 22pt, Bold, ALL CAPS, Centered */}
        <h1 
          style={{ 
            fontSize: '22pt', 
            lineHeight: '1.2',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            textAlign: 'center',
            margin: '0 0 6pt 0'
          }}
        >
          {parsedData.name}
        </h1>
        
        {/* Desired Role - 11pt, Bold, Small-Caps, Centered, Letter-spaced */}
        <div 
          style={{ 
            fontSize: '11pt',
            fontWeight: 'bold',
            letterSpacing: '2pt',
            textTransform: 'uppercase',
            fontVariant: 'small-caps',
            textAlign: 'center',
            margin: '0 0 6pt 0'
          }}
        >
          {getDesiredRole()}
        </div>
        
        {/* Horizontal line - 0.75pt black, full width */}
        <div 
          style={{ 
            height: '0.75pt',
            backgroundColor: '#000000',
            width: '100%',
            margin: '6pt 0'
          }}
        />
        
        {/* Contact Row - single line, centered, 11pt Regular */}
        <div 
          style={{ 
            fontSize: '11pt',
            fontWeight: 'normal',
            textAlign: 'center',
            margin: '0 0 18pt 0'
          }}
        >
          {[parsedData.phone, parsedData.email, parsedData.location]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>

      {/* Professional Summary - 11pt, Centered, Italic */}
      {parsedData.summary && (
        <div 
          style={{ 
            fontSize: '11pt',
            lineHeight: '1.4',
            fontStyle: 'italic',
            textAlign: 'center',
            margin: '0 0 18pt 0',
            maxWidth: '100%'
          }}
        >
          {parsedData.summary}
        </div>
      )}

      {/* Skills Section */}
      {parsedData.skills.length > 0 && (
        <div style={{ marginBottom: '12pt' }}>
          {/* Section Heading - 13pt Bold, Centered, Letter-spaced */}
          <h2 
            style={{ 
              fontSize: '13pt',
              fontWeight: 'bold',
              letterSpacing: '1pt',
              textTransform: 'uppercase',
              textAlign: 'center',
              margin: '12pt 0 6pt 0'
            }}
          >
            SKILLS
          </h2>
          <div 
            style={{ 
              height: '0.5pt',
              backgroundColor: '#000000',
              width: '100%',
              margin: '0 0 4pt 0'
            }}
          />
          
          {/* Two-column bullet list */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '24pt',
              width: '100%'
            }}
          >
            <div>
              {skillColumns.left.map((skill, index) => (
                <div 
                  key={index}
                  style={{ 
                    fontSize: '11pt',
                    marginBottom: '4pt',
                    paddingLeft: '12pt',
                    textIndent: '-12pt'
                  }}
                >
                  <span>• {skill}</span>
                </div>
              ))}
            </div>
            <div>
              {skillColumns.right.map((skill, index) => (
                <div 
                  key={index}
                  style={{ 
                    fontSize: '11pt',
                    marginBottom: '4pt',
                    paddingLeft: '12pt',
                    textIndent: '-12pt'
                  }}
                >
                  <span>• {skill}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Experience Section */}
      {parsedData.experience.length > 0 && (
        <div style={{ marginBottom: '12pt' }}>
          {/* Section Heading */}
          <h2 
            style={{ 
              fontSize: '13pt',
              fontWeight: 'bold',
              letterSpacing: '1pt',
              textTransform: 'uppercase',
              textAlign: 'center',
              margin: '12pt 0 6pt 0'
            }}
          >
            EXPERIENCE
          </h2>
          <div 
            style={{ 
              height: '0.5pt',
              backgroundColor: '#000000',
              width: '100%',
              margin: '0 0 4pt 0'
            }}
          />
          
          <div>
            {parsedData.experience.map((exp, index) => (
              <div key={index} style={{ marginBottom: index < parsedData.experience.length - 1 ? '8pt' : '0' }}>
                {/* Job Title and Date */}
                <div 
                  style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '2pt'
                  }}
                >
                  <h3 
                    style={{ 
                      fontSize: '12pt',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      margin: '0'
                    }}
                  >
                    {exp.title}
                  </h3>
                  <span 
                    style={{ 
                      fontSize: '12pt',
                      fontWeight: 'normal'
                    }}
                  >
                    {exp.duration.replace('-', '–')}
                  </span>
                </div>
                
                {/* Company */}
                <div 
                  style={{ 
                    fontSize: '12pt',
                    fontStyle: 'italic',
                    marginBottom: '4pt'
                  }}
                >
                  {exp.company}
                </div>
                
                {/* Bullets */}
                {exp.bullets.length > 0 && (
                  <div>
                    {exp.bullets.map((bullet, bulletIndex) => (
                      <div 
                        key={bulletIndex}
                        style={{ 
                          fontSize: '11pt',
                          marginBottom: '4pt',
                          paddingLeft: '12pt',
                          textIndent: '-12pt',
                          lineHeight: '1.4'
                        }}
                      >
                        <span>• {bullet}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {parsedData.education.length > 0 && (
        <div style={{ marginBottom: '12pt' }}>
          {/* Section Heading */}
          <h2 
            style={{ 
              fontSize: '13pt',
              fontWeight: 'bold',
              letterSpacing: '1pt',
              textTransform: 'uppercase',
              textAlign: 'center',
              margin: '12pt 0 6pt 0'
            }}
          >
            EDUCATION
          </h2>
          <div 
            style={{ 
              height: '0.5pt',
              backgroundColor: '#000000',
              width: '100%',
              margin: '0 0 4pt 0'
            }}
          />
          
          <div>
            {parsedData.education.map((edu, index) => (
              <div key={index} style={{ marginBottom: '8pt' }}>
                <div 
                  style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '2pt'
                  }}
                >
                  <h3 
                    style={{ 
                      fontSize: '12pt',
                      fontWeight: 'bold',
                      margin: '0'
                    }}
                  >
                    {edu.degree}
                  </h3>
                  <span 
                    style={{ 
                      fontSize: '12pt',
                      fontWeight: 'normal'
                    }}
                  >
                    {edu.year}
                  </span>
                </div>
                <div 
                  style={{ 
                    fontSize: '12pt',
                    fontWeight: 'normal'
                  }}
                >
                  {edu.school}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications Section */}
      {parsedData.certifications && parsedData.certifications.length > 0 && (
        <div style={{ marginBottom: '12pt' }}>
          {/* Section Heading */}
          <h2 
            style={{ 
              fontSize: '13pt',
              fontWeight: 'bold',
              letterSpacing: '1pt',
              textTransform: 'uppercase',
              textAlign: 'center',
              margin: '12pt 0 6pt 0'
            }}
          >
            CERTIFICATIONS
          </h2>
          <div 
            style={{ 
              height: '0.5pt',
              backgroundColor: '#000000',
              width: '100%',
              margin: '0 0 4pt 0'
            }}
          />
          
          <div>
            {parsedData.certifications.map((cert, index) => (
              <div key={index} style={{ marginBottom: '8pt' }}>
                <div 
                  style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '2pt'
                  }}
                >
                  <h3 
                    style={{ 
                      fontSize: '12pt',
                      fontWeight: 'bold',
                      margin: '0'
                    }}
                  >
                    {cert.name}
                  </h3>
                  <span 
                    style={{ 
                      fontSize: '12pt',
                      fontWeight: 'normal'
                    }}
                  >
                    {cert.year}
                  </span>
                </div>
                <div 
                  style={{ 
                    fontSize: '12pt',
                    fontWeight: 'normal'
                  }}
                >
                  {cert.issuer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};