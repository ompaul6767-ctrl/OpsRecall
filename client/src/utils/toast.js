import toast from "react-hot-toast";

const recentErrors = new Set();

export function showErrorToast(message) {
  if (recentErrors.has(message)) return;

  recentErrors.add(message);
  toast.error(message, { id: `error:${message}` });
  window.setTimeout(() => recentErrors.delete(message), 5000);
}
