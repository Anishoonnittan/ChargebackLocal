import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('high-risk-orders', {
        name: 'High Risk Orders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('chargeback-alerts', {
        name: 'Chargeback Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Send local notification (for testing)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Send immediately
  });
}

/**
 * Send high-risk order alert
 */
export async function sendHighRiskAlert(orderData: {
  orderAmount: number;
  riskScore: number;
  customerEmail: string;
  scanId: string;
}) {
  await sendLocalNotification(
    '🚨 High-Risk Order Detected',
    `$${orderData.orderAmount} order (Risk: ${orderData.riskScore}/100) - Review immediately`,
    {
      type: 'HIGH_RISK_ORDER',
      scanId: orderData.scanId,
      screen: 'ChargebackAlerts',
    }
  );
}

/**
 * Send chargeback prevented alert
 */
export async function sendChargebackPreventedAlert(savedAmount: number) {
  await sendLocalNotification(
    '✅ Chargeback Prevented!',
    `Auto-refunded $${savedAmount} to avoid dispute`,
    {
      type: 'CHARGEBACK_PREVENTED',
      screen: 'ChargebackAnalytics',
    }
  );
}

/**
 * Send dispute alert (customer contacted bank)
 */
export async function sendDisputeAlert(orderData: {
  orderId: string;
  amount: number;
}) {
  await sendLocalNotification(
    '⚠️ Dispute Alert',
    `Customer contacted bank about order ${orderData.orderId} ($${orderData.amount})`,
    {
      type: 'DISPUTE_ALERT',
      orderId: orderData.orderId,
      screen: 'ChargebackAlerts',
    }
  );
}

/**
 * Handle notification tap
 */
export function setupNotificationResponseListener(
  onNotificationTap: (data: Record<string, unknown>) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    if (typeof onNotificationTap === 'function') {
      onNotificationTap(data);
    } else {
      console.warn('setupNotificationResponseListener: onNotificationTap callback is not a function');
    }
  });

  return subscription;
}