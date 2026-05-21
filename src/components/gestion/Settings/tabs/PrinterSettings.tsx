"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  AlertCircle,
  Bluetooth,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
  Plug,
  Printer,
  RefreshCw,
  Unplug,
  Usb,
} from "lucide-react";
import {
  appairerImprimante,
  appairerImprimanteBT,
  decrireImprimante,
  decrireImprimanteBT,
  envoyerCommandes,
  envoyerCommandesBT,
  genererTicketEscPos,
  imprimanteBTConnue,
  nomDeviceBT,
  oublierImprimante,
  oublierImprimanteBT,
  retrouverImprimante,
  supporteWebBluetooth,
  supporteWebUsb,
  type DeviceBluetooth,
  type DeviceUSB,
} from "@/lib/escpos";
import type { Order } from "../../../../../features/orders/types/order.types";

type Transport = "usb" | "bluetooth";

/**
 * Onglet "Imprimante" — appairage WebUSB + WebBluetooth + test d'impression.
 *
 * Stack volontairement Tailwind brut (pas de HeroUI dans le BO CN) et lucide
 * pour les icones, alignee sur les autres onglets Settings.
 *
 * L'impression de test envoie un Order minimal "synthetique" pour valider
 * que le device est bien repondant (utile en boutique avant la 1ere vraie
 * commande de la journee).
 */
const PrinterSettings: React.FC = () => {
  const supportUsb =
    typeof window !== "undefined" ? supporteWebUsb() : false;
  const supportBT =
    typeof window !== "undefined" ? supporteWebBluetooth() : false;

  const [transport, setTransport] = useState<Transport>(() => {
    if (typeof window === "undefined") return "usb";
    return !supportUsb && supportBT ? "bluetooth" : "usb";
  });

  // ─── USB ──────────────────────────────────────────────────────────────
  const [deviceUsb, setDeviceUsb] = useState<DeviceUSB | null>(null);
  const [chargementUsb, setChargementUsb] = useState(true);
  const [enCoursUsb, setEnCoursUsb] = useState(false);
  const [modeAvanceUsb, setModeAvanceUsb] = useState(false);

  useEffect(() => {
    if (!supportUsb) {
      setChargementUsb(false);
      return;
    }
    retrouverImprimante()
      .then((d) => {
        setDeviceUsb(d);
        setChargementUsb(false);
      })
      .catch(() => setChargementUsb(false));
  }, [supportUsb]);

  async function connecterUsb() {
    try {
      setEnCoursUsb(true);
      const d = await appairerImprimante(modeAvanceUsb);
      setDeviceUsb(d);
      toast.success("Imprimante USB connectée");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      if (!/no device selected|user cancel/i.test(msg)) toast.error(msg);
    } finally {
      setEnCoursUsb(false);
    }
  }

  function deconnecterUsb() {
    oublierImprimante();
    setDeviceUsb(null);
    toast.success("Imprimante USB déconnectée");
  }

  async function testerUsb() {
    if (!deviceUsb) return;
    setEnCoursUsb(true);
    try {
      const data = genererTicketEscPos(buildOrderTest(), {
        nom: "Chicken Nation",
        devise: "F CFA",
      });
      await envoyerCommandes(deviceUsb, data);
      toast.success("Ticket de test envoyé");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur d'impression";
      toast.error(msg);
    } finally {
      setEnCoursUsb(false);
    }
  }

  // ─── Bluetooth ────────────────────────────────────────────────────────
  const [deviceBT, setDeviceBT] = useState<DeviceBluetooth | null>(null);
  const [enCoursBT, setEnCoursBT] = useState(false);
  const [modeAvanceBT, setModeAvanceBT] = useState(false);
  const btConnu =
    typeof window !== "undefined" ? imprimanteBTConnue() : false;
  const nomBT =
    typeof window !== "undefined" ? nomDeviceBT() : null;

  async function connecterBT() {
    try {
      setEnCoursBT(true);
      const d = await appairerImprimanteBT(modeAvanceBT);
      setDeviceBT(d);
      toast.success("Imprimante Bluetooth connectée");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      if (!/no device selected|user cancel/i.test(msg)) toast.error(msg);
    } finally {
      setEnCoursBT(false);
    }
  }

  function deconnecterBT() {
    oublierImprimanteBT();
    setDeviceBT(null);
    toast.success("Imprimante Bluetooth déconnectée");
  }

  async function testerBT() {
    if (!deviceBT) return;
    setEnCoursBT(true);
    try {
      const data = genererTicketEscPos(buildOrderTest(), {
        nom: "Chicken Nation",
        devise: "F CFA",
      });
      await envoyerCommandesBT(deviceBT, data);
      toast.success("Ticket de test envoyé");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur d'impression";
      toast.error(msg);
    } finally {
      setEnCoursBT(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
        <Printer className="w-5 h-5 text-[#F17922] shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700">
          <p className="font-medium text-[#F17922]">
            Configuration de l&apos;imprimante thermique 80mm
          </p>
          <p className="mt-1 text-xs">
            Branchez votre imprimante en USB (boutique fixe) ou en Bluetooth
            (camion / livreur). L&apos;appairage est conservé entre sessions.
            Si rien n&apos;est appairé, l&apos;impression bascule
            automatiquement vers l&apos;app native (TPE) puis le navigateur.
          </p>
        </div>
      </div>

      {/* Tabs USB / Bluetooth */}
      <div className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 mb-4 w-fit">
        <button
          type="button"
          onClick={() => setTransport("usb")}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium rounded-[10px] transition-colors ${
            transport === "usb"
              ? "bg-[#F17922] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Usb className="w-4 h-4" /> USB
        </button>
        <button
          type="button"
          onClick={() => setTransport("bluetooth")}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium rounded-[10px] transition-colors ${
            transport === "bluetooth"
              ? "bg-[#F17922] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Bluetooth className="w-4 h-4" /> Bluetooth
        </button>
      </div>

      {transport === "usb" && (
        <div className="border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Usb className="w-5 h-5 text-[#F17922]" />
            <h3 className="font-semibold text-gray-900">USB (boutique fixe)</h3>
          </div>

          {!supportUsb ? (
            <EmptyState
              icon={<AlertCircle className="w-8 h-8 text-amber-500" />}
              title="WebUSB non supporté"
              description="Votre navigateur ne supporte pas WebUSB. Utilisez Chrome ou Edge sur desktop, ou bascule en Bluetooth."
            />
          ) : chargementUsb ? (
            <p className="text-sm text-gray-500">Détection en cours…</p>
          ) : deviceUsb ? (
            <ConnectedState
              label={decrireImprimante(deviceUsb)}
              onTest={testerUsb}
              onDisconnect={deconnecterUsb}
              busy={enCoursUsb}
            />
          ) : (
            <DisconnectedState
              cta="Appairer une imprimante USB"
              advancedLabel="Mode avancé (lever les filtres si imprimante non détectée)"
              advanced={modeAvanceUsb}
              setAdvanced={setModeAvanceUsb}
              onConnect={connecterUsb}
              busy={enCoursUsb}
            />
          )}
        </div>
      )}

      {transport === "bluetooth" && (
        <div className="border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-5 h-5 text-[#F17922]" />
            <h3 className="font-semibold text-gray-900">
              Bluetooth (camion / livreur)
            </h3>
          </div>

          {!supportBT ? (
            <EmptyState
              icon={<AlertCircle className="w-8 h-8 text-amber-500" />}
              title="Web Bluetooth non supporté"
              description="Votre navigateur ne supporte pas Web Bluetooth. Utilisez Chrome sur Android, ou Chrome/Edge sur desktop."
            />
          ) : deviceBT ? (
            <ConnectedState
              label={decrireImprimanteBT(deviceBT)}
              onTest={testerBT}
              onDisconnect={deconnecterBT}
              busy={enCoursBT}
            />
          ) : btConnu && nomBT ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Appairage enregistré pour{" "}
                <strong className="text-gray-900">{nomBT}</strong>. Cliquez sur
                « Connecter » pour réactiver le lien avec le device.
              </p>
              <DisconnectedState
                cta="Connecter l'imprimante Bluetooth"
                advancedLabel="Mode avancé"
                advanced={modeAvanceBT}
                setAdvanced={setModeAvanceBT}
                onConnect={connecterBT}
                busy={enCoursBT}
              />
              <button
                type="button"
                onClick={deconnecterBT}
                className="text-xs text-red-600 hover:underline"
              >
                Oublier ce device
              </button>
            </div>
          ) : (
            <DisconnectedState
              cta="Appairer une imprimante Bluetooth"
              advancedLabel="Mode avancé (lever les filtres)"
              advanced={modeAvanceBT}
              setAdvanced={setModeAvanceBT}
              onConnect={connecterBT}
              busy={enCoursBT}
            />
          )}
        </div>
      )}

      {/* ─── Panneau d'aide spécifique Windows ─────────────────────────── */}
      <WindowsHelpPanel />
    </div>
  );
};

// ─── Panneau d'aide Windows : --kiosk-printing ─────────────────────────

const KIOSK_COMMAND =
  '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk-printing https://admin-private.chicken-nation.com/gestion';

const WindowsHelpPanel: React.FC = () => {
  const [open, setOpen] = useState(false);

  function detectWindows(): boolean {
    if (typeof navigator === "undefined") return false;
    // Chrome 90+ : navigator.userAgentData.platform
    const uaData = (navigator as Navigator & {
      userAgentData?: { platform?: string };
    }).userAgentData;
    if (uaData?.platform) return /windows/i.test(uaData.platform);
    return /windows/i.test(navigator.userAgent);
  }

  const isWindows = detectWindows();

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(KIOSK_COMMAND);
      toast.success("Commande copiée — collez-la dans la cible du raccourci");
    } catch {
      toast.error("Impossible de copier — sélectionnez la commande manuellement");
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-5 py-3 bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <Info className="w-5 h-5 text-blue-600 shrink-0" />
        <span className="flex-1 text-left text-sm font-medium text-blue-900">
          Configuration Windows {isWindows ? "(détecté)" : ""} — impression silencieuse sans dialog
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-blue-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-blue-600" />
        )}
      </button>

      {open && (
        <div className="px-5 py-4 space-y-4 bg-white text-sm text-gray-700">
          <div className="space-y-2">
            <p className="font-medium text-gray-900">
              Pourquoi mon imprimante thermique n&apos;apparaît pas dans le
              picker USB ci-dessus&nbsp;?
            </p>
            <p className="text-xs leading-relaxed">
              Sur Windows, dès qu&apos;un driver est installé pour
              l&apos;imprimante (cas de toutes les imprimantes reconnues par
              Windows — quel que soit leur modèle&nbsp;: POS-90, Epson TM,
              Star TSP, Xprinter, etc.), l&apos;OS la <strong>réserve</strong>{" "}
              pour lui-même : WebUSB ne peut alors plus y accéder, c&apos;est
              une restriction de sécurité Windows. Sur macOS / Linux,
              cette restriction n&apos;existe pas — c&apos;est pour ça que
              l&apos;USB direct fonctionne sur Mac mais pas sur le poste
              Windows.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-gray-900">
              Solution recommandée — Chrome en mode kiosk-printing
            </p>
            <p className="text-xs leading-relaxed">
              Chrome dispose d&apos;un flag <code className="px-1 py-0.5 bg-gray-100 rounded font-mono text-[11px]">--kiosk-printing</code>{" "}
              qui supprime la fenêtre de dialogue d&apos;impression : quand on
              clique « Imprimer », le ticket part directement sur
              l&apos;imprimante par défaut Windows, sans clic supplémentaire
              (comportement identique à WebUSB direct).
            </p>
          </div>

          <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="font-semibold text-gray-900 text-xs">
              Procédure (à faire une fois par poste)
            </p>
            <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed">
              <li>
                Dans <strong>Paramètres Windows → Imprimantes et scanners</strong>{" "}
                : décocher <em>« Laisser Windows gérer mon imprimante par défaut »</em>,
                puis <strong>définir votre imprimante thermique comme
                imprimante par défaut</strong> (ex. POS-90, Epson TM-T20,
                Xprinter, etc. — le nom exact figure dans la liste des
                imprimantes Windows).
              </li>
              <li>
                Faire un clic droit sur le bureau → <strong>Nouveau → Raccourci</strong>.
              </li>
              <li>
                Coller la commande ci-dessous comme <strong>emplacement de l&apos;élément</strong> :
                <div className="mt-2 flex items-stretch gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-[11px] font-mono text-gray-800 break-all">
                    {KIOSK_COMMAND}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyCommand}
                    className="px-3 py-2 bg-[#F17922] text-white rounded text-xs font-medium hover:bg-[#d96810] flex items-center gap-1 shrink-0"
                    title="Copier la commande"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copier
                  </button>
                </div>
              </li>
              <li>
                Nommer le raccourci <strong>« Chicken Nation »</strong> et le
                placer sur le bureau ou la barre des tâches.
              </li>
              <li>
                Lancer le BO via ce raccourci : Chrome démarre sans le dialog
                d&apos;impression. Cliquer sur <strong>Imprimer</strong> dans
                une commande → le ticket part directement sur l&apos;imprimante
                par défaut du poste.
              </li>
            </ol>
            <p className="text-[11px] italic text-gray-500 mt-2">
              Note : si Chrome n&apos;est pas dans{" "}
              <code className="font-mono text-[10px]">C:\Program Files\Google\Chrome\Application\</code>,
              adapter le chemin (parfois{" "}
              <code className="font-mono text-[10px]">C:\Program Files (x86)\...</code>{" "}
              sur les Windows 32 bits, ou{" "}
              <code className="font-mono text-[10px]">%LOCALAPPDATA%\Google\Chrome\Application\</code>{" "}
              pour une install utilisateur).
            </p>
          </div>

          <div className="text-xs leading-relaxed bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="font-medium text-amber-900">Alternative non recommandée</p>
            <p className="mt-1">
              Il est techniquement possible de libérer l&apos;imprimante pour
              WebUSB avec l&apos;outil{" "}
              <a
                href="https://zadig.akeo.ie/"
                target="_blank"
                rel="noreferrer"
                className="text-amber-900 underline"
              >
                Zadig
              </a>{" "}
              (remplacement du driver par WinUSB) — mais l&apos;imprimante
              devient alors inutilisable pour Word, PDF et toute autre
              application Windows. À éviter sauf besoin spécifique.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sous-composants ───────────────────────────────────────────────────

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center py-8 px-4">
    {icon}
    <p className="font-medium text-gray-900 mt-3">{title}</p>
    <p className="text-sm text-gray-500 mt-1 max-w-md">{description}</p>
  </div>
);

const ConnectedState: React.FC<{
  label: string;
  onTest: () => void;
  onDisconnect: () => void;
  busy: boolean;
}> = ({ label, onTest, onDisconnect, busy }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-green-900">
          Imprimante connectée
        </p>
        <p className="text-xs text-green-700 truncate">{label}</p>
      </div>
    </div>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onTest}
        disabled={busy}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#F17922] text-white rounded-lg text-sm font-medium hover:bg-[#d96810] disabled:opacity-50"
      >
        {busy ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Printer className="w-4 h-4" />
        )}
        Tester (ticket démo)
      </button>
      <button
        type="button"
        onClick={onDisconnect}
        disabled={busy}
        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        <Unplug className="w-4 h-4" />
        Déconnecter
      </button>
    </div>
  </div>
);

const DisconnectedState: React.FC<{
  cta: string;
  advancedLabel: string;
  advanced: boolean;
  setAdvanced: (b: boolean) => void;
  onConnect: () => void;
  busy: boolean;
}> = ({ cta, advancedLabel, advanced, setAdvanced, onConnect, busy }) => (
  <div className="space-y-3">
    <p className="text-sm text-gray-500">Aucune imprimante appairée.</p>
    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
      <input
        type="checkbox"
        checked={advanced}
        onChange={(e) => setAdvanced(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-[#F17922] focus:ring-[#F17922]"
      />
      {advancedLabel}
    </label>
    <button
      type="button"
      onClick={onConnect}
      disabled={busy}
      className="flex items-center gap-1.5 px-4 py-2 bg-[#F17922] text-white rounded-lg text-sm font-medium hover:bg-[#d96810] disabled:opacity-50"
    >
      {busy ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Plug className="w-4 h-4" />
      )}
      {cta}
    </button>
  </div>
);

// ─── Ticket de test ────────────────────────────────────────────────────

/** Construit un Order synthetique minimal pour l'impression de test. */
function buildOrderTest(): Order {
  const now = new Date().toISOString();
  return {
    id: "test-order",
    reference: "TEST-001",
    customer_id: "",
    paied: true,
    delivery_fee: 0,
    delivery_service: "CHICKEN_NATION" as Order["delivery_service"],
    zone_id: null,
    points: 0,
    type: "PICKUP" as Order["type"],
    table_type: null,
    places: null,
    address: "",
    code_promo: null,
    tax: 100,
    amount: 5100,
    net_amount: 5000,
    discount: 0,
    date: now,
    time: null,
    estimated_delivery_time: null,
    estimated_preparation_time: null,
    ready_at: null,
    picked_up_at: null,
    collected_at: null,
    fullname: "Test Client",
    phone: "+225 07 00 00 00 00",
    email: null,
    note: "Ticket de démonstration imprimante",
    auto: false,
    payment_method: "OFFLINE",
    status: "COMPLETED" as Order["status"],
    restaurant_id: "",
    promotion_id: null,
    order_items: [
      {
        id: "i1",
        quantity: 2,
        amount: 4000,
        epice: true,
        order_id: "test-order",
        dish_id: "d1",
        supplements: [],
        cooking_time: null,
        dish: {
          id: "d1",
          name: "Poulet braisé",
          price: 2000,
        } as unknown as import("../../../../../features/menus/types/dish.types").Dish,
        created_at: now,
        updated_at: now,
      },
      {
        id: "i2",
        quantity: 1,
        amount: 1000,
        epice: false,
        order_id: "test-order",
        dish_id: "d2",
        supplements: [],
        cooking_time: null,
        dish: {
          id: "d2",
          name: "Frites",
          price: 1000,
        } as unknown as import("../../../../../features/menus/types/dish.types").Dish,
        created_at: now,
        updated_at: now,
      },
    ],
    paiements: [],
  } as unknown as Order;
}

export default PrinterSettings;
