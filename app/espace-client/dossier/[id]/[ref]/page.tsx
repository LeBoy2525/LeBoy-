"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../../../components/LanguageProvider";
import BackToHomeLink from "../../../../components/BackToHomeLink";
import { MissionProgressBar } from "../../../../components/MissionProgressBar";
import { ClientPaymentSection } from "../../../../components/ClientPaymentSection";
import { MissionChat } from "../../../../components/MissionChat";
import { MessageSquare } from "lucide-react";
import type { Mission } from "@/lib/types";

// Désactiver le préchargement pour cette page dynamique
export const dynamic = "force-dynamic";

type Dossier = {
  id: string; // UUID (comme dans lib/types.ts)
  ref: string;
  createdAt: string;
  serviceType: string;
  serviceSubcategory?: string;
  description: string;
  lieu?: string | null;
  urgence: string;
  fullName: string;
  email: string;
  phone: string;
  statut?: "en_attente" | "rejetee" | "acceptee";
  rejeteeAt?: string | null;
  rejeteeBy?: string | null;
  raisonRejet?: string | null;
};

// Utiliser le type Mission complet de lib/types

type ServiceCategory = {
  id: string;
  nameFr: string;
  nameEn: string;
  subcategories: Array<{
    id: string;
    nameFr: string;
    nameEn: string;
  }>;
};

export default function DossierPage() {
  const params = useParams();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [showChat, setShowChat] = useState(false);
  
  // Charger l'email de l'utilisateur
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserEmail(data.user?.email || "");
        }
      } catch (err) {
        console.error("Erreur récupération utilisateur:", err);
      }
    }
    fetchUser();
  }, []);
  
  // Fonction pour recharger les missions après paiement
  const handlePaymentSuccess = async () => {
    if (!dossier?.ref) return;
    try {
      const res = await fetch(
        `/api/espace-client/dossier/${encodeURIComponent(dossier.ref)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions ?? []);
      }
    } catch (e) {
      console.error("Erreur rechargement missions:", e);
    }
  };

  useEffect(() => {
    // Charger les catégories de services
    async function fetchServiceCategories() {
      try {
        const res = await fetch("/api/service-categories", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setServiceCategories(data.categories || []);
        }
      } catch (e) {
        console.error("Erreur lors du chargement des catégories:", e);
      }
    }

    fetchServiceCategories();
  }, []);

  useEffect(() => {
    const idParam = params?.id;
    const refParam = params?.ref;
    
    const id = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : "";
    const ref = refParam ? (Array.isArray(refParam) ? refParam[0] : refParam) : "";
    
    if (!ref) {
      setError("Référence manquante.");
      setLoading(false);
      return;
    }

    const decodedRef = decodeURIComponent(ref);

    async function fetchDossier() {
      try {
        const res = await fetch(
          `/api/espace-client/dossier/${encodeURIComponent(decodedRef)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          if (res.status === 404) {
            setError("Dossier introuvable.");
          } else {
            setError("Erreur lors du chargement du dossier.");
          }
          setDossier(null);
        } else {
          const data = await res.json();
          console.log("[DossierPage] Données reçues:", { 
            dossier: data.dossier?.ref, 
            missionsCount: data.missions?.length,
            missions: data.missions?.map((m: any) => ({ 
              id: m.id, 
              ref: m.ref, 
              internalState: m.internalState,
              hasMessages: !!m.messages,
              messagesCount: m.messages?.length || 0
            }))
          });
          setDossier(data.dossier ?? null);
          setMissions(data.missions ?? []);
          setError(null);
        }
      } catch (e) {
        console.error(e);
        setError("Erreur lors du chargement du dossier.");
        setDossier(null);
      } finally {
        setLoading(false);
      }
    }

    fetchDossier();
  }, [params]);

  // Fonction pour obtenir le nom du service principal
  const getServiceName = (serviceTypeId: string): string => {
    const category = serviceCategories.find((cat) => cat.id === serviceTypeId);
    if (!category) return serviceTypeId;
    return lang === "fr" ? category.nameFr : category.nameEn;
  };

  // Fonction pour obtenir le nom du sous-service
  const getSubserviceName = (serviceTypeId: string, subcategoryId?: string): string | null => {
    if (!subcategoryId) return null;
    const category = serviceCategories.find((cat) => cat.id === serviceTypeId);
    if (!category) return null;
    const subcategory = category.subcategories.find((sub) => sub.id === subcategoryId);
    if (!subcategory) return null;
    return lang === "fr" ? subcategory.nameFr : subcategory.nameEn;
  };

  const hasDossier = !!dossier;

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <BackToHomeLink backTo="client" />
      {/* HEADER DOSSIER */}
      <section className="bg-white border-b border-[#DDDDDD]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-3">

          <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A55F]">
            Dossier LeBoy
          </p>

          {loading && (
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
              Chargement du dossier…
            </h1>
          )}

          {!loading && hasDossier && (
            <>
              <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
                Référence {dossier!.ref}
              </h1>
              <p className="text-xs md:text-sm text-[#4B4F58]">
                Créé le{" "}
                {new Date(dossier!.createdAt).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </>
          )}

          {!loading && !hasDossier && (
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
              Dossier introuvable
            </h1>
          )}
        </div>
      </section>

      {/* CONTENU */}
      <section className="bg-[#F2F2F5]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
          {loading && (
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 text-sm text-[#4B4F58]">
              Chargement des informations du dossier…
            </div>
          )}

          {!loading && error && (
            <div className="bg-white border border-red-200 rounded-xl p-5 md:p-6 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && !hasDossier && (
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 text-sm text-[#4B4F58]">
              <p style={{ textAlign: "justify" }}>
                Ce dossier n&apos;est pas disponible. Il se peut qu&apos;il n&apos;existe
                pas, qu&apos;il ait été créé dans une autre session ou que les données
                aient été réinitialisées côté serveur.
              </p>
              <p className="mt-2 text-xs">
                Vous pouvez retourner à votre espace client pour consulter vos demandes
                récentes.
              </p>
            </div>
          )}

          {!loading && !error && hasDossier && (
            <div className="grid md:grid-cols-[1.3fr,1.1fr] gap-6 md:gap-8">
              {/* Colonne gauche : infos principales */}
              <div className="space-y-4">
                <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 space-y-3">
                  <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
                    Informations principales
                  </h2>

                  <div className="space-y-2 text-xs md:text-sm text-[#4B4F58]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0A1B2A]">
                        Statut :
                      </span>
                      {dossier!.statut === "en_attente" && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
                          En attente
                        </span>
                      )}
                      {dossier!.statut === "acceptee" && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                          Acceptée
                        </span>
                      )}
                      {dossier!.statut === "rejetee" && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          Rejetée
                        </span>
                      )}
                      {!dossier!.statut && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                          En traitement
                        </span>
                      )}
                    </div>
                    <p>
                      <span className="font-semibold text-[#0A1B2A]">
                        Service principal :
                      </span>{" "}
                      {getServiceName(dossier!.serviceType)}
                    </p>
                    {dossier!.serviceSubcategory && (
                      <p>
                        <span className="font-semibold text-[#0A1B2A]">
                          Sous-service :
                        </span>{" "}
                        {getSubserviceName(dossier!.serviceType, dossier!.serviceSubcategory) || dossier!.serviceSubcategory}
                      </p>
                    )}
                    {dossier!.lieu && (
                      <p>
                        <span className="font-semibold text-[#0A1B2A]">
                          Lieu concerné :
                        </span>{" "}
                        {dossier!.lieu}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-[#0A1B2A]">
                        Urgence :
                      </span>{" "}
                      {dossier!.urgence || "Non précisée"}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="font-heading text-sm md:text-base font-semibold text-[#0A1B2A] mb-1">
                      Description de la situation
                    </p>
                    <p
                      className="text-xs md:text-sm text-[#4B4F58] whitespace-pre-line"
                      style={{ textAlign: "justify" }}
                    >
                      {dossier!.description}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 space-y-4">
                  <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
                    Statut de la demande
                  </h2>
                  
                  {/* Barre de progression de la mission si elle existe */}
                  {missions.length > 0 && missions[0] && (
                    <div className="mb-4">
                      <MissionProgressBar mission={missions[0]} lang={lang} />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {dossier!.statut === "en_attente" && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <span className="text-amber-600 font-semibold text-sm">
                          ⏳ En attente d&apos;analyse
                        </span>
                      </div>
                    )}
                    {dossier!.statut === "acceptee" && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <span className="text-emerald-600 font-semibold text-sm">
                          ✅ Demande acceptée
                        </span>
                      </div>
                    )}
                    {dossier!.statut === "rejetee" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-red-600 font-semibold text-sm">
                            ❌ Demande rejetée
                          </span>
                        </div>
                        {dossier!.raisonRejet && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-700">
                              <span className="font-semibold">Raison :</span> {dossier!.raisonRejet}
                            </p>
                            {dossier!.rejeteeAt && (
                              <p className="text-xs text-red-600 mt-1">
                                Le {new Date(dossier!.rejeteeAt).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {!dossier!.statut && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <span className="text-gray-600 font-semibold text-sm">
                          📋 En attente de traitement
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Afficher la mission avec détails et actions */}
                  {missions.length > 0 && missions[0] && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-heading text-base font-semibold text-[#0A1B2A]">
                            Mission
                          </h3>
                          {/* Bouton chat - toujours visible si mission existe */}
                          {currentUserEmail && (
                            <button
                              onClick={() => {
                                console.log("[DossierPage] Toggle chat:", { 
                                  showChat, 
                                  missionId: missions[0].id,
                                  hasMessages: !!missions[0].messages,
                                  currentUserEmail 
                                });
                                setShowChat(!showChat);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#0A1B2A] border border-[#0A1B2A] rounded-md hover:bg-[#0A1B2A] hover:text-white transition"
                              title={lang === "fr" ? "Ouvrir le chat avec l'administrateur" : "Open chat with administrator"}
                            >
                              <MessageSquare className="w-4 h-4" />
                              {lang === "fr" ? "Chat" : "Chat"}
                            </button>
                          )}
                        </div>
                        <Link
                          href={`/espace-client/mission/${missions[0].id}`}
                          prefetch={false}
                          className="block p-3 bg-[#F9F9FB] border border-[#DDDDDD] rounded-lg hover:bg-[#F2F2F5] transition"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm text-[#0A1B2A]">
                                {missions[0].ref}
                              </p>
                              <p className="text-xs text-[#6B7280] mt-1">
                                {missions[0].titre}
                              </p>
                              {(missions[0] as any).prestataireRef && (
                                <p className="text-xs text-[#6B7280] mt-1">
                                  Prestataire : {(missions[0] as any).prestataireRef}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-[#4B4F58]">
                              →
                            </span>
                          </div>
                        </Link>
                      </div>
                      
                      {/* Chat avec l'admin */}
                      {showChat && missions[0] && currentUserEmail && (
                        <div className="mt-4">
                          <MissionChat
                            mission={missions[0]}
                            currentUserEmail={currentUserEmail}
                            currentUserRole="client"
                            lang={lang}
                            autoOpen={true}
                            onClose={() => setShowChat(false)}
                          />
                        </div>
                      )}
                      
                      {/* Section de paiement si la mission nécessite un paiement */}
                      {missions[0].internalState === "WAITING_CLIENT_PAYMENT" && missions[0].devisGenere && (
                        <div className="mt-4">
                          <ClientPaymentSection
                            mission={missions[0]}
                            lang={lang}
                            onPaymentSuccess={handlePaymentSuccess}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Message informatif si aucune mission n'est encore visible (prestataire non sélectionné) */}
                  {missions.length === 0 && dossier!.statut === "acceptee" && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <span className="font-semibold">En attente de sélection du prestataire</span>
                        <br />
                        Votre demande a été acceptée. Un prestataire sera sélectionné prochainement et vous recevrez une notification.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne droite : coordonnées */}
              <aside className="space-y-4">
                <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 space-y-3 text-xs md:text-sm text-[#4B4F58]">
                  <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
                    Coordonnées du demandeur
                  </h2>
                  <p>
                    <span className="font-semibold text-[#0A1B2A]">Nom :</span>{" "}
                    {dossier!.fullName}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0A1B2A]">Email :</span>{" "}
                    {dossier!.email}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0A1B2A]">Téléphone :</span>{" "}
                    {dossier!.phone}
                  </p>
                </div>

                <div className="bg-[#FFF9EC] border border-[#C8A55F] rounded-xl p-5 md:p-6 text-xs md:text-sm text-[#4B4F58] space-y-2">
                  <p className="font-heading text-sm md:text-base font-semibold text-[#0A1B2A]">
                    Besoin d&apos;une correction ou d&apos;un complément ?
                  </p>
                  <p style={{ textAlign: "justify" }}>
                    Si vous devez corriger une information importante ou ajouter des
                    éléments, vous pourrez le faire en mentionnant la référence{" "}
                    <strong>{dossier!.ref}</strong> dans vos échanges avec LeBoy.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

