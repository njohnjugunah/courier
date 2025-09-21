import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Send, Loader2 } from 'lucide-react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase/firebaseClient';
import { generateTrackingCode, formatPhoneNumber, validatePhoneNumber } from '@/lib/generate';
import { sendSms, getSmsTemplates } from '@/lib/sms';

interface Destination {
  id: string;
  name: string;
  region: string;
  baseFee: number;
}

interface ParcelForm {
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  destinationId: string;
  shortDescription: string;
}

const ParcelCreate: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ParcelForm>({
    senderName: '',
    senderPhone: '',
    recipientName: '',
    recipientPhone: '',
    destinationId: '',
    shortDescription: ''
  });
  const [errors, setErrors] = useState<Partial<ParcelForm>>({});

  useEffect(() => {
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
      }
    };

    fetchDestinations();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<ParcelForm> = {};

    if (!formData.senderName.trim()) {
      newErrors.senderName = 'Sender name is required';
    }

    if (!formData.senderPhone.trim()) {
      newErrors.senderPhone = 'Sender phone is required';
    } else if (!validatePhoneNumber(formData.senderPhone)) {
      newErrors.senderPhone = 'Please enter a valid phone number';
    }

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }

    if (!formData.recipientPhone.trim()) {
      newErrors.recipientPhone = 'Recipient phone is required';
    } else if (!validatePhoneNumber(formData.recipientPhone)) {
      newErrors.recipientPhone = 'Please enter a valid phone number';
    }

    if (!formData.destinationId) {
      newErrors.destinationId = 'Please select a destination';
    }

    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = 'Description is required';
    } else if (formData.shortDescription.length > 140) {
      newErrors.shortDescription = 'Description must be 140 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;

    setLoading(true);

    try {
      const trackingCode = generateTrackingCode();
      const selectedDestination = destinations.find(d => d.id === formData.destinationId);

      // Create parcel document
      const parcelData = {
        trackingCode,
        createdBy: user.uid,
        senderName: formData.senderName.trim(),
        senderPhone: formatPhoneNumber(formData.senderPhone),
        recipientName: formData.recipientName.trim(),
        recipientPhone: formatPhoneNumber(formData.recipientPhone),
        destinationId: formData.destinationId,
        shortDescription: formData.shortDescription.trim(),
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const parcelRef = await addDoc(collection(db, 'parcels'), parcelData);

      // Add ledger entry for delivery fee
      if (selectedDestination) {
        await addDoc(collection(db, 'ledger'), {
          type: 'delivery_fee',
          amount: selectedDestination.baseFee,
          currency: 'KES',
          staffId: user.uid,
          parcelId: parcelRef.id,
          createdAt: new Date()
        });
      }

      // Send SMS notification
      try {
        const templates = getSmsTemplates();
        const smsMessage = templates.parcelReceived(
          formData.recipientName,
          trackingCode,
          'CourierPWA'
        );
        
        await sendSms(formatPhoneNumber(formData.recipientPhone), smsMessage);
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
        // Don't block parcel creation if SMS fails
      }

      // Navigate to parcel detail
      navigate(`/parcels/${parcelRef.id}`);
    } catch (error) {
      console.error('Error creating parcel:', error);
      alert('Failed to create parcel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ParcelForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/parcels')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Parcel</h1>
          <p className="text-gray-600 mt-1">Add a new parcel for delivery</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Sender Information</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender Name *
              </label>
              <input
                type="text"
                value={formData.senderName}
                onChange={(e) => handleInputChange('senderName', e.target.value)}
                className={`input-field ${errors.senderName ? 'border-red-500' : ''}`}
                placeholder="John Doe"
              />
              {errors.senderName && (
                <p className="text-red-600 text-sm mt-1">{errors.senderName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender Phone *
              </label>
              <input
                type="tel"
                value={formData.senderPhone}
                onChange={(e) => handleInputChange('senderPhone', e.target.value)}
                className={`input-field ${errors.senderPhone ? 'border-red-500' : ''}`}
                placeholder="+254700000000"
              />
              {errors.senderPhone && (
                <p className="text-red-600 text-sm mt-1">{errors.senderPhone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Recipient Information</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Name *
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => handleInputChange('recipientName', e.target.value)}
                className={`input-field ${errors.recipientName ? 'border-red-500' : ''}`}
                placeholder="Jane Smith"
              />
              {errors.recipientName && (
                <p className="text-red-600 text-sm mt-1">{errors.recipientName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Phone *
              </label>
              <input
                type="tel"
                value={formData.recipientPhone}
                onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                className={`input-field ${errors.recipientPhone ? 'border-red-500' : ''}`}
                placeholder="+254711111111"
              />
              {errors.recipientPhone && (
                <p className="text-red-600 text-sm mt-1">{errors.recipientPhone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Parcel Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination *
              </label>
              <select
                value={formData.destinationId}
                onChange={(e) => handleInputChange('destinationId', e.target.value)}
                className={`input-field ${errors.destinationId ? 'border-red-500' : ''}`}
              >
                <option value="">Select destination</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}, {dest.region} - KES {dest.baseFee}
                  </option>
                ))}
              </select>
              {errors.destinationId && (
                <p className="text-red-600 text-sm mt-1">{errors.destinationId}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description * ({formData.shortDescription.length}/140)
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                className={`input-field resize-none h-24 ${errors.shortDescription ? 'border-red-500' : ''}`}
                placeholder="Small electronics - fragile"
                maxLength={140}
              />
              {errors.shortDescription && (
                <p className="text-red-600 text-sm mt-1">{errors.shortDescription}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => navigate('/parcels')}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Package className="h-4 w-4" />
                <span>Create Parcel</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ParcelCreate;