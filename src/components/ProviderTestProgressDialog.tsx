import {MaterialCommunityIcons} from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {
  ProviderDiagnosticProgressStage,
  ProviderDiagnosticProgress,
} from '../lib/services/providerDiagnostics';

export type ProviderTestStepStatus =
  | 'pending'
  | ProviderDiagnosticProgress['status'];

export type ProviderTestStepState = Record<
  ProviderDiagnosticProgressStage,
  ProviderTestStepStatus
>;

interface ProviderTestProgressDialogProps {
  visible: boolean;
  providerName: string;
  steps: ProviderTestStepState;
  resultMessage?: string;
  primary: string;
  onClose: () => void;
}

const stepLabels: Array<{
  stage: ProviderDiagnosticProgressStage;
  label: string;
}> = [
  {stage: 'catalog', label: 'Catalog'},
  {stage: 'posts', label: 'Show list'},
  {stage: 'metadata', label: 'Metadata'},
  {stage: 'playback', label: 'Playback'},
  {stage: 'streams', label: 'Streams'},
];

const ProviderTestProgressDialog = ({
  visible,
  providerName,
  steps,
  resultMessage,
  primary,
  onClose,
}: ProviderTestProgressDialogProps) => {
  const statuses = Object.values(steps);
  const hasFailed = statuses.some(status => status === 'failed');
  const hasPassed = statuses.every(status => status === 'completed');
  const isFinished = hasFailed || hasPassed;

  return (
    <Modal
      animationType="fade"
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={() => {
        if (isFinished) {
          onClose();
        }
      }}>
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-md rounded-lg border border-gray-700 bg-[#1A1A1A] p-5">
          <Text className="text-xl font-semibold text-white">
            {hasFailed
              ? 'Provider test failed'
              : hasPassed
                ? 'Provider test passed'
                : 'Testing provider'}
          </Text>
          <Text className="mb-5 mt-1 text-sm text-gray-400" numberOfLines={1}>
            {providerName}
          </Text>

          <View className="gap-3">
            {stepLabels.map(({stage, label}) => {
              const status = steps[stage];
              return (
                <View
                  key={stage}
                  testID={`provider-test-step-${stage}-${status}`}
                  className="h-11 flex-row items-center rounded-md bg-gray-800 px-3">
                  <View className="mr-3 h-7 w-7 items-center justify-center">
                    {status === 'running' ? (
                      <ActivityIndicator size="small" color={primary} />
                    ) : (
                      <MaterialCommunityIcons
                        name={
                          status === 'completed'
                            ? 'check-circle'
                            : status === 'failed'
                              ? 'close-circle'
                              : 'circle-outline'
                        }
                        size={22}
                        color={
                          status === 'completed'
                            ? '#22C55E'
                            : status === 'failed'
                              ? '#EF4444'
                              : '#6B7280'
                        }
                      />
                    )}
                  </View>
                  <Text className="flex-1 font-medium text-white">{label}</Text>
                  <Text className="text-xs capitalize text-gray-400">
                    {status}
                  </Text>
                </View>
              );
            })}
          </View>

          {resultMessage && (
            <Text
              testID="provider-test-result"
              className={`mt-4 rounded-md p-3 text-sm leading-5 ${
                hasFailed
                  ? 'bg-red-950 text-red-200'
                  : 'bg-green-950 text-green-200'
              }`}>
              {resultMessage}
            </Text>
          )}

          {isFinished && (
            <TouchableOpacity
              testID="close-provider-test-progress"
              className="mt-5 items-center rounded-md px-4 py-3"
              style={{backgroundColor: primary}}
              onPress={onClose}>
              <Text className="font-semibold text-white">Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ProviderTestProgressDialog;
