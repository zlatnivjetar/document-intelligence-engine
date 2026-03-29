import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export const DOCPIPE_ANTHROPIC_API_KEY_STORAGE_KEY = 'docpipe.anthropicApiKey';

function readStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') {
    return initialValue;
  }

  const storedValue = window.sessionStorage.getItem(key);

  if (storedValue === null) {
    return initialValue;
  }

  if (typeof initialValue === 'string') {
    return storedValue as T;
  }

  try {
    return JSON.parse(storedValue) as T;
  } catch {
    return initialValue;
  }
}

function writeStoredValue<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof value === 'string') {
    window.sessionStorage.setItem(key, value);
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function useSessionStorageState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue));

  useEffect(() => {
    setValue(readStoredValue(key, initialValue));
  }, [initialValue, key]);

  useEffect(() => {
    writeStoredValue(key, value);
  }, [key, value]);

  return [value, setValue];
}
