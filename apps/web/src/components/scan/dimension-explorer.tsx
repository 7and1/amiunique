'use client';

import { useState } from 'react';
import {
  BatteryCharging,
  ChevronDown,
  ChevronUp,
  Chrome,
  Cpu,
  Globe,
  Headphones,
  Monitor,
  Palette,
  ShieldAlert,
  Wifi,
} from 'lucide-react';
import type { AnalysisResult } from '@amiunique/core';
import { cn, valueToDisplay } from '@/lib/utils';
import { RarityBadge, estimateRarity, type RarityLevel } from '@/components/ui/rarity-badge';

interface DimensionExplorerProps {
  details: AnalysisResult['details'];
  rarityLookup?: Record<string, { level: RarityLevel; share?: number }>;
}

/** Raw addresses must never render, even if present in a saved legacy payload */
const HIDDEN_KEYS = new Set(['rtc_local_ip', 'rtc_public_ip', 'aux_webrtc_ip']);

interface DimensionGroup {
  id: string;
  prefix: string;
  title: string;
  icon: typeof Cpu;
  headerClass: string;
}

const GROUPS: DimensionGroup[] = [
  {
    id: 'hardware',
    prefix: 'hw_',
    title: 'Hardware & Rendering',
    icon: Cpu,
    headerClass: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  {
    id: 'system',
    prefix: 'sys_',
    title: 'System & OS',
    icon: Monitor,
    headerClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  {
    id: 'capabilities',
    prefix: 'cap_',
    title: 'Capabilities',
    icon: Palette,
    headerClass: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  {
    id: 'media',
    prefix: 'med_',
    title: 'Media Codecs',
    icon: Headphones,
    headerClass: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  },
  {
    id: 'network',
    prefix: 'net_',
    title: 'Network & Edge',
    icon: Globe,
    headerClass: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  {
    id: 'webrtc',
    prefix: 'rtc_',
    title: 'WebRTC',
    icon: Wifi,
    headerClass: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  },
  {
    id: 'client-hints',
    prefix: 'ch_',
    title: 'Client Hints',
    icon: Chrome,
    headerClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  {
    id: 'auxiliary',
    prefix: 'aux_',
    title: 'Auxiliary Signals',
    icon: BatteryCharging,
    headerClass: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  },
  {
    id: 'lies',
    prefix: 'lie_',
    title: 'Lie Detection',
    icon: ShieldAlert,
    headerClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
];

function prettifyLabel(key: string, prefix: string): string {
  return key.slice(prefix.length).replace(/_/g, ' ');
}

export function DimensionExplorer({ details, rarityLookup }: DimensionExplorerProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['hardware']));

  const groups = GROUPS.map(group => ({
    ...group,
    rows: Object.entries(details)
      .filter(([key]) => key.startsWith(group.prefix) && !HIDDEN_KEYS.has(key))
      .map(([key, value]) => ({ key, value, label: prettifyLabel(key, group.prefix) })),
  })).filter(group => group.rows.length > 0);

  const totalVisible = groups.reduce((sum, group) => sum + group.rows.length, 0);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-xl font-semibold">All Dimensions ({totalVisible}+)</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Rarity is estimated from public browser statistics; corpus-based rarity is coming.
        </p>
      </div>

      <div className="space-y-4">
        {groups.map(group => {
          const Icon = group.icon;
          const isOpen = openGroups.has(group.id);
          const panelId = `dimension-group-${group.id}`;

          return (
            <div key={group.id} className="overflow-hidden rounded-xl border">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={cn(
                  'flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  group.headerClass
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="font-medium">{group.title}</span>
                  <span className="text-xs opacity-70">({group.rows.length} dimensions)</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                )}
              </button>

              <div id={panelId} hidden={!isOpen} className="divide-y border-t">
                {group.rows.map(({ key, value, label }) => {
                  const lookup = rarityLookup?.[key];
                  const level = lookup?.level ?? estimateRarity(key, value);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="capitalize text-muted-foreground">{label}</span>
                        <RarityBadge level={level} showLabel estimated={!lookup} />
                      </div>
                      <span className="max-w-[40%] truncate text-right font-mono text-xs">
                        {valueToDisplay(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
