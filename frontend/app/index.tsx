import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF0000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
