import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo.jpg";
import { COMPANY } from "@/lib/constants";

type Props = {
  internId: string;
  fullName: string;
  domain: string;
  photoUrl?: string | null;
  issuedAt: string;
};

export function IDCard({ internId, fullName, domain, photoUrl, issuedAt }: Props) {
  const verifyUrl = `https://skyrovixvirtualinternship.vercel.app/verify-certificate?intern=${internId}`;
  return (
    <div className="brand-gradient relative mx-auto aspect-[1.6/1] w-full max-w-md overflow-hidden rounded-2xl p-5 text-white shadow-2xl glow">
      <div className="absolute -right-12 -top-12 size-40 rounded-full bg-white/10 blur-2xl" />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="size-8 rounded" />
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-80">{COMPANY.shortName}</div>
            <div className="text-xs font-semibold">Intern ID Card</div>
          </div>
        </div>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider">{new Date(issuedAt).getFullYear()}</span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="size-20 overflow-hidden rounded-xl border-2 border-white/40 bg-white/10">
          {photoUrl ? <img src={photoUrl} alt={fullName} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-2xl">{fullName.charAt(0)}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs opacity-70">Name</div>
          <div className="truncate text-lg font-bold">{fullName}</div>
          <div className="mt-1 text-xs opacity-70">Domain</div>
          <div className="truncate text-sm font-medium">{domain}</div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-70">Intern ID</div>
          <div className="font-mono text-sm font-bold">{internId}</div>
          <div className="mt-1 text-[10px] opacity-60">Issued {new Date(issuedAt).toLocaleDateString()}</div>
        </div>
        <div className="rounded-md bg-white p-1.5">
          <QRCodeSVG value={verifyUrl} size={56} />
        </div>
      </div>
    </div>
  );
}
