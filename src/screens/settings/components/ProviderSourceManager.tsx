import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {MaterialCommunityIcons, MaterialIcons} from '@expo/vector-icons';
import {
  extensionStorage,
  ProviderSource,
} from '../../../lib/storage/extensionStorage';
import {createProviderSource} from '../../../lib/utils/helpers';
import {socialLinks} from '../../../lib/constants';

type Props = {
  primary: string;
  visible: boolean;
  onSourceChanged: (source: ProviderSource | undefined) => void | Promise<void>;
};

const ProviderSourceManager = ({primary, visible, onSourceChanged}: Props) => {
  const [sources, setSources] = useState<ProviderSource[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const defaultSource = useMemo(() => {
    return sources.find(item => item.isDefault) || sources[0];
  }, [sources]);

  const reloadSources = () => {
    const nextSources = extensionStorage.getProviderSources();
    setSources(nextSources);
    if (nextSources.length === 0) {
      setShowSourcePicker(false);
      setShowAddDialog(true);
    }
  };

  useEffect(() => {
    if (!visible) {
      return;
    }

    const currentSources = extensionStorage.getProviderSources();
    setSources(currentSources);

    if (currentSources.length === 0) {
      setShowAddDialog(true);
    }
  }, [visible]);

  const handleSelectSource = async (source: ProviderSource) => {
    setShowSourcePicker(false);
    extensionStorage.setDefaultProviderSource(source.author);
    reloadSources();
    await onSourceChanged(extensionStorage.getProviderSource());
  };

  const handleConfirmAdd = async () => {
    try {
      const parsedSource = createProviderSource(inputValue);
      extensionStorage.addProviderSources(
        parsedSource.author,
        parsedSource.url,
      );
      extensionStorage.setDefaultProviderSource(parsedSource.author);
      setInputValue('');
      setShowAddDialog(false);
      reloadSources();
      await onSourceChanged(extensionStorage.getProviderSource());
    } catch (error) {
      Alert.alert(
        'Invalid source',
        'Enter a valid source URL or GitHub author.',
      );
    }
  };

  const handleRemoveSource = (author: string) => {
    Alert.alert('Remove source', `Remove ${author} from provider sources?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const installedForSource = extensionStorage
            .getInstalledProviders()
            .filter(provider => provider.source?.author === author);

          installedForSource.forEach(provider => {
            extensionStorage.uninstallProvider(provider.value, author);
          });

          extensionStorage.removeProviderSource(author);
          reloadSources();
          await onSourceChanged(extensionStorage.getProviderSource());
        },
      },
    ]);
  };

  if (!visible) {
    return null;
  }

  return (
    <View className="mx-4 mt-4">
      <Text className="mb-2 text-xs font-semibold uppercase text-gray-500">
        Provider source
      </Text>
      <View className="flex-row items-center gap-2">
        <View className="flex-1 overflow-hidden rounded-lg border border-[#2f302f] bg-black">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Select provider source"
            className="h-[52px] flex-row items-center px-3"
            onPress={() => setShowSourcePicker(true)}>
            <Text
              className={`flex-1 text-base font-bold ${
                defaultSource ? '' : 'text-gray-400'
              }`}
              style={defaultSource ? {color: primary} : undefined}
              numberOfLines={1}>
              {defaultSource?.author || 'Add a provider source'}
            </Text>
            <MaterialIcons name="expand-more" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          accessibilityLabel="Add provider source"
          className="h-[52px] w-[52px] items-center justify-center rounded-lg"
          style={{backgroundColor: primary}}
          onPress={() => setShowAddDialog(true)}>
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSourcePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSourcePicker(false)}>
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end bg-black/70"
          onPress={() => setShowSourcePicker(false)}>
          <TouchableOpacity
            activeOpacity={1}
            className="max-h-[70%] rounded-t-xl border-t border-gray-700 bg-tertiary px-4 pb-8 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-semibold text-white">
                  Provider source
                </Text>
                <Text className="mt-1 text-xs text-gray-400">
                  Select or remove a source
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Close source picker"
                className="h-10 w-10 items-center justify-center"
                onPress={() => setShowSourcePicker(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            <ScrollView nestedScrollEnabled>
              {sources.map(source => {
                const isSelected = source.author === defaultSource?.author;
                return (
                  <View
                    key={source.author}
                    className={`mb-2 flex-row items-center rounded-lg border px-3 py-3 ${
                      isSelected
                        ? 'border-primary bg-quaternary'
                        : 'border-gray-700 bg-black'
                    }`}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${source.author} source`}
                      className="flex-1 flex-row items-center pr-2"
                      onPress={() => handleSelectSource(source)}>
                      <View className="flex-1">
                        <Text className="font-semibold text-white">
                          {source.author}
                        </Text>
                        <Text
                          className="mt-1 text-xs text-gray-400"
                          numberOfLines={1}>
                          {source.url}
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={22}
                          color={primary}
                        />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityLabel={`Remove ${source.author} source`}
                      className="ml-3 h-10 w-10 items-center justify-center rounded-md bg-red-950"
                      onPress={() => handleRemoveSource(source.author)}>
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={20}
                        color="#F87171"
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAddDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowAddDialog(false);
          setInputValue('');
        }}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            className="flex-1 bg-black/70"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: 24,
            }}
            keyboardShouldPersistTaps="handled">
            <View className="w-full bg-tertiary rounded-2xl p-4 border border-quaternary">
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="text-white text-base font-semibold w-fit"
                  numberOfLines={1}>
                  Add Source
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddDialog(false);
                    setInputValue('');
                  }}>
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              <Text className="text-white text-sm font-medium">
                Enter source name or url to add provider
              </Text>
              <Text className="text-gray-400 text-sm mt-[4px]">
                How to create or add provider check{' '}
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(socialLinks.github + '#vega-app')
                  }>
                  <Text className="text-blue-400 text-sm mt-[4.5px]">here</Text>
                </TouchableOpacity>
              </Text>
              <Text className="text-gray-400 text-sm mt-[4px]">
                or join Discord for support{' '}
                <TouchableOpacity
                  onPress={() => Linking.openURL(socialLinks.discord)}>
                  <Text className="text-blue-400 text-sm mt-[4.5px]">
                    Discord
                  </Text>
                </TouchableOpacity>
              </Text>
              <TextInput
                className="bg-quaternary rounded-lg px-4 py-3 text-white border border-gray-700 mt-3"
                placeholder=" "
                placeholderTextColor="#6B7280"
                value={inputValue}
                onChangeText={setInputValue}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  className="flex-1 rounded-lg px-4 py-3 items-center bg-gray-700"
                  onPress={() => {
                    setShowAddDialog(false);
                    setInputValue('');
                  }}>
                  <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 rounded-lg px-4 py-3 items-center"
                  style={{backgroundColor: primary}}
                  onPress={handleConfirmAdd}>
                  <Text className="text-white font-medium">Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ProviderSourceManager;
