import Ionicons from '@expo/vector-icons/Ionicons';
import React, {useEffect, useState} from 'react';
import {Image, View} from 'react-native';
import Text from './ui/Text';

type EpisodeRowContentProps = {
  title: string;
  description?: string;
  image?: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
};

const getValidImageUri = (image?: string): string | undefined => {
  const value = image?.trim();
  return value && /^https?:\/\//i.test(value) ? value : undefined;
};

export const hasEpisodeMetadata = ({
  description,
  image,
}: Pick<EpisodeRowContentProps, 'description' | 'image'>): boolean =>
  Boolean(description?.trim() || getValidImageUri(image));

const EpisodeRowContent = ({
  title,
  description,
  image,
  accentColor,
  textColor,
  mutedTextColor,
}: EpisodeRowContentProps) => {
  const imageUri = getValidImageUri(image);
  const [imageFailed, setImageFailed] = useState(false);
  const descriptionText = description?.trim();

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);

  return (
    <>
      {imageUri && !imageFailed ? (
        <Image
          source={{uri: imageUri}}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
          style={{borderRadius: 4, height: 56, width: 88}}
        />
      ) : (
        <View
          className="items-center justify-center"
          style={{
            backgroundColor: '#171717',
            borderRadius: 4,
            height: 56,
            width: 88,
          }}>
          <Ionicons name="play-circle" size={32} color={accentColor} />
        </View>
      )}
      <View className="min-w-0 flex-1">
        <Text
          role="titleMedium"
          numberOfLines={descriptionText ? 1 : 2}
          style={{color: textColor}}>
          {title}
        </Text>
        {descriptionText ? (
          <Text
            role="bodySmall"
            numberOfLines={2}
            style={{color: mutedTextColor, marginTop: 2}}>
            {descriptionText}
          </Text>
        ) : null}
      </View>
    </>
  );
};

export default EpisodeRowContent;
