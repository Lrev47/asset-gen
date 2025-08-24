import { GlassFeatureCard, GlassPanel } from "@/components/ui/glass-panel";
import { 
  PhotoIcon, 
  PaintBrushIcon, 
  CubeIcon, 
  ChartBarIcon,
  ClockIcon,
  SwatchIcon 
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: PhotoIcon,
    title: "Multiple AI Models",
    description: "Access to DALL-E 3, Stable Diffusion, and other cutting-edge AI image generation models for diverse creative needs."
  },
  {
    icon: PaintBrushIcon,
    title: "Smart Prompting",
    description: "Advanced prompt engineering and optimization to get the best results from AI models automatically."
  },
  {
    icon: CubeIcon,
    title: "Asset Types",
    description: "Pre-configured templates for logos, hero banners, product shots, team photos, and more specialized asset types."
  },
  {
    icon: ChartBarIcon,
    title: "Batch Generation",
    description: "Generate multiple variations and asset types simultaneously to speed up your creative workflow."
  },
  {
    icon: ClockIcon,
    title: "Fast Processing",
    description: "Optimized generation pipeline with intelligent queuing and parallel processing for maximum speed."
  },
  {
    icon: SwatchIcon,
    title: "Output Formats",
    description: "Automatic optimization and export in multiple formats (PNG, JPG, WebP) and sizes for different use cases."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-surface/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-primary">
            Everything You Need for
            <span className="text-accent block bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
              Professional Asset Creation
            </span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Our platform combines the power of multiple AI models with intelligent automation 
            to streamline your creative workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <GlassFeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={<feature.icon className="w-6 h-6" />}
              className="animate-slide-up"
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              {/* No additional children needed */}
            </GlassFeatureCard>
          ))}
        </div>

        {/* Enhanced feature showcase with glassmorphism */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold mb-6 text-text-primary">
              Project-Based Organization
            </h3>
            <p className="text-text-secondary mb-8 leading-relaxed">
              Organize your assets by project, track generation costs, manage different asset types, 
              and maintain a complete history of your creative iterations. Perfect for agencies, 
              startups, and individual creators.
            </p>
            <div className="space-y-4">
              {[
                "Project templates for different industries",
                "Cost tracking and budget management", 
                "Asset versioning and iteration history",
                "Team collaboration and sharing"
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full shadow-glow"></div>
                  <span className="text-sm text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <GlassPanel variant="elevated" padding="lg" className="relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -translate-y-8 translate-x-8" />
              
              <GlassPanel variant="default" padding="lg" className="relative">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                    <CubeIcon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">E-commerce Store</h4>
                    <p className="text-sm text-text-muted">24 assets generated</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Hero Banners", count: "3 variations", cost: "$2.40" },
                    { name: "Product Photos", count: "12 variations", cost: "$9.60" },
                    { name: "Category Icons", count: "9 variations", cost: "$3.60" }
                  ].map((asset, index) => (
                    <GlassPanel key={index} variant="muted" padding="sm" className="transition-all hover:bg-accent/5">
                      <div className="text-sm font-medium mb-1 text-text-primary">{asset.name}</div>
                      <div className="text-xs text-text-muted">{asset.count} • {asset.cost}</div>
                    </GlassPanel>
                  ))}
                </div>
              </GlassPanel>
            </GlassPanel>
          </div>
        </div>
      </div>
    </section>
  );
}