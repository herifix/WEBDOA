import type { QueryClient } from "@tanstack/react-query";

type MutationSuccessArgs = {
  queryClient: QueryClient;
  queryKey: string;
  setPage: (page: number) => void;
  clearFormError: () => void;
  setFormSuccess: (message: string) => void;
  successMessage: string;
  toView: () => void;
};

type MutationErrorArgs = {
  err: unknown;
  clearFormSuccess: () => void;
  setFormError: (message: string) => void;
  fallbackMessage: string;
};

export async function handleMutationSuccess({
  queryClient,
  queryKey,
  setPage,
  clearFormError,
  setFormSuccess,
  successMessage,
  toView,
}: MutationSuccessArgs) {
  setPage(1);
  await queryClient.invalidateQueries({
    queryKey: [queryKey],
  });
  clearFormError();
  setFormSuccess(successMessage);
  toView();
}

export function handleMutationError({
  err,
  clearFormSuccess,
  setFormError,
  fallbackMessage,
}: MutationErrorArgs) {
  clearFormSuccess();
  setFormError(err instanceof Error ? err.message : fallbackMessage);
}
