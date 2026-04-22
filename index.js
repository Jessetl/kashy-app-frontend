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

  await notifee.displayNotification({
    title: remoteMessage.notification?.title ?? 'Kashy',
    body: remoteMessage.notification?.body ?? '',
    data: remoteMessage.data,
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
