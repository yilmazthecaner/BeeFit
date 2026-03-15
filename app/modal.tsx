import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useColorScheme } from '../components/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';

export default function EditProfileModal() {
  const router = useRouter();
  const { type } = useLocalSearchParams(); // 'profile' | 'goal'
  const isGoal = type === 'goal';
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user, updateProfile } = useAuthStore();
  const u = user as any;
  
  const [name, setName] = useState(u?.displayName || u?.user_metadata?.first_name || 'Alex');
  const [weight, setWeight] = useState(user?.weightKg?.toString() || '75.5');
  const [height, setHeight] = useState(user?.heightCm?.toString() || '178');
  const [goal, setGoal] = useState<string>(user?.fitnessGoal || 'lose_weight');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    if (isGoal) {
      await updateProfile({ fitnessGoal: goal as any });
    } else {
      await updateProfile({
        displayName: name,
        heightCm: parseInt(height, 10),
        weightKg: parseFloat(weight),
      });
    }
    setIsSaving(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
        {isGoal ? 'Edit Fitness Goal' : 'Edit Profile'}
      </Text>
      <View style={styles.separator} lightColor="rgba(0,0,0,0.1)" darkColor="rgba(255,255,255,0.1)" />

      {isGoal ? (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#475569' }]}>Primary Goal</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a', borderColor: isDark ? '#334155' : '#e2e8f0' }]} 
            value={goal} 
            onChangeText={setGoal} 
            placeholder="Muscle Gain, Weight Loss, etc." 
            placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'} 
          />
        </View>
      ) : (
        <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#475569' }]}>First Name</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a', borderColor: isDark ? '#334155' : '#e2e8f0' }]} 
              value={name} 
              onChangeText={setName} 
              placeholder="Name" 
              placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#475569' }]}>Height (cm)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a', borderColor: isDark ? '#334155' : '#e2e8f0' }]} 
              value={height} 
              onChangeText={setHeight} 
              keyboardType="numeric" 
              placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#475569' }]}>Weight (kg)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a', borderColor: isDark ? '#334155' : '#e2e8f0' }]} 
              value={weight} 
              onChangeText={setWeight} 
              keyboardType="numeric" 
              placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'} 
            />
          </View>
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
        <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 24,
  },
  separator: {
    marginVertical: 16,
    height: 1,
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  saveBtn: {
    backgroundColor: '#ec5b13',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
