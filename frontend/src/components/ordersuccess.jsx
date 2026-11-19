import { useLocation, useNavigate } from "react-router-dom";
import "./css_fiels/ordersuccess.css"

function OrderSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();

  return (
    <div className="success-container">

      <div className="success-card">

        <h1>🎉 Order Placed Successfully!</h1>

        {state?.orderId && <p>Order number: #{state.orderId}</p>}
        <p>
          {state?.paymentMethod === "cod"
            ? "Pay cash when your order arrives."
            : "Your payment is confirmed. Your order is being prepared."}
        </p>

        <div className="actions">
          <button onClick={() => navigate("/dashboard")}>
            Continue shopping
          </button>
          <button onClick={() => navigate("/orders")}>
            View orders
          </button>
        </div>

      </div>

    </div>
  );
}

export default OrderSuccess;
