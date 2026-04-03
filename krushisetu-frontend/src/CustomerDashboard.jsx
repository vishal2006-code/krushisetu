import { useState, useEffect } from "react";
import OrderForm from "./components/OrderForm";
import Chatbot from "./components/Chatbot";

function CustomerDashboard() {
  const [openChat, setOpenChat] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // 🔥 MESSAGE BUBBLE LOGIC
  useEffect(() => {
    const showTimer = setTimeout(() => setShowHint(true), 1000);
    const hideTimer = setTimeout(() => setShowHint(false), 6000);

    const interval = setInterval(() => {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 5000);
    }, 15000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="page-shell relative">
      <div className="mx-auto max-w-7xl space-y-8">

        <section className="page-hero animate-enter">
          <h1 className="text-4xl font-black text-white">
            Order Fresh Produce And Grains
          </h1>
        </section>

        <section>
          <OrderForm />
        </section>
      </div>

      {/* 🔘 BUTTON (fixed always) */}
      <button
        onClick={() => {
          setOpenChat(!openChat);
          setShowHint(false);
        }}
        className="fixed bottom-6 right-6 bg-emerald-600 text-white w-16 h-16 rounded-full shadow-lg text-2xl flex items-center justify-center hover:bg-emerald-700 z-50"
      >
        💬
      </button>

      {/* 💬 MESSAGE BUBBLE (separate - no movement) */}
      {showHint && !openChat && (
        <div className="fixed bottom-24 right-6 w-64 bg-white text-gray-800 p-3 rounded-xl shadow-lg text-sm z-50 animate-bounce">
          👋 Hi! I’m here to help you find vegetables and place orders.
        </div>
      )}

      {/* 🔥 CHAT POPUP */}
      {openChat && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          
          <div className="bg-emerald-600 text-white px-4 py-3 flex justify-between items-center">
            <span className="font-bold">KrushiSetu Chat</span>
            <button onClick={() => setOpenChat(false)}>✖</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Chatbot />
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;
