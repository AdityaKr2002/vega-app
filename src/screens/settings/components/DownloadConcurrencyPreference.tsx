import {MaterialCommunityIcons} from '@expo/vector-icons';
import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {updateDownloadConcurrency} from '../../../lib/downloadManager';
import {settingsStorage} from '../../../lib/storage';

const MIN_CONCURRENCY = 1;
const MAX_CONCURRENCY = 5;

const DownloadConcurrencyPreference = ({primary}: {primary: string}) => {
  const [concurrency, setConcurrency] = useState(
    settingsStorage.getDownloadConcurrency(),
  );

  const update = (next: number) => {
    setConcurrency(next);
    updateDownloadConcurrency(next);
  };

  return (
    <View className="mb-6">
      <Text className="text-gray-400 text-sm mb-3">Downloads</Text>
      <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
        <View className="flex-row items-center justify-between p-4">
          <View className="mr-4 flex-1">
            <Text className="text-white text-base">Concurrent Downloads</Text>
            <Text className="mt-1 text-xs text-gray-400">
              Extra downloads wait in the queue
            </Text>
          </View>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              testID="decrease-download-concurrency"
              disabled={concurrency <= MIN_CONCURRENCY}
              onPress={() =>
                update(Math.max(concurrency - 1, MIN_CONCURRENCY))
              }>
              <MaterialCommunityIcons
                name="minus"
                size={23}
                color={concurrency <= MIN_CONCURRENCY ? '#4B5563' : primary}
              />
            </TouchableOpacity>
            <Text
              testID="download-concurrency-value"
              className="w-12 rounded-md bg-[#262626] px-3 py-1 text-center text-base text-white">
              {concurrency}
            </Text>
            <TouchableOpacity
              testID="increase-download-concurrency"
              disabled={concurrency >= MAX_CONCURRENCY}
              onPress={() =>
                update(Math.min(concurrency + 1, MAX_CONCURRENCY))
              }>
              <MaterialCommunityIcons
                name="plus"
                size={23}
                color={concurrency >= MAX_CONCURRENCY ? '#4B5563' : primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DownloadConcurrencyPreference;
