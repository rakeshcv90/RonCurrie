
import { MMKV } from 'react-native-mmkv';
const mmkv = new MMKV();

export const MMKVStorage = {
  setItem: (key, value) => {
    const stringValue =
      typeof value === 'object' ? JSON.stringify(value) : value;
    mmkv.set(key, stringValue);
    return Promise.resolve(true);
  },
  getItem: key => {
    const value = mmkv.getString(key);
    try {
      return Promise.resolve(JSON.parse(value));
    } catch (e) {
      return Promise.resolve(value);
    }
  },
  removeItem: key => {
    mmkv.delete(key);
    return Promise.resolve();
  },
  clearAllData: () => {
    mmkv.clearAll();
    return Promise.resolve();
  },
};
