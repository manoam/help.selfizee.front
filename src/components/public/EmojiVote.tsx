import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type VoteTally, type VoteValue } from "../../lib/api";

const EMOJIS: { value: VoteValue; emoji: string; label: string }[] = [
  { value: "SAD", emoji: "😞", label: "Pas utile" },
  { value: "NEUTRAL", emoji: "😐", label: "Moyen" },
  { value: "HAPPY", emoji: "😀", label: "Très utile" },
];

export function EmojiVote({ postId }: { postId: number }) {
  const qc = useQueryClient();

  const { data: tally } = useQuery({
    queryKey: ["vote", postId],
    queryFn: async () => {
      const { data } = await api.get<VoteTally>(`/votes/by-post/${postId}`);
      return data;
    },
  });

  const setVote = useMutation({
    mutationFn: async (value: VoteValue) => {
      const { data } = await api.put(`/votes/by-post/${postId}`, { value });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vote", postId] }),
  });

  const removeVote = useMutation({
    mutationFn: async () => {
      await api.delete(`/votes/by-post/${postId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vote", postId] }),
  });

  return (
    <div className="bg-[--a-surface-3] rounded-xl p-5 md:p-6 mt-6">
      <p className="text-sm font-semibold text-[--a-text] mb-1 text-center">
        Cet article vous a-t-il aidé ?
      </p>
      <p className="text-xs text-[--a-text-muted] mb-4 text-center">
        Cliquez sur l'emoji qui correspond à votre ressenti.
      </p>
      <div className="flex items-center justify-center gap-3 md:gap-6">
        {EMOJIS.map(({ value, emoji, label }) => {
          const isMine = tally?.myVote === value;
          const count = tally?.tally?.[value] ?? 0;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (isMine) removeVote.mutate();
                else setVote.mutate(value);
              }}
              disabled={setVote.isPending || removeVote.isPending}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition disabled:opacity-50 ${
                isMine
                  ? "bg-white shadow-md ring-2 ring-[--a-accent]"
                  : "hover:bg-white"
              }`}
              title={label}
            >
              <span className="text-3xl md:text-4xl">{emoji}</span>
              <span className="text-[10px] uppercase font-semibold tracking-wide text-[--a-text-muted]">
                {label}
              </span>
              <span className="text-xs font-semibold text-[--a-text]">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
