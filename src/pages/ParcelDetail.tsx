import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  Phone, 
  MapPin, 
  Calendar,
  MessageSquare,
  /*Edit,*/
  Send,
  Loader2,
  CheckCircle,
  Clock,
  Truck
} from 'lucide-react';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase/firebaseClient';
import { sendSms, getSmsTemplates } from '@/lib/sms';

interface Parcel {
  id: string;
  trackingCode: string;
  createdBy: string;
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

interface Destination {
  id: string;
  name: string;
  region: string;
  baseFee: number;
}

const ParcelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);

  useEffect(() => {
    const fetchParcelData = async () => {
      if (!id) return;
      
      try {
        // Fetch parcel
        const parcelDoc = await getDoc(doc(db, 'parcels', id));
        if (parcelDoc.exists()) {
          const parcelData = { id: parcelDoc.id, ...parcelDoc.data() } as Parcel;
          setParcel(parcelData);
          
          // Fetch destination
          const destDoc = await getDoc(doc(db, 'destinations', parcelData.destinationId));
          if (destDoc.exists()) {
            setDestination({ id: destDoc.id, ...destDoc.data() } as Destination);
          }
        } else {
          console.error('Parcel not found');
          navigate('/parcels');
        }
      } catch (error) {
        console.error('Error fetching parcel:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParcelData();
  }, [id, navigate]);

  const updateStatus = async (newStatus: 'pending' | 'in_transit' | 'delivered') => {
    if (!parcel || !user) return;
    
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'parcels', parcel.id), {
        status: newStatus,
        updatedAt: new Date()
      });

      // Send SMS notification
      const templates = getSmsTemplates();
      let message = '';
      
      if (newStatus === 'in_transit') {
        message = templates.inTransit(parcel.trackingCode);
      } else if (newStatus === 'delivered') {
        message = templates.delivered(parcel.trackingCode);
      }

      if (message) {
        try {
          await sendSms(parcel.recipientPhone, message);
        } catch (smsError) {
          console.error('SMS failed:', smsError);
        }
      }

      // Update local state
      setParcel(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const sendCustomSms = async () => {
    if (!parcel || !customMessage.trim()) return;
    
    setSendingSms(true);
    try {
      await sendSms(parcel.recipientPhone, customMessage.trim());
      
      // Log the custom message
      await addDoc(collection(db, 'sms_logs'), {
        parcelId: parcel.id,
        recipientPhone: parcel.recipientPhone,
        message: customMessage.trim(),
        sentBy: user?.uid,
        sentAt: new Date()
      });

      alert('SMS sent successfully!');
      setCustomMessage('');
      setShowMessageForm(false);
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS');
    } finally {
      setSendingSms(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'in_transit': return <Truck className="h-5 w-5 text-blue-600" />;
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-600" />;
      default: return <Package className="h-5 w-5 text-gray-600" />;
    }
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Parcel not found</h2>
        <p className="text-gray-600">The parcel you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/parcels')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">{parcel.trackingCode}</h1>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(parcel.status)}`}>
              {getStatusIcon(parcel.status)}
              <span>{parcel.status.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
          <p className="text-gray-600 mt-1">Parcel details and management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sender & Recipient */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Sender</span>
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">{parcel.senderName}</p>
                  <p className="text-gray-600 flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{parcel.senderPhone}</span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Recipient</span>
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">{parcel.recipientName}</p>
                  <p className="text-gray-600 flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{parcel.recipientPhone}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Parcel Details */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Parcel Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900 mt-1">{parcel.shortDescription}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Destination</label>
                <p className="text-gray-900 mt-1 flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {destination ? `${destination.name}, ${destination.region}` : parcel.destinationId}
                    {destination && (
                      <span className="text-gray-600 ml-2">- KES {destination.baseFee}</span>
                    )}
                  </span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-gray-900 mt-1 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{parcel.createdAt?.toDate?.()?.toLocaleString()}</span>
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-gray-900 mt-1 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{parcel.updatedAt?.toDate?.()?.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            
            <div className="space-y-3">
              {['pending', 'in_transit', 'delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status as any)}
                  disabled={updating || parcel.status === status}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg font-medium transition-all duration-200 ${
                    parcel.status === status
                      ? `${getStatusColor(status)} cursor-default`
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {getStatusIcon(status)}
                  <span>{status.replace('_', ' ').toUpperCase()}</span>
                  {parcel.status === status && (
                    <CheckCircle className="h-4 w-4 ml-auto" />
                  )}
                </button>
              ))}
            </div>
            
            {updating && (
              <div className="flex items-center justify-center mt-4 text-primary">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Updating...</span>
              </div>
            )}
          </div>

          {/* SMS Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowMessageForm(!showMessageForm)}
                className="btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Send Custom SMS</span>
              </button>
            </div>

            {showMessageForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter your custom message..."
                  className="input-field h-24 resize-none"
                  maxLength={160}
                />
                <div className="text-xs text-gray-500 text-right">
                  {customMessage.length}/160
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowMessageForm(false);
                      setCustomMessage('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendCustomSms}
                    disabled={sendingSms || !customMessage.trim()}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    {sendingSms ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParcelDetail;