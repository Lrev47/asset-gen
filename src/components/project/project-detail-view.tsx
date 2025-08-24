'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeftIcon,
  PlusIcon, 
  PhotoIcon, 
  PlayIcon,
  CogIcon 
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface ProjectDetailViewProps {
  projectId: string;
}

export function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const [project] = useState({
    id: projectId,
    name: "E-commerce Store",
    description: "Modern online shopping experience with clean design and optimized user flow",
    type: "e-commerce",
    status: "active",
    createdAt: "2024-01-15",
    fields: [
      {
        id: "1",
        name: "Hero Banner",
        description: "Main homepage banner showcasing featured products",
        assetType: "Hero Banner",
        status: "completed",
        imageCount: 3,
        lastGenerated: "2 hours ago"
      },
      {
        id: "2", 
        name: "Product Photos",
        description: "Professional product photography for catalog",
        assetType: "Product Shot",
        status: "generating",
        imageCount: 12,
        lastGenerated: "5 minutes ago"
      },
      {
        id: "3",
        name: "Category Icons",
        description: "Navigation icons for product categories",
        assetType: "Icon",
        status: "pending",
        imageCount: 0,
        lastGenerated: null
      }
    ]
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/projects">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
            <span>Type: {project.type}</span>
            <span>•</span>
            <span>Created: {project.createdAt}</span>
            <span>•</span>
            <span className="capitalize">{project.status}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <CogIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {/* Project Fields */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Asset Fields</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {project.fields.map((field) => (
            <Card key={field.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{field.name}</CardTitle>
                  <div className={`text-xs px-2 py-1 rounded ${
                    field.status === 'completed' ? 'bg-green-100 text-green-700' :
                    field.status === 'generating' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {field.status}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{field.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Asset Type</span>
                  <span>{field.assetType}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Images Generated</span>
                  <span>{field.imageCount}</span>
                </div>
                
                {field.lastGenerated && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Last Generated</span>
                    <span className="text-xs">{field.lastGenerated}</span>
                  </div>
                )}
                
                <div className="pt-4 flex space-x-2">
                  {field.imageCount > 0 ? (
                    <Button variant="outline" size="sm" className="flex-1">
                      <PhotoIcon className="w-4 h-4 mr-2" />
                      View Images ({field.imageCount})
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1" disabled>
                      <PhotoIcon className="w-4 h-4 mr-2" />
                      No Images
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    className="flex-1"
                    disabled={field.status === 'generating'}
                  >
                    <PlayIcon className="w-4 h-4 mr-2" />
                    {field.status === 'generating' ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Field Card */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <PlusIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Add Asset Field</h3>
              <p className="text-muted-foreground text-center text-sm mb-4">
                Define a new type of asset to generate for this project
              </p>
              <Button size="sm">
                Add Field
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}