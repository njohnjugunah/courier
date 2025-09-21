import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  DollarSign
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

interface Destination {
  id: string;
  name: string;
  region: string;
  baseFee: number;
  createdAt?: any;
}

const AdminDestinations: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    baseFee: 0
  });

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const destinationsSnapshot = await getDocs(collection(db, 'destinations'));
      const destinationsData = destinationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Destination[];
      setDestinations(destinationsData);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.region || formData.baseFee <= 0) {
      alert('Please fill all fields with valid data');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'destinations'), {
        ...formData,
        createdAt: new Date()
      });
      
      const newDestination = {
        id: docRef.id,
        ...formData,
        createdAt: new Date()
      };
      
      setDestinations([...destinations, newDestination]);
      setFormData({ name: '', region: '', baseFee: 0 });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding destination:', error);
      alert('Failed to add destination');
    }
  };

  const handleUpdate = async (id: string) => {
    const destination = destinations.find(d => d.id === id);
    if (!destination) return;

    try {
      await updateDoc(doc(db, 'destinations', id), {
        name: destination.name,
        region: destination.region,
        baseFee: destination.baseFee
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error updating destination:', error);
      alert('Failed to update destination');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this destination?')) return;

    try {
      await deleteDoc(doc(db, 'destinations', id));
      setDestinations(destinations.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting destination:', error);
      alert('Failed to delete destination');
    }
  };

  const updateDestination = (id: string, field: keyof Destination, value: any) => {
    setDestinations(destinations.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Destinations</h1>
          <p className="text-gray-600 mt-1">Manage delivery destinations and fees</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Destination</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-l-4 border-primary"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New Destination</h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ name: '', region: '', baseFee: 0 });
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field"
                placeholder="Nairobi CBD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                className="input-field"
                placeholder="Nairobi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Fee (KES)
              </label>
              <input
                type="number"
                value={formData.baseFee}
                onChange={(e) => setFormData({...formData, baseFee: parseInt(e.target.value) || 0})}
                className="input-field"
                placeholder="150"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ name: '', region: '', baseFee: 0 });
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
              <span>Add Destination</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Destinations List */}
      <div className="space-y-4">
        {destinations.length > 0 ? (
          destinations.map((destination) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card hover:shadow-md transition-all duration-200"
            >
              {editingId === destination.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={destination.name}
                        onChange={(e) => updateDestination(destination.id, 'name', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Region
                      </label>
                      <input
                        type="text"
                        value={destination.region}
                        onChange={(e) => updateDestination(destination.id, 'region', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Fee (KES)
                      </label>
                      <input
                        type="number"
                        value={destination.baseFee}
                        onChange={(e) => updateDestination(destination.id, 'baseFee', parseInt(e.target.value) || 0)}
                        className="input-field"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={() => handleUpdate(destination.id)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {destination.name}
                        </h3>
                        <p className="text-gray-600">{destination.region}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-green-600 font-bold">
                        <DollarSign className="h-4 w-4" />
                        <span>KES {destination.baseFee.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-500">Base fee</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingId(destination.id)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        title="Edit destination"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(destination.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        title="Delete destination"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="card text-center py-12">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No destinations yet</h3>
            <p className="text-gray-600 mb-6">Add your first delivery destination to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Destination</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDestinations;