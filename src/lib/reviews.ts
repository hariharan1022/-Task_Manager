import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReviewWithProfile = {
  id: string;
  user_id: string;
  target_type: "course" | "internship";
  target_id: string;
  rating: number;
  title: string | null;
  content: string;
  status: "approved" | "pending" | "rejected";
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    photo_url: string | null;
  } | null;
};

export type ReviewStats = {
  average: number;
  total: number;
  distribution: Record<number, number>;
};

export function computeStats(reviews: ReviewWithProfile[]): ReviewStats {
  const total = reviews.length;
  if (total === 0) return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
    sum += r.rating;
  }
  return { average: Math.round((sum / total) * 10) / 10, total, distribution };
}

export function useReviews(targetType: string, targetId: string) {
  return useQuery({
    queryKey: ["reviews", targetType, targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_reviews_with_profiles", { p_target_type: targetType, p_target_id: targetId });
      if (error) throw error;
      return (data ?? []) as ReviewWithProfile[];
    },
    refetchInterval: 10_000,
  });
}

export function useRecentReviews(limit = 6) {
  return useQuery({
    queryKey: ["recent-reviews", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_recent_reviews_with_profiles", { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as ReviewWithProfile[];
    },
    refetchInterval: 30_000,
  });
}

export function useUserReview(targetType: string, targetId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ["user-review", targetType, targetId, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("user_id", userId)
        .maybeSingle();
      return data as ReviewRow | null;
    },
    refetchInterval: 10_000,
  });
}

export type ReviewRow = {
  id: string;
  user_id: string;
  target_type: "course" | "internship";
  target_id: string;
  rating: number;
  title: string | null;
  content: string;
  status: "approved" | "pending" | "rejected";
  created_at: string;
  updated_at: string;
};

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      target_type: "course" | "internship";
      target_id: string;
      rating: number;
      title?: string;
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("reviews")
        .upsert(
          {
            user_id: user.id,
            target_type: input.target_type,
            target_id: input.target_id,
            rating: input.rating,
            title: input.title || null,
            content: input.content,
          },
          { onConflict: "user_id,target_type,target_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["reviews", variables.target_type, variables.target_id] });
      qc.invalidateQueries({ queryKey: ["user-review", variables.target_type, variables.target_id] });
      qc.invalidateQueries({ queryKey: ["recent-reviews"] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["user-review"] });
      qc.invalidateQueries({ queryKey: ["recent-reviews"] });
    },
  });
}
