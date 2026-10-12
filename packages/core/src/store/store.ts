import { isUndefined, isFalsy } from 'isa-util';
import { storeError } from '../console/error';

export type Listener<T> = (state: T, previousState?: T) => void;
export type Selector<T, R> = (state: T) => R;
export type EqualityFn<T> = (a: T, b: T) => boolean;

const store = new Map<string, any>();
const listeners = new Map<string, Set<Listener<any>>>();

let isBatching = false;
const pendingNotifications = new Set<string>();

const defaultEquality: EqualityFn<any> = (a, b) => Object.is(a, b);

// 상태 초기화
export function initState(id: string, value: any) {
  if (isUndefined(value) || isFalsy(id)) return storeError('wrong', id);
  store.set(id, value);
  if (!listeners.has(id)) {
    listeners.set(id, new Set());
  }
}

// 상태 가져오기
export function getState<T = any>(id: string): T | undefined {
  const state = store.get(id);
  if (isUndefined(state)) {
    return undefined;
  }
  return state;
}

// 상태 변경 및 구독자 알림 (Equality Check 지원)
export function setState(id: string, value: any, forceNotify = false) {
  const previousState = store.get(id);
  if (isUndefined(value)) return storeError('wrong', id);

  if (!forceNotify && defaultEquality(previousState, value)) {
    return; // 동일한 상태면 불필요한 리스너 트리거 방지
  }

  store.set(id, value);

  if (isBatching) {
    pendingNotifications.add(id);
    return;
  }

  notifyListeners(id, value, previousState);
}

function notifyListeners(id: string, current: any, previous: any) {
  const idListeners = listeners.get(id);
  if (!idListeners || idListeners.size === 0) return;

  // Set 복사본으로 순회하여 실행 중 구독/해제로 인한 오류 방지
  const snapshot = Array.from(idListeners);
  for (const listener of snapshot) {
    try {
      listener(current, previous);
    } catch (err) {
      console.error(`[ISA-AUTH Store] Error in listener for state "${id}":`, err);
    }
  }
}

// 상태 초기화 (null)
export function clearState(id: string) {
  if (!store.has(id)) return storeError('wrong', id);
  setState(id, null);
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

// 상태 구독 (초기 상태 즉시 전달 및 unsubscribe 클린업 반환)
export function subscribe<T = any>(id: string, listener: Listener<T>) {
  if (!store.has(id)) {
    // 자동 초기화가 필요할 경우 null로 등록
    store.set(id, null);
    listeners.set(id, new Set());
  }

  const idListeners = listeners.get(id) ?? new Set();
  idListeners.add(listener);
  listeners.set(id, idListeners);

  // 초기 상태 즉시 1회 전달
  try {
    listener(getState<any>(id));
  } catch (err) {
    console.error(`[ISA-AUTH Store] Error in initial subscriber call for "${id}":`, err);
  }

  return () => {
    idListeners.delete(listener);
    if (idListeners.size === 0) {
      listeners.delete(id);
    }
  };
}

/**
 * 상태 객체의 특정 슬라이스나 계산값만 구독하는 셀렉터 구독자
 */
export function subscribeSelector<T = any, R = any>(
  id: string,
  selector: Selector<T, R>,
  listener: (slice: R, prevSlice?: R) => void,
  equalityFn: EqualityFn<R> = defaultEquality
) {
  let prevSlice: R = selector(getState<T>(id) as T);

  return subscribe<T>(id, (currentState) => {
    const nextSlice = selector(currentState);
    if (!equalityFn(prevSlice, nextSlice)) {
      const oldSlice = prevSlice;
      prevSlice = nextSlice;
      listener(nextSlice, oldSlice);
    }
  });
}

/**
 * 여러 상태 변경을 하나의 틱으로 묶어주는 배치 함수
 */
export function batch(fn: () => void) {
  const wasBatching = isBatching;
  isBatching = true;
  try {
    fn();
  } finally {
    if (!wasBatching) {
      isBatching = false;
      const ids = Array.from(pendingNotifications);
      pendingNotifications.clear();
      for (const id of ids) {
        notifyListeners(id, store.get(id), undefined);
      }
    }
  }
}

/**
 * 스토어 전체 상태 초기화 (테스트 및 완벽한 로그아웃 정리용)
 */
export function resetAllState() {
  store.clear();
  listeners.clear();
  pendingNotifications.clear();
  isBatching = false;
}
