import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Shield,
  User
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseClient';

interface Staff {
  id: string;
  uid: string;
  name: string;
  phone: string;
  role: 'admin' | 'staff';
  createdAt?: any;
}

const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    uid: '',
    name: '',
    phone: '',
    role: 'staff' as 'admin' | 'staff'
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const staffSnapshot = await getDocs(collection(db, 'staffs'));
      const staffData = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.uid || !formData.name || !formData.phone) {
      alert('Please fill all required fields');
      return;
    }

    if (staff.some(s => s.uid === formData.uid)) {
      alert('A staff member with this UID already exists');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'staffs'), {
        ...formData,
        createdAt: new Date()
      });
      
      const newStaff = {
        id: docRef.id,
        ...formData,
        createdAt: new Date()
      };
      
      setStaff([...staff, newStaff]);
      setFormData({ uid: '', name: '', phone: '', role: 'staff' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to add staff member');
    }
  };

  const handleUpdate = async (id: string) => {
    const staffMember = staff.find(s => s.id === id);
    if (!staffMember) return;

    try {
      await updateDoc(doc(db, 'staffs', id), {
        name: staffMember.name,
        phone: staffMember.phone,
        role: staffMember.role
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Failed to update staff member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      await deleteDoc(doc(db, 'staffs', id));
      setStaff(staff.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member');
    }
  };

  const updateStaff = (id: string, field: keyof Staff, value: any) => {
    setStaff(staff.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' 
      ? <Shield className="h-4 w-4" />
      : <User className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-20 bg-gray-200 mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage staff members and their roles</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{staff.length}</p>
            </div>
            <Users className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="card border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Admins</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {staff.filter(s => s.role === 'admin').length}
              </p>
            </div>
            <Shield className="h-6 w-6 text-purple-500" />
          </div>
        </div>
        <div className="card border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Staff</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {staff.filter(s => s.role === 'staff').length}
              </p>
            </div>
            <User className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-l-4 border-primary"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New Staff Member</h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ uid: '', name: '', phone: '', role: 'staff' });
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Firebase UID *
              </label>
              <input
                type="text"
                value={formData.uid}
                onChange={(e) => setFormData({...formData, uid: e.target.value})}
                className="input-field"
                placeholder="Firebase User ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="input-field"
                placeholder="+254700000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'staff'})}
                className="input-field"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ uid: '', name: '', phone: '', role: 'staff' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Add Staff</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Staff List */}
      <div className="space-y-4">
        {staff.length > 0 ? (
          staff.map((staffMember) => (
            <motion.div
              key={staffMember.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card hover:shadow-md transition-all duration-200"
            >
              {editingId === staffMember.id ? (
                // --- Edit Mode ---
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={staffMember.name}
                        onChange={(e) => updateStaff(staffMember.id, 'name', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={staffMember.phone}
                        onChange={(e) => updateStaff(staffMember.id, 'phone', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={staffMember.role}
                        onChange={(e) => updateStaff(staffMember.id, 'role', e.target.value)}
                        className="input-field"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(staffMember.id)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                // --- View Mode ---
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{staffMember.name}</h3>
                    <p className="text-gray-600 text-sm">{staffMember.phone}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${getRoleColor(staffMember.role)}`}
                    >
                      {getRoleIcon(staffMember.role)}
                      <span className="ml-1 capitalize">{staffMember.role}</span>
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingId(staffMember.id)}
                      className="btn-secondary flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(staffMember.id)}
                      className="btn-danger flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="text-center text-gray-500">No staff members found.</div>
        )}
      </div>
    </div>
  );
};

export default AdminStaff;
