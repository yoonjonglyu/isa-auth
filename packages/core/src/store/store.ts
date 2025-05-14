import { isUndefined, isFalsy } from 'isa-util';
import { storeError } from '../console/error';

type Listener<T> = (state: T) => void;

const store = new Map<string, any>();
const listeners = new Map<string, Set<Listener<any>>>();

// 상태 초기화
export function initState(id: string, value: any) {
  if (isUndefined(value) || isFalsy(id)) return storeError('wrong', id);
  store.set(id, value);
  listeners.set(id, new Set());
}

// 상태 가져오기
export function getState<T = any>(id: string): T | undefined {
  const state = store.get(id);
  if (isUndefined(state)) {
    storeError('wrong', id);
    return undefined;
  }
  return state;
}

// 상태 변경 및 구독자 알림
export function setState(id: string, value: any) {
  const state = store.get(id);
  if (isUndefined(state) || isUndefined(value)) return storeError('wrong', id);

  store.set(id, value);

  const idListeners = listeners.get(id);
  idListeners?.forEach((listener) => listener(value));
}

// 상태 초기화 (null)
export function clearState(id: string) {
  if (!store.has(id)) return storeError('wrong', id);
  store.set(id, null);
}

// 상태 삭제
export function deleteState(id: string) {
  if (!store.has(id)) return storeError('wrong', id);
  store.delete(id);
  listeners.delete(id);
}

// 상태 존재 여부 확인
export function hasState(id: string) {
  return store.has(id);
}

// 상태 구독
export function subscribe<T = any>(id: string, listener: Listener<T>) {
  if (!store.has(id)) return storeError('wrong', id);

  const idListeners = listeners.get(id) ?? new Set();
  idListeners.add(listener);
  listeners.set(id, idListeners);

  listener(getState<any>(id)); // 초기 상태도 전달

  return () => {
    idListeners.delete(listener);
    if (idListeners.size === 0) listeners.delete(id);
  };
}
