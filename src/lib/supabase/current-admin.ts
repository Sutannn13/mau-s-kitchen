import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getServiceClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/supabase/auth";
import { isAdminDataAccessConfigured } from "@/lib/supabase/config";

// Verifikasi ulang di setiap batas DAL berprivilege. Trafik admin rendah;
// tambahkan cache request-scoped hanya bila pengukuran menunjukkan perlu.
export async function getAuthorizedAdminServiceClient() {
  if (!isAdminDataAccessConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  const admin = await verifyAdminSession(() =>
    cookieStore.getAll().map(({ name, value }) => ({ name, value })),
  );

  if (!admin) {
    redirect("/admin/login");
  }

  return getServiceClient();
}
