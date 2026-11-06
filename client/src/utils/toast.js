import toast from "react-hot-toast";

export function showErrorToast(message) {
  toast.error(message, { id: `error:${message}` });
}
