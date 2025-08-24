'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PlusIcon, 
  FolderIcon, 
  PhotoIcon, 
  ClockIcon,
  CurrencyDollarIcon 
} from "@heroicons/react/24/outline";

export function ProjectsDashboard() {
  const [projects] = useState([
    {
      id: "1",
      name: "E-commerce Store",
      description: "Modern online shopping experience",
      type: "e-commerce",
      assetCount: 24,
      lastActivity: "2 hours ago",
      cost: 45.60
    },
    {
      id: "2", 
      name: "SaaS Landing Page",
      description: "Product marketing website",
      type: "saas",
      assetCount: 12,
      lastActivity: "1 day ago",
      cost: 28.40
    },
    {
      id: "3",
      name: "Photography Portfolio", 
      description: "Professional photographer showcase",
      type: "portfolio",
      assetCount: 8,
      lastActivity: "3 days ago",
      cost: 19.20
    }
  ]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Manage your AI-generated assets by project
          </p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <PlusIcon className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <PhotoIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, project) => sum + project.assetCount, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">assets generated</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${projects.reduce((sum, project) => sum + project.cost, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {project.type}
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{project.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Assets</span>
                <span className="font-medium">{project.assetCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-medium">${project.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Last activity</span>
                <span className="text-xs">{project.lastActivity}</span>
              </div>
              <div className="pt-4 flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Assets
                </Button>
                <Button size="sm" className="flex-1">
                  Generate More
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Project Card */}
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PlusIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Create New Project</h3>
            <p className="text-muted-foreground text-center text-sm mb-4">
              Start generating assets for a new website or application
            </p>
            <Button>
              New Project
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}