import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    client.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete client.defaults.headers.common['x-auth-token'];
  }
};

export default client;
