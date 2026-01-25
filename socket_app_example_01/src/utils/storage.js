import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export const storeKey = (key, value) => {
  storage.set(key, value);
};

export const getKey = key => {
  return storage.getString(key);
};

export const deleteKey = key => {
  storage.remove(key);
};

// get auth token from stored login data
export const getAuthToken = () => {
  const loginData = storage.getString('loginData');
  if (!loginData) return null;

  try {
    const { token, user } = JSON.parse(loginData);
    return token;
  } catch (e) {
    return null;
  }
};

export const getUser = () => {
  const loginData = storage.getString('loginData');
  if (!loginData) return null;

  try {
    const { user } = JSON.parse(loginData);
    return user;
  } catch (e) {
    return null;
  }
};
