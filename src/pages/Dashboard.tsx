// src/pages/Dashboard.tsx

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient"; // adjust path if needed
import { Loader2 } from "lucide-react"; // only import icons you actually use

// --- Types ---
interface Parcel {
  id: string;
  status: "pending" | "in_transit" | "delivered";
  createdDate: string;
  // add other fields from Firestore if needed
}

interface Wallet {
  id: string;
  uid: string;
  balance: number;
  // add other fields if needed
}

interface Stats {
  totalParcels: number;
  pendingParcels: number;
  inTransitParcels: number;
  deliveredParcels: number;
  walletBalance: number;
}

// --- Component ---
const Dashboard: React.FC<{ userUid: string | null }> = ({ userUid }) => {
  const [stats, setStats] = useState<Stats>({
    totalParcels: 0,
    pendingParcels: 0,
    inTransitParcels: 0,
    deliveredParcels: 0,
    walletBalance: 0,
  });

  const [recentParcels, setRecentParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch dashboard data ---
  const fetchDashboardData = async (uid: string) => {
    try {
      setLoading(true);

      // --- Fetch parcels ---
      const parcelsRef = collection(db, "parcels");
      const parcelsQuery = query(parcelsRef, orderBy("createdDate", "desc"));
      const parcelsSnapshot = await getDocs(parcelsQuery);

      const parcelsData: Parcel[] = parcelsSnapshot.docs.map((doc) => {
        const data = doc.data() as Parcel;
        const { id: _omit, ...rest } = data; // omit id from Firestore if exists
        return { id: doc.id, ...rest };
      });

      const totalParcels = parcelsData.length;
      const pendingParcels = parcelsData.filter((p) => p.status === "pending").length;
      const inTransitParcels = parcelsData.filter((p) => p.status === "in_transit").length;
      const deliveredParcels = parcelsData.filter((p) => p.status === "delivered").length;

      // --- Fetch wallet ---
      const walletRef = collection(db, "wallets");
      const walletQuery = query(walletRef, where("uid", "==", uid));
      const walletSnapshot = await getDocs(walletQuery);

      const walletData: Wallet | undefined = walletSnapshot.docs[0]
        ? (() => {
            const data = walletSnapshot.docs[0].data() as Wallet;
            const { id: _omit, ...rest } = data;
            return { id: walletSnapshot.docs[0].id, ...rest };
          })()
        : undefined;

      const walletBalance = walletData?.balance ?? 0;

      // --- Update state ---
      setStats({ totalParcels, pendingParcels, inTransitParcels, deliveredParcels, walletBalance });
      setRecentParcels(parcelsData.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- useEffect to fetch data on mount ---
  useEffect(() => {
    if (!userUid) return;
    fetchDashboardData(userUid);
  }, [userUid]);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2>Total Parcels: {stats.totalParcels}</h2>
      <h2>Pending: {stats.pendingParcels}</h2>
      <h2>In Transit: {stats.inTransitParcels}</h2>
      <h2>Delivered: {stats.deliveredParcels}</h2>
      <h2>Wallet Balance: {stats.walletBalance}</h2>

      <h3 className="mt-4">Recent Parcels:</h3>
      <ul>
        {recentParcels.map((parcel) => (
          <li key={parcel.id}>
            {parcel.id} - {parcel.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
