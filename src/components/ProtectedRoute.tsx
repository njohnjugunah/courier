import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseClient';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const [user, loading, error] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
	  const checkUserRole = async () => {
	  if (user) {
		try {
		  const q = query(collection(db, 'staffs'), where('phone', '==', user.phoneNumber));
		  const querySnapshot = await getDocs(q);

		  if (!querySnapshot.empty) {
			const staffDoc = querySnapshot.docs[0];
			console.log('Matched staff:', staffDoc.data());
			setUserRole(staffDoc.data().role as string); // admin
		  } else {
			console.log('No staff found. Creating new staff...');
			const newStaffRef = doc(collection(db, 'staffs'));
			const staffData = {
			  uid: user.uid,
			  name: user.displayName || 'Staff User',
			  phone: user.phoneNumber || '',
			  role: 'staff',
			  createdAt: serverTimestamp(),
			};
			await setDoc(newStaffRef, staffData);
			setUserRole('staff');
		  }
		} catch (err) {
		  console.error('Error fetching user role:', err);
		}
	  }
	  setRoleLoading(false);
	};

    if (!loading && user) {
      checkUserRole();
    } else if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Error</h2>
          <p className="text-gray-600 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!user) return null; // Will redirect to login

  if (requireAdmin && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
          <p className="text-gray-600 mt-2">Admin access required</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

