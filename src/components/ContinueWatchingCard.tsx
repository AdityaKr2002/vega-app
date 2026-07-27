import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

export type ContinueWatchingItemData = {
  link: string;
  title?: string;
  poster?: string;
  provider?: string;
  [key: string]: unknown;
};

type Props = {
  item: ContinueWatchingItemData;
  progress: number;
  isSelected: boolean;
  selectionMode: boolean;
  primary: string;
  onPress: (item: ContinueWatchingItemData) => void;
  onLongPress: (link: string) => void;
};

const ContinueWatchingCard = ({
  item,
  progress,
  isSelected,
  selectionMode,
  primary,
  onPress,
  onLongPress,
}: Props) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="max-w-[100px] mx-2"
      onLongPress={e => {
        e.stopPropagation();
        onLongPress(item.link);
      }}
      onPress={e => {
        e.stopPropagation();
        onPress(item);
      }}>
      <View className="relative">
        <Image
          source={{uri: item?.poster}}
          className="rounded-md"
          style={{width: 100, height: 150}}
        />

        {selectionMode && (
          <View className="absolute top-2 right-2 z-50">
            <View
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isSelected ? '' : 'bg-white/30'
              }`}
              style={{
                borderWidth: 1,
                borderColor: 'white',
                backgroundColor: isSelected ? primary : undefined,
              }}>
              {isSelected && <AntDesign name="check" size={12} color="white" />}
            </View>
          </View>
        )}

        {isSelected && (
          <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/30 rounded-lg" />
        )}

        <View
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${progress}%`,
              backgroundColor: primary,
            }}
          />
        </View>
      </View>
      <Text
        className="text-white text-center truncate w-24 text-xs"
        numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
};

export default React.memo(ContinueWatchingCard);
