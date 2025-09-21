export interface Parcel {
  id: string;
  trackingCode: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  destinationId: string;
  shortDescription: string;
  status: 'pending' | 'in_transit' | 'delivered';
  createdAt: any;   // consider firebase.firestore.Timestamp if you want stricter typing
  updatedAt: any;
}
