import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to contracts page by default
  redirect('/dashboard/contracts');
}
