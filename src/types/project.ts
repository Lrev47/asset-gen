export interface Project {
  id: string;
  name: string;
  description: string;
  type: string;
  businessType?: string;
  githubUrl?: string | null;
  prdContent?: string;
  schemaContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  totalFields: number;
  totalPrompts: number;
  totalImages: number;
  lastGeneratedAt: string | null;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export interface ProjectAnalysis {
  websiteStyle: WebsiteStyleAnalysis;
  summary: ProjectSummary;
  recommendations: DetailedRecommendation[];
}

export interface WebsiteStyleAnalysis {
  primaryStyle: string;
  colorScheme: string[];
  designApproach: string;
  targetAudience: string;
  brandPersonality: string[];
  visualPriorities: string[];
}

export interface ProjectSummary {
  totalImages: number;
  totalCost: number;
  timeEstimate: string;
  categories: string[];
}

export interface DetailedRecommendation {
  category: string;
  title: string;
  description: string;
  composition: string;
  lighting: string;
  mood: string;
  technicalSpecs: {
    dimensions: { width: number; height: number };
    aspectRatio: string;
    preferredFormat: string;
    estimatedCost: number;
  };
  examples: string[];
  priority: 'high' | 'medium' | 'low';
  quantity: number;
  reasoning: string;
}