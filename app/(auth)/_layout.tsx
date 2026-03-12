/**
 * Auth Group Layout — Simple stack for auth screens
 */

import { Stack } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { useColorScheme } from '../../components/useColorScheme';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
