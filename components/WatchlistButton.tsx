"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addWatchlistItem, removeWatchlistItem } from "@/lib/actions/watchlist.actions";

const messageForError = (error: string) => {
  if (error === "invalid_input") return "Enter a valid stock symbol and company name.";
  if (error === "invalid_symbol") return "That symbol is not a supported stock.";
  if (error === "unauthorized") return "Sign in to manage your watchlist.";
  return "Your watchlist could not be updated. Please try again.";
};

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  watchlistAvailable = true,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState(isInWatchlist);
  const [loading, setLoading] = useState(false);

  useEffect(() => setAdded(isInWatchlist), [isInWatchlist]);

  const handleClick = async () => {
    if (loading || !watchlistAvailable) return;
    const next = !added;
    setLoading(true);

    try {
      const result = next
        ? await addWatchlistItem({ symbol, company })
        : await removeWatchlistItem(symbol);

      if (!result.success) {
        toast.error(messageForError(result.error));
        return;
      }

      setAdded(next);
      onWatchlistChange?.(symbol, next);
    } catch {
      toast.error("Your watchlist could not be updated. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = added ? "Remove from Watchlist" : "Add to Watchlist";
  const title = !watchlistAvailable
    ? "Watchlist is temporarily unavailable"
    : loading
      ? "Updating watchlist"
      : added
        ? `Remove ${company} from watchlist`
        : `Add ${company} to watchlist`;

  if (type === "icon") {
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-pressed={added}
        aria-busy={loading}
        disabled={loading || !watchlistAvailable}
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={added ? "#FACC15" : "none"}
          stroke="#FACC15"
          strokeWidth="1.5"
          className="watchlist-star"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        className={`watchlist-btn ${added ? "watchlist-remove" : ""}`}
        onClick={handleClick}
        title={title}
        aria-pressed={added}
        aria-busy={loading}
        disabled={loading || !watchlistAvailable}
      >
        {showTrashIcon && added ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
          </svg>
        ) : null}
        <span>{loading ? "Saving..." : actionLabel}</span>
      </button>
      {!watchlistAvailable && (
        <p role="status" className="text-sm text-gray-500">Watchlist unavailable. Please refresh and try again.</p>
      )}
    </div>
  );
};

export default WatchlistButton;
