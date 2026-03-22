import OrderForm from "./components/OrderForm";
import Chatbot from "./components/Chatbot";

function CustomerDashboard() {
  return (
    <div className="space-y-2">
      <OrderForm />
      <div className="page-shell pt-0">
        <div className="mx-auto max-w-7xl">
          <Chatbot />
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
