'use client';

import { useScrollSpy } from '@/hooks/use-scroll-spy';
import { cn } from '@/lib/utils';

interface SectionNavProps {
  sections: { id: string; label: string }[];
  visible: boolean;
}

/**
 * Sticky pill navigation for the single-page layout.
 * Sits directly under the h-16 site header; CSS-only styling.
 */
export function SectionNav({ sections, visible }: SectionNavProps) {
  const activeId = useScrollSpy(sections.map(s => s.id));

  if (!visible) return null;

  const scrollTo = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <nav aria-label="Result sections" className="sticky top-16 z-40 flex justify-center px-4 py-3">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/40 bg-white/70 p-1 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
        {sections.map(section => {
          const active = activeId === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={event => scrollTo(event, section.id)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10'
              )}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
