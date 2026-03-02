const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email) =>
  !!email && adminEmails.includes(email.toLowerCase());
