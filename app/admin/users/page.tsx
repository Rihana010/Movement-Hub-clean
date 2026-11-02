import Link from "next/link";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/currentAdmin";
import { AdminRoleSelector } from "@/components/AdminRoleSelector";
import { AdminStatusButton } from "@/components/AdminStatusButton";
import { AdminResetPasswordButton } from "@/components/AdminResetPasswordButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
    const currentAdmin = await requireAdmin();

    if (!currentAdmin || currentAdmin.role !== "super_admin") {
    redirect("/admin");
    }
  const admins = await prisma.adminUser.findMany({
    orderBy: {
      email: "asc",
    },
  });

  return (
    <div className="min-h-[calc(100dvh-4.5rem)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <Link
                href="/admin"
                className="admin-back-link"
              >
                ← Back to Dashboard
              </Link>

              <h1 className="mt-4 text-3xl font-bold text-slate-950">
                Admin Users
              </h1>

              <p className="mt-3 text-slate-600">
                Review admin accounts, roles, and password-change status.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:pt-12">

                <Link
                    href="/admin/users/new"
                    className="w-full rounded-xl bg-[#8DC63F] px-4 py-2 text-center font-semibold text-white transition hover:bg-[#78A935] sm:w-auto"
                >
                    + Create Admin
                </Link>
                </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="hidden w-full border-collapse text-left text-sm md:table">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Password</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-t border-slate-200">
                  <td className="px-4 py-4 font-semibold text-slate-950">
                    {admin.fullName || "—"}
                  </td>

                  <td className="px-4 py-4 text-slate-600">{admin.email}</td>

                  <td className="px-4 py-4">
                    <AdminRoleSelector
                        adminId={admin.id}
                        currentRole={admin.role}
                    />
                    </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        admin.isActive
                          ? "bg-[#EDF7DD] text-[#4F7F1F]"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="technical-label">
                        {admin.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    {admin.mustChangePassword ? (
                      <span className="technical-label rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      MUST CHANGE
                      </span>
                    ) : (
                      <span className="technical-label rounded-full bg-[#EDF7DD] px-3 py-1 text-xs font-semibold text-[#4F7F1F]">
                        SET
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {admin.role !== "super_admin" && (
                        <>
                          <AdminStatusButton
                            adminId={admin.id}
                            fullName={admin.fullName}
                            isActive={admin.isActive}
                          />
                          <AdminResetPasswordButton
                            adminId={admin.id}
                            email={admin.email}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-3 p-4 md:hidden">
            {admins.map((admin) => (
              <article key={admin.id} className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-950">{admin.fullName || "—"}</p>
                  <p className="break-all text-sm text-slate-600">{admin.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-500">Role</p>
                    <AdminRoleSelector adminId={admin.id} currentRole={admin.role} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Status</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        admin.isActive
                          ? "bg-[#EDF7DD] text-[#4F7F1F]"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="technical-label">
                        {admin.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Password</p>
                    {admin.mustChangePassword ? (
                      <span className="technical-label mt-1 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        MUST CHANGE
                      </span>
                    ) : (
                      <span className="technical-label mt-1 inline-flex rounded-full bg-[#EDF7DD] px-3 py-1 text-xs font-semibold text-[#4F7F1F]">
                        SET
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {admin.role !== "super_admin" && (
                    <>
                      <AdminStatusButton
                        adminId={admin.id}
                        fullName={admin.fullName}
                        isActive={admin.isActive}
                      />
                      <AdminResetPasswordButton
                        adminId={admin.id}
                        email={admin.email}
                      />
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          {admins.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              No admin users have been created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}