import { redirect } from 'next/navigation';

// Legacy route: redirect to /play (game machine model - no "end session" concept)
export default function EndPage() {
  redirect('/play');
}
