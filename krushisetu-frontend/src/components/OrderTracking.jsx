function TrackingIcon({ symbol, active }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-all duration-500 ${
        active ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-100 text-slate-400"
      }`}
    >
      {symbol}
    </span>
  );
}

const steps = [
  { status: "placed", label: "Order Placed", icon: "OP" },
  { status: "pending_farmer_acceptance", label: "Finding Farmer", icon: "FF" },
  { status: "accepted_by_farmer", label: "Farmer Accepted", icon: "FA" },
  { status: "pickup_assigned", label: "Pickup Assigned", icon: "PA" },
  { status: "picked_from_farmer", label: "Picked From Farmer", icon: "PF" },
  { status: "arrived_at_hub", label: "Reached Hub", icon: "RH" },
  { status: "packaged", label: "Packaged", icon: "PK" },
  { status: "out_for_delivery", label: "Out for Delivery", icon: "OD" },
  { status: "delivered", label: "Delivered", icon: "DL" }
];

const statusProgressIndex = {
  placed: 0,
  pending_farmer_acceptance: 1,
  accepted_by_farmer: 2,
  pickup_assigned: 3,
  picked_from_farmer: 4,
  arrived_at_hub: 5,
  packaged: 6,
  delivery_assigned: 7,
  out_for_delivery: 7,
  delivered: 8,
  cancelled: 0
};

function OrderTracking({ currentStatus, compact = false }) {
  const safeStatus = currentStatus || "placed";
  const currentStepIndex = statusProgressIndex[safeStatus] ?? 0;

  return (
    <div
      className={`w-full rounded-3xl border border-emerald-100 bg-white ${
        compact ? "p-4 shadow-sm" : "mx-auto max-w-md p-6 shadow-xl"
      }`}
    >
      <h2
        className={`font-black text-emerald-900 ${
          compact ? "mb-5 text-left text-lg" : "mb-8 text-center text-xl"
        }`}
      >
        Live Tracking
      </h2>

      <div className="relative">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.status} className="flex">
              <div className={`${compact ? "mr-3" : "mr-4"} flex flex-col items-center`}>
                <TrackingIcon symbol={step.icon} active={isCompleted} />
                {!isLast && (
                  <div
                    className={`${compact ? "min-h-10" : "min-h-12"} w-1 flex-1 transition-all duration-500 ${
                      index < currentStepIndex ? "bg-emerald-600" : "bg-slate-100"
                    }`}
                  />
                )}
              </div>

              <div className={`${compact ? "pb-6" : "pb-8"} pt-1`}>
                <p
                  className={`font-bold uppercase tracking-wider ${
                    compact ? "text-xs sm:text-sm" : "text-sm"
                  } ${isCompleted ? "text-emerald-900" : "text-slate-300"}`}
                >
                  {step.label}
                </p>
                <p
                  className={`mt-1 ${
                    isCurrent ? "text-slate-600" : "text-slate-400"
                  } ${compact ? "text-xs" : "text-sm"}`}
                >
                  {isCurrent ? "Currently in progress" : index < currentStepIndex ? "Completed" : "Pending"}
                </p>
                {isCurrent && (
                  <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                    CURRENT STATUS
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderTracking;
