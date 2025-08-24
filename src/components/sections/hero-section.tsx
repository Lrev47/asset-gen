'use client';

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Button, GradientButton } from "@/components/ui/button";
import { GlassFeatureCard } from "@/components/ui/glass-panel";
import { SparklesIcon, PhotoIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

export function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Enhanced background with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent-glow),transparent_50%)]" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Enhanced Hero badge with glassmorphism */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 backdrop-blur-sm border border-accent/20 text-accent text-sm font-medium mb-8 shadow-glow animate-glow">
            <SparklesIcon className="w-4 h-4 mr-2" />
            AI-Powered Asset Generation
          </div>

          {/* Enhanced main heading */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-text-primary">
            Create Professional
            <span className="text-accent block bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
              Website Assets
            </span>
            with AI
          </h1>

          {/* Enhanced subheading */}
          <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
            Generate high-quality images, logos, and graphics for your projects in minutes. 
            Powered by advanced AI models like DALL-E 3 and Stable Diffusion.
          </p>

          {/* Enhanced CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {session ? (
              <Link href="/projects">
                <GradientButton 
                  size="xl" 
                  className="text-lg px-8 py-4"
                  glow="default"
                  icon={<RocketLaunchIcon className="w-5 h-5" />}
                >
                  Go to Dashboard
                </GradientButton>
              </Link>
            ) : (
              <>
                <GradientButton 
                  size="xl" 
                  className="text-lg px-8 py-4"
                  glow="default"
                  onClick={() => signIn()}
                  icon={<RocketLaunchIcon className="w-5 h-5" />}
                >
                  Sign In to Start
                </GradientButton>
                <Link href="#features">
                  <Button 
                    variant="glass" 
                    size="xl" 
                    className="text-lg px-8 py-4"
                    icon={<PhotoIcon className="w-5 h-5" />}
                  >
                    View Features
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Enhanced feature highlights with GlassFeatureCard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <GlassFeatureCard
              title="AI-Powered"
              description="Advanced AI models generate professional-quality assets"
              icon={<SparklesIcon className="w-6 h-6" />}
              className="animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            />
            <GlassFeatureCard
              title="Lightning Fast"
              description="Generate multiple variations in seconds, not hours"
              icon={<RocketLaunchIcon className="w-6 h-6" />}
              className="animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            />
            <GlassFeatureCard
              title="High Quality"
              description="Production-ready assets in multiple formats and sizes"
              icon={<PhotoIcon className="w-6 h-6" />}
              className="animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}