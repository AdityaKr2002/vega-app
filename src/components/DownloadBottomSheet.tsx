import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Text,
  TouchableOpacity,
  ToastAndroid,
  View,
} from 'react-native';
import React, { useEffect, useRef } from 'react';
import { Stream } from '../lib/providers/types';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from '@expo/ui/community/bottom-sheet';
import LoadingIndicator from './ui/LoadingIndicator';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Clipboard } from 'react-native';
import { TextTrackType } from 'react-native-video';
import { settingsStorage } from '../lib/storage';
import { useM3Colors } from '../theme/M3PaletteContext';

export interface DownloadedSubtitleItem {
  id: string;
  title: string;
  language?: string;
  filePath?: string;
}

type Props = {
  data: Stream[];
  loading: boolean;
  title?: string;
  showModal: boolean;
  setModal: (value: boolean) => void;
  onPressVideo: (item: any) => void;
  onPressSubs: (item: any) => void;
  error?: string | null;
  videoDownloaded?: boolean;
  downloadedServer?: string;
  onDeleteVideo?: () => void;
  downloadedSubtitles?: DownloadedSubtitleItem[];
  isSubDownloaded?: (subTitle: string) => boolean;
  onDeleteSub?: (subTitle: string) => void;
};
const DownloadBottomSheet = ({
  data,
  loading,
  showModal,
  setModal,
  title,
  onPressSubs,
  onPressVideo,
  error,
  videoDownloaded,
  downloadedServer,
  onDeleteVideo,
  downloadedSubtitles,
  isSubDownloaded,
  onDeleteSub,
}: Props) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const colors = useM3Colors();
  const [activeTab, setActiveTab] = React.useState<1 | 2>(1);
  const streams = Array.isArray(data) ? data : [];

  const downloadedSubs = downloadedSubtitles || [];
  const hasDownloadedSubs = downloadedSubs.length > 0;

  const rawSubtitles = streams
    .flatMap(server => server.subtitles || [])
    .filter(Boolean);

  const streamSubtitles = rawSubtitles.filter(
    (sub, index, self) =>
      index ===
      self.findIndex(
        s =>
          s.uri === sub.uri ||
          (s.title === sub.title && s.language === sub.language),
      ),
  );

  const hasSubtitles = hasDownloadedSubs || streamSubtitles.length > 0;

  useEffect(() => {
    if (showModal) {
      setActiveTab(1);
      bottomSheetRef.current?.expand?.();
    } else {
      bottomSheetRef.current?.close?.();
    }
  }, [showModal]);

  const renderVideoTab = () => {
    if (videoDownloaded) {
      return (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: colors.surfaceContainerHighest,
            borderColor: colors.outlineVariant,
            borderRadius: 16,
            borderWidth: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginVertical: 6,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}>
          <View
            style={{
              alignItems: 'center',
              flex: 1,
              flexDirection: 'row',
              gap: 12,
            }}>
            <MaterialCommunityIcons
              name="check-circle"
              size={22}
              color={colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.onSurface,
                  fontSize: 15,
                  fontWeight: '700',
                }}>
                {downloadedServer || 'Video is downloaded'}
              </Text>
              <Text
                style={{
                  color: colors.onSurfaceVariant,
                  fontSize: 12,
                  marginTop: 2,
                }}>
                Downloaded
              </Text>
            </View>
          </View>
          {onDeleteVideo ? (
            <TouchableOpacity
              onPress={() => {
                onDeleteVideo();
                bottomSheetRef.current?.close?.();
              }}
              style={{
                alignItems: 'center',
                backgroundColor: colors.errorContainer,
                borderRadius: 12,
                flexDirection: 'row',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={18}
                color={colors.onErrorContainer}
              />
              <Text
                style={{
                  color: colors.onErrorContainer,
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                Delete
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

    if (loading) {
      return (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 64,
            minHeight: 180,
          }}>
          <LoadingIndicator size={52} color={colors.primary} />
        </View>
      );
    }

    if (streams.length > 0) {
      return streams.map(item => (
        <TouchableOpacity
          key={item.link}
          activeOpacity={0.72}
          style={{
            backgroundColor: colors.surfaceContainerHigh,
            alignItems: 'center',
            borderColor: colors.outlineVariant,
            borderRadius: 16,
            borderWidth: 1,
            flexDirection: 'row',
            gap: 12,
            justifyContent: 'space-between',
            marginVertical: 5,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
          onLongPress={() => {
            if (settingsStorage.isHapticFeedbackEnabled()) {
              RNReactNativeHapticFeedback.trigger('effectTick', {
                enableVibrateFallback: true,
                ignoreAndroidSystemSettings: false,
              });
            }
            Clipboard.setString(item.link);
            ToastAndroid.show('Link copied', ToastAndroid.SHORT);
          }}
          onPress={() => {
            onPressVideo(item);
            bottomSheetRef.current?.close?.();
          }}>
          <Text
            style={{
              color: colors.onSurface,
              flex: 1,
              fontWeight: '600',
            }}>
            {item.server}
          </Text>
          {item.quality ? (
            <View
              style={{
                backgroundColor: colors.secondaryContainer,
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}>
              <Text
                style={{
                  color: colors.onSecondaryContainer,
                  fontSize: 12,
                  fontWeight: '700',
                }}>
                {item.quality.toLowerCase().endsWith('p')
                  ? item.quality
                  : `${item.quality}p`}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ));
    }

    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 36,
        }}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={44}
          color={colors.error}
        />
        <Text
          style={{
            color: colors.onSurfaceVariant,
            fontSize: 15,
            fontWeight: '500',
            textAlign: 'center',
            marginTop: 12,
            paddingHorizontal: 20,
          }}>
          {error || 'No downloadable streams found'}
        </Text>
      </View>
    );
  };

  const renderSubtitleTab = () => {
    const undownloadedStreamSubs = streamSubtitles.filter(
      item =>
        !downloadedSubs.some(
          d =>
            d.title.toLowerCase().trim() ===
            item.title.toLowerCase().trim(),
        ) && !isSubDownloaded?.(item.title),
    );

    return (
      <>
        {downloadedSubs.map(item => (
          <View
            key={item.id || item.title}
            style={{
              alignItems: 'center',
              backgroundColor: colors.surfaceContainerHighest,
              borderColor: colors.outlineVariant,
              borderRadius: 16,
              borderWidth: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 5,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
            <View
              style={{
                alignItems: 'center',
                flex: 1,
                flexDirection: 'row',
                gap: 10,
              }}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={colors.primary}
              />
              <Text
                style={{
                  color: colors.onSurface,
                  flex: 1,
                  fontWeight: '600',
                }}>
                {item.language ? `${item.language} - ` : ''}
                {item.title}
              </Text>
            </View>
            {onDeleteSub ? (
              <TouchableOpacity
                onPress={() => {
                  onDeleteSub(item.title);
                  bottomSheetRef.current?.close?.();
                }}
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.errorContainer,
                  borderRadius: 10,
                  flexDirection: 'row',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={16}
                  color={colors.onErrorContainer}
                />
                <Text
                  style={{
                    color: colors.onErrorContainer,
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                  Delete
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}

        {loading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
            <LoadingIndicator size={42} color={colors.primary} />
          </View>
        ) : undownloadedStreamSubs.length > 0 ? (
          undownloadedStreamSubs.map(item => (
            <TouchableOpacity
              key={item.uri}
              activeOpacity={0.72}
              style={{
                alignItems: 'center',
                backgroundColor: colors.surfaceContainerHigh,
                borderColor: colors.outlineVariant,
                borderRadius: 16,
                borderWidth: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 5,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
              onLongPress={() => {
                if (settingsStorage.isHapticFeedbackEnabled()) {
                  RNReactNativeHapticFeedback.trigger('effectTick', {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: false,
                  });
                }
                Clipboard.setString(item.uri);
                ToastAndroid.show('Link copied', ToastAndroid.SHORT);
              }}
              onPress={() => {
                onPressSubs({
                  server: 'Subtitles',
                  link: item.uri,
                  type:
                    item.type === TextTrackType.VTT ? 'vtt' : 'srt',
                  title: item.title,
                });
                bottomSheetRef.current?.close?.();
              }}>
              <Text
                style={{
                  color: colors.onSurface,
                  flex: 1,
                }}>
                {item.language}
                {' - '} {item.title}
              </Text>
            </TouchableOpacity>
          ))
        ) : downloadedSubs.length === 0 ? (
          <Text
            style={{
              color: colors.onSurfaceVariant,
              fontSize: 15,
              textAlign: 'center',
              marginTop: 20,
            }}>
            No extra subtitles available
          </Text>
        ) : null}
      </>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing={false}
      snapPoints={['55%', '82%']}
      backgroundStyle={{ backgroundColor: colors.surfaceContainerLow }}
      handleIndicatorStyle={{ backgroundColor: colors.outline }}
      onClose={() => setModal(false)}>
      <BottomSheetView
        style={{
          backgroundColor: colors.surfaceContainerLow,
          flex: 1,
          paddingHorizontal: 16,
          paddingTop: 8,
        }}>
        {title &&
          <Text
            style={{
              color: colors.onSurface,
              fontSize: 20,
              fontWeight: '700',
              textAlign: 'center',
            }}>
            {title}
          </Text>}
        {hasSubtitles && (
          <View
            style={{
              alignSelf: 'center',
              borderBottomColor: colors.outlineVariant,
              borderBottomWidth: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
            {([
              { label: 'Video', value: 1 as const },
              { label: 'Subtitle', value: 2 as const },
            ] as const).map(tab => {
              const selected = activeTab === tab.value;
              return (
                <TouchableOpacity
                  key={tab.value}
                  onPress={() => setActiveTab(tab.value)}
                  style={{
                    borderBottomColor: selected
                      ? colors.primary
                      : 'transparent',
                    borderBottomWidth: 2,
                    marginBottom: -1,
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                  }}>
                  <Text
                    style={{
                      color: selected
                        ? colors.primary
                        : colors.onSurfaceVariant,
                      fontSize: 14,
                      fontWeight: selected ? '700' : '500',
                    }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: 28, paddingTop: hasSubtitles ? 0 : 12 }}
          showsVerticalScrollIndicator={false}>
          {activeTab === 1 ? renderVideoTab() : renderSubtitleTab()}
        </BottomSheetScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default DownloadBottomSheet;
