const store = new Map();

export function initState(id: string, value: any) {
  const state = store.get(id);
  if (state !== undefined)
    return console.error(`isa-auth(err): wrong store state id: ${id} `);
  if (value === undefined)
    return console.error(`isa-auth(err): wrong set store state id: ${id}`);
  store.set(id, value);
}
export function getState(id: string) {
  const state = store.get(id);
  if (state === undefined)
    return console.error(`isa-auth(err): wrong store state id: ${id} `);

  return state;
}
export function setState(id: string, value: any) {
  const state = store.get(id);
  if (state === undefined)
    return console.error(`isa-auth(err): wrong store state id: ${id} `);
  if (value === undefined)
    return console.error(`isa-auth(err): wrong set store state id: ${id}`);
  store.set(id, value);
}
export function clearState(id: string) {
  const state = store.get(id);
  if (state === undefined)
    return console.error(`isa-auth(err): wrong store state id: ${id} `);
  store.set(id, null);
}
