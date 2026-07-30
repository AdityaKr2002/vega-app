import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {settingsStorage} from '../../lib/storage';
import {useM3Colors} from '../../theme/M3PaletteContext';
import AppText from '../ui/Text';
import {AnimatedTabIcon, type AnimatedTabIconName} from './AnimatedTabIcon';

const TAB_ICONS: Record<string, AnimatedTabIconName> = {
  HomeStack: 'home',
  SearchStack: 'search',
  WatchListStack: 'watchlist',
  DownloadsStack: 'download',
  SettingsStack: 'settings',
};

const StreamingTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const colors = useM3Colors();
  const insets = useSafeAreaInsets();
  const showLabels = settingsStorage.showTabBarLabels();

  return (
    <View
      style={{
        backgroundColor: colors.surfaceContainerHigh,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingHorizontal: 4,
        paddingTop: 10,
      }}>
      <View
        style={{
          flexDirection: 'row',
          height: showLabels ? 64 : 44,
        }}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof descriptor.options.tabBarLabel === 'string'
              ? descriptor.options.tabBarLabel
              : typeof descriptor.options.title === 'string'
                ? descriptor.options.title
                : route.name;
          const icon = TAB_ICONS[route.name] ?? 'home';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              if (settingsStorage.isHapticFeedbackEnabled()) {
                ReactNativeHapticFeedback.trigger('effectTick', {
                  enableVibrateFallback: true,
                  ignoreAndroidSystemSettings: false,
                });
              }
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? {selected: true} : {}}
              accessibilityLabel={descriptor.options.tabBarAccessibilityLabel}
              activeOpacity={0.8}
              onLongPress={() =>
                navigation.emit({type: 'tabLongPress', target: route.key})
              }
              onPress={onPress}
              style={{
                alignItems: 'center',
                flex: 1,
                height: showLabels ? 64 : 44,
                justifyContent: 'center',
                minWidth: 48,
              }}>
              <View
                pointerEvents="none"
                style={{
                  alignItems: 'center',
                  backgroundColor: focused
                    ? colors.secondaryContainer
                    : 'transparent',
                  borderRadius: 18,
                  height: 36,
                  justifyContent: 'center',
                  overflow: 'hidden',
                  width: 64,
                }}>
                <AnimatedTabIcon
                  name={icon}
                  active={focused}
                  color={
                    focused
                      ? colors.onSecondaryContainer
                      : colors.onSurfaceVariant
                  }
                  size={26}
                />
              </View>
              {showLabels ? (
                <AppText
                  role={focused ? 'labelMediumEmphasized' : 'labelMedium'}
                  numberOfLines={1}
                  style={{
                    color: focused ? colors.onSurface : colors.onSurfaceVariant,
                    marginTop: 6,
                    textAlign: 'center',
                  }}>
                  {label}
                </AppText>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default StreamingTabBar;
