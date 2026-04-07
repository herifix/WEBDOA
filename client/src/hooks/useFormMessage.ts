import { useState } from "react";

export function useFormMessage() {
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const clearFormError = () => setFormError("");
  const clearFormSuccess = () => setFormSuccess("");
  const clearFormMessage = () => {
    clearFormError();
    clearFormSuccess();
  };

  return {
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    clearFormError,
    clearFormSuccess,
    clearFormMessage,
  };
}
