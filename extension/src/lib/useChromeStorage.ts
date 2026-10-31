import { useEffect, useState } from "react";

/**
 * Read/write a single key in chrome.storage.local from React. Returns
 * [value, setValue, loaded]. `loaded` is false until the initial async read
 * completes (so the UI can avoid flashing a wrong state).
 */
export function useChromeStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    if (!chrome.storage?.local) {
      setLoaded(true); // no storage (e.g. tests) — don't hang the UI on a blank gate
      return;
    }
    chrome.storage.local.get(key).then((res) => {
      if (!active) return;
      if (res && key in res) setValue(res[key] as T);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [key]);

  const update = (next: T) => {
    setValue(next);
    chrome.storage?.local.set({ [key]: next });
  };

  return [value, update, loaded] as const;
}
