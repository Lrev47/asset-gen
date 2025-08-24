'use client';

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ProjectDetailView } from "@/components/project/project-detail-view";
import { CreativeAppShell } from "@/components/layout/app-shell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import {
  PhotoIcon,
  SparklesIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  EyeIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const projectId = params.id as string;

  if (status === "loading") {
    return (
      <GlassPanel className="min-h-screen flex items-center justify-center" variant="default">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-text-secondary">Loading project...</p>
        </div>
      </GlassPanel>
    );
  }

  if (!session) {
    redirect("/");
  }

  // Mock tools for now - these would be passed from the ProjectDetailView component
  const mockTools = (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
        <PhotoIcon className="w-4 h-4" />
        Generate Image
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
        <SparklesIcon className="w-4 h-4" />
        Enhance Prompt
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
        <PaintBrushIcon className="w-4 h-4" />
        Style Transfer
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
        <ArrowPathIcon className="w-4 h-4" />
        Regenerate
      </Button>
    </div>
  );

  // Mock layers/results panel
  const mockLayers = (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
        <EyeIcon className="w-4 h-4" />
        Generated Images
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
        <DocumentTextIcon className="w-4 h-4" />
        Prompts
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
        <CloudArrowUpIcon className="w-4 h-4" />
        Export
      </Button>
    </div>
  );

  return (
    <CreativeAppShell
      header={<Header />}
      tools={mockTools}
      layers={mockLayers}
    >
      <ProjectDetailView projectId={projectId} />
    </CreativeAppShell>
  );
}