import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, TouchableOpacity} from 'react-native';
import type {ListRenderItem} from 'react-native';
import useWatchHistoryStore from '../lib/zustand/watchHistrory';
import {mainStorage as MMKV} from '../lib/storage/StorageService';
import {useNavigation} from '@react-navigation/native';
import useThemeStore from '../lib/zustand/themeStore';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {TabStackParamList} from '../App';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import ContinueWatchingCard, {
  ContinueWatchingItemData,
} from './ContinueWatchingCard';

const ContinueWatching = () => {
  const primary = useThemeStore(state => state.primary);
  const navigation =
    useNavigation<NativeStackNavigationProp<TabStackParamList>>();
  const history = useWatchHistoryStore(state => state.history);
  const removeItems = useWatchHistoryStore(state => state.removeItems);
  const [progressData, setProgressData] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<boolean>(false);

  // Filter out duplicates and get the most recent items
  const recentItems = React.useMemo(() => {
    const seen = new Set();
    const items = history
      .filter(item => item.provider !== 'local')
      .filter(item => {
        if (seen.has(item.link)) {
          return false;
        }
        seen.add(item.link);
        return true;
      })
      .slice(0, 10); // Limit to 10 items

    return items;
  }, [history]);

  // Load progress data
  useEffect(() => {
    const loadProgressData = () => {
      const progressMap: Record<string, number> = {};

      recentItems.forEach(item => {
        try {
          // Try to get dedicated watch history progress
          const historyKey = item.link;
          const historyProgressKey = `watch_history_progress_${historyKey}`;
          const storedProgress = MMKV.getString(historyProgressKey);

          if (storedProgress) {
            const parsed = JSON.parse(storedProgress);
            if (parsed.percentage) {
              progressMap[item.link] = Math.min(
                Math.max(parsed.percentage, 0),
                100,
              );
            } else if (parsed.currentTime && parsed.duration) {
              const percentage = (parsed.currentTime / parsed.duration) * 100;
              progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
            }
          } else if (item.currentTime && item.duration) {
            const percentage = (item.currentTime / item.duration) * 100;
            progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
          }
        } catch (e) {
          console.error('Error processing progress for item:', item.title, e);
        }
      });

      setProgressData(progressMap);
    };

    loadProgressData();
  }, [recentItems]);

  const handleNavigateToInfo = (item: any) => {
    try {
      // Parse the link if it's a JSON string
      let linkData = item.link;
      if (typeof item.link === 'string' && item.link.startsWith('{')) {
        try {
          linkData = JSON.parse(item.link);
        } catch (e) {
          console.error('Failed to parse link:', e);
        }
      }
      console.log('linkData', item.poster);
      // Navigate to Info screen
      navigation.navigate('HomeStack', {
        screen: 'Info',
        params: {
          link: linkData,
          provider: item.provider,
          poster: item.poster,
        },
      } as any);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const toggleItemSelection = (link: string) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(link)) {
        newSelected.delete(link);
      } else {
        newSelected.add(link);
      }

      // Exit selection mode if no items are selected
      if (newSelected.size === 0) {
        setSelectionMode(false);
      }

      return newSelected;
    });
  };

  const handleLongPress = useCallback(
    (link: string) => {
      ReactNativeHapticFeedback.trigger('effectClick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });

      // Enter selection mode if not already in it
      if (!selectionMode) {
        setSelectionMode(true);
      }

      toggleItemSelection(link);
    },
    [selectionMode],
  );

  const handlePress = useCallback(
    (item: any) => {
      if (selectionMode) {
        toggleItemSelection(item.link);
      } else {
        handleNavigateToInfo(item);
      }
    },
    [selectionMode],
  );

  const deleteSelectedItems = () => {
    removeItems([...selectedItems]);
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const exitSelectionMode = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const keyExtractor = useCallback(
    (item: ContinueWatchingItemData) => item.link,
    [],
  );

  const renderItem = useCallback<ListRenderItem<ContinueWatchingItemData>>(
    ({item}) => (
      <ContinueWatchingCard
        item={item}
        progress={progressData[item.link] || 0}
        isSelected={selectedItems.has(item.link)}
        selectionMode={selectionMode}
        primary={primary}
        onPress={handlePress}
        onLongPress={handleLongPress}
      />
    ),
    [
      progressData,
      selectedItems,
      selectionMode,
      primary,
      handlePress,
      handleLongPress,
    ],
  );

  // Only render if we have items (MOVED AFTER ALL HOOKS)
  if (recentItems.length === 0) {
    return null;
  }

  return (
    <Pressable
      onPress={() => selectionMode && exitSelectionMode()}
      className="mt-3 mb-8">
      <View className="flex flex-row justify-between items-center px-2 mb-3">
        <Text className="text-2xl font-semibold" style={{color: primary}}>
          Continue Watching
        </Text>

        {selectionMode && selectedItems.size > 0 && (
          <View className="flex flex-row items-center">
            <Text className="text-white mr-1">
              {selectedItems.size} selected
            </Text>
            <TouchableOpacity
              onPress={event => {
                event.stopPropagation();
                deleteSelectedItems();
              }}
              className=" rounded-full mr-2">
              <MaterialCommunityIcons
                name="delete-outline"
                size={25}
                color={primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={recentItems}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        contentContainerStyle={{paddingHorizontal: 12}}
        renderItem={renderItem}
      />
    </Pressable>
  );
};

export default ContinueWatching;
