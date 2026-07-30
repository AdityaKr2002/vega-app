import {View, FlatList, Pressable} from 'react-native';
import React, {useState, useEffect, useCallback, memo} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {MMKV} from '../lib/Mmkv';
import {SafeAreaView} from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';
import {searchOMDB} from '../lib/services/omdb';
import debounce from 'lodash/debounce';
import {OMDBResult} from '../types/omdb';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Surface from '../components/ui/Surface';
import AppText from '../components/ui/Text';
import SearchField from '../components/ui/SearchField';
import {useM3Colors} from '../theme/M3PaletteContext';

const MAX_VISIBLE_RESULTS = 15; // Limit number of animated items to prevent excessive callbacks
const MAX_HISTORY_ITEMS = 30; // Maximum number of history items to store

// Memoized search result item to prevent unnecessary re-renders
const SearchResultItem = memo(
  ({item, onPress}: {item: OMDBResult; onPress: (title: string) => void}) => {
    const colors = useM3Colors();
    const handlePress = useCallback(() => {
      onPress(item.Title);
    }, [item.Title, onPress]);

    return (
      <View style={{paddingHorizontal: 16, paddingVertical: 5}}>
        <Pressable
          onPress={handlePress}
          style={({pressed}) => ({
            backgroundColor: pressed
              ? colors.surfaceContainerHighest
              : colors.surfaceContainerLow,
            borderRadius: 20,
            padding: 14,
          })}>
          <View style={{alignItems: 'center', flexDirection: 'row'}}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: colors.secondaryContainer,
                borderRadius: 16,
                height: 44,
                justifyContent: 'center',
                marginRight: 14,
                width: 44,
              }}>
              <MaterialCommunityIcons
                name={item.Type === 'series' ? 'television' : 'movie-open'}
                size={22}
                color={colors.onSecondaryContainer}
              />
            </View>
            <View className="flex-1">
              <AppText
                role="bodyLargeEmphasized"
                style={{color: colors.onSurface}}>
                {item.Title}
              </AppText>
              <AppText
                role="bodySmall"
                style={{color: colors.onSurfaceVariant, marginTop: 2}}>
                {item.Type === 'series' ? 'TV Show' : 'Movie'} • {item.Year}
              </AppText>
            </View>
            <MaterialCommunityIcons
              name="arrow-top-right"
              size={20}
              color={colors.onSurfaceVariant}
            />
          </View>
        </Pressable>
      </View>
    );
  },
);

// Memoized history item component
const HistoryItem = memo(
  ({
    search,
    onPress,
    onRemove,
  }: {
    search: string;
    onPress: (text: string) => void;
    onRemove: (text: string) => void;
  }) => {
    const colors = useM3Colors();
    const handlePress = useCallback(() => {
      onPress(search);
    }, [search, onPress]);

    const handleRemove = useCallback(() => {
      onRemove(search);
    }, [search, onRemove]);

    return (
      <Surface level="low" className="mb-2 flex-row items-center p-2">
        <Pressable
          onPress={handlePress}
          className="flex-row flex-1 items-center p-2">
          <View className="rounded-2xl bg-m3-secondary-container p-2.5">
            <MaterialCommunityIcons
              name="history"
              size={18}
              color={colors.onSecondaryContainer}
            />
          </View>
          <AppText
            role="bodyMediumEmphasized"
            className="ml-3 text-m3-on-surface">
            {search}
          </AppText>
        </Pressable>
        <IconButton
          icon="close"
          label={`Remove ${search} from recent searches`}
          onPress={handleRemove}
          size={18}
        />
      </Surface>
    );
  },
);

const Search = () => {
  const colors = useM3Colors();
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  const [searchText, setSearchText] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(
    MMKV.getArray<string>('searchHistory') || [],
  );
  const [searchResults, setSearchResults] = useState<OMDBResult[]>([]);

  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      if (text.length >= 2) {
        setSearchResults([]); // Clear previous results
        const results = await searchOMDB(text);
        if (results.length > 0) {
          // Remove duplicates based on imdbID
          const uniqueResults = results.reduce((acc, current) => {
            const x = acc.find(
              (item: OMDBResult) => item.imdbID === current.imdbID,
            );
            if (!x) {
              return acc.concat([current]);
            } else {
              return acc;
            }
          }, [] as OMDBResult[]);

          // Limit the number of results to prevent excessive animations
          setSearchResults(uniqueResults.slice(0, MAX_VISIBLE_RESULTS));
        }
      } else {
        setSearchResults([]);
      }
    }, 300), // Reduced debounce time for better responsiveness
    [],
  );

  useEffect(() => {
    debouncedSearch(searchText);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchText, debouncedSearch]);

  const handleSearch = useCallback(
    (text: string) => {
      if (text.trim()) {
        // Save to search history
        const prevSearches = MMKV.getArray<string>('searchHistory') || [];
        if (!prevSearches.includes(text.trim())) {
          const newSearches = [text.trim(), ...prevSearches].slice(
            0,
            MAX_HISTORY_ITEMS,
          );
          MMKV.setArray('searchHistory', newSearches);
          setSearchHistory(newSearches);
        }

        navigation.navigate('SearchResults', {
          filter: text.trim(),
        });
      }
    },
    [navigation],
  );

  const removeHistoryItem = useCallback(
    (search: string) => {
      const newSearches = searchHistory.filter(item => item !== search);
      MMKV.setArray('searchHistory', newSearches);
      setSearchHistory(newSearches);
    },
    [searchHistory],
  );

  const clearHistory = useCallback(() => {
    MMKV.setArray('searchHistory', []);
    setSearchHistory([]);
  }, []);

  const handleResultPress = useCallback(
    (title: string) => {
      // Save to search history
      const prevSearches = MMKV.getArray<string>('searchHistory') || [];
      if (!prevSearches.includes(title)) {
        const newSearches = [title, ...prevSearches].slice(
          0,
          MAX_HISTORY_ITEMS,
        );
        MMKV.setArray('searchHistory', newSearches);
        setSearchHistory(newSearches);
      }
      navigation.navigate('SearchResults', {
        filter: title,
      });
    },
    [navigation],
  );

  // Memoized render function for search results
  const renderSearchResult = useCallback(
    ({item}: {item: OMDBResult}) => (
      <SearchResultItem item={item} onPress={handleResultPress} />
    ),
    [handleResultPress],
  );

  // Memoized render function for history items
  const renderHistoryItem = useCallback(
    ({item}: {item: string}) => (
      <HistoryItem
        search={item}
        onPress={handleSearch}
        onRemove={removeHistoryItem}
      />
    ),
    [handleSearch, removeHistoryItem],
  );

  // Memoized key extractors
  const searchResultKeyExtractor = useCallback(
    (item: OMDBResult) => item.imdbID.toString(),
    [],
  );
  const historyKeyExtractor = useCallback(
    (item: string, index: number) => `history-${index}`,
    [],
  );

  // Conditionally render animations based on state
  const AnimatedContainer = Animated.View;

  return (
    <SafeAreaView className="flex-1 bg-m3-background">
      {/* Title Section */}
      <AnimatedContainer
        entering={FadeInDown.springify()}
        layout={Layout.springify()}
        className="px-4 pt-5">
        {/* <AppText
          role="headlineLargeEmphasized"
          className="mb-1 text-m3-on-background"></AppText> */}
        <AppText
          role="bodyLarge"
          style={{color: colors.onSurfaceVariant, marginBottom: 18}}>
          Search across all providers
        </AppText>
        <View className="flex-row items-center space-x-3 mb-3">
          <View className="flex-1">
            <SearchField
              value={searchText}
              onChangeText={setSearchText}
              onSubmit={handleSearch}
              placeholder="Search anime..."
            />
          </View>
          {searchText.length > 0 && (
            <IconButton
              icon="close"
              label="Clear search"
              onPress={() => setSearchText('')}
              size={18}
            />
          )}
        </View>
      </AnimatedContainer>

      {/* Search Results */}
      <AnimatedContainer
        layout={Layout.springify()}
        className="flex-1"
        key={
          searchResults.length > 0
            ? 'results'
            : searchHistory.length > 0
              ? 'history'
              : 'empty'
        }>
        {searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={searchResultKeyExtractor}
            renderItem={renderSearchResult}
            contentContainerStyle={{paddingTop: 4}}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            initialNumToRender={10}
          />
        ) : searchHistory.length > 0 ? (
          <AnimatedContainer
            entering={SlideInRight.springify()}
            layout={Layout.springify()}
            className="px-4 flex-1 pt-4">
            <View className="flex-row items-center justify-between mb-3">
              <AppText
                role="titleMediumEmphasized"
                className="text-m3-on-surface">
                Recent Searches
              </AppText>
              <Button compact variant="text" onPress={clearHistory}>
                Clear all
              </Button>
            </View>

            <FlatList
              data={searchHistory}
              keyExtractor={historyKeyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 20}}
              renderItem={renderHistoryItem}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              windowSize={10}
              initialNumToRender={10}
            />
          </AnimatedContainer>
        ) : (
          // Empty State - Only show when no history and no results
          <AnimatedContainer
            layout={Layout.springify()}
            className="items-center justify-center flex-1 px-8">
            <View className="mb-5 rounded-[28px] bg-m3-secondary-container p-7">
              <MaterialCommunityIcons
                name="magnify"
                size={32}
                color={colors.onSecondaryContainer}
              />
            </View>
            <AppText
              role="bodyLarge"
              className="text-center text-m3-on-surface">
              Your next watch starts here
            </AppText>
            <AppText
              role="bodyMedium"
              className="mt-1 text-center text-m3-on-surface-variant">
              Search by title, then browse every provider in one place
            </AppText>
          </AnimatedContainer>
        )}
      </AnimatedContainer>
    </SafeAreaView>
  );
};

export default Search;
