import { useAuth } from "../stores/auth";
export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Profile</h2>
      <div className="rounded-2xl border bg-white p-4">
        <div>Email: {user?.email}</div>
        <div>Name: {user?.name ?? "—"}</div>
        <p className="text-sm text-slate-500 mt-3">(Frontend-only demo – not persisted.)</p>
      </div>
    </div>
  );
}
