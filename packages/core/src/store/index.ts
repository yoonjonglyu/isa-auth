import { initState, getState, setState } from './store';

export function initStore(prevState: boolean) {
  initState('isa-auth', prevState || false);
}
/**
 *
 * @todo make watch render state
 */
export function useAuthState() {
  const auth: boolean = getState('isa-auth');
  const setAuth = (value: boolean) => setState('isa-auth', value);
  return [auth, setAuth] as [typeof auth, typeof setAuth];
}
