import { Alert } from 'react-native';

export const handleApiError = error => {
  // Server responded
  if (error.response) {
    const message =
      error.response.data?.message ||
      error.response.data?.error ||
      'Something went wrong';

    Alert.alert('Error', message);
    console.log('API Error:', error.response);
  }
  // Request made but no response
  else if (error.request) {
    Alert.alert(
      'Network Error',
      'Unable to reach server. Please check your internet connection.',
    );
    console.log('Network Error:', error.request);
  }
  // Something else
  else {
    Alert.alert('Error', error.message);
    console.log('Unexpected Error:', error.message);
  }
};
