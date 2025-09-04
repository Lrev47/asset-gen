'use client'

import React from 'react'
import Link from 'next/link'
import {
  Github,
  Twitter,
  Mail,
  ExternalLink,
  Sparkles,
  Heart,
  Shield,
  FileText,
  HelpCircle,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface FooterLink {
  name: string
  href: string
  external?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { name: 'Features', href: '/features' },
      { name: 'Models', href: '/models' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Changelog', href: '/changelog' },
    ]
  },
  {
    title: 'Resources',
    links: [
      { name: 'Documentation', href: '/docs', external: true },
      { name: 'API Reference', href: '/api/docs', external: true },
      { name: 'Tutorials', href: '/tutorials', external: true },
      { name: 'Community', href: '/community', external: true },
    ]
  },
  {
    title: 'Support',
    links: [
      { name: 'Help Center', href: '/help', external: true },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Status', href: 'https://status.mediaforge.ai', external: true },
      { name: 'Bug Reports', href: 'https://github.com/mediaforge/issues', external: true },
    ]
  },
  {
    title: 'Company',
    links: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog', external: true },
      { name: 'Careers', href: '/careers' },
      { name: 'Press Kit', href: '/press' },
    ]
  }
]

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/mediaforge',
    icon: Github
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/mediaforge',
    icon: Twitter
  },
  {
    name: 'Email',
    href: 'mailto:hello@mediaforge.ai',
    icon: Mail
  }
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Asset Generator</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              AI-powered image generation tool that creates stunning visuals from simple text prompts.
            </p>
            
            {/* Status Badge */}
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Activity className="h-3 w-3 mr-1" />
                All Systems Operational
              </Badge>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-2">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <Button
                    key={social.name}
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 w-8 p-0"
                  >
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
                      >
                        {link.name}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Asset Generator. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
              >
                <Shield className="h-3 w-3 mr-1" />
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
              >
                <FileText className="h-3 w-3 mr-1" />
                Terms of Service
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <p className="text-sm text-muted-foreground flex items-center">
              Made with <Heart className="h-3 w-3 mx-1 text-red-500" /> by the Asset Generator Team
            </p>
            <Badge variant="secondary" className="text-xs">
              v1.0.0
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  )
}