import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { BASE_URL } from '../utils/connection';

const initialForm = {
  lastname: '',
  firstname: '',
  middlename: '',
  suffix: '',
  email: '',
  contactNumber: '',
  username: '',
  password: '',
  department: '',
  position: ''
};

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    // Fetch departments list
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${BASE_URL}/get_departments.php`);
        const data = await res.json();
        if (data.success) {
          setDepartments(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Limit contactNumber to 11 digits and numeric
    if (name === 'contactNumber' && !/^\d{0,11}$/.test(value)) return;

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{11}$/.test(formData.contactNumber)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Contact Number',
        text: 'Contact number must be exactly 11 digits.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/signup.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Account Created!',
          text: 'You can now log in.',
          confirmButtonColor: '#3b82f6'
        }).then(() => navigate('/'));
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Signup Failed',
          text: result.message || 'An error occurred.',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Please try again later.',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Create Your Account</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(initialForm).map(([key, _]) => (
            <div key={key} className={['position', 'department'].includes(key) ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
                {['lastname','firstname','email','username','password','department','position'].includes(key) && ' *'}
              </label>

              {key === 'suffix' ? (
                <select
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">N/A</option>
                  <option value="Jr.">Jr.</option>
                  <option value="Sr.">Sr.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                </select>
              ) : key === 'department' ? (
                <select
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.entity_id} value={dept.entity_name}>
                      {dept.entity_name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={key === 'password' ? 'password' : 'text'}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  required={['lastname','firstname','email','username','password','department','position'].includes(key)}
                  placeholder={key === 'contactNumber' ? 'e.g. 09123456789' : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          ))}
          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Register
            </button>
            <p
              className="text-sm text-center text-gray-600 mt-4 cursor-pointer hover:underline"
              onClick={() => navigate('/')}
            >
              Already have an account? Log in
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
