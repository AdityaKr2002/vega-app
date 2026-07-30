import {View, SafeAreaView, Linking, ToastAndroid} from 'react-native';
import React from 'react';
import {WebView} from 'react-native-webview';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../App';
import {isSafeExternalUrl} from '../lib/sandbox/urlGuard';
import IconButton from '../components/ui/IconButton';
import AppText from '../components/ui/Text';

type Props = NativeStackScreenProps<HomeStackParamList, 'Webview'>;

const Webview = ({route, navigation}: Props) => {
  const link = isSafeExternalUrl(route.params.link) ? route.params.link : '';

  const openExternally = () => {
    if (!link) {
      ToastAndroid.show('Unsupported link', ToastAndroid.SHORT);
      return;
    }
    Linking.openURL(link);
  };

  return (
    <SafeAreaView className="h-full w-full bg-m3-background">
      <View className="mt-6 h-16 w-full flex-row items-center justify-between bg-m3-surface-container px-4">
        <AppText role="titleLargeEmphasized" className="text-m3-on-surface">
          Web
        </AppText>
        <View className="flex-row items-center gap-2">
          <IconButton
            icon="open-in-new"
            label="Open in browser"
            onPress={openExternally}
          />
          <IconButton
            icon="close"
            label="Close web view"
            onPress={() => {
              navigation.goBack();
            }}
          />
        </View>
      </View>
      {link ? (
        <WebView
          // javaScriptCanOpenWindowsAutomatically={false}
          javaScriptEnabled={false}
          source={{uri: link}}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <AppText role="bodyLarge" className="text-m3-on-surface-variant">
            Unsupported link
          </AppText>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Webview;
