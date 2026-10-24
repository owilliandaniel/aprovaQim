// Inline error or success message for forms.
export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-danger">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="rounded-lg bg-ok-bg px-3 py-2 text-ok">
        {success}
      </p>
    );
  }
  return null;
}
