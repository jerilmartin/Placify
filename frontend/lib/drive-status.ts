type DriveWithDeadline = {
  status?: string | null;
  registration_deadline?: string | null;
  drive_date?: string | null;
};

/** Registration closing is separate from the stored drive lifecycle status. */
export function isDriveRegistrationClosed(drive: DriveWithDeadline, now = new Date()): boolean {
  if (drive.status !== "active" && drive.status !== "upcoming") return false;
  const cutoff = drive.registration_deadline || drive.drive_date;
  if (!cutoff) return false;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return cutoff < today;
}
