import { toastRef } from "../../App";

export const showToast = (type, text, description, duration) => {
  if (toastRef.current) {
    toastRef.current.show({ type, text, description, duration });
  }
};