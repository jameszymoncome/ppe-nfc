import React, { useState } from "react";
import Swal from "sweetalert2";
import { BASE_URL } from "../utils/connection";
import lgu_seal from "/assets/images/lgu_seal.png"; // Make sure this path is correct

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const sendReset = async () => {
    if (!email.trim()) {
      Swal.fire("Error", "Please enter your email address.", "error");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/send_reset_email.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire(
          "Email Sent",
          "Check your inbox for the reset link.",
          "success"
        );
        setEmail(""); // Clear input after sending
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (err) {
      Swal.fire(
        "Network Error",
        "Unable to connect to the server. Try again later.",
        "error"
      );
      console.error("Reset error:", err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={lgu_seal} alt="LGU Seal" className="w-16 h-16" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">
          Reset Your Password
        </h2>

        {/* Instruction */}
        <p className="text-center text-gray-600 text-sm mb-6">
          Enter your user account's verified email address and we will send you
          a password reset link.
        </p>

        {/* Email Input */}
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Send Button */}
        <button
          onClick={sendReset}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
        >
          Send Reset Link
        </button>
      </div>
    </div>
  );
}
