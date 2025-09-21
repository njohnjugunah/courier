import axios from 'axios';

export async function sendSms(to: string, message: string) {
  try {
    const response = await axios.post('/api/sms', { to, message });
    return response.data;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
}

export function getSmsTemplates() {
  return {
    parcelReceived: (recipientName: string, trackingCode: string, companyName: string = 'CourierPWA') =>
      `Dear ${recipientName}, your parcel ${trackingCode} has been received and is pending collection. - ${companyName}`,
    
    inTransit: (trackingCode: string) =>
      `Your parcel ${trackingCode} is now in transit and will be delivered soon.`,
    
    delivered: (trackingCode: string) =>
      `Your parcel ${trackingCode} has been delivered successfully. Thank you for using our service!`
  };
}