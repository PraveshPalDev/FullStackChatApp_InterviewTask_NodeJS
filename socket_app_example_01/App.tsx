import { AppState, StyleSheet, View } from 'react-native';
import React, { useEffect } from 'react';
import Navigation from './src/routes/Navigation';
import { connectSocket, disconnectSocket } from './src/utils/socket';


export default function App() {

  useEffect(() => {
    connectSocket();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        disconnectSocket();
      } else if (nextAppState === 'active') {
        connectSocket();
      }
    });

    return () => {
      subscription.remove();
      disconnectSocket();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Navigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
