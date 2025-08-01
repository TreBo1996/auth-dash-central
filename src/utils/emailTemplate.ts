interface JobRecommendation {
  title: string;
  company: string;
  location: string;
  salary: string;
  job_page_link: string;
  match_score: number;
}

export const generateJobAlertEmailHTML = (userName: string, jobs: JobRecommendation[]): string => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Daily Job Recommendations</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #9333ea 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
        .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .intro { font-size: 16px; color: #4b5563; margin-bottom: 30px; line-height: 1.6; }
        .job-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        .job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .job-title { font-size: 18px; font-weight: bold; color: #1f2937; margin: 0; }
        .match-badge { background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .company { font-size: 16px; color: #6b7280; margin: 4px 0; }
        .job-details { display: flex; gap: 20px; margin: 12px 0; font-size: 14px; color: #6b7280; }
        .detail-item { display: flex; align-items: center; gap: 6px; }
        .job-actions { margin-top: 16px; }
        .btn { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 12px; margin-bottom: 8px; }
        .btn-primary { background-color: #2563eb; color: #ffffff; }
        .btn-secondary { background-color: #f3f4f6; color: #374151; }
        .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 14px; color: #6b7280; margin-bottom: 16px; }
        .unsubscribe { font-size: 12px; color: #9ca3af; }
        .unsubscribe a { color: #6b7280; }
        @media (max-width: 600px) {
            .content { padding: 20px; }
            .job-details { flex-direction: column; gap: 8px; }
            .btn { display: block; margin-right: 0; margin-bottom: 12px; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="margin-bottom: 20px;">
                <img src="https://rezlit.com/lovable-uploads/41eb8276-f076-476b-93fb-6dab57a8c8b1.png" alt="RezLit" style="height: 40px; width: auto; display: inline-block;" />
            </div>
            <h1>Your Job Matches</h1>
            <p>Personalized recommendations for ${currentDate}</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hi ${userName}! 👋</div>
            
            <div class="intro">
                We've found <strong>${jobs.length} excellent job matches</strong> that align perfectly with your career goals and experience. These opportunities were selected specifically for you based on your profile.
            </div>
            
            ${jobs.map((job, index) => `
            <div class="job-card">
                <div class="job-header">
                    <h3 class="job-title">${job.title}</h3>
                    <span class="match-badge">${job.match_score}% Match</span>
                </div>
                <div class="company">${job.company}</div>
                <div class="job-details">
                    <div class="detail-item">📍 ${job.location}</div>
                    <div class="detail-item">💰 ${job.salary}</div>
                </div>
                <div class="job-actions">
                    <a href="https://rezlit.com${job.job_page_link}" class="btn btn-primary">View Job Details</a>
                    <a href="https://rezlit.com/upload?job=https://rezlit.com${job.job_page_link}" class="btn btn-secondary">Create Optimized Resume</a>
                </div>
            </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Ready to land your dream job? <strong>Create an ATS-optimized resume</strong> for each position to increase your interview chances by 3x!
            </div>
            <div class="footer-text">
                <a href="https://rezlit.com/dashboard" class="btn btn-primary">Visit Your Dashboard</a>
            </div>
            <div class="unsubscribe">
                Don't want these emails? <a href="#">Unsubscribe here</a> | 
                <a href="#">Update your preferences</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

export const sampleJobs: JobRecommendation[] = [
  {
    title: "Senior Software Engineer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    salary: "$120,000 - $180,000",
    job_page_link: "/job-search?jobId=database_sample-1&autoExpand=true",
    match_score: 95
  },
  {
    title: "Full Stack Developer",
    company: "InnovateTech",
    location: "Remote",
    salary: "$90,000 - $140,000",
    job_page_link: "/job-search?jobId=database_sample-2&autoExpand=true",
    match_score: 88
  },
  {
    title: "Frontend Developer",
    company: "DesignFirst Studios", 
    location: "Austin, TX",
    salary: "$80,000 - $120,000",
    job_page_link: "/job-search?jobId=database_sample-3&autoExpand=true",
    match_score: 82
  }
];