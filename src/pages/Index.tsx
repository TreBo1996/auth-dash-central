
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Best Hire
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your resume with AI-powered optimization. Upload your documents and let our intelligent system help you land your dream job.
          </p>
          <Link to="/upload">
            <Button size="lg" className="text-lg px-8 py-3">
              <Upload className="mr-2 h-5 w-5" />
              Get Started
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <Upload className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload your resume and job descriptions in PDF or DOCX format
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>AI Optimization</CardTitle>
              <CardDescription>
                Our AI analyzes and optimizes your resume for specific job requirements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Get Results</CardTitle>
              <CardDescription>
                Download your optimized resume and increase your chances of getting hired
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ready to optimize your resume?</CardTitle>
              <CardDescription>
                Join thousands of job seekers who have improved their chances with Best Hire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/upload">
                <Button size="lg" className="w-full">
                  <Upload className="mr-2 h-5 w-5" />
                  Start Upload Process
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
