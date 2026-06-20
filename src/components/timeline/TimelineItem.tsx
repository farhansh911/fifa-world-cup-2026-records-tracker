import Link from "next/link";
import Image from "next/image";
import { cn, formatDate, getImportanceColor } from "@/lib/utils";
import type { TimelineEvent } from "@/types/database";
import {
  CircleDot,
  Trophy,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

const eventIcons = {
  goal: CircleDot,
  record_broken: Trophy,
  record_created: Sparkles,
  match_highlight: Zap,
  milestone: Star,
};

const eventColors = {
  goal: "bg-green-500/20 text-green-400 border-green-500/40",
  record_broken: "bg-secondary/20 text-secondary border-secondary/40",
  record_created: "bg-accent/20 text-accent border-accent/40",
  match_highlight: "bg-highlight/20 text-highlight border-highlight/40",
  milestone: "bg-primary/40 text-white border-primary/60",
};

interface TimelineItemProps {
  event: TimelineEvent;
  index: number;
}

export function TimelineItem({ event, index }: TimelineItemProps) {
  const Icon = eventIcons[event.event_type] || Star;

  return (
    <div className="relative pl-16 pb-10 last:pb-0">
      {index === 0 && <div className="timeline-line" />}

      <div className={cn(
        "absolute left-3 w-7 h-7 rounded-full flex items-center justify-center border-2 z-10",
        eventColors[event.event_type]
      )}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      <article className="glass glass-hover rounded-2xl p-5 ml-2">
        <div className="flex items-start justify-between gap-4 mb-2">
          <span className={cn("text-xs font-bold uppercase px-2 py-0.5 rounded-full border", eventColors[event.event_type])}>
            {event.event_type.replace("_", " ")}
          </span>
          <time className="text-xs text-white/40">{formatDate(event.event_date)}</time>
        </div>

        <h3 className="text-lg font-bold mb-1">{event.title}</h3>

        {event.description && (
          <p className="text-white/60 text-sm mb-3">{event.description}</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-white/40">
          {event.player && (
            <Link href={`/players/${event.player.id}`} className="hover:text-accent">
              {event.player.name}
            </Link>
          )}
          {event.team && (
            <Link href={`/teams/${event.team.id}`} className="hover:text-accent">
              {event.team.name}
            </Link>
          )}
          {event.match && (
            <Link href={`/matches/${event.match.id}`} className="hover:text-accent">
              View Match
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
