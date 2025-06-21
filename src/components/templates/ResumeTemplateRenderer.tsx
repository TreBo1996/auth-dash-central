import React from 'react';
import { ParsedResume, TemplateConfig } from '@/types/resume';

interface ResumeTemplateRendererProps {
  resume: ParsedResume;
  templateConfig: TemplateConfig;
  templateName: string;
}

export const ResumeTemplateRenderer: React.FC<ResumeTemplateRendererProps> = ({
  resume,
  templateConfig,
  templateName
}) => {
  const { layout, colors, fonts } = templateConfig;

  const getLayoutComponent = () => {
    switch (layout) {
      case 'single-column':
        return <SingleColumnTemplate resume={resume} colors={colors} fonts={fonts} />;
      case 'two-column':
        return <TwoColumnTemplate resume={resume} colors={colors} fonts={fonts} />;
      case 'executive':
        return <ExecutiveTemplate resume={resume} colors={colors} fonts={fonts} />;
      case 'creative':
        return <CreativeTemplate resume={resume} colors={colors} fonts={fonts} />;
      case 'tech':
        return <TechTemplate resume={resume} colors={colors} fonts={fonts} />;
      default:
        return <SingleColumnTemplate resume={resume} colors={colors} fonts={fonts} />;
    }
  };

  return (
    <div className="resume-template" data-template={templateName}>
      {getLayoutComponent()}
    </div>
  );
};

// Single Column Template (Free)
const SingleColumnTemplate: React.FC<{
  resume: ParsedResume;
  colors: TemplateConfig['colors'];
  fonts: TemplateConfig['fonts'];
}> = ({ resume, colors, fonts }) => (
  <div className="max-w-2xl mx-auto bg-white p-8 shadow-lg">
    <header className="mb-8">
      <h1 className={`text-3xl ${fonts.heading} mb-2`} style={{ color: colors.primary }}>
        John Doe
      </h1>
      <h2 className={`text-xl ${fonts.body} mb-4`} style={{ color: colors.accent }}>
        Professional Title
      </h2>
      <div className="text-gray-600">
        <p>email@example.com | (555) 123-4567 | LinkedIn Profile</p>
      </div>
    </header>

    {resume.summary && (
      <section className="mb-6">
        <h3 className={`text-lg ${fonts.heading} mb-3 pb-2 border-b-2`} style={{ color: colors.primary, borderColor: colors.accent }}>
          Professional Summary
        </h3>
        <p className={`${fonts.body} text-gray-700 leading-relaxed`}>{resume.summary}</p>
      </section>
    )}

    {resume.experience.length > 0 && (
      <section className="mb-6">
        <h3 className={`text-lg ${fonts.heading} mb-3 pb-2 border-b-2`} style={{ color: colors.primary, borderColor: colors.accent }}>
          Professional Experience
        </h3>
        {resume.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className={`${fonts.heading} text-base`} style={{ color: colors.primary }}>
                {exp.role}
              </h4>
              <span className={`${fonts.body} text-sm text-gray-600`}>
                {exp.startDate} - {exp.endDate}
              </span>
            </div>
            <p className={`${fonts.body} text-sm mb-2`} style={{ color: colors.accent }}>
              {exp.company}
            </p>
            <p className={`${fonts.body} text-gray-700 text-sm leading-relaxed`}>
              {exp.description}
            </p>
          </div>
        ))}
      </section>
    )}

    {resume.skills.length > 0 && (
      <section className="mb-6">
        <h3 className={`text-lg ${fonts.heading} mb-3 pb-2 border-b-2`} style={{ color: colors.primary, borderColor: colors.accent }}>
          Skills
        </h3>
        <div className="flex flex-wrap gap-2">
          {resume.skills.map((skill, index) => (
            <span
              key={index}
              className={`${fonts.body} px-3 py-1 rounded-full text-sm`}
              style={{ backgroundColor: colors.accent + '20', color: colors.accent }}
            >
              {skill}
            </span>
          ))}
        </div>
      </section>
    )}

    {resume.education.length > 0 && (
      <section className="mb-6">
        <h3 className={`text-lg ${fonts.heading} mb-3 pb-2 border-b-2`} style={{ color: colors.primary, borderColor: colors.accent }}>
          Education
        </h3>
        {resume.education.map((edu) => (
          <div key={edu.id} className="mb-3">
            <h4 className={`${fonts.heading} text-base`} style={{ color: colors.primary }}>
              {edu.degree}
            </h4>
            <p className={`${fonts.body} text-sm`} style={{ color: colors.accent }}>
              {edu.institution} • {edu.year}
            </p>
          </div>
        ))}
      </section>
    )}

    {resume.certifications.length > 0 && (
      <section>
        <h3 className={`text-lg ${fonts.heading} mb-3 pb-2 border-b-2`} style={{ color: colors.primary, borderColor: colors.accent }}>
          Certifications
        </h3>
        {resume.certifications.map((cert) => (
          <div key={cert.id} className="mb-3">
            <h4 className={`${fonts.heading} text-base`} style={{ color: colors.primary }}>
              {cert.name}
            </h4>
            <p className={`${fonts.body} text-sm`} style={{ color: colors.accent }}>
              {cert.issuer} • {cert.year}
            </p>
          </div>
        ))}
      </section>
    )}
  </div>
);

// Two Column Template (Free)
const TwoColumnTemplate: React.FC<{
  resume: ParsedResume;
  colors: TemplateConfig['colors'];
  fonts: TemplateConfig['fonts'];
}> = ({ resume, colors, fonts }) => (
  <div className="max-w-4xl mx-auto bg-white shadow-lg flex">
    {/* Left Sidebar */}
    <div className="w-1/3 p-6" style={{ backgroundColor: colors.accent + '10' }}>
      <div className="mb-6">
        <h1 className={`text-2xl ${fonts.heading} mb-1`} style={{ color: colors.primary }}>
          John Doe
        </h1>
        <h2 className={`text-lg ${fonts.body} mb-4`} style={{ color: colors.accent }}>
          Professional Title
        </h2>
        <div className={`${fonts.body} text-sm text-gray-600 space-y-1`}>
          <p>email@example.com</p>
          <p>(555) 123-4567</p>
          <p>LinkedIn Profile</p>
        </div>
      </div>

      {resume.skills.length > 0 && (
        <div className="mb-6">
          <h3 className={`text-base ${fonts.heading} mb-3`} style={{ color: colors.primary }}>
            Skills
          </h3>
          <div className="space-y-2">
            {resume.skills.map((skill, index) => (
              <div key={index} className={`${fonts.body} text-sm text-gray-700`}>
                {skill}
              </div>
            ))}
          </div>
        </div>
      )}

      {resume.education.length > 0 && (
        <div className="mb-6">
          <h3 className={`text-base ${fonts.heading} mb-3`} style={{ color: colors.primary }}>
            Education
          </h3>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-3">
              <h4 className={`${fonts.heading} text-sm`} style={{ color: colors.primary }}>
                {edu.degree}
              </h4>
              <p className={`${fonts.body} text-xs text-gray-600`}>
                {edu.institution}
              </p>
              <p className={`${fonts.body} text-xs`} style={{ color: colors.accent }}>
                {edu.year}
              </p>
            </div>
          ))}
        </div>
      )}

      {resume.certifications.length > 0 && (
        <div>
          <h3 className={`text-base ${fonts.heading} mb-3`} style={{ color: colors.primary }}>
            Certifications
          </h3>
          {resume.certifications.map((cert) => (
            <div key={cert.id} className="mb-3">
              <h4 className={`${fonts.heading} text-sm`} style={{ color: colors.primary }}>
                {cert.name}
              </h4>
              <p className={`${fonts.body} text-xs text-gray-600`}>
                {cert.issuer} • {cert.year}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Right Main Content */}
    <div className="w-2/3 p-6">
      {resume.summary && (
        <section className="mb-6">
          <h3 className={`text-lg ${fonts.heading} mb-3`} style={{ color: colors.primary }}>
            Professional Summary
          </h3>
          <p className={`${fonts.body} text-gray-700 leading-relaxed`}>{resume.summary}</p>
        </section>
      )}

      {resume.experience.length > 0 && (
        <section>
          <h3 className={`text-lg ${fonts.heading} mb-4`} style={{ color: colors.primary }}>
            Professional Experience
          </h3>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <h4 className={`${fonts.heading} text-base`} style={{ color: colors.primary }}>
                  {exp.role}
                </h4>
                <span className={`${fonts.body} text-sm text-gray-600`}>
                  {exp.startDate} - {exp.endDate}
                </span>
              </div>
              <p className={`${fonts.body} text-sm mb-2`} style={{ color: colors.accent }}>
                {exp.company}
              </p>
              <p className={`${fonts.body} text-gray-700 text-sm leading-relaxed`}>
                {exp.description}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  </div>
);

// Premium Templates (simplified for brevity)
const ExecutiveTemplate: React.FC<{
  resume: ParsedResume;
  colors: TemplateConfig['colors'];
  fonts: TemplateConfig['fonts'];
}> = ({ resume, colors, fonts }) => (
  <div className="max-w-2xl mx-auto bg-white p-8 shadow-lg border-t-4" style={{ borderColor: colors.accent }}>
    <header className="text-center mb-8 pb-6 border-b">
      <h1 className={`text-4xl ${fonts.heading} mb-2`} style={{ color: colors.primary }}>
        John Doe
      </h1>
      <h2 className={`text-xl ${fonts.body} mb-4 uppercase tracking-wide`} style={{ color: colors.accent }}>
        Senior Executive
      </h2>
      <div className={`${fonts.body} text-gray-600`}>
        <p>email@example.com | (555) 123-4567 | LinkedIn Profile</p>
      </div>
    </header>
    {/* Rest of template content similar to single column but with executive styling */}
    <SingleColumnContent resume={resume} colors={colors} fonts={fonts} />
  </div>
);

const CreativeTemplate: React.FC<{
  resume: ParsedResume;
  colors: TemplateConfig['colors'];
  fonts: TemplateConfig['fonts'];
}> = ({ resume, colors, fonts }) => (
  <div className="max-w-2xl mx-auto bg-white shadow-lg">
    <div className="h-4" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }}></div>
    <div className="p-8">
      <header className="mb-8">
        <h1 className={`text-3xl ${fonts.heading} mb-2`} style={{ color: colors.primary }}>
          John Doe
        </h1>
        <h2 className={`text-xl ${fonts.body} mb-4 italic`} style={{ color: colors.accent }}>
          Creative Professional
        </h2>
      </header>
      <SingleColumnContent resume={resume} colors={colors} fonts={fonts} />
    </div>
  </div>
);

const TechTemplate: React.FC<{
  resume: ParsedResume;
  colors: TemplateConfig['colors'];
  fonts: TemplateConfig['fonts'];
}> = ({ resume, colors, fonts }) => (
  <div className="max-w-2xl mx-auto bg-white shadow-lg">
    <div className="bg-gray-900 text-white p-6">
      <h1 className={`text-3xl ${fonts.heading} mb-2`}>John Doe</h1>
      <h2 className={`text-xl ${fonts.body} mb-4`} style={{ color: colors.accent }}>
        Software Engineer
      </h2>
    </div>
    <div className="p-8">
      <SingleColumnContent resume={resume} colors={colors} fonts={fonts} />
    </div>
  </div>
);

// Helper component for shared content structure
const SingleColumnContent: React.FC<{
  resume: ParsedResume;
  colors: TemplateConfig['colors'];
  fonts: TemplateConfig['fonts'];
}> = ({ resume, colors, fonts }) => (
  <>
    {resume.summary && (
      <section className="mb-6">
        <h3 className={`text-lg ${fonts.heading} mb-3`} style={{ color: colors.primary }}>
          Professional Summary
        </h3>
        <p className={`${fonts.body} text-gray-700 leading-relaxed`}>{resume.summary}</p>
      </section>
    )}

    {resume.experience.length > 0 && (
      <section className="mb-6">
        <h3 className={`text-lg ${fonts.heading} mb-3`} style={{ color: colors.primary }}>
          Experience
        </h3>
        {resume.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className={`${fonts.heading} text-base`} style={{ color: colors.primary }}>
                {exp.role}
              </h4>
              <span className={`${fonts.body} text-sm text-gray-600`}>
                {exp.startDate} - {exp.endDate}
              </span>
            </div>
            <p className={`${fonts.body} text-sm mb-2`} style={{ color: colors.accent }}>
              {exp.company}
            </p>
            <p className={`${fonts.body} text-gray-700 text-sm leading-relaxed`}>
              {exp.description}
            </p>
          </div>
        ))}
      </section>
    )}
  </>
);
