import {View, Text, SafeAreaView, Linking, ToastAndroid} from 'react-native';
import React from 'react';
import {WebView} from 'react-native-webview';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../App';
import {MaterialIcons} from '@expo/vector-icons';
import {isSafeExternalUrl} from '../lib/sandbox/urlGuard';

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
    <SafeAreaView className="bg-black w-full h-full">
      <View className="bg-black w-full mt-6 h-16 flex flex-row justify-between p-3 items-center">
        <Text className="text-white text-lg font-bold">Webview</Text>
        <View className="flex flex-row items-center gap-5">
          <MaterialIcons
            name="open-in-browser"
            size={24}
            color="white"
            onPress={openExternally}
          />
          <MaterialIcons
            name="close"
            size={24}
            color="white"
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
          <Text className="text-white">Unsupported link</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Webview;
