import { toast } from "sonner";

type ToastId = string | number;

/**
 * Stable id so the same message updates an existing toast instead of stacking
 * (e.g. React StrictMode double-invoking fetch effects in development).
 */
function resolveToastId(prefix: string, message: string, id?: ToastId): ToastId {
  return id ?? `${prefix}:${message}`;
}

/**
 * Show a success toast with green background
 */
export const showSuccessToast = (message: string, id?: ToastId) => {
  toast.success(message, { id: resolveToastId("success", message, id) });
};

/**
 * Show an error toast with red background
 */
export const showErrorToast = (message: string, id?: ToastId) => {
  toast.error(message, { id: resolveToastId("error", message, id) });
};

/**
 * Show a warning toast with yellow background
 */
export const showWarningToast = (message: string, id?: ToastId) => {
  toast.warning(message, { id: resolveToastId("warning", message, id) });
};

/**
 * Show an info toast with blue background (default style)
 */
export const showInfoToast = (message: string, id?: ToastId) => {
  toast.info(message, { id: resolveToastId("info", message, id) });
};

/**
 * Show a loading toast with spinning icon
 * Returns promise ID to close it later
 */
export const showLoadingToast = (message: string, id?: ToastId) => {
  return toast.loading(message, {
    id: resolveToastId("loading", message, id),
  });
};

/**
 * Update a toast (useful for loading -> success/error transitions)
 */
export const updateToast = (
  id: string | number,
  options: {
    message?: string;
    type?: "success" | "error" | "warning" | "info" | "loading";
  }
) => {
  if (options.type === "success") {
    toast.success(options.message ?? "Success", { id });
  } else if (options.type === "error") {
    toast.error(options.message ?? "Error", { id });
  } else if (options.type === "warning") {
    toast.warning(options.message ?? "Warning", { id });
  } else if (options.type === "info") {
    toast.info(options.message ?? "Info", { id });
  } else if (options.type === "loading") {
    toast.loading(options.message ?? "Loading", { id });
  }
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (id: string | number) => {
  toast.dismiss(id);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};
