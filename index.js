import notifee, { AndroidImportance } from '@notifee/react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';

import 'expo-router/entry';

setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Kashy',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  const data = remoteMessage.data ?? {};
  await notifee.displayNotification({
    title: String(data.title ?? remoteMessage.notification?.title ?? 'Kashy'),
    body: String(data.body ?? remoteMessage.notification?.body ?? ''),
    data,
    android: {
      channelId,
      smallIcon: 'ic_notification',
      color: '#63E696',
      pressAction: { id: 'default' },
    },
    ios: {
      sound: 'default',
    },
  });
});
