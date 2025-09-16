import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, LogOut, RefreshCw, AlertCircle, X, Loader2, Plus,
  UserPlus, Eye, EyeOff, Trash2, User, Shield
} from 'lucide-react';
import { ChatService, SupportAgent } from '../services/chatService';

const SuperAdminUI: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Support agents state
  const [supportAgents, setSupportAgents] = useState<SupportAgent[]>([]);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [agentFormData, setAgentFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agentFormLoading, setAgentFormLoading] = useState(false);
  const [agentFormError, setAgentFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if user is authenticated as super admin
    const isAuthenticated = localStorage.getItem('super_admin_authenticated');
    const loginTime = localStorage.getItem('super_admin_login_time');
    
    if (!isAuthenticated || !loginTime) {
      navigate('/super-admin-login');
      return;
    }

    // Check if session is still valid (24 hours)
    const loginDate = new Date(loginTime);
    const now = new Date();
    const hoursSinceLogin = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLogin > 24) {
      localStorage.removeItem('super_admin_authenticated');
      localStorage.removeItem('super_admin_login_time');
      navigate('/super-admin-login');
      return;
    }

    loadSupportAgents();
  }, [navigate]);

  const loadSupportAgents = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading support agents...');

      const agentsData = await ChatService.getSupportAgents();
      setSupportAgents(agentsData);
      
      console.log('✅ Support agents loaded:', agentsData.length);
    } catch (err: any) {
      console.error('❌ Error loading support agents:', err);
      setError('Failed to load support agents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    try {
      setAgentFormLoading(true);
      setAgentFormError('');

      // Validation
      if (!agentFormData.name.trim()) {
        setAgentFormError('Name is required');
        return;
      }

      if (!agentFormData.email.trim()) {
        setAgentFormError('Email is required');
        return;
      }

      if (!/\S+@\S+\.\S+/.test(agentFormData.email)) {
        setAgentFormError('Please enter a valid email address');
        return;
      }

      if (!agentFormData.password) {
        setAgentFormError('Password is required');
        return;
      }

      if (agentFormData.password.length < 8) {
        setAgentFormError('Password must be at least 8 characters');
        return;
      }

      if (agentFormData.password !== agentFormData.confirmPassword) {
        setAgentFormError('Passwords do not match');
        return;
      }

      // Check if email already exists
      const existingAgent = supportAgents.find(agent => agent.email === agentFormData.email);
      if (existingAgent) {
        setAgentFormError('An agent with this email already exists');
        return;
      }

      await ChatService.createSupportAgent({
        name: agentFormData.name,
        email: agentFormData.email,
        password: agentFormData.password
      });

      // Refresh agents list
      await loadSupportAgents();

      // Reset form
      resetAgentForm();
      setShowCreateAgentModal(false);

    } catch (err: any) {
      console.error('Error creating support agent:', err);
      setAgentFormError(err.message || 'Failed to create support agent');
    } finally {
      setAgentFormLoading(false);
    }
  };

  const handleUpdateAgent = async (agentId: string, updates: any) => {
    try {
      await ChatService.updateSupportAgent(agentId, updates);
      
      // Refresh agents list
      await loadSupportAgents();
    } catch (err: any) {
      console.error('Error updating support agent:', err);
      alert(err.message || 'Failed to update support agent');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this support agent? This action cannot be undone.')) {
      return;
    }

    try {
      await ChatService.deleteSupportAgent(agentId);
      
      // Refresh agents list
      await loadSupportAgents();
    } catch (err: any) {
      console.error('Error deleting support agent:', err);
      alert(err.message || 'Failed to delete support agent');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('super_admin_authenticated');
    localStorage.removeItem('super_admin_login_time');
    navigate('/super-admin-login');
  };

  const resetAgentForm = () => {
    setAgentFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setAgentFormError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Support Agent Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={loadSupportAgents}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Support Agents Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Support Agents</h2>
              <p className="text-gray-600">Manage support agents who can access the support portal</p>
            </div>
            <button
              onClick={() => setShowCreateAgentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Create Agent
            </button>
          </div>

          {/* Agents List */}
          {supportAgents.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Support Agents</h3>
              <p className="text-gray-500 mb-6">Create your first support agent to start handling customer support</p>
              <button
                onClick={() => setShowCreateAgentModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Agent
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Agent</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Last Login</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supportAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">{agent.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{agent.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            agent.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {agent.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {agent.last_login_at 
                            ? new Date(agent.last_login_at).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleUpdateAgent(agent.id, { is_active: !agent.is_active })}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                agent.is_active
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {agent.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Agent Modal */}
      {showCreateAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Create Support Agent</h3>
              <button
                onClick={() => {
                  setShowCreateAgentModal(false);
                  resetAgentForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {agentFormError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                {agentFormError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={agentFormData.name}
                  onChange={(e) => setAgentFormData({ ...agentFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sarah Johnson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={agentFormData.email}
                  onChange={(e) => setAgentFormData({ ...agentFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sarah@voya.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={agentFormData.password}
                    onChange={(e) => setAgentFormData({ ...agentFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={agentFormData.confirmPassword}
                    onChange={(e) => setAgentFormData({ ...agentFormData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateAgentModal(false);
                  resetAgentForm();
                }}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgent}
                disabled={agentFormLoading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {agentFormLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Agent
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUI;