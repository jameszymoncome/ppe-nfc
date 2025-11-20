import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import lgu_seal from '/assets/images/lgu_seal.png';
import img_1 from '/assets/images/login_image1.png';
import { BASE_URL } from '../utils/connection';
import { connectWebSocket, sendMessage } from '../components/websocket';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [signupData, setSignupData] = useState({
    lastname: '',
    firstname: '',
    middlename: '',
    suffix: '',
    email: '',
    contactNumber: '',
    username: '',
    password: '',
    department: '',
    position: '',
  });

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotPassword = async () => {
  const { value: email } = await Swal.fire({
    title: "Reset Password",
    text: "Enter your email to receive a reset link",
    input: "email",
    inputPlaceholder: "your@email.com",
    showCancelButton: true,
    confirmButtonText: "Send Reset Link",
    confirmButtonColor: "#2563eb"
  });

  if (!email) return;

  try {
    const response = await fetch(`${BASE_URL}/forgot_password.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Email Sent!",
        text: "A password reset link has been sent to your email.",
        confirmButtonColor: "#2563eb"
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message,
        confirmButtonColor: "#ef4444"
      });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: "Cannot connect to server.",
      confirmButtonColor: "#ef4444"
    });
  }
};


  // Form validation
  const validateLoginForm = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const validateSignupForm = () => {
    const required = ['lastname', 'firstname', 'email', 'contactNumber', 'username', 'password', 'department', 'position'];
    for (let field of required) {
      if (!signupData[field].trim()) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
          confirmButtonColor: '#ef4444'
        });
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter a valid email address',
        confirmButtonColor: '#ef4444'
      });
      return false;
    }

    // Password validation
    if (signupData.password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Password must be at least 6 characters long',
        confirmButtonColor: '#ef4444'
      });
      return false;
    }

    // Contact number validation - must be exactly 11 digits
    if (!/^\d{11}$/.test(signupData.contactNumber)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Contact Number',
        text: 'Contact number must be exactly 11 digits.',
        confirmButtonColor: '#ef4444'
      });
      return false;
    }

    return true;
  };

  //useEffect to fetch departments
    useEffect(() => {
      const fetchDepartments = async () => {
        try {
          const response = await fetch(`${BASE_URL}/get_departments.php`);
          const data = await response.json();
          if (data.success) {
            setDepartments(data.data);
          }
        } catch (error) {
          console.error('Error fetching departments:', error);
        }
      };
  
      fetchDepartments();
    }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateLoginForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Check if account is still pending
        if (data.acc_status === "Pending") {
          Swal.fire({
            icon: 'warning',
            title: 'Account Pending',
            text: 'Your account is still waiting for approval. Please contact the administrator.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f59e0b'
          });
          return;
        }

        // Save user info in localStorage
        const userInfo = {
          token: data.token,
          firstName: data.firstName,
          lastname: data.lastname,
          accessLevel: data.accessLevel,
          position: data.position,
          userId: data.userId,
          department: data.department,
          email: data.email,
          contactNumber: data.contactNumber,
          acc_status: data.acc_status,
          lastLogin: new Date().toISOString(),
          rememberMe
        };

        // Store user data
        Object.entries(userInfo).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        });

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: `Welcome back, ${data.firstName || username}!`,
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          toast: true,
          position: 'top-end'
        });

        connectWebSocket(true);

        // Redirect based on access level
        const routes = {
          "SUPER ADMIN": '/dashboard',
          "ADMIN": '/ad-dashboard',
          "EMPLOYEE": '/em-dashboard',
          "INVENTORY COMMITTEE": '/inv-com-dashboard'
        };
        
        navigate(routes[data.accessLevel] || '/end-user-dashboard');

      } else {
        throw new Error(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      const isNetworkError = err.name === 'TypeError' || err.message.includes('fetch');
      
      Swal.fire({
        icon: 'error',
        title: isNetworkError ? 'Network Error' : 'Login Failed',
        text: isNetworkError 
          ? 'Unable to connect to the server. Please check your internet connection.' 
          : err.message || 'Something went wrong. Please try again.',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444'
      });
      
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateSignupForm()) {
      return;
    }

    setSignupLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/signup.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signupData,
          lastname: signupData.lastname.trim(),
          firstname: signupData.firstname.trim(),
          middlename: signupData.middlename.trim(),
          email: signupData.email.trim().toLowerCase(),
          username: signupData.username.trim(),
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Account Created!',
          text: 'Your account has been created successfully. Please wait for admin approval before logging in.',
          confirmButtonColor: '#3b82f6'
        });
        
        // Reset form and close modal
        setSignupData({
          lastname: '',
          firstname: '',
          middlename: '',
          suffix: '',
          email: '',
          contactNumber: '',
          username: '',
          password: '',
          department: '',
          position: '',
        });
        setIsSignupOpen(false);
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      
      const isNetworkError = err.name === 'TypeError' || err.message.includes('fetch');
      
      Swal.fire({
        icon: 'error',
        title: isNetworkError ? 'Network Error' : 'Registration Failed',
        text: isNetworkError 
          ? 'Unable to connect to the server. Please try again later.' 
          : err.message || 'Something went wrong during registration.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleSignupInputChange = (field, value) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
  };

  const closeSignupModal = () => {
    setIsSignupOpen(false);
    setSignupData({
      lastname: '',
      firstname: '',
      middlename: '',
      suffix: '',
      email: '',
      contactNumber: '',
      username: '',
      password: '',
      department: '',
      position: '',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username*
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
                disabled={loading}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <div className="text-sm text-center text-gray-700 mt-4">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignupOpen(true)}
                className="text-blue-600 hover:underline transition-colors"
                disabled={loading}
              >
                Sign up
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

      {/* Signup Modal */}
      {isSignupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeSignupModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              disabled={signupLoading}
            >
              ×
            </button>
            
            <h2 className="text-xl font-semibold text-center mb-4">Create Account</h2>
            
            <form onSubmit={handleSignup}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name*
                  </label>
                  <input
                    type="text"
                    value={signupData.lastname}
                    onChange={(e) => handleSignupInputChange('lastname', e.target.value)}
                    required
                    disabled={signupLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name*
                  </label>
                  <input
                    type="text"
                    value={signupData.firstname}
                    onChange={(e) => handleSignupInputChange('firstname', e.target.value)}
                    required
                    disabled={signupLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={signupData.middlename}
                    onChange={(e) => handleSignupInputChange('middlename', e.target.value)}
                    disabled={signupLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={signupData.suffix}
                    onChange={(e) => handleSignupInputChange('suffix', e.target.value)}
                    disabled={signupLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Jr., Sr., III, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email*
                  </label>
                  <input
                    type="email"
                    value={signupData.email}
                    onChange={(e) => handleSignupInputChange('email', e.target.value)}
                    required
                    disabled={signupLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number*
                  </label>
                  <input
                    type="text"
                    value={signupData.contactNumber}
                    onChange={(e) => handleSignupInputChange('contactNumber', e.target.value)}
                    required
                    disabled={signupLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="09XXXXXXXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username*
                  </label>
                  <input
                    type="text"
                    value={signupData.username}
                    onChange={(e) => handleSignupInputChange('username', e.target.value)}
                    required
                    disabled={signupLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password*
                  </label>
                  <input
                    type="password"
                    value={signupData.password}
                    onChange={(e) => handleSignupInputChange('password', e.target.value)}
                    required
                    disabled={signupLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department*
                  </label>
                  <select
                    value={signupData.department}
                    onChange={(e) => handleSignupInputChange('department', e.target.value)}
                    required
                    disabled={signupLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="">Select department</option>
                            {departments.map(dept => (
                              <option key={dept.entity_id} value={dept.entity_name}>
                                {dept.entity_name}
                              </option>
                            ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position*
                  </label>
                  <input
                    type="text"
                    value={signupData.position}
                    onChange={(e) => handleSignupInputChange('position', e.target.value)}
                    required
                    disabled={signupLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {signupLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isForgotOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
          <button
            onClick={() => setIsForgotOpen(false)}
            className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold text-center mb-4">Forgot Password</h2>
          <p className="text-gray-600 text-sm mb-4">
            Enter your email address and we will send a password reset link.
          </p>

          <input
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-500"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </button>
        </div>
      </div>
    )}
    </div>
  );
};

export default Login;