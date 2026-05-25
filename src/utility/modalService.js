import { modalRef } from "../../App";

export const showGlobalModal = (config) => {
  if (modalRef.current) {
    modalRef.current.show(config);
  }
};

export const hideGlobalModal = () => {
  if (modalRef.current) {
    modalRef.current.hide();
  }
};
