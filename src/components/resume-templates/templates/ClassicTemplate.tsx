
import React from 'react';
import { templateConfigs } from '../templateConfigs';
import { parseResumeContent } from '../utils/parseResumeContent';

interface ClassicTemplateProps {
  resumeData: string;
}

export const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ resumeData }) => {
  const config = templateConfigs.classic;
  const parsedData = parseResumeContent(resumeData);

  return (
    <div 
      className="max-w-4xl mx-auto p-8 bg-white"
      style={{ 
        fontFamily: config.fonts.body,
        color: config.colors.text
      }}
    >
      {/* Header */}
      <div className="text-center mb-8 pb-4 border-b border-gray-300">
        <h1 
          className="text-3xl font-bold mb-2"
          style={{ 
            fontFamily: config.fonts.heading,
            color: config.colors.primary
          }}
        >
          {parsedData.name || 'Your Name'}
        </h1>
        <div className="text-base">
          {parsedData.email && <span>{parsedData.email}</span>}
          {parsedData.phone && <span> • {parsedData.phone}</span>}
          {parsedData.location && <span> • {parsedData.location}</span>}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Summary */}
        {parsedData.summary && (
          <section>
            <h2 
              className="text-xl font-bold mb-3 uppercase tracking-wide"
              style={{ color: config.colors.primary }}
            >
              Summary
            </h2>
            <p className="text-sm leading-relaxed">{parsedData.summary}</p>
          </section>
        )}

        {/* Experience */}
        {parsedData.experience.length > 0 && (
          <section>
            <h2 
              className="text-xl font-bold mb-3 uppercase tracking-wide"
              style={{ color: config.colors.primary }}
            >
              Professional Experience
            </h2>
            <div className="space-y-4">
              {parsedData.experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex justify-between items-baseline mb-2">
                    <div>
                      <h3 className="font-bold text-base">{exp.title}</h3>
                      <p className="font-semibold">{exp.company}</p>
                    </div>
                    <span className="text-sm font-medium">{exp.duration}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {parsedData.education.length > 0 && (
          <section>
            <h2 
              className="text-xl font-bold mb-3 uppercase tracking-wide"
              style={{ color: config.colors.primary }}
            >
              Education
            </h2>
            <div className="space-y-2">
              {parsedData.education.map((edu, index) => (
                <div key={index} className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p>{edu.school}</p>
                  </div>
                  <span className="text-sm">{edu.year}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {parsedData.skills.length > 0 && (
          <section>
            <h2 
              className="text-xl font-bold mb-3 uppercase tracking-wide"
              style={{ color: config.colors.primary }}
            >
              Skills
            </h2>
            <div className="space-y-2">
              {parsedData.skills.map((skill, index) => (
                <div key={index} className="text-sm">
                  <span className="font-semibold">{skill.category}:</span>
                  <span className="ml-2">{skill.items.join(', ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
