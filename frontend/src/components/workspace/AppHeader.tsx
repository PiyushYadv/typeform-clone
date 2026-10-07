import Link from "next/link";

/** Top bar shared by the workspace and results pages. */
export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/10 bg-white px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/forms" className="text-[17px] font-semibold tracking-tight">
          typeform<span className="font-normal text-black/40"> clone</span>
        </Link>
        {children}
      </div>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCD0F2] text-sm font-medium"
        title="Default creator"
        aria-label="Signed in as the default creator"
      >
        A
      </span>
    </header>
  );
}
