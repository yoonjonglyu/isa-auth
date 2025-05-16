import { AUTH_EVENT } from '../value';
// dom custom event
export function addAuthEventListener<T extends HTMLElement>(
  root: T,
  callback: (state: boolean) => void,
) {
  root.addEventListener(AUTH_EVENT, (event: Event) => {
    const auth = (event as CustomEvent<boolean>).detail;
    callback(auth);
  });
}
export function removeAuthEventListener<T extends HTMLElement>(
  root: T,
  callback: (state: boolean) => void,
) {
  root.removeEventListener(AUTH_EVENT, (event: Event) => {
    const auth = (event as CustomEvent<boolean>).detail;
    callback(auth);
  });
}
export function dispatchAuthEvent<T extends HTMLElement>(
  root: T,
  auth: boolean,
) {
  root.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: auth }));
}
