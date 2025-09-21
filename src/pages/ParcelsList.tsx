import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  /*Filter,*/
  Eye,
  Calendar,
  Phone,
  MapPin
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase/firebaseClient';

interface Parcel {
  id: string;
  trackingCode: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  destinationId: string;
  shortDescription: string;
  status: 'pending' | 'in_transit' | 'delivered';
  createdAt: any;
  updatedAt: any;
}

const ParcelsList: React.FC = () => {
  const [user] = useAuthState(auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [filteredParcels, setFilteredParcels] = useState<Parcel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParcels = async () => {
      if (!user) return;
      
      try {
        const parcelsQuery = query(
          collection(db, 'parcels'),
          where('createdBy', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const parcelsSnapshot = await getDocs(parcelsQuery);
        const parcelsData = parcelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Parcel[];

        setParcels(parcelsData);
        setFilteredParcels(parcelsData);
      } catch (error) {
        console.error('Error fetching parcels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParcels();
  }, [user]);

  useEffect(() => {
    let filtered = parcels;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(parcel => parcel.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(parcel =>
        parcel.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredParcels(filtered);
  }, [parcels, searchTerm, statusFilter]);

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    if (status === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-32 bg-gray-200 mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parcels</h1>
          <p className="text-gray-600 mt-1">Manage your parcel deliveries</p>
        </div>
        <Link to="/parcels/new">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Parcel</span>
          </motion.button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tracking code, names, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: parcels.length },
              { key: 'pending', label: 'Pending', count: parcels.filter(p => p.status === 'pending').length },
              { key: 'in_transit', label: 'In Transit', count: parcels.filter(p => p.status === 'in_transit').length },
              { key: 'delivered', label: 'Delivered', count: parcels.filter(p => p.status === 'delivered').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => handleStatusFilter(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  statusFilter === key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parcels List */}
      {filteredParcels.length > 0 ? (
        <div className="space-y-4">
          {filteredParcels.map((parcel) => (
            <motion.div
              key={parcel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {parcel.trackingCode}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(parcel.status)}`}>
                      {parcel.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{parcel.senderName} → {parcel.recipientName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4" />
                      <span>{parcel.shortDescription}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {parcel.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Dest: {parcel.destinationId}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <Link
                    to={`/parcels/${parcel.id}`}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No parcels found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first parcel'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Link to="/parcels/new" className="btn-primary inline-flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Parcel</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ParcelsList;