import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package
} from 'lucide-react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase/firebaseClient';

interface LedgerEntry {
  id: string;
  type: 'delivery_fee' | 'withdrawal' | 'bonus' | 'penalty';
  amount: number;
  currency: string;
  staffId: string;
  staffName?: string;
  parcelId?: string;
  description?: string;
  createdAt: any;
}

const Ledger: React.FC = () => {
  const [user] = useAuthState(auth);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');

  useEffect(() => {
    const fetchLedgerData = async () => {
      if (!user) return;
      
      try {
        const ledgerQuery = query(
          collection(db, 'ledger'),
          orderBy('createdAt', 'desc')
        );
        
        const ledgerSnapshot = await getDocs(ledgerQuery);
        const ledgerData = ledgerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LedgerEntry[];

        // Get staff names for display
        const staffQuery = query(collection(db, 'staffs'));
        const staffSnapshot = await getDocs(staffQuery);
        const staffMap = new Map();
        staffSnapshot.docs.forEach(doc => {
          staffMap.set(doc.data().uid, doc.data().name);
        });

        // Add staff names to entries
        const enrichedEntries = ledgerData.map(entry => ({
          ...entry,
          staffName: staffMap.get(entry.staffId) || 'Unknown Staff'
        }));

        setEntries(enrichedEntries);
        setFilteredEntries(enrichedEntries);
      } catch (error) {
        console.error('Error fetching ledger data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLedgerData();
  }, [user]);

  useEffect(() => {
    let filtered = entries;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.type === typeFilter);
    }

    // Filter by staff (admin only)
    if (staffFilter !== 'all') {
      filtered = filtered.filter(e => e.staffId === staffFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(e => 
        e.createdAt?.toDate?.() >= filterDate
      );
    }

    setFilteredEntries(filtered);
  }, [entries, typeFilter, dateFilter, staffFilter]);

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'delivery_fee':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'bonus':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'penalty':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'delivery_fee':
        return 'bg-blue-100 text-blue-800';
      case 'bonus':
        return 'bg-green-100 text-green-800';
      case 'withdrawal':
        return 'bg-red-100 text-red-800';
      case 'penalty':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotals = () => {
    const totalIncome = filteredEntries
      .filter(e => ['delivery_fee', 'bonus'].includes(e.type))
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalExpenses = filteredEntries
      .filter(e => ['withdrawal', 'penalty'].includes(e.type))
      .reduce((sum, e) => sum + e.amount, 0);

    return { totalIncome, totalExpenses, netAmount: totalIncome - totalExpenses };
  };

  const { totalIncome, totalExpenses, netAmount } = calculateTotals();
  const uniqueStaff = Array.from(new Set(entries.map(e => e.staffId)))
    .map(id => ({ id, name: entries.find(e => e.staffId === id)?.staffName || 'Unknown' }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
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
          <h1 className="text-3xl font-bold text-gray-900">Ledger</h1>
          <p className="text-gray-600 mt-1">Complete transaction history</p>
        </div>
        <button className="btn-secondary flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export Data</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Income</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                KES {totalIncome.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
              <p className="text-xl font-bold text-red-600 mt-1">
                KES {totalExpenses.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="h-6 w-6 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`card border-l-4 ${netAmount >= 0 ? 'border-primary' : 'border-orange-500'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Net Amount</p>
              <p className={`text-xl font-bold mt-1 ${netAmount >= 0 ? 'text-primary' : 'text-orange-600'}`}>
                KES {netAmount.toLocaleString()}
              </p>
            </div>
            <DollarSign className={`h-6 w-6 ${netAmount >= 0 ? 'text-primary' : 'text-orange-500'}`} />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card border-l-4 border-gray-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Entries</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {filteredEntries.length}
              </p>
            </div>
            <FileText className="h-6 w-6 text-gray-500" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Types</option>
              <option value="delivery_fee">Delivery Fees</option>
              <option value="bonus">Bonuses</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="penalty">Penalties</option>
            </select>

            {/* Staff Filter */}
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Staff</option>
              {uniqueStaff.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Entries */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Transaction History</h2>

        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Staff
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Parcel ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          {getEntryIcon(entry.type)}
                        </div>
                        <div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEntryColor(entry.type)}`}>
                            {entry.type.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{entry.staffName}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-900">
                        {entry.currency} {entry.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-gray-600 text-sm">
                        {entry.parcelId || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-gray-600 text-sm">
                        {entry.createdAt?.toDate?.()?.toLocaleString()}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No entries found</h3>
            <p className="text-gray-600">
              {typeFilter !== 'all' || dateFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Transaction history will appear here'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ledger;