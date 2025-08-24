'use client';

import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { ProjectsDashboard } from "@/components/dashboard/projects-dashboard";
import { DashboardAppShell } from "@/components/layout/app-shell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { redirect } from "next/navigation";
import { 
  RectangleGroupIcon, 
  TagIcon, 
  CpuChipIcon, 
  Cog6ToothIcon,
  FolderIcon 
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { href: '/projects', label: 'Projects', icon: FolderIcon, active: true },
  { href: '/asset-types', label: 'Asset Types', icon: RectangleGroupIcon },
  { href: '/tags', label: 'Tags', icon: TagIcon },
  { href: '/models', label: 'AI Models', icon: CpuChipIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export default function ProjectsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <GlassPanel className="min-h-screen flex items-center justify-center" variant="default">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-text-secondary">Loading your dashboard...</p>
        </div>
      </GlassPanel>
    );
  }

  if (!session) {
    redirect("/");
  }

  return (
    <DashboardAppShell
      header={<Header />}
      navigation={
        <div className="space-y-2">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-4 px-3">
            Navigation
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant={item.active ? "glass" : "ghost"}
                size="sm"
                className={`w-full justify-start gap-3 h-9 ${
                  item.active ? 'bg-accent/10 text-accent border-accent/20' : ''
                }`}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>
      }
    >
      <ProjectsDashboard />
    </DashboardAppShell>
  );
}