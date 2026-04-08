import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function SupportPage() {
  const t = await getTranslations("legal");

  return (
    <main className="pt-28 pb-20 bg-surface min-h-screen">
      <section className="max-w-[980px] mx-auto px-8">
        <h1 className="font-headline text-5xl text-on-surface mb-6">{t("supportTitle")}</h1>
        <p className="text-on-surface-variant text-lg mb-12">{t("supportIntro")}</p>

        <div className="grid gap-6">
          <article className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline text-3xl text-on-surface mb-3">{t("supportChannel1Title")}</h2>
            <p className="text-on-surface-variant">{t("supportChannel1Body")}</p>
          </article>

          <article className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline text-3xl text-on-surface mb-3">{t("supportChannel2Title")}</h2>
            <p className="text-on-surface-variant">{t("supportChannel2Body")}</p>
          </article>

          <article className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline text-3xl text-on-surface mb-3">{t("supportChannel3Title")}</h2>
            <p className="text-on-surface-variant">{t("supportChannel3Body")}</p>
          </article>
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold hover:brightness-110 transition-all"
          >
            {t("backHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
