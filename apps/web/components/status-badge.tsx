import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { useI18n } from "@/context/i18n-context";

type StatusBadgeProps = { value?: string | null; label?: string; kind?: "publishing" | "property" | "account" | "verification" | "role" };

const styleFor = (value?: string | null, kind?: StatusBadgeProps["kind"]) => {
  if (value === "ACTIVE" || value === "active" || value === "VERIFIED") return "status-badge is-positive";
  if (value === "PENDING" || value === "TEMPORARY_BLOCK" || value === "NOT_VERIFIED") return "status-badge is-warning";
  if (value === "REJECTED" || value === "PERMANETLY_BLOCK") return "status-badge is-danger";
  if (value === "archived" || value === "SOLD" || value === "RENTED") return "status-badge is-muted";
  if (kind === "role" && value === "SUPERADMIN") return "status-badge is-role";
  return "status-badge";
};

const humanize = (value?: string | null) => value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "—";

export function StatusBadge({ value, label, kind }: StatusBadgeProps) {
  const { t } = useI18n();
  const Icon = value === "ACTIVE" || value === "active" || value === "VERIFIED" ? CheckCircle2 : value === "PENDING" || value === "TEMPORARY_BLOCK" || value === "NOT_VERIFIED" ? Clock3 : value === "REJECTED" || value === "PERMANETLY_BLOCK" ? ShieldAlert : undefined;
  return <span className={styleFor(value, kind)}>{Icon && <Icon size={13}/>} {label || (value ? t(`status.${value.toUpperCase()}`) || humanize(value) : "—")}</span>;
}
