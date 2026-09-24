import React, { useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "react-hot-toast";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { useOffresQuery, useReglagesMutation } from "../../queries/reglage.query";
import { reglagesSchema } from "../../schemas/reglage.schema";
import { IReglages } from "../../types/reglage.type";
import { Bouton, ChampSelect, ChampTexte, Libelle, classeChamp } from "../commun/Champs";

const EXEMPLE = { prenom: "Awa", code: "CN-7KQ4MX", expiration: "01/10/2026" };

/** Réglages du module et message du coupon, avec l'aperçu que recevra le client. */
export function ReglagesGeneraux({ initial }: { initial: IReglages }) {
  const [r, setR] = useState(initial);
  const { data: offres = [] } = useOffresQuery();
  const enregistrer = useReglagesMutation();
  const maj = (p: Partial<IReglages>) => setR((x) => ({ ...x, ...p }));

  const offre = offres.find((o) => o.id === r.default_offer_id) ?? offres[0];
  const apercu = r.message_template
    .split("{prenom}").join(EXEMPLE.prenom)
    .split("{offre}").join(offre?.label ?? "votre offre")
    .split("{code}").join(EXEMPLE.code)
    .split("{expiration}").join(EXEMPLE.expiration)
    .split("{lien}").join(r.app_link);

  const valider = () => {
    const v = reglagesSchema.safeParse(r);
    if (!v.success) return toast.error(v.error.issues[0].message);
    enregistrer.mutate(v.data);
  };

  return (
    <StatsChartCard title="Réglages généraux" subtitle="Tentatives, alertes et message du coupon" icon={Settings2}>
      <div className="grid sm:grid-cols-2 gap-3">
        <ChampTexte label="Tentatives sans réponse avant « injoignable »" type="number" valeur={String(r.max_attempts)} onChange={(v) => maj({ max_attempts: Number(v) })} min={1} max={20} />
        <ChampTexte label="Alerte si pas appelé après (heures)" type="number" valeur={String(r.alert_delay_hours)} onChange={(v) => maj({ alert_delay_hours: Number(v) })} min={1} />
        <ChampSelect label="Offre par défaut" valeur={r.default_offer_id} onChange={(v) => maj({ default_offer_id: v })} vide="La première de la liste" options={offres.filter((o) => o.is_active).map((o) => ({ value: o.id, label: o.label }))} />
        <ChampTexte label="Lien de commande" type="url" valeur={r.app_link} onChange={(v) => maj({ app_link: v })} />
      </div>

      <div className="mt-4 space-y-3">
        <ChampTexte label="Modèle WhatsApp approuvé par Meta (identifiant Twilio)" valeur={r.whatsapp_template_sid} onChange={(v) => maj({ whatsapp_template_sid: v })} placeholder="HX… (vide : envoi par SMS)" />
        <p className="text-xs text-gray-500 -mt-1">
          Le modèle doit prévoir cinq variables dans cet ordre : prénom, offre, code, date d&apos;expiration, lien. Tant que ce champ est vide, ou
          si WhatsApp échoue, le message part par SMS.
        </p>
        <label className="block">
          <Libelle>Message SMS (et repli WhatsApp)</Libelle>
          <textarea value={r.message_template} onChange={(e) => maj({ message_template: e.target.value })} rows={3} className={`${classeChamp} resize-none`} />
        </label>
        <p className="text-xs text-gray-500 -mt-1">Variables : {"{prenom} {offre} {code} {expiration} {lien}"}</p>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-gray-800">
          <p className="text-xs font-semibold text-emerald-700 mb-1">Aperçu</p>
          {apercu}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Bouton variante="primaire" onClick={valider} desactive={enregistrer.isPending}>
          Enregistrer les réglages
        </Bouton>
      </div>
    </StatsChartCard>
  );
}
