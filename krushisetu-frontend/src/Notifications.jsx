import { useEffect, useState } from "react";
import { useAuth } from "./context/useAuth";
import api, { getErrorMessage } from "./lib/api";
import { EmptyState, ErrorState, SkeletonGrid } from "./components/PageState";

const notificationIcons = {
  order_placed: "📦",
  order_accepted: "✅",
  order_delivered: "🚚",
  payment_received: "💳",
  new_vegetable: "🥬",
  review_received: "⭐",
  refund_issued: "💰"
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        setError("");
        const res = await api.get("/notifications");
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load notifications"));
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to mark notification as read"));
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((currentNotifications) => currentNotifications.map((notification) => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to mark all notifications as read"));
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((currentNotifications) => currentNotifications.filter((notification) => notification._id !== notificationId));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete notification"));
    }
  };

  if (!isAuthenticated) {
    return <ErrorState title="Sign in required" message="Please log in to open your notifications center." />;
  }

  if (loading) {
    return <div className="page-shell"><SkeletonGrid count={5} /></div>;
  }

  if (error && notifications.length === 0) {
    return <ErrorState title="Unable to load notifications" message={error} />;
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="page-hero animate-enter">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-100">Notification Center</p>
              <h1 className="mt-4 text-4xl font-black md:text-5xl">Stay on top of every marketplace update.</h1>
              <p className="mt-3 max-w-2xl text-emerald-50/90">
                Order events, payment updates, and platform activity land here in a cleaner inbox-style feed.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-black">{notifications.length}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Total</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-black">{unreadCount}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Unread</p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "Everything is up to date."}
            </p>
          </div>
          {unreadCount > 0 ? (
            <button onClick={markAllAsRead} className="btn-secondary">
              Mark All as Read
            </button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            subtitle="When orders, payments, reviews, or platform events happen, they will appear here automatically."
          />
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <article
                key={notification._id}
                className={`surface-panel cursor-pointer p-6 transition animate-enter-delay-${Math.min(index + 1, 3)} ${
                  notification.read
                    ? "border-l-4 border-l-slate-300"
                    : "border-l-4 border-l-cyan-500 bg-cyan-50/70 dark:bg-cyan-500/5"
                }`}
                onClick={() => !notification.read && markAsRead(notification._id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-sm dark:bg-slate-800/80">
                      {notificationIcons[notification.type] || "📢"}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">{notification.title}</h3>
                        {!notification.read ? (
                          <span className="rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200">
                            New
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-slate-600 dark:text-slate-300">{notification.message}</p>
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(notification.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
