import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Wallet, 
  FileText, 
  Plus, 
  TrendingUp,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase/firebaseClient';

interface DashboardStats {
  totalParcels: number;
  pendingParcels: number;
  inTransitParcels: number;
  deliveredParcels: number;
  walletBalance: number;
}

const Dashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [stats, setStats] = useState<DashboardStats>({
    totalParcels: 0,
    pendingParcels: 0,
    inTransitParcels: 0,
    deliveredParcels: 0,
    walletBalance: 0
  });
  const [recentParcels, setRecentParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Fetch parcels created by current user
        const parcelsQuery = query(
          collection(db, 'parcels'),
          where('createdBy', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const parcelsSnapshot = await getDocs(parcelsQuery);
        const parcelsData = parcelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate stats
        const totalParcels = parcelsData.length;
        const pendingParcels = parcelsData.filter(p => p.status === 'pending').length;
        const inTransitParcels = parcelsData.filter(p => p.status === 'in_transit').length;
        const deliveredParcels = parcelsData.filter(p => p.status === 'delivered').length;

        // Fetch wallet balance
        const walletQuery = query(collection(db, 'wallets'), where('uid', '==', user.uid));
        const walletSnapshot = await getDocs(walletQuery);
        const walletBalance = walletSnapshot.docs[0]?.data()?.balance || 0;

        setStats({
          totalParcels,
          pendingParcels,
          inTransitParcels,
          deliveredParcels,
          walletBalance
        });

        // Set recent parcels (last 5)
        setRecentParcels(parcelsData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const StatCard = ({ icon: Icon, title, value, color, link }: any) => (
    <Link to={link}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`card hover:shadow-lg cursor-pointer border-l-4 ${color}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('border-', 'bg-')}`}>
            <Icon className={`h-6 w-6 ${color.replace('border-', 'text-')}`} />
          </div>
        </div>
      </motion.div>
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card h-24 bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Package}
          title="Total Parcels"
          value={stats.totalParcels}
          color="border-primary"
          link="/parcels"
        />
        <StatCard
          icon={Clock}
          title="Pending"
          value={stats.pendingParcels}
          color="border-yellow-500"
          link="/parcels?status=pending"
        />
        <StatCard
          icon={Truck}
          title="In Transit"
          value={stats.inTransitParcels}
          color="border-blue-500"
          link="/parcels?status=in_transit"
        />
        <StatCard
          icon={CheckCircle}
          title="Delivered"
          value={stats.deliveredParcels}
          color="border-green-500"
          link="/parcels?status=delivered"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Parcels */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Parcels</h2>
              <Link to="/parcels" className="text-primary hover:text-primary/80 font-medium">
                View All
              </Link>
            </div>
            
            {recentParcels.length > 0 ? (
              <div className="space-y-4">
                {recentParcels.map((parcel) => (
                  <motion.div
                    key={parcel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="font-semibold text-gray-900">
                          {parcel.trackingCode}
                        </div>
                        <span className={`status-${parcel.status}`}>
                          {parcel.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        {parcel.senderName} → {parcel.recipientName}
                      </p>
                    </div>
                    <Link
                      to={`/parcels/${parcel.id}`}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      View
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No parcels yet</p>
                <Link to="/parcels/new" className="text-primary hover:text-primary/80 font-medium">
                  Create your first parcel
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Summary */}
        <div className="space-y-6">
          <div className="card">
            <div className="text-center">
              <Wallet className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Balance</h3>
              <p className="text-3xl font-bold text-primary">
                KES {stats.walletBalance.toLocaleString()}
              </p>
              <Link
                to="/wallet"
                className="inline-block mt-4 text-primary hover:text-primary/80 font-medium"
              >
                View Details →
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold">
                    {stats.totalParcels > 0 
                      ? Math.round((stats.deliveredParcels / stats.totalParcels) * 100)
                      : 0
                    }%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Parcels</span>
                  <span className="font-semibold">
                    {stats.pendingParcels + stats.inTransitParcels}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;