import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Zap, ArrowRight, Users, Award, CheckCircle, Star, BarChart3, Clock, Shield, Target, ChevronRight, Briefcase } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from "sonner";
import { PaymentModal } from '@/components/subscription/PaymentModal';
import { useTypewriter } from '@/hooks/useTypewriter';

const Home = () => {
  const { user } = useAuth();
  const { createCheckout } = useSubscription();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { displayText, isComplete } = useTypewriter({ text: "AI Power", speed: 120, delay: 800 });

  const handleUploadResumeClick = () => {
    if (user) {
      navigate('/upload-resume');
    } else {
      navigate('/auth?redirect=upload-resume');
    }
  };

  const handleJoinPremium = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowPaymentModal(true);
  };

  const features = [{
    icon: <Zap className="h-8 w-8" />,
    title: "AI-Powered Optimization",
    description: "Advanced AI analyzes your resume against job descriptions and optimizes content for maximum ATS compatibility.",
    highlight: "95% ATS Pass Rate"
  }, {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Real-Time ATS Scoring",
    description: "Get instant feedback on your resume's ATS compatibility with detailed scoring and improvement suggestions.",
    highlight: "Instant Results"
  }, {
    icon: <FileText className="h-8 w-8" />,
    title: "Professional Templates",
    description: "Choose from 7+ professionally designed templates optimized for different industries and career levels.",
    highlight: "7+ Templates"
  }, {
    icon: <Target className="h-8 w-8" />,
    title: "Interview Preparation",
    description: "Practice with AI-generated interview questions tailored to your role and get personalized feedback.",
    highlight: "Smart Practice"
  }, {
    icon: <Clock className="h-8 w-8" />,
    title: "Quick Turnaround",
    description: "Get your optimized resume in minutes, not hours. Perfect for when you need to apply quickly.",
    highlight: "Under 5 Minutes"
  }, {
    icon: <Shield className="h-8 w-8" />,
    title: "Privacy & Security",
    description: "Your data is encrypted and secure. We never share your information with third parties.",
    highlight: "100% Secure"
  }];

  const testimonials = [{
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Google",
    content: "RezLit helped me land my dream job at Google. The ATS optimization was a game-changer!",
    rating: 5
  }, {
    name: "Michael Rodriguez",
    role: "Marketing Manager",
    company: "Meta",
    content: "I went from 2% to 40% response rate after using RezLit. The AI suggestions were spot-on.",
    rating: 5
  }, {
    name: "Jennifer Liu",
    role: "Data Scientist",
    company: "Netflix",
    content: "The interview prep feature helped me ace my technical interviews. Highly recommended!",
    rating: 5
  }];

  const stats = [{
    number: "50,000+",
    label: "Resumes Optimized"
  }, {
    number: "85%",
    label: "Success Rate"
  }, {
    number: "3x",
    label: "More Interviews"
  }, {
    number: "24/7",
    label: "AI Support"
  }];

  const freeFeatures = ["3 resume optimizations per month", "1 mock interview session per month", "2 AI-generated cover letters per month", "3 job description saves per month", "Basic ATS scoring", "Access to 2 professional templates", "Standard AI optimization", "Email support"];

  const premiumFeatures = ["Unlimited resume optimizations", "Unlimited mock interview sessions with AI feedback", "Unlimited AI-generated cover letters", "Unlimited job description saves", "Advanced ATS scoring with detailed insights", "Access to all 5+ professional templates", "Priority AI optimization", "Job search integration", "Resume version history"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">Trusted by 50,000+ job seekers</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
              Transform Your Job Search with{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {displayText}
                {!isComplete && <span className="animate-blink">|</span>}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Get 3x more interviews with AI-optimized resumes that beat ATS systems. 
              Join thousands who've landed their dream jobs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button size="lg" className="text-lg px-8 py-4 bg-white text-indigo-600 hover:bg-gray-100 shadow-xl">
                      <ArrowRight className="mr-2 h-5 w-5" />
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link to="/upload-resume">
                    <Button size="lg" className="text-lg px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20 transition-all">
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Resume
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="text-lg px-8 py-4 bg-white text-indigo-600 hover:bg-gray-100 shadow-xl">
                      <ArrowRight className="mr-2 h-5 w-5" />
                      Start Free Today
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-4 border-indigo-900 text-white bg-indigo-900 hover:bg-indigo-800"
                    onClick={handleUploadResumeClick}
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Resume
                  </Button>
                </>
              )}
            </div>

            {/* Add For Employers Button */}
            <div className="mb-8">
              <Link to="/employer/auth">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl border-2 border-white/20"
                >
                  <Briefcase className="mr-2 h-5 w-5" />
                  For Employers - Post Jobs
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-yellow-300">{stat.number}</div>
                  <div className="text-sm text-blue-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive suite of AI-powered tools gives you the competitive edge in today's job market.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="text-indigo-600 group-hover:text-indigo-700 transition-colors">
                      {feature.icon}
                    </div>
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {feature.highlight}
                    </span>
                  </div>
                  <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your optimized resume in just 3 simple steps
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[{
                step: "1",
                title: "Upload Your Resume",
                description: "Upload your current resume and the job description you're targeting.",
                icon: <Upload className="h-8 w-8" />
              }, {
                step: "2",
                title: "AI Optimization",
                description: "Our AI analyzes and optimizes your resume for ATS compatibility and relevance.",
                icon: <Zap className="h-8 w-8" />
              }, {
                step: "3",
                title: "Download & Apply",
                description: "Get your optimized resume with improved ATS score and start applying!",
                icon: <FileText className="h-8 w-8" />
              }].map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg text-indigo-600">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                  {index < 2 && <ChevronRight className="hidden md:block absolute top-8 -right-4 h-6 w-6 text-gray-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">See how RezLit has helped professionals land their dream jobs</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-semibold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Start Free, Upgrade When Ready
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Begin your journey with our comprehensive free plan, then unlock premium features as you grow
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="text-center pb-8">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium w-fit mx-auto mb-4">
                  Most Popular
                </div>
                <CardTitle className="text-2xl font-bold">Free Plan</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">
                  $0<span className="text-lg text-gray-600">/month</span>
                </div>
                <CardDescription className="text-lg mt-2">Perfect to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {freeFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
{!user ? (
                <Link to="/auth" className="block">
                  <Button className="w-full py-3" size="lg">
                    Get Started Free
                  </Button>
                </Link>
              ) : (
                <Link to="/dashboard" className="block">
                  <Button className="w-full py-3" size="lg">
                    Access Dashboard
                  </Button>
                </Link>
              )}
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2 border-indigo-200 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium">
                  Best Value
                </span>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">Premium Plan</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">
                  $19.99<span className="text-lg text-gray-600">/month</span>
                </div>
                <CardDescription className="text-lg mt-2">For serious job seekers</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {premiumFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={handleJoinPremium}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" 
                  size="lg"
                >
                  Join Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">Join thousands of professionals who've already boosted their job search success with RezLit.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-4 bg-white text-indigo-600 hover:bg-gray-100">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Access Dashboard
                  </Button>
                </Link>
                <Link to="/upload-resume">
                  <Button size="lg" className="text-lg px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20 transition-all">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Resume
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="text-lg px-8 py-4 bg-white text-indigo-600 hover:bg-gray-100">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Start Free Today
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20 transition-all"
                  onClick={handleUploadResumeClick}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Resume
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        returnUrl={window.location.href}
      />
    </div>
  );
};

export default Home;
