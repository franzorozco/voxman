import React from "react";
import { Globe, Store, Laptop, ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";

/**
 * Google brand icon SVG component (minimal & crisp)
 */
export function GoogleIcon({ size = 14, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Identify user origin / access channel
 */
export function getUserOrigin(user) {
  if (!user) {
    return {
      type: "web",
      label: "Web",
      shortLabel: "Web",
      isGoogle: false,
      isPos: false,
      isSystem: false,
      icon: <Globe size={12} />,
    };
  }

  const isGoogle = Boolean(user.google_id);
  const isGuestEmail = Boolean(user.email && user.email.toLowerCase().includes("@guest"));
  const isPosCustomer = Boolean(
    isGuestEmail ||
      user.customer?.customer_code?.startsWith("CLI-POS") ||
      user.registration_source === "pos" ||
      user.source === "store" ||
      user.source === "pos"
  );
  const isSystemUser =
    !isGoogle && !isPosCustomer && (user.owner?.is_active || user.employee?.is_active) && !user.customer?.is_active;

  if (isGoogle) {
    return {
      type: "google",
      label: "Google OAuth",
      shortLabel: "Google",
      isGoogle: true,
      isPos: false,
      isSystem: false,
      icon: <GoogleIcon size={13} />,
    };
  }

  if (isPosCustomer) {
    return {
      type: "pos",
      label: "POS / Tienda Física",
      shortLabel: "POS",
      isGoogle: false,
      isPos: true,
      isSystem: false,
      icon: <Store size={12} />,
    };
  }

  if (isSystemUser) {
    return {
      type: "system",
      label: "Panel / Sistema Interno",
      shortLabel: "Interno",
      isGoogle: false,
      isPos: false,
      isSystem: true,
      icon: <Laptop size={12} />,
    };
  }

  return {
    type: "web",
    label: "Plataforma Web",
    shortLabel: "Web",
    isGoogle: false,
    isPos: false,
    isSystem: false,
    icon: <Globe size={12} />,
  };
}

/**
 * Determine email verification status
 */
export function getUserVerification(user) {
  if (!user) {
    return {
      verified: false,
      isGoogle: false,
      isGuest: false,
      isPending: false,
      label: "No verificado",
      statusClass: "unverified",
      icon: <Clock size={12} />,
      date: null,
    };
  }

  // Google users are verified implicitly
  if (user.google_id) {
    return {
      verified: true,
      isGoogle: true,
      isGuest: false,
      isPending: false,
      label: "Verificado (Google)",
      statusClass: "verified",
      icon: <ShieldCheck size={12} />,
      date: user.email_verified_at,
    };
  }

  // Guest accounts created on POS
  if (user.email && user.email.toLowerCase().includes("@guest")) {
    return {
      verified: false,
      isGoogle: false,
      isGuest: true,
      isPending: false,
      label: "POS Rápido (Sin email)",
      statusClass: "guest",
      icon: <Store size={12} />,
      date: null,
    };
  }

  if (user.email_verified_at) {
    return {
      verified: true,
      isGoogle: false,
      isGuest: false,
      isPending: false,
      label: "Email Verificado",
      statusClass: "verified",
      icon: <ShieldCheck size={12} />,
      date: user.email_verified_at,
    };
  }

  return {
    verified: false,
    isGoogle: false,
    isGuest: false,
    isPending: true,
    label: "Pendiente (24h)",
    statusClass: "pending",
    icon: <Clock size={12} />,
    date: null,
  };
}

/**
 * Get formatted full name
 */
export function getUserFullName(user) {
  if (!user) return "-";
  const p = user.profile;
  if (!p) return user.username || user.email || "-";
  const parts = [p.first_name, p.last_name_paternal, p.last_name_maternal].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.username || "-";
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(user) {
  if (!user) return "U";
  const p = user.profile;
  if (p?.first_name) {
    const f = p.first_name.trim()[0];
    const l = p.last_name_paternal ? p.last_name_paternal.trim()[0] : "";
    return `${f}${l}`.toUpperCase();
  }
  if (user.username) {
    return user.username.slice(0, 2).toUpperCase();
  }
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return "U";
}

/**
 * Clean date formatter
 */
export function formatDate(dateString, withTime = false) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    if (withTime) {
      return date.toLocaleString("es-BO", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("es-BO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}
