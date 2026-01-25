// url.js
export const API_BASE_URL = 'http://192.168.0.102:4000/';

export const getApiURL = endpoint => API_BASE_URL + endpoint;

// auth all api endpoints
export const SIGNUP_API = 'api/auth/register';
export const LOGIN_API = 'api/auth/login';
export const GETAllUSERS_API = 'api/auth/users';
export const GETMESSAGES_API = (userId) => `api/auth/messages/${userId}`;
export const SEND_MESSAGE_API = 'api/auth/messages';
