import {
  initStore,
  getAccessToken,
  setAccessToken,
  getAuthInfo,
  getAuthState,
  setAuthInfo,
  setAuthState,
  watchAuthState,
} from './store';
import AuthBaseService from './service/baseAuthService';
import JwtService from './service/jwtService';
import GoogleAuthProvider from './providers/googleAuth';

import {
  addAuthEventListener,
  removeAuthEventListener,
  dispatchAuthEvent,
} from './event/customAuth';
import GoogleButton from './components/googleLogin';
