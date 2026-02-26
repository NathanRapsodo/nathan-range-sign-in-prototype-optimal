import { redirect } from 'next/navigation';

// Legacy route: redirect to /play (game machine model - no "start session" concept)
export default function StartPage() {
  redirect('/play');
}
