import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

export default function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Instantly routes Stripe callbacks successfully into the local interceptor
                return_url: `${window.location.origin}/booking-success`, 
            },
        });

        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message);
        } else {
            setMessage("An unexpected error occurred.");
        }

        setIsLoading(false);
    };

    return (
        <form className="payment-form" onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" />
            <button className="btn-primary pay-button" disabled={isLoading || !stripe || !elements} id="submit">
                <span id="button-text">
                    {isLoading ? <div className="spinner" id="spinner"></div> : "Pay Now & Confirm Booking"}
                </span>
            </button>
            {/* Show any error or success messages */}
            {message && <div id="payment-message" className="payment-message">{message}</div>}
        </form>
    );
}
