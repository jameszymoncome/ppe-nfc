import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Search, X, PlusCircle, Trash2, Eye, Replace } from 'lucide-react';
import { BASE_URL } from '../utils/connection';
import Swal from 'sweetalert2';

const initialForm = {
  lastname: '',
  firstname: '',
  middlename: '',
  suffix: '',
  email: '',
  contactNumber: '',
  username: '',
  password: '',
  role: '',
  department: '',
  position: '',
};

const Accounts = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [userToApprove, setUserToApprove] = useState(null);
  const [approvalRole, setApprovalRole] = useState('');
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [userToReplace, setUserToReplace] = useState(null);
  const [selectedReplacement, setSelectedReplacement] = useState('');

  const firstName = localStorage.getItem('firstName') || '';
  const lastName = localStorage.getItem('lastname') || '';

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const fetchUsers = () => {
    fetch(`${BASE_URL}/retrieve_users.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.data);
      });
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
  e.preventDefault();
  setLoading(true);
  setMessage({ text: '', type: '' });
  
  try {
    const res = await fetch(`${BASE_URL}/add_account.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!/^\d{11}$/.test(form.contactNumber)) {
      setMessage({
        type: 'error',
        text: 'Contact number must be exactly 11 digits and numeric only.',
      });
      return;
    }
    
    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Account Successfully Created',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#2563eb', // Tailwind blue-600
      });
      setForm(initialForm);
      setTimeout(() => {
        setShowAddModal(false);
        setShowSuccessModal(false);
        fetchUsers();
      }, 2000);
    } else {
      setMessage({ text: data.message, type: 'error' });
    }
  } catch (error) {
    setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async () => {
  if (!userToDelete) return;
  
  try {
    const res = await fetch(`${BASE_URL}/delete_account.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userToDelete,
        requester_id: localStorage.getItem('userId'),
        requester_role: localStorage.getItem('accessLevel'),
      }),
    });
    const data = await res.json();
    
    if (data.success) {
      setUsers(users.filter(u => u.user_id !== userToDelete));
      Swal.fire({
        icon: 'success',
        title: 'Account Successfully Deleted',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#2563eb', // Tailwind blue-600
      });

      setTimeout(() => setShowDeleteSuccess(false), 2000);
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert('Failed to delete account. Please try again.');
  } finally {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  }
};

  const handleApprove = async (userId) => {
  try {
    const res = await fetch(`${BASE_URL}/approve_account.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await res.json();
    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Account Approved',
        confirmButtonColor: '#2563eb',
      });
      fetchUsers();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Approval Failed',
        text: data.message || 'Could not approve account.',
        confirmButtonColor: '#ef4444',
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Network Error',
      text: 'Failed to connect to the server.',
      confirmButtonColor: '#ef4444',
    });
  }
};


  const handleApproveWithRole = async () => {
  if (!userToApprove || !approvalRole) return;

  try {
    const res = await fetch(`${BASE_URL}/approve_account.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userToApprove.user_id,
        role: approvalRole
      })
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Account Approved',
        confirmButtonColor: '#2563eb',
      });
      fetchUsers();
      setShowApproveModal(false);
      setUserToApprove(null);
      setApprovalRole('');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Approval Failed',
        text: data.message || 'Could not approve account.',
        confirmButtonColor: '#ef4444',
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Network Error',
      text: 'Failed to connect to the server.',
      confirmButtonColor: '#ef4444',
    });
  }
};



  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Accounts Management</h1>
            <p className="text-sm text-gray-600">
              Welcome back, {firstName && lastName ? `${firstName} ${lastName}` : 'User'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              <PlusCircle size={16} />
              <span>Add Account</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-blue-800">Accounts List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? 'No matching accounts found' : 'No accounts available'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {user.role}
                        </span>
                        <span className={`ml-2 text-xs ${user.acc_status === 'Pending' ? 'text-yellow-500' : 'text-green-600'}`}>
                          ({user.acc_status})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            title="View details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user.user_id);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1"
                            title="Delete account"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                          {user.acc_status === 'Pending' && (
                            <button
                              onClick={() => {
                                setUserToApprove(user);
                                setApprovalRole(''); // reset
                                setShowApproveModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1"
                              title="Approve account"
                            >
                              <PlusCircle size={14} />
                              <span>Approve</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setUserToReplace(user);
                              setShowReplaceModal(true);
                              setSelectedReplacement('');
                            }}
                            className="text-yellow-600 hover:text-yellow-800 flex items-center gap-1"
                            title="Replace account"
                          >
                            <Replace size={14} />
                            <span>Replace</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Account Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-blue-800">Create New Account</h3>
                  <button 
                    onClick={() => setShowAddModal(false)} 
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {Object.entries(initialForm).map(([key, _]) => (
                      <div key={key} className={['role', 'password', 'department', 'position'].includes(key)
                        ? 'md:col-span-2'
                        : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')} {['lastname','firstname','email','username','password','role','department','position'].includes(key) && '*'}
                        </label>
                        {key === 'role' ? (
                          <select
                            name={key}
                            value={form[key]}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select role</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="DEPARTMENT HEAD">DEPARTMENT HEAD</option>
                            <option value="END USER">END USER</option>
                            <option value="GSO EMPLOYEE">GSO EMPLOYEE</option>
                            <option value="INVENTORY COMMITTEE">INVENTORY COMMITTEE</option>
                          </select>
                        ) : key === 'department' ? (
                          <select
                            name={key}
                            value={form[key]}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select department</option>
                            {departments.map(dept => (
                              <option key={dept.entity_id} value={dept.entity_name}>
                                {dept.entity_name}
                              </option>
                            ))}
                          </select>
                        ) : key === 'contactNumber' ? (
                          <input
                            type="text"
                            name="contactNumber"
                            value={form.contactNumber}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d{0,11}$/.test(value)) {
                                handleChange(e); // allow only digits and max 11 characters
                              }
                            }}
                            required
                            placeholder="e.g. 09123456789"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : key === 'suffix' ? (
                        <select
                          name={key}
                          value={form[key]}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">N/A</option>
                          <option value="Jr.">Jr.</option>
                          <option value="Sr.">Sr.</option>
                          <option value="II">II</option>
                          <option value="III">III</option>
                          <option value="IV">IV</option>
                        </select>
                      ) : (
                          <input
                            type={key === 'password' ? 'password' : 'text'}
                            name={key}
                            value={form[key]}
                            onChange={handleChange}
                            required={['lastname','firstname','email','username','password','role','department', 'position'].includes(key)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Rest of your modal code remains the same */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : 'Create Account'}
                    </button>
                  </div>
                  {message.text && (
                    <div className={`mt-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      {message.text}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

        {/* View Account Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
              <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Account Details</h3>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.full_name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contact Number</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.contactNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Role</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${selectedUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {selectedUser.role || 'Approve Account to Add Role'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Position</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.position || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Department</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.department || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Show Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Account Successfully Created</h3>
              <div className="mt-4">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        )}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this account? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showApproveModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
      <div className="p-5 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-800">Approve Account</h3>
        <button
          onClick={() => {
            setShowApproveModal(false);
            setUserToApprove(null);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-700">
          Assign a role to <strong>{userToApprove?.full_name}</strong>:
        </p>
        <select
          value={approvalRole}
          onChange={(e) => setApprovalRole(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select role</option>
          <option value="SUPER ADMIN">SUPER ADMIN</option>
          <option value="ADMIN">ADMIN</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
          <option value="INVENTORY COMMITTEE">INVENTORY COMMITTEE</option>
        </select>
      </div>
      <div className="px-5 py-3 bg-gray-50 flex justify-end gap-3">
        <button
          onClick={() => setShowApproveModal(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleApproveWithRole}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          disabled={!approvalRole}
        >
          Approve
        </button>
      </div>
    </div>
  </div>
)}
      {showReplaceModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
      <div className="p-5 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-yellow-700">Replace Account</h3>
        <button
          onClick={() => {
            setShowReplaceModal(false);
            setUserToReplace(null);
            setSelectedReplacement('');
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-700">
          Replace <strong>{userToReplace?.full_name}</strong> with:
        </p>
        <div className="space-y-3">
          <button
            className="w-full px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium"
            onClick={() => setSelectedReplacement('choose')}
          >
            Choose from current users
          </button>
          <button
            className="w-full px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 font-medium"
            onClick={() => setSelectedReplacement('create')}
          >
            Create a new user
          </button>
        </div>
        {selectedReplacement === 'choose' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none"
              onChange={e => setSelectedReplacement(e.target.value)}
              value={selectedReplacement}
            >
              <option value="choose">Select user</option>
              {users
                .filter(u => u.user_id !== userToReplace?.user_id)
                .map(u => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name} ({u.department})
                  </option>
                ))}
            </select>
            <button
              className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              onClick={() => {
                // TODO: Add your replace logic here
                Swal.fire({
                  icon: 'success',
                  title: 'Account replaced!',
                  confirmButtonColor: '#2563eb',
                });
                setShowReplaceModal(false);
                setUserToReplace(null);
                setSelectedReplacement('');
              }}
              disabled={selectedReplacement === 'choose'}
            >
              Confirm Replace
            </button>
          </div>
        )}
        {selectedReplacement === 'create' && (
          <div className="mt-4">
            <p className="text-sm text-gray-700 mb-2">Proceed to create a new user to replace this account.</p>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => {
                setShowReplaceModal(false);
                setShowAddModal(true);
                setUserToReplace(null);
                setSelectedReplacement('');
              }}
            >
              Create New User
            </button>
          </div>
        )}
      </div>
      <div className="px-5 py-3 bg-gray-50 flex justify-end gap-3">
        <button
          onClick={() => {
            setShowReplaceModal(false);
            setUserToReplace(null);
            setSelectedReplacement('');
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Accounts;