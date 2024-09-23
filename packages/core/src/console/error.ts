export type StoreErrorType = 'require' | 'wrong' ;

export function storeError(type: StoreErrorType, id: string) {
  const _error = (msg: string) => error(`(store)::${msg}`);
  switch (type) {
    case 'require':
      return _error(`require ${id}.`);
    case 'wrong':
      return _error(`wrong ${id}.`);
    default:
      return _error(`test ${id}.`);
  }
}

function error(msg: string) {
  console.error(`**ISA-Auth(err)::${msg}`);
}
