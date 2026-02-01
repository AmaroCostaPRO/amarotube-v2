"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionLink }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card/[var(--component-bg-opacity)] backdrop-blur-md shadow-neo-outset rounded-2xl" data-aos="fade-up">
      <div className="p-4 bg-primary/10 rounded-full mb-4 shadow-neo-inset">
        <Icon className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-xs mb-6">{description}</p>
      {actionLabel && actionLink && (
        <Button asChild className="shadow-neo-outset transition-transform hover:scale-105">
          <Link href={actionLink}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}