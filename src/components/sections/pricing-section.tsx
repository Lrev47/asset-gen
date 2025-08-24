'use client';

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon, SparklesIcon } from "@heroicons/react/24/outline";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for trying out the platform",
    features: [
      "5 images per month",
      "Basic AI models",
      "Standard quality",
      "Personal projects only",
      "Community support"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For professionals and small teams",
    features: [
      "500 images per month",
      "All AI models (DALL-E 3, Stable Diffusion)",
      "HD quality generation",
      "Commercial license",
      "Priority support",
      "Batch generation",
      "Project templates"
    ],
    cta: "Start Pro Trial",
    popular: true
  },
  {
    name: "Agency",
    price: "$99",
    period: "/month",
    description: "For agencies and larger teams",
    features: [
      "2,000 images per month",
      "All premium AI models",
      "Ultra HD quality",
      "White-label options",
      "Team collaboration",
      "Custom asset types",
      "Dedicated support",
      "API access"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export function PricingSection() {
  const { data: session } = useSession();

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent
            <span className="text-primary block">Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include access to our core features 
            with generous usage limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <SparklesIcon className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <CheckIcon className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  {session ? (
                    <Button 
                      asChild
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      <Link href="/projects">
                        {plan.cta}
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => signIn()}
                    >
                      {plan.cta}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include unlimited projects, asset organization, and basic support.
          </p>
          <p className="text-sm text-muted-foreground">
            Need a custom plan? <Button variant="link" className="p-0 h-auto">Contact our sales team</Button>
          </p>
        </div>
      </div>
    </section>
  );
}