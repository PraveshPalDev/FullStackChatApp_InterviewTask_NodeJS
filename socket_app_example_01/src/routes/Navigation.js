import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainStack from './MainStack';
import AuthStack from './AuthStack';
import { useMMKVString } from 'react-native-mmkv';

export default function Navigation() {
  const [loginData] = useMMKVString('loginData');

  const parsedLoginData = loginData ? JSON.parse(loginData) : null;
  const { token, user } = parsedLoginData || {};

  return (
    <NavigationContainer options={{ headerShown: true }}>
      {token ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
