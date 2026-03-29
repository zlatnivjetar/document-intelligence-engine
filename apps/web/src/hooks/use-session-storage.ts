import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type DocpipeProvider = 'anthropic' | 'openai';

export const DOCPIPE_PROVIDER_STORAGE_KEY = 'docpipe.provider';
export const DOCPIPE_ANTHROPIC_API_KEY_STORAGE_KEY = 'docpipe.anthropicApiKey';
const DOCPIPE_API_KEY_STORAGE_KEY_PREFIX = 'docpipe.apiKey.';

export function getDocpipeApiKeyStorageKey(provider: DocpipeProvider): string {
  return `${DOCPIPE_API_KEY_STORAGE_KEY_PREFIX}${provider}`;
}

function getLegacyStorageKey(key: string): string | null {
  if (key === getDocpipeApiKeyStorageKey('anthropic')) {
    return DOCPIPE_ANTHROPIC_API_KEY_STORAGE_KEY;
  }

  return null;
}

function getStoredStringValue(key: string): string | null {
  const storedValue = window.sessionStorage.getItem(key);

  if (storedValue !== null) {
    return storedValue;
  }

  const legacyKey = getLegacyStorageKey(key);

  if (legacyKey === null) {
    return null;
  }

  const legacyValue = window.sessionStorage.getItem(legacyKey);

  if (legacyValue === null) {
    return null;
  }

  window.sessionStorage.setItem(key, legacyValue);
  return legacyValue;
}

function readStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') {
    return initialValue;
  }

  const storedValue = getStoredStringValue(key);

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
  const previousKeyRef = useRef(key);
  const skipWriteRef = useRef(false);

  useEffect(() => {
    if (previousKeyRef.current !== key) {
      previousKeyRef.current = key;
      skipWriteRef.current = true;
    }

    setValue(readStoredValue(key, initialValue));
  }, [initialValue, key]);

  useEffect(() => {
    if (skipWriteRef.current) {
      skipWriteRef.current = false;
      return;
    }

    writeStoredValue(key, value);
  }, [key, value]);

  return [value, setValue];
}
