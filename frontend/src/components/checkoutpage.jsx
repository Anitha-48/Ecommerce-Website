import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./css_fiels/checkoutpage.css";
import { API_BASE_URL } from "../api";

let razorpayScriptPromise;

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.querySelector("#razorpay-checkout-script")
      || document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const loaded = Boolean(window.Razorpay);
      if (!loaded) {
        script.remove();
        razorpayScriptPromise = undefined;
      }
      resolve(loaded);
    };
    script.onerror = () => {
      script.remove();
      razorpayScriptPromise = undefined;
      resolve(false);
    };
    if (!script.isConnected) document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ address: "", phone: "" });
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}cart/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    })
      .then((response) => setCart(response.data))
      .catch(() => toast.error("Could not load your cart. Please try again."));
  }, []);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * Number(item.product_price || 0),
    0
  );
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleOrder = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      toast.error("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      if (paymentMethod === "cod") {
        const response = await axios.post(
          `${API_BASE_URL}order/`,
          { ...form, payment_method: "cod" },
          { headers }
        );
        navigate("/ordersuccess", {
          state: { orderId: response.data.order_id, paymentMethod: "cod" },
        });
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Could not load Razorpay checkout. Please try again.");
        setSubmitting(false);
        return;
      }

      const { data: order } = await axios.post(
        `${API_BASE_URL}order/`,
        { ...form, payment_method: "razorpay" },
        { headers }
      );

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Thamizhan Treats",
        description: "Traditional foods order",
        order_id: order.razorpay_order_id,
        handler: async (payment) => {
          try {
            await axios.post(
              `${API_BASE_URL}payments/razorpay/verify/`,
              {
                order_id: order.order_id,
                razorpay_order_id: payment.razorpay_order_id,
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_signature: payment.razorpay_signature,
              },
              { headers }
            );
            navigate("/ordersuccess", {
              state: { orderId: order.order_id, paymentMethod: "razorpay" },
            });
          } catch (error) {
            toast.error(
              error.response?.data?.error || "Payment verification failed."
            );
          } finally {
            setSubmitting(false);
          }
        },
        prefill: { name: localStorage.getItem("username") || "" },
        theme: { color: "#9d3325" },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });

      checkout.open();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Could not place your order."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Checkout</h1>

      <form onSubmit={handleOrder}>
        <label htmlFor="delivery-address">Delivery address</label>
        <textarea
          id="delivery-address"
          name="address"
          placeholder="Enter your full delivery address"
          value={form.address}
          onChange={handleChange}
          maxLength={1000}
          required
        />

        <label htmlFor="delivery-phone">Phone number</label>
        <input
          id="delivery-phone"
          name="phone"
          type="tel"
          placeholder="Phone number for delivery"
          value={form.phone}
          onChange={handleChange}
          maxLength={30}
          required
        />

        <fieldset className="payment-options">
          <legend>Payment method</legend>
          <label>
            <input
              type="radio"
              name="payment-method"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={(event) => setPaymentMethod(event.target.value)}
            />
            Cash on delivery
          </label>
          <label>
            <input
              type="radio"
              name="payment-method"
              value="razorpay"
              checked={paymentMethod === "razorpay"}
              onChange={(event) => setPaymentMethod(event.target.value)}
            />
            Pay online with Razorpay
          </label>
          {paymentMethod === "razorpay" && (
            <p className="payment-help">
              Online checkout requires Razorpay keys to be configured on the server.
            </p>
          )}
        </fieldset>

        <div className="total-box">
          <p>Items total: ₹{subtotal.toFixed(2)}</p>
          <p>Delivery: ₹{deliveryFee.toFixed(2)}</p>
          <h3>Total payable: ₹{total.toFixed(2)}</h3>
        </div>

        <button className="checkout-btn" type="submit" disabled={submitting || !cart.length}>
          {submitting ? "Processing..." : "Place order"}
        </button>
      </form>
    </div>
  );
}

export default Checkout;
