'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useBreadcrumbLabels } from './BreadcrumbsContext';

const NORWEGIAN_SEGMENT_LABELS: Record<string, string> = {
  org: 'Organisasjoner',
  tasks: 'Oppgaver',
  calendar: 'Kalender',
  settings: 'Innstillinger',
  account: 'Konto',
  'create-task': 'Ny oppgave',
  dashboard: 'Oversikt',
};

function formatSegment(segment: string): string {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function labelForSegment(
  segment: string,
  labels: Record<string, string>,
): string {
  return (
    labels[segment] ??
    NORWEGIAN_SEGMENT_LABELS[segment] ??
    formatSegment(decodeURIComponent(segment))
  );
}

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const { labels, rootLabel } = useBreadcrumbLabels();

  const breadcrumbs = React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const rootHref = '/dashboard';

    const crumbs = [{ href: rootHref, label: rootLabel }];

    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      if (href === rootHref) return;

      crumbs.push({
        href,
        label: labelForSegment(segment, labels),
      });
    });

    return crumbs;
  }, [pathname, labels, rootLabel]);


  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={`${crumb.href}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
