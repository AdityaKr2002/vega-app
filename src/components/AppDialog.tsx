import {MaterialCommunityIcons} from '@expo/vector-icons';
import React from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';

export type AppDialogVariant = 'info' | 'success' | 'warning' | 'error';

export interface AppDialogAction {
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'destructive';
  testID?: string;
}

interface AppDialogProps {
  visible: boolean;
  title: string;
  message: string;
  primary: string;
  variant?: AppDialogVariant;
  actions?: AppDialogAction[];
  onDismiss: () => void;
}

const variantStyles: Record<
  AppDialogVariant,
  {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
  }
> = {
  info: {icon: 'information-outline', color: '#60A5FA'},
  success: {icon: 'check-circle-outline', color: '#22C55E'},
  warning: {icon: 'alert-outline', color: '#F59E0B'},
  error: {icon: 'alert-circle-outline', color: '#EF4444'},
};

const AppDialog = ({
  visible,
  title,
  message,
  primary,
  variant = 'info',
  actions = [{label: 'OK', variant: 'primary'}],
  onDismiss,
}: AppDialogProps) => {
  const appearance = variantStyles[variant];

  return (
    <Modal
      animationType="fade"
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={onDismiss}>
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View
          testID="app-dialog"
          className="w-full max-w-md rounded-lg border border-gray-700 bg-[#1A1A1A] p-5">
          <View className="mb-4 flex-row items-center">
            <View
              className="mr-3 h-11 w-11 items-center justify-center rounded-full"
              style={{backgroundColor: `${appearance.color}22`}}>
              <MaterialCommunityIcons
                name={appearance.icon}
                size={25}
                color={appearance.color}
              />
            </View>
            <Text
              testID="app-dialog-title"
              className="flex-1 text-xl font-semibold text-white">
              {title}
            </Text>
          </View>

          <Text
            testID="app-dialog-message"
            className="mb-5 text-sm leading-5 text-gray-300">
            {message}
          </Text>

          <View className="flex-row flex-wrap justify-end gap-3">
            {actions.map(action => {
              const isDestructive = action.variant === 'destructive';
              const isPrimary = action.variant === 'primary';
              return (
                <TouchableOpacity
                  key={action.label}
                  testID={action.testID}
                  className="min-w-24 items-center rounded-md px-4 py-3"
                  style={{
                    backgroundColor: isDestructive
                      ? '#DC2626'
                      : isPrimary
                        ? primary
                        : '#374151',
                  }}
                  onPress={() => {
                    onDismiss();
                    action.onPress?.();
                  }}>
                  <Text className="font-semibold text-white">
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AppDialog;
