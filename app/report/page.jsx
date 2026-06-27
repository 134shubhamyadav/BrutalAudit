import { redirect } from 'next/navigation';

export default function ReportIndexPage() {
  // Redirect to repos where they can view specific reports
  redirect('/repos');
}
