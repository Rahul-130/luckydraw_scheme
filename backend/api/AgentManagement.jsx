import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 

const AgentManagement = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isAddingAgent, setIsAddingAgent] = useState(false);

  // Ensure only admins can access this page
  useEffect(() => {
    if (user && user.userRole !== 'admin') {
      setError('Access Denied: Only administrators can manage agents.');
      setLoading(false);
    } else if (!user) {
      setError('Authentication Required.');
      setLoading(false);
    }
  }, [user]);

  const fetchAgents = async () => {
    if (!user || user.userRole !== 'admin') return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/agents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgents(response.data);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to fetch agents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.userRole === 'admin') {
      fetchAgents();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAgent((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' })); // Clear error on input change
  };

  const validateForm = () => {
    const errors = {};
    if (!newAgent.name.trim()) errors.name = 'Name is required';
    if (!newAgent.phone.trim()) errors.phone = 'Phone is required';
    if (!newAgent.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newAgent.email)) {
      errors.email = 'Email is invalid';
    }
    if (!newAgent.password.trim()) {
      errors.password = 'Password is required';
    } else if (newAgent.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsAddingAgent(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/agents', newAgent, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Agent added successfully!');
      setNewAgent({ name: '', phone: '', email: '', password: '' });
      fetchAgents(); // Refresh the list
    } catch (err) {
      console.error('Error adding agent:', err);
      const errorMessage = err.response?.data?.error || 'Failed to add agent. Please try again.';
      setError(errorMessage);
    } finally {
      setIsAddingAgent(false);
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/agents/${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Agent deleted successfully!');
      fetchAgents(); // Refresh the list
    } catch (err) {
      console.error('Error deleting agent:', err);
      const errorMessage = err.response?.data?.error || 'Failed to delete agent. Please try again.';
      setError(errorMessage);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading agents...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 text-center">{error}</div>;
  }

  if (!user || user.userRole !== 'admin') {
    return <div className="p-4 text-red-500 text-center">You do not have permission to view this page.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Agent Management</h1>

      {/* Add New Agent Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Agent</h2>
        <form onSubmit={handleAddAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newAgent.name}
              onChange={handleInputChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.name ? 'border-red-500' : ''}`}
              required
            />
            {formErrors.name && <p className="text-red-500 text-xs italic">{formErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">Phone:</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={newAgent.phone}
              onChange={handleInputChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.phone ? 'border-red-500' : ''}`}
              required
            />
            {formErrors.phone && <p className="text-red-500 text-xs italic">{formErrors.phone}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={newAgent.email}
              onChange={handleInputChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.email ? 'border-red-500' : ''}`}
              required
            />
            {formErrors.email && <p className="text-red-500 text-xs italic">{formErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={newAgent.password}
              onChange={handleInputChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.password ? 'border-red-500' : ''}`}
              required
            />
            {formErrors.password && <p className="text-red-500 text-xs italic">{formErrors.password}</p>}
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isAddingAgent}
            >
              {isAddingAgent ? 'Adding...' : 'Add Agent'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Agents List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Existing Agents</h2>
        {agents.length === 0 ? (
          <p>No agents found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2FA Enabled</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agent.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.is2FAEnabled ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentManagement;
