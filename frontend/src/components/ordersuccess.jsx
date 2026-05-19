import { useNavigate } from "react-router-dom";
import "./css_fiels/ordersuccess.css"

function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <div className="success-container">

      <div className="success-card">

        <h1>🎉 Order Placed Successfully!</h1>

        <p>Your delicious food is on the way 🚀</p>

        <div className="actions">
          <button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>

          {/* <button onClick={() => navigate("/")}>
            View Orders
          </button> */}
        </div>

      </div>

    </div>
  );
}

export default OrderSuccess;
