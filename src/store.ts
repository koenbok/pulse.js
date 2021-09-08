export function get(key: string) {
  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch (error) {
    return;
  }
}

export function set(key: string, value: any) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function remove(key: string) {
  window.localStorage.removeItem(key);
}