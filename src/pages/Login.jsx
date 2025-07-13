import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import lgu_seal from '/assets/images/lgu_seal.png';
import img_1 from '/assets/images/login_image1.png';
import { BASE_URL } from '../utils/connection'; // Ensure this path is correct

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();
      console.log(data);

      if (data.success) {
        // Save user info in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('rememberMe', rememberMe);
        localStorage.setItem('lastLogin', new Date().toISOString());
        localStorage.setItem('firstName', data.firstName);
        localStorage.setItem('lastname', data.lastname);
        localStorage.setItem('accessLevel', data.accessLevel);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('department', data.department);
        localStorage.setItem('email', data.email);
        localStorage.setItem('contactNumber', data.contactNumber);

        console.log('User role:', data.accessLevel);

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: `Welcome back, ${data.firstName || username}!`,
          showConfirmButton: false,
          timer: 500,
          timerProgressBar: true,
          toast: true,
          position: 'top-end'
        }).then(() => {
          if (data.accessLevel === "ADMIN") {
            navigate('/dashboard');
          } else if (data.accessLevel === "GSO EMPLOYEE") {
            navigate('/gso-employee-dashboard');
          } else if (data.accessLevel === "INVENTORY COMMITTEE") {
            navigate('/inv-com-dashboard');
          } else {
            navigate('/end-user-dashboard');
          }
        });

      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: data.message || 'Invalid credentials. Please try again.',
          confirmButtonText: 'Try Again',
          confirmButtonColor: '#ef4444'
        });
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to the server. Please check your internet connection and try again.',
        confirmButtonText: 'Retry',
        confirmButtonColor: '#ef4444'
      });
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white-400">
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden max-w-4xl w-full mx-4 flex">
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 p-8">
          <div className="text-center mb-8">
            <img src={lgu_seal} alt="LGU Seal" className="w-16 h-16 object-cover mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Property, Plant and Equipment
            </h2>
            <p className="text-gray-600">Management System</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username*
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password*
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <button type="button" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Right Side - Image */}
        <div className="hidden md:block md:w-1/2 relative">
          <img
            src={img_1}
            alt="Login Visual"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
