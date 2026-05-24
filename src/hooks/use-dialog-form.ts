"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SubmitResult = { error?: string } | void | null | undefined;

export function useDialogForm(
  onClose: () => void,
  options?: { successMessage?: string }
) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSubmit =
    (submitFn: (formData: FormData) => Promise<SubmitResult>) =>
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);

      startTransition(async () => {
        const result = await submitFn(formData);

        if (result && typeof result === "object" && "error" in result && result.error) {
          toast.error(result.error);
          return;
        }

        if (options?.successMessage) {
          toast.success(options.successMessage);
        }

        form.reset();
        onClose();
        router.refresh();
      });
    };

  return { pending, handleSubmit };
}
