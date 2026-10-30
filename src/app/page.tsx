import Link from "next/link";

// The proxy redirects "/" to the right area; this only shows if that fails.
export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center">
      <Link href="/login" className="font-semibold text-brand underline">
        Ir para o login
      </Link>
    </main>
  );
}
