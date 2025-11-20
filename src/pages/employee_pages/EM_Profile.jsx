import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Calendar, Edit3, Save, X, Eye, EyeOff } from 'lucide-react';
import EM_Sidebar from '../../components/EM_Sidebar';
import { BASE_URL } from '../../utils/connection';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EM_Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState('');
  const [editData, setEditData] = useState({ ...userData });
  const [loading, setLoading] = useState(true);
  const [showResignModal, setShowResignModal] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [error, setError] = useState('');
  const [userToReplace, setUserToReplace] = useState(null);
  const [selectedReplacement, setSelectedReplacement] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [departmentName, setDepartmentName] = useState('TITEEE');
  const [deptPosition, setDeptPostition] = useState('');
  const [users, setUsers] = useState([]);

  const userRole = localStorage.getItem('accessLevel');

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem('userId');
      try {
        const res = await fetch(`${BASE_URL}/profile.php?user_id=${userId}`);
        const data = await res.json();
        if (data.success) {
          console.log('User Profile:', data.data);
          setUserToReplace(data.data);
          setUserData(data.data);           // ✅ Set user data here
          setEditData(data.data);           // ✅ Initialize editData here
          setLoading(false);                // ✅ Stop loading
        } else {
          console.error(data.message);
          setError(data.message);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to fetch user profile.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      Swal.fire({
        title: 'Saving...',
        text: 'Please wait while we update your profile.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch(`${BASE_URL}/updateProfile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      const result = await res.json();
      Swal.close();

      if (result.success) {
        setUserData(editData);
        setIsEditing(false);

        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: result.message || 'Your profile has been updated successfully.'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: result.message || 'Something went wrong while updating the profile.'
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: 'Unable to connect to the server. Please try again later.'
      });
    }
  };

  const handleCancel = () => {
    setEditData(userData);
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFullName = () => {
    const parts = [userData.firstname, userData.middlename, userData.lastname];
    if (userData.suffix !== 'None') parts.push(userData.suffix);
    return parts.filter(Boolean).join(' ');
  };

  const showModalConstatiner = () => {
    Swal.fire({
      title: "Confirmation",
      text: "Are your sure you want to transfer all of your assets?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, I'm sure.",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
        cancelButton: "bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded mx-2",
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed){
        transferItem();
      }
    });
  };

  const transferItem = async () => {
    console.log(localStorage.getItem('userId'));
    console.log(localStorage.getItem('department'));
    console.log(localStorage.getItem('accessLevel'));
    try {
      const response = await axios.post(`${BASE_URL}/transferAssets.php`, {
        usersID: localStorage.getItem('userId'),
        department: localStorage.getItem('department'),
        role: localStorage.getItem("accessLevel")
      });
      console.log(response.data);
      if (response.data.success){
        if (localStorage.getItem("accessLevel") === "EMPLOYEE" || localStorage.getItem("accessLevel") === "INVENTORY COMMITTEE"){
          setShowResignModal(true);
        }
        else {
          Swal.fire({
            title: "Transfer Completed",
            text: "Transferring is done.",
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "OK",
            cancelButtonText: "Close",
            customClass: {
              popup: "rounded-2xl",
              confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
              cancelButton: "bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded mx-2",
            },
            buttonsStyling: false,
          });
        }
      }
      else {
        console.log('Transfer Name:', response.data.message);
        Swal.fire({
          title: "No assets available",
          text: "The system cannot proccess to transfer because no assets are assigned to this user.",
          icon: "warning",
          confirmButtonText: "Okay",
          customClass: {
            popup: "rounded-2xl",
            confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
        console.error('Error fetching scrapped items:', error);
    }
  };

  const getDeptHead = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getDepartmentHead.php`, {
          params: {
              department: localStorage.getItem('department')
          }
      });
      console.log('Department Head:', response.data.data);
      setUsers(response.data.data);
      // setDepartmentName(response.data.data.deptName);
      // setDeptPostition(response.data.data.position);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }

  const fetchUsers = () => {
    fetch(`${BASE_URL}/retrieve_users.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.data);
      });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <EM_Sidebar />
      <div className="flex-1 p-6">
        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-blue-800">Profile</h1>
                <p className="text-gray-600">Manage your account information</p>
              </div>
              {!isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => showModalConstatiner()}
                    className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Edit3 size={20} />
                    Transfer All Asset
                  </button>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Edit3 size={20} />
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Save size={20} />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <X size={20} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={48} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-800">{getFullName()}</h2>
              <p className="text-gray-600">{userData.position}</p>
              <p className="text-gray-500">{userData.department}</p>
            </div>
          </div>

          {/* User Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.firstname}
                      onChange={(e) => handleInputChange('firstname', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{userData.firstname}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.middlename}
                      onChange={(e) => handleInputChange('middlename', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{userData.middlename}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.lastname}
                      onChange={(e) => handleInputChange('lastname', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{userData.lastname}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.suffix}
                      onChange={(e) => handleInputChange('suffix', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{userData.suffix || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail size={20} className="text-gray-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{userData.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone size={20} className="text-gray-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{userData.contactNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Account Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-800">{userData.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={editData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-800">••••••••</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                {isEditing ? (
                  <select
                    value={editData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">--{userRole}--</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="GSO EMPLOYEE">GSO EMPLOYEE</option>
                    <option value="INVENTORY COMMITTEE">INVENTORY COMMITTEE</option>
                    <option value="END USER">END USER</option>
                  </select>
                ) : (
                  <p className="text-gray-800">{userData.role}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Building size={20} className="text-gray-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{userData.department}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-800">{userData.position}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-gray-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                  <p className="text-gray-800">{formatDate(userData.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {showResignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-yellow-700">Transfering Assets</h3>
              <button
                onClick={() => {
                  setShowResignModal(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-700">
                Where you transfer your assets with:
              </p>

              <div className="space-y-3">
                <button
                  className="w-full px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium"
                  onClick={() => {
                    fetchUsers();
                    setShowSelection(true);
                    setSelectedReplacement('choose')}
                  }
                >
                  Choose a employee
                </button>
                <button
                  className="w-full px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 font-medium"
                  onClick={() => {
                    setShowSelection(true);
                    getDeptHead();
                    setSelectedReplacement('dept')}
                  }
                >
                  Transfer to Depeartment Head
                </button>
              </div>

              {showSelection && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select {selectedReplacement === "choose" ? "Employee" : "Department Head"}</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none"
                    onChange={e => {
                      setSelectedUser(e.target.value)
                      console.log(e.target.value)
                    }}
                    value={selectedUser}
                  >
                    <option value="choose">Select {selectedReplacement === "choose" ? "user" : "department head"}</option>
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
                      navigate("/em-transfer-assets", {
                        state: { userId: selectedUser }
                      });
                    }}
                    
                  >
                    Select Asset to Transfer
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResignModal(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) }
    </div>
  );
};

export default EM_Profile;

