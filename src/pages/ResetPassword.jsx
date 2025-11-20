import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { BASE_URL } from "../utils/connection";
import lgu_seal from "/assets/images/lgu_seal.png"; // adjust path if needed

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [valid, setValid] = useState(false);
  const [userId, setUserId] = useState(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // VERIFY TOKEN
  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${BASE_URL}/verify_reset_token.php?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setValid(true);
          setUserId(data.user_id);
        } else {
          Swal.fire("Invalid Link", data.message, "error");
        }
      } catch (err) {
        Swal.fire("Error", "Unable to verify token.", "error");
      }
    };
    verify();
  }, [token]);

  // UPDATE PASSWORD FUNCTION
  const updatePassword = async () => {
    if (password.length < 6) {
      Swal.fire("Error", "Password must be at least 6 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire("Error", "Passwords do not match.", "error");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/update_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire("Success", "Your password has been updated!", "success");
        window.location.href = "/login";
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (err) {
      Swal.fire("Network Error", "Unable to update password.", "error");
    }
  };

  if (!valid) return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={lgu_seal} alt="LGU Logo" className="w-16 h-16" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-4">Reset Password</h2>

        <input
          type="password"
          placeholder="New password"
          className="w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm new password"
          className="w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={updatePassword}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
        >
          Update Password
        </button>
      </div>
    </div>
  );
}
