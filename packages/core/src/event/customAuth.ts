import { AUTH_EVENT } from '../value';

export function addAuthEventListener(
  callback: (detail: any) => void,
  target: EventTarget = typeof window !== 'undefined' ? window : ({} as any)
): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    callback(detail);
  };

  if (target && typeof target.addEventListener === 'function') {
    target.addEventListener(AUTH_EVENT, handler);
    return () => target.removeEventListener(AUTH_EVENT, handler);
  }
  return () => {};
}

export function removeAuthEventListener(
  callback: (detail: any) => void,
  target: EventTarget = typeof window !== 'undefined' ? window : ({} as any)
) {
  if (target && typeof target.removeEventListener === 'function') {
    target.removeEventListener(AUTH_EVENT, callback as EventListener);
  }
}

export function dispatchAuthEvent(
  eventNameOrDetail: string | any,
  detailOrTarget?: any,
  optionalTarget?: EventTarget
) {
  let eventType = AUTH_EVENT;
  let payload = eventNameOrDetail;
  let target = optionalTarget || (typeof window !== 'undefined' ? window : ({} as any));

  if (typeof eventNameOrDetail === 'string' && detailOrTarget !== undefined) {
    eventType = eventNameOrDetail;
    payload = detailOrTarget;
  } else if (typeof detailOrTarget?.dispatchEvent === 'function') {
    target = detailOrTarget;
  }

  if (target && typeof target.dispatchEvent === 'function') {
    const event = typeof CustomEvent !== 'undefined'
      ? new CustomEvent(eventType, { detail: payload })
      : ({ type: eventType, detail: payload } as any);
    target.dispatchEvent(event);
  }
}
