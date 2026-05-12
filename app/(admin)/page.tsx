import React from 'react';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export default function AdminDashboardPage() {
  // Server component wrapper — client logic moved to AdminDashboardClient
  return (
    <div>
      <AdminDashboardClient />
    </div>
  );
}
