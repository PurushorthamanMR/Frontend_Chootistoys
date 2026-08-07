const inflight = new Map();

export function getInFlight(key) {
  return inflight.get(key);
}

export function setInFlight(key, promise) {
  inflight.set(key, promise);
  promise.finally(() => {
    if (inflight.get(key) === promise) inflight.delete(key);
  });
}
