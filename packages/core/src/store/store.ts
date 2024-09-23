import { isUndefined, isFalsy } from 'isa-util';
import { storeError } from '../console/error';

const store = new Map();

export function initState(id: string, value: any) {
  if (isUndefined(value) || isFalsy(id)) return storeError('wrong', id);
  store.set(id, value);
}
export function getState(id: string) {
  const state = store.get(id);
  if (isUndefined(state)) return storeError('wrong', id);

  return state;
}
export function setState(id: string, value: any) {
  const state = store.get(id);
  if (isUndefined(state) || isUndefined(value)) return storeError('wrong', id);

  store.set(id, value);
}
export function clearState(id: string) {
  const state = store.get(id);
  if (isUndefined(state)) return storeError('wrong', id);
  store.set(id, null);
}
