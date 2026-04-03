import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./context/useAuth";
import api, { getErrorMessage } from "./lib/api";
import { getVegetableIcon } from "./utils/vegetableIcons";
import { formatINR } from "./utils/formatters";
import { EmptyState, ErrorState, SkeletonGrid } from "./components/PageState";

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchFavorites = async () => {
      try {
        setError(null);
        const res = await api.get("/favorites");
        setFavorites(res.data);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load favorites"));
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated]);

  const removeFavorite = async (vegetableId) => {
    try {
      setRemovingId(vegetableId);
      await api.delete(`/favorites/${vegetableId}`);
      setFavorites((currentFavorites) => currentFavorites.filter((favorite) => favorite.vegetable._id !== vegetableId));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove favorite"));
    } finally {
      setRemovingId("");
    }
  };

  const favoriteSummary = useMemo(() => {
    const totalItems = favorites.length;
    const totalValue = favorites.reduce((sum, favorite) => sum + Number(favorite.vegetable?.price || 0), 0);

    return { totalItems, totalValue };
  }, [favorites]);

  const getUnitLabel = (unit) => (unit === "quintal" ? "quintal" : "kg");

  if (!isAuthenticated) {
    return <ErrorState title="Sign in required" message="Please log in to view your favorite products." />;
  }

  if (loading) {
    return <div className="page-shell"><SkeletonGrid count={6} /></div>;
  }

  if (error && favorites.length === 0) {
    return <ErrorState title="Unable to load favorites" message={error} />;
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="page-hero animate-enter">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-100">Favorites</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">Saved products you want to revisit.</h1>
              <p className="mt-3 max-w-2xl text-emerald-50/90">
                Keep your best products in one premium shelf so reordering feels fast and effortless.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-black">{favoriteSummary.totalItems}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Saved</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-black">{formatINR(favoriteSummary.totalValue)}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Value</p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {error}
          </div>
        ) : null}

        {favorites.length === 0 ? (
          <EmptyState
            title="No favorites yet"
            subtitle="Start saving products from the customer dashboard and they will appear here in your curated list."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((favorite, index) => (
              <article
                key={favorite._id}
                className={`glass-card overflow-hidden p-0 animate-enter-delay-${Math.min(index + 1, 3)}`}
              >
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-emerald-100 via-cyan-50 to-white text-6xl dark:from-emerald-950/70 dark:via-cyan-950/40 dark:to-slate-900">
                  {getVegetableIcon(favorite.vegetable?.name, favorite.vegetable?.emoji)}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">{favorite.vegetable?.name}</h3>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
                        {favorite.vegetable?.category || "Vegetable"}
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {formatINR(favorite.vegetable?.price)}/{getUnitLabel(favorite.vegetable?.unit)}
                    </div>
                  </div>

                  {favorite.notes ? (
                    <p className="mt-5 rounded-2xl border border-slate-200/70 bg-slate-50/90 p-4 text-sm italic text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                      {favorite.notes}
                    </p>
                  ) : null}

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => removeFavorite(favorite.vegetable._id)}
                      disabled={removingId === favorite.vegetable._id}
                      className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                    >
                      {removingId === favorite.vegetable._id ? "Removing..." : "Remove Favorite"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
