import { SUPPORTED_MODE_IDS } from '@/lib/gameModes';

export function generateStaticParams() {
  return SUPPORTED_MODE_IDS.map((modeId) => ({
    modeId,
  }));
}

export default function ModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
