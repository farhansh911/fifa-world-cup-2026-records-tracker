import { LiveMatchBoard } from "@/components/matches/LiveMatchBoard";
import { getFeaturedMatchView, getLiveMatchViews } from "@/lib/data";

export async function LiveMatchBoardServer() {
  const [live, featured] = await Promise.all([
    getLiveMatchViews(),
    getFeaturedMatchView(),
  ]);

  return (
    <LiveMatchBoard
      initialLive={live}
      initialFeatured={featured}
    />
  );
}
