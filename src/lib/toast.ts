import { toast } from "sonner";

/**
 * Show a success toast with green background
 */
export const showSuccessToast = (message: string) => {
  toast.success(message);
};

/**
 * Show an error toast with red background
 */
export const showErrorToast = (message: string) => {
  toast.error(message);
};

/**
 * Show a warning toast with yellow background
 */
export const showWarningToast = (message: string) => {
  toast.warning(message);
};

/**
 * Show an info toast with blue background (default style)
 */
export const showInfoToast = (message: string) => {
  toast.info(message);
};

/**
 * Show a loading toast with spinning icon
 * Returns promise ID to close it later
 */
export const showLoadingToast = (message: string) => {
  return toast.loading(message);
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
    toast.success(options.message || "Success", { id });
  } else if (options.type === "error") {
    toast.error(options.message || "Error", { id });
  } else if (options.type === "warning") {
    toast.warning(options.message || "Warning", { id });
  } else if (options.type === "info") {
    toast.info(options.message || "Info", { id });
  } else if (options.type === "loading") {
    toast.loading(options.message || "Loading", { id });
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
