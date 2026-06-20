"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSessionId } from "@/lib/utils";
import { Heart } from "lucide-react";

interface FavoriteTeamButtonProps {
  teamId: string;
}

export function FavoriteTeamButton({ teamId }: FavoriteTeamButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const sessionId = getSessionId();
      if (!sessionId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("favorite_teams")
        .select("id")
        .eq("team_id", teamId)
        .eq("session_id", sessionId)
        .single();
      setIsFavorite(!!data);
      setLoading(false);
    };
    check();
  }, [teamId]);

  const toggle = async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    const supabase = createClient();

    if (isFavorite) {
      await supabase
        .from("favorite_teams")
        .delete()
        .eq("team_id", teamId)
        .eq("session_id", sessionId);
      setIsFavorite(false);
    } else {
      await supabase.from("favorite_teams").insert({ team_id: teamId, session_id: sessionId });
      setIsFavorite(true);
    }
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full glass glass-hover transition-colors"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${isFavorite ? "fill-secondary text-secondary" : "text-white/40"}`}
      />
    </button>
  );
}
