import {MaterialCommunityIcons} from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {ProviderExtension} from '../../../lib/storage/extensionStorage';

export type ProviderTestStatus = 'untested' | 'testing' | 'working' | 'failed';

interface ProviderCardProps {
  provider: ProviderExtension;
  itemKey: string;
  installed: boolean;
  active: boolean;
  installing: boolean;
  updating: boolean;
  testStatus: ProviderTestStatus;
  hasUpdate: boolean;
  primary: string;
  onActivate: () => void;
  onInstall: () => void;
  onUpdate: () => void;
  onTest: () => void;
  onUninstall: () => void;
}

const statusAppearance: Record<
  Exclude<ProviderTestStatus, 'testing'>,
  {
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
    backgroundColor: string;
    borderColor: string;
  }
> = {
  untested: {
    label: 'Not tested',
    icon: 'circle',
    color: '#9CA3AF',
    backgroundColor: '#23272D',
    borderColor: '#4B5563',
  },
  working: {
    label: 'Working',
    icon: 'check-circle',
    color: '#4ADE80',
    backgroundColor: '#0D301B',
    borderColor: '#16A34A',
  },
  failed: {
    label: 'Failed',
    icon: 'close-circle',
    color: '#F87171',
    backgroundColor: '#351313',
    borderColor: '#DC2626',
  },
};

const ProviderStatusBadge = ({
  status,
  itemKey,
}: {
  status: ProviderTestStatus;
  itemKey: string;
}) => {
  if (status === 'testing') {
    return (
      <View
        testID={`provider-status-${itemKey}-testing`}
        className="flex-row items-center rounded-full border border-gray-600 bg-[#23272D] px-3 py-2">
        <ActivityIndicator size="small" color="#FF6347" />
        <Text className="ml-2 text-xs font-medium text-gray-300">Testing</Text>
      </View>
    );
  }

  const appearance = statusAppearance[status];
  return (
    <View
      testID={`provider-status-${itemKey}-${status}`}
      className="flex-row items-center rounded-full border px-3 py-2"
      style={{
        backgroundColor: appearance.backgroundColor,
        borderColor: appearance.borderColor,
      }}>
      <MaterialCommunityIcons
        name={appearance.icon}
        size={status === 'untested' ? 9 : 17}
        color={appearance.color}
      />
      <Text
        className="ml-2 text-xs font-medium"
        style={{color: appearance.color}}>
        {appearance.label}
      </Text>
    </View>
  );
};

const MetadataChip = ({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
}) => (
  <View className="mr-2 mt-2 max-w-36 flex-row items-center rounded-md border border-gray-700 bg-[#20252B] px-2 py-1.5">
    <MaterialCommunityIcons name={icon} size={15} color="#D1D5DB" />
    <Text className="ml-1.5 text-xs capitalize text-gray-300" numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const ProviderCard = ({
  provider,
  itemKey,
  installed,
  active,
  installing,
  updating,
  testStatus,
  hasUpdate,
  primary,
  onActivate,
  onInstall,
  onUpdate,
  onTest,
  onUninstall,
}: ProviderCardProps) => (
  <View
    className="mx-4 mb-4 overflow-hidden rounded-xl border bg-tertiary"
    style={{
      borderColor: active ? primary : '#',
      elevation: 2,
    }}>
    <TouchableOpacity
      activeOpacity={installed ? 0.75 : 1}
      disabled={!installed}
      onPress={onActivate}
      className="flex-row items-center p-4">
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-gray-600 bg-[#20262D]">
        {provider.icon ? (
          <Image
            source={{uri: provider.icon}}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <MaterialCommunityIcons name="web" size={36} color="white" />
        )}
      </View>

      <View className="ml-4 flex-1">
        <View className="flex-row items-baseline">
          <Text
            className="shrink text-xl font-bold text-white"
            numberOfLines={1}>
            {provider.display_name || 'Unknown Provider'}
          </Text>
          <Text className="ml-2 text-sm font-medium text-gray-400">
            v{provider.version || 'Unknown'}
          </Text>
        </View>
        <View className="flex-row flex-wrap">
          <MetadataChip icon="web" label={provider.type || 'Unknown'} />
          {provider.source?.author && (
            <MetadataChip icon="account" label={provider.source.author} />
          )}
        </View>
      </View>

      {installed && (
        <View className="ml-2 flex-row items-center self-start">
          {hasUpdate && (
            <TouchableOpacity
              testID={`update-provider-${itemKey}`}
              accessibilityLabel={`Update ${provider.display_name}`}
              disabled={updating}
              onPress={onUpdate}
              className="mr-2 h-9 w-9 items-center justify-center rounded-full border border-gray-600 bg-[#23272D]">
              {updating ? (
                <ActivityIndicator size="small" color={primary} />
              ) : (
                <MaterialCommunityIcons
                  name="update"
                  size={20}
                  color={primary}
                />
              )}
            </TouchableOpacity>
          )}
          <ProviderStatusBadge status={testStatus} itemKey={itemKey} />
        </View>
      )}
    </TouchableOpacity>

    <View className="mx-4 h-px bg-gray-700/60" />

    {installed ? (
      <View className="h-14 flex-row items-center">
        <TouchableOpacity
          testID={`test-provider-${itemKey}`}
          accessibilityLabel={`Test ${provider.display_name}`}
          disabled={testStatus === 'testing'}
          onPress={onTest}
          className="h-full flex-1 flex-row items-center justify-center">
          {testStatus === 'testing' ? (
            <ActivityIndicator size="small" color={primary} />
          ) : (
            <MaterialCommunityIcons name="flask" size={21} color={primary} />
          )}
          <Text
            className="ml-2 text-base font-semibold"
            style={{color: primary}}>
            {testStatus === 'testing' ? 'Testing' : 'Test'}
          </Text>
        </TouchableOpacity>

        <View className="h-8 w-px bg-gray-700" />

        <TouchableOpacity
          testID={`uninstall-provider-${itemKey}`}
          accessibilityLabel={`Uninstall ${provider.display_name}`}
          onPress={onUninstall}
          className="h-full flex-1 flex-row items-center justify-center">
          <MaterialCommunityIcons
            name="delete-outline"
            size={22}
            color={primary}
          />
          <Text
            className="ml-2 text-base font-semibold"
            style={{color: primary}}>
            Uninstall
          </Text>
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity
        testID={`install-provider-${itemKey}`}
        disabled={installing}
        onPress={onInstall}
        className="h-14 flex-row items-center justify-center">
        {installing ? (
          <ActivityIndicator size="small" color={primary} />
        ) : (
          <MaterialCommunityIcons name="download" size={22} color={primary} />
        )}
        <Text className="ml-2 text-base font-semibold" style={{color: primary}}>
          {installing ? 'Installing' : 'Install'}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

export default React.memo(ProviderCard);
