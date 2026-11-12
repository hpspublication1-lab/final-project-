'use client';

import React from 'react';
import {
  Microscope,
  Ruler,
  BarChart3,
  BookOpen,
  Globe,
  Zap,
  FlaskConical,
  Leaf,
  Magnet,
  Beaker,
  Dna,
  Activity,
  Brain,
  Settings,
  Landmark,
  Newspaper,
  Headphones,
  BookText,
  PenTool,
  Mic,
  Lightbulb,
  Smartphone,
  Video,
  Search,
  FileText,
  Briefcase,
  Bot,
  Code,
  Rocket,
  Target,
  Languages,
  Scale,
  Shapes,
  Flag,
  LucideProps,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Microscope,
  Ruler,
  BarChart3,
  BookOpen,
  Globe,
  Zap,
  FlaskConical,
  Leaf,
  Magnet,
  Beaker,
  Dna,
  Activity,
  Brain,
  Settings,
  Landmark,
  Newspaper,
  Headphones,
  BookText,
  PenTool,
  Mic,
  Lightbulb,
  Smartphone,
  Video,
  Search,
  FileText,
  Briefcase,
  Bot,
  Code,
  Rocket,
  Target,
  Languages,
  Scale,
  Shapes,
  Flag,
};

interface SubjectIconProps extends LucideProps {
  name: string;
}

export default function SubjectIcon({ name, size = 20, className = '', ...props }: SubjectIconProps) {
  const IconComponent = ICON_MAP[name] || BookOpen;
  return <IconComponent size={size} className={className} {...props} />;
}
