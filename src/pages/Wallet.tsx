import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Plus,
  Minus
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
//import { useAuthState } from 'react-firebase-hooks/auth';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from '@/firebase/firebaseClient';

interface Transaction {
  id: string;
  type: 'delivery_fee' | 'withdrawal' | 'bonus' | 'penalty';
  amount: number;
  currency: string;
  description?: string;
  parcelId?: string;
  createdAt: any;
}

interface WalletData {
  balance: number;
  lastUpdated: any;
}

const Wallet: React.FC = () => {
  const [user] = useAuthState(auth);
  const [wallet, setWallet] = useState<WalletData>({ balance: 0, lastUpdated: null });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) return;
      
      try {
        // Fetch wallet data
        const walletDoc = await getDoc(doc(db, 'wallets', user.uid));
        if (walletDoc.exists()) {
          setWallet(walletDoc.data() as WalletData);
        }

        // Fetch transactions
        const transactionsQuery = query(
          collection(db, 'ledger'),
          where('staffId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];

        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [user]);

  useEffect(() => {
    let filtered = transactions;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
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
      
      filtered = filtered.filter(t => 
        t.createdAt?.toDate?.() >= filterDate
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, typeFilter, dateFilter]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'delivery_fee':
      case 'bonus':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
      case 'penalty':
        return <Minus className="h-4 w-4 text-red-600" />;
      default:
        return <WalletIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'delivery_fee':
      case 'bonus':
        return 'text-green-600';
      case 'withdrawal':
      case 'penalty':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAmountDisplay = (transaction: Transaction) => {
    const sign = ['delivery_fee', 'bonus'].includes(transaction.type) ? '+' : '-';
    return `${sign}${transaction.currency} ${transaction.amount.toLocaleString()}`;
  };

  const calculateTotals = () => {
    const income = filteredTransactions
      .filter(t => ['delivery_fee', 'bonus'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => ['withdrawal', 'penalty'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses };
  };

  const { income, expenses } = calculateTotals();

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
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600 mt-1">Manage your earnings and transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card border-l-4 border-primary"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current Balance</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                KES {wallet.balance.toLocaleString()}
              </p>
              {wallet.lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Updated {wallet.lastUpdated.toDate?.()?.toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <WalletIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                KES {income.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This period
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                KES {expenses.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This period
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10">
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
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
          
          <div className="lg:ml-auto text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          {filteredTransactions.length > 0 && (
            <p className="text-sm text-gray-600">
              Net: KES {(income - expenses).toLocaleString()}
            </p>
          )}
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-white">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 capitalize">
                      {transaction.type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {transaction.description || 'No description'}
                    </div>
                    {transaction.parcelId && (
                      <div className="text-xs text-gray-500">
                        Parcel: {transaction.parcelId}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                    {getAmountDisplay(transaction)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{transaction.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <WalletIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600">
              {typeFilter !== 'all' || dateFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Your transaction history will appear here'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;