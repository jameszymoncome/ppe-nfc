import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Search, Plus, Eye, Trash2, Pencil } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../utils/connection';
import Swal from 'sweetalert2';

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/getCategories.php`);
      if (response.data.success) {
        setCategories(response.data.categories || response.data.data || []);
      } else {
        console.error('Failed to fetch categories:', response.data.message);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'Failed to fetch categories',
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Unable to connect to the server. Please try again.',
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `This will permanently delete the category "${name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axios.post(`${BASE_URL}/deleteCategory.php`, { id });
        if (res.data.success) {
          await fetchCategories();
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Category has been deleted successfully.',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: res.data.message || 'Failed to delete category.',
            timer: 3000,
            showConfirmButton: false
          });
        }
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Something went wrong while deleting the category.',
          timer: 3000,
          showConfirmButton: false
        });
      }
    }
  };

  const handleEdit = async (id, name, usefulness) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `This will update the category name to "${name}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      setShowEditModal(false);
      console.log(usefulness);

      try {
        const res = await axios.post(`${BASE_URL}/editCategory.php`, 
          {
            id, 
            usefulness // { "Wood": 0, "Mix": 76, "Concrete": 0 }
          },
          {
            headers: { "Content-Type": "application/json" } // ✅ ensures PHP sees it as an array
          }
        );
        console.log(res.data);
        Swal.fire({
          title: "Update Complete",
          text: "The category has been updated successfully.",
          icon: "success",
          confirmButtonText: "Done",
          customClass: {
            popup: "rounded-2xl",
            confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
          },
          buttonsStyling: false,
        }).then(() => {
          fetchCategories();
        });
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Something went wrong while updating the category.',
          timer: 3000,
          showConfirmButton: false
        });
      }
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryId.trim() || !newCategory.trim()) {
      setMessage('Both Category ID and Category Name are required.');
      return;
    }

    if (newCategory.trim().length < 2) {
      setMessage('Category name must be at least 2 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${BASE_URL}/addCategory.php`, {
        id: newCategoryId.trim(),
        name: newCategory.trim()
      });

      if (res.data.success) {
        setShowModal(false);
        setNewCategory('');
        setNewCategoryId('');
        setMessage('');
        await fetchCategories();
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Category has been added successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        setMessage(res.data.message || 'Failed to add category.');
      }
    } catch (error) {
      console.error('Add error:', error);
      setMessage('An error occurred while adding the category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setNewCategory('');
    setNewCategoryId('');
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  };

  const filtered = categories.filter(cat =>
    cat.name && cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Categories</h1>
            <p className="text-sm text-gray-500">Manage all category types in the system.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        <div className="relative w-80 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors duration-200"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usefulness
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-500">Loading categories...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cat.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {cat.usefulness
                          ? (() => {
                              let parsed;
                              try {
                                parsed = JSON.parse(cat.usefulness);
                              } catch (e) {
                                parsed = null;
                              }

                              if (parsed && typeof parsed === 'object') {
                                return Object.entries(parsed)
                                  .map(([type, value]) => `${type}: ${value} ${value > 1 ? 'years' : 'year'}`)
                                  .join(', ');
                              } else {
                                // fallback if usefulness is just a number
                                const value = Number(cat.usefulness);
                                return `${value} ${value > 1 ? 'years' : 'year'}`;
                              }
                            })()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedCategory(cat);
                              setShowViewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCategory(cat);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200 flex items-center gap-1"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200 flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center">
                      <div className="text-gray-500">
                        {search ? 'No categories found matching your search.' : 'No categories found.'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filtered.length} of {categories.length} categories
        </div>
      </div>

      {/* Add Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-blue-800">Add New Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter category ID (e.g., 1, 2, 3)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter category name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={submitting}
                />
              </div>
              
              {message && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {message}
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={submitting || !newCategory.trim() || !newCategoryId.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Category
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Category Modal */}
      {showViewModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-blue-800">Category Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category ID:</label>
                <p className="text-base text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedCategory.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category Name:</label>
                <p className="text-base text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedCategory.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Usefulness:</label>
                <div className="text-base text-gray-900 bg-gray-50 p-2 rounded">
                  {(() => {
                    let parsed;
                    try {
                      parsed = JSON.parse(selectedCategory.usefulness);
                    } catch {
                      parsed = null;
                    }

                    if (parsed && typeof parsed === "object") {
                      // If it has structure types
                      return (
                        <>
                          {Object.entries(parsed).map(([type, value]) => (
                            <p key={type}>
                              {type}: {value} {value > 1 ? "years" : "year"}
                            </p>
                          ))}
                        </>
                      );
                    } else {
                      // Normal usefulness value
                      const val = Number(selectedCategory.usefulness);
                      return `${val} ${val > 1 ? "years" : "year"}`;
                    }
                  })()}
                </div>
              </div>
              <div>
              </div>
            </div>
            <div className="flex justify-end pt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-blue-800">Category Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category ID:</label>
                <p className="text-base text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedCategory.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category Name:</label>
                <p className="text-base text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedCategory.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Usefulness:
                </label>
                <div className="text-base text-gray-900 bg-gray-50 p-2 rounded space-y-2">
                  {(() => {
                    let parsed;
                    try {
                      parsed = JSON.parse(selectedCategory.usefulness);
                    } catch {
                      parsed = null;
                    }

                    // 🧱 Multiple structure types
                    if (parsed && typeof parsed === "object") {
                      return Object.entries(parsed).map(([type, value]) => (
                        <div key={type} className="flex items-center gap-1">
                          <label className="w-20 text-gray-700">{type}:</label>
                          <input
                            type="number"
                            value={value}
                            onChange={(e) => {
                              const updated = { ...parsed, [type]: e.target.value };
                              setSelectedCategory({
                                ...selectedCategory,
                                usefulness: JSON.stringify(updated),
                              });
                            }}
                            className="bg-gray-50 w-20 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            min="0"
                            step="1"
                          />
                          <span>{value > 1 ? "years" : "year"}</span>
                        </div>
                      ));
                    }

                    // ⏳ Single value
                    return (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={selectedCategory.usefulness}
                          onChange={(e) =>
                            setSelectedCategory({
                              ...selectedCategory,
                              usefulness: e.target.value,
                            })
                          }
                          className="bg-gray-50 w-20 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          min="0"
                          step="1"
                        />
                        <span>
                          {selectedCategory.usefulness > 1 ? "years" : "year"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>
            <div className="flex justify-end pt-6 gap-5">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Close
              </button>
              <button
                onClick={() => handleEdit(selectedCategory.id, selectedCategory.name, selectedCategory.usefulness)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;