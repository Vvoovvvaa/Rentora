"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, CheckCircle2, Heart, LayoutGrid, LogOut, Mail, MessageCircle, UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { apiMessage, userApi } from "@/lib/api";
import { PhoneInput } from "./phone-input";
import { useI18n } from "@/context/i18n-context";

export function ProfilePage() {
  const { user, refresh, signOut } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "+374");
  const [age, setAge] = useState(String(user?.age || ""));
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  const selectPhoto = (file: File | null) => {
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const reset = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "+374");
    setAge(String(user?.age || ""));
    selectPhoto(null);
    setError("");
    setSuccess("");
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("phone", phone);
      form.append("age", age);
      if (photo) form.append("photo", photo);
      await userApi.update(form);
      await refresh();
      selectPhoto(null);
      setSuccess(t("profile.updated"));
    } catch (reason) {
      setError(apiMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || t("profile.title")).split(" ").filter(Boolean).slice(0, 2).map((item) => item[0]).join("").toUpperCase();
  const avatarSrc = photoPreview || user?.image?.url;
  const navigation = [
    { href: "/profile", label: t("navigation.profile"), icon: UserRound, active: true },
    { href: "/my-properties", label: t("navigation.myListings"), icon: LayoutGrid },
    { href: "/favorites", label: t("navigation.savedHomes"), icon: Heart },
    { href: "/messages", label: t("navigation.messages"), icon: MessageCircle },
  ];

  return <main className="profile-page"><div className="shell profile-shell">
    <header className="profile-intro"><p className="eyebrow">{t("profile.eyebrow")}</p><h1>{t("profile.title")}</h1><p>{t("profile.personalInfo")}</p></header>
    <div className="profile-layout">
      <aside className="profile-sidebar" aria-label={t("profile.title")}>
        <section className="profile-summary-card">
          <div className="profile-avatar">{avatarSrc ? <img src={avatarSrc} alt={t("profile.profilePhoto")}/> : initials}</div>
          <div className="profile-summary-copy"><h2>{user?.name || t("profile.title")}</h2><p><Mail size={14}/>{user?.gmail}</p>{user?.gmailStatus === "VERIFIED" && <span className="profile-verified"><CheckCircle2 size={14}/>{t("profile.verifiedEmail")}</span>}</div>
        </section>
        <nav className="profile-navigation">{navigation.map(({ href, label, icon: Icon, active }) => <Link key={href} href={href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}><Icon size={17}/><span>{label}</span></Link>)}</nav>
        <button type="button" onClick={() => void signOut()} className="profile-logout"><LogOut size={17}/>{t("profile.logOut")}</button>
      </aside>

      <div className="profile-main-content">
        <form onSubmit={save} className="profile-settings-card">
          <div className="profile-card-heading"><div><p className="eyebrow">{t("profile.eyebrow")}</p><h2>{t("profile.personalInfo")}</h2><p>{t("profile.personalInfo")}</p></div></div>
          <div className="profile-fields">
            <label className="profile-field"><span>{t("profile.name")}</span><input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name"/></label>
            <label className="profile-field"><span>{t("profile.age")}</span><input required type="number" min="18" max="120" value={age} onChange={(event) => setAge(event.target.value)} inputMode="numeric"/></label>
            <div className="profile-phone-field"><PhoneInput value={phone} onChange={setPhone}/></div>
          </div>

          <section className="profile-photo-section" aria-labelledby="profile-photo-title"><div><p className="eyebrow">{t("profile.profilePhoto")}</p><h3 id="profile-photo-title">{t("profile.profilePhoto")}</h3><p>JPG, PNG, WebP</p></div><div className="profile-photo-action"><div className="profile-photo-preview">{avatarSrc ? <img src={avatarSrc} alt={t("profile.profilePhoto")}/> : initials}</div><label className="btn-secondary profile-photo-button"><Camera size={16}/>{t("profile.changePhoto")}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => selectPhoto(event.target.files?.[0] || null)}/></label></div>{photo && <p className="profile-selected-file">{photo.name}</p>}</section>

          <div className="profile-save-area"><div>{error && <p className="profile-notice is-error" role="alert">{error}</p>}{success && <p className="profile-notice is-success" role="status">{success}</p>}</div><div><button type="button" className="btn-secondary" onClick={reset} disabled={saving}>{t("common.cancel")}</button><button className="btn-primary" disabled={saving}>{saving ? t("profile.saving") : t("profile.saveChanges")}</button></div></div>
        </form>

        <section className="profile-account-card"><div><p className="eyebrow">{t("profile.eyebrow")}</p><h2>{t("profile.title")}</h2></div><dl><div><dt>{t("profile.email")}</dt><dd>{user?.gmailStatus === "VERIFIED" ? t("profile.verifiedEmail") : t("common.notAvailable")}</dd></div><div><dt>{t("property.status")}</dt><dd>{user?.accauntStatus === "ACTIVE" ? t("status.ACTIVE") : user?.accauntStatus || t("common.notAvailable")}</dd></div></dl></section>
      </div>
    </div>
  </div></main>;
}
