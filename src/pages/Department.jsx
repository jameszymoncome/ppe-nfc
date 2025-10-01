import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Search, Eye, Trash2 } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../utils/connection';
import Swal from 'sweetalert2';

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [dept_id, setDeptId] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/getDepartments.php`);
      if (response.data.success) {
        setDepartments(response.data.departments || response.data.data);
      } else {
        console.error(response.data.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the department.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axios.post(`${BASE_URL}/deleteDepartment.php`, { id });
        if (res.data.success) {
          await fetchDepartments();
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Department has been deleted.',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire('Error', res.data.message || 'Delete failed.', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'Something went wrong while deleting.', 'error');
      }
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.trim() || !newAddress.trim() || !dept_id.trim()) {
      setMessage('All fields are required.');
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/addDepartment.php`, {
        dept_id: dept_id,
        name: newDepartment,
        address: newAddress
      });

      if (res.data.success) {
        setShowModal(false);
        setNewDepartment('');
        setNewAddress('');
        setMessage('');
        await fetchDepartments();
        Swal.fire({
          icon: 'success',
          title: 'Added!',
          text: 'Department has been added successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        setMessage(res.data.message || 'Failed to add department.');
      }
    } catch (error) {
      console.error('Add error:', error);
      setMessage('An error occurred while adding.');
    }
  };

  const filtered = departments.filter(dep =>
    dep.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Departments</h1>
            <p className="text-sm text-gray-500">List of all registered departments/entities.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Add Department
          </button>
        </div>

        <div className="relative w-80 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
              <tr>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Department Name</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
              {filtered.length > 0 ? (
                filtered.map((dep) => (
                  <tr key={dep.id}>
                    <td className="px-6 py-4">{dep.id}</td>
                    <td className="px-6 py-4">{dep.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        dep.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedDepartment(dep);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title='View Details'
                      >
                        <Eye className='inline-block w-5 h-5' /> View
                      </button>
                      <button
                        onClick={() => handleDelete(dep.id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-4"
                        title='Delete Department'
                      >
                        <Trash2 className='inline-block w-5 h-5' /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-4" colSpan="4">No departments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-blue-800">Add New Department</h2>
            <input
              type="text"
              value={dept_id}
              onChange={(e) => setDeptId(e.target.value)}
              placeholder="Enter department ID"
              className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              placeholder="Enter department name"
              className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Enter department address"
              className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {message && <p className="text-sm text-red-600 mb-2">{message}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewDepartment('');
                  setNewAddress('');
                  setMessage('');
                }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDepartment}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Department Modal */}
        {showViewModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <h2 className="text-lg font-semibold mb-4 text-blue-800">Department Details</h2>
              <div className="mb-3">
                <label className="text-sm text-gray-600 font-medium">Office Name:</label>
                <p className="text-base text-gray-800">{selectedDepartment.name}</p>
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600 font-medium">Office Address:</label>
                <p className="text-base text-gray-800">{selectedDepartment.address || selectedDepartment.dept_address}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Department;
