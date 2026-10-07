import type { LucideIcon } from "lucide-react";

export function ComingSoon({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/5">
          <Icon size={22} aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-medium">{title}</h2>
        <p className="mt-1 text-black/60">{text}</p>
        <span className="mt-4 inline-block rounded-full bg-black/5 px-2.5 py-1 text-xs">Coming soon</span>
      </div>
    </div>
  );
}
