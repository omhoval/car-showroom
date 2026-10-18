import CrudPage from '../components/CrudPage';
import StatusBadge from '../components/StatusBadge';
import { userApi } from '../services/resources';
import { date, label } from '../utils/format';

const ROLES = ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'];

export default function Users() {
  return (
    <CrudPage
      title="Employees"
      subtitle="Showroom staff accounts"
      queryKey="users"
      api={userApi}
      createLabel="Add employee"
      searchPlaceholder="Search name, email, phone…"
      filters={[{ name: 'role', label: 'Role', options: ROLES }, { name: 'isActive', label: 'Status', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true, createOnly: true },
        { name: 'phone', label: 'Mobile', type: 'tel', required: true },
        { name: 'password', label: 'Password', type: 'password', hint: 'Min 8 characters with upper, lower and a digit' },
        { name: 'role', label: 'Role', type: 'select', options: ROLES, required: true },
        { name: 'department', label: 'Department' },
        { name: 'joiningDate', label: 'Joining date', type: 'date' },
        { name: 'isActive', label: 'Account is active', type: 'checkbox', editOnly: true },
      ]}
      columns={[
        { key: 'name', label: 'Name', sortKey: 'name', render: (r) => <span className="font-semibold">{r.name}</span> },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Mobile' },
        { key: 'role', label: 'Role', sortKey: 'role', render: (r) => label(r.role) },
        { key: 'department', label: 'Department' },
        { key: 'isActive', label: 'Status', render: (r) => <StatusBadge value={r.isActive} /> },
        { key: 'lastLoginAt', label: 'Last login', render: (r) => date(r.lastLoginAt) },
      ]}
    />
  );
}
