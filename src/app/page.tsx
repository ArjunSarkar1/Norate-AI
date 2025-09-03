"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { AuthUser } from "@supabase/supabase-js";
import {
  Brain,
  Search,
  FileText,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

function MainPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Summarization",
      description:
        "Automatically generate concise summaries of your notes using advanced AI technology.",
    },
    {
      icon: Search,
      title: "Semantic Search",
      description:
        "Find your notes using natural language queries. AI understands context, not just keywords.",
    },
    {
      icon: FileText,
      title: "Rich Text Editor",
      description:
        "Create beautiful, structured notes with our powerful rich text editor and formatting tools.",
    },
    {
      icon: Sparkles,
      title: "Auto-Titling",
      description:
        "Let AI suggest perfect titles for your notes based on their content and context.",
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      description:
        "Your notes sync instantly across all devices with real-time updates and collaboration.",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description:
        "Your data is encrypted and secure. We never access your personal notes or information.",
    },
  ];

  const benefits = [
    "Save hours with AI-powered note organization",
    "Find information instantly with semantic search",
    "Create better notes with intelligent suggestions",
    "Access your notes anywhere, anytime",
    "Collaborate seamlessly with team members",
    "Export and share notes in multiple formats",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Transform Your
            <span className="text-primary block">Note-Taking</span>
            with AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the future of note-taking with intelligent AI assistance.
            Create, organize, and discover your notes like never before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link href="/signup">Get Started Free</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Modern Note-Taking
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to capture, organize, and discover your
              thoughts with AI assistance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-border hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Norate AI?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of users who have transformed their note-taking
              experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users who have already transformed their
            note-taking with AI.
          </p>
          {user ? (
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/dashboard">
                Continue to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/signup">Start Your Free Trial</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

export default MainPage;
