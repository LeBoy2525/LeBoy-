"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { DollarSign, Receipt, CreditCard, BarChart3, AlertCircle, FileText } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "../_components/AdminPageHeader";

const TEXT = {
  fr: {
    title: "Finance & Comptabilité",
    subtitle: "Gestion financière, facturation et comptabilité",
    backToDashboard: "Retour au tableau de bord",
    exchangeRates: "Taux de change",
    exchangeRatesDesc: "Gérer les taux de change",
    taxReview: "Révision fiscale",
    taxReviewDesc: "Réviser les cas fiscaux",
    invoices: "Factures",
    invoicesDesc: "Consulter et télécharger les factures",
    transactions: "Transactions",
    transactionsDesc: "Voir toutes les transactions",
    payouts: "Paiements prestataires",
    payoutsDesc: "Gérer les paiements aux prestataires",
    exports: "Exports mensuels",
    exportsDesc: "Exports mensuels pour comptabilité",
  },
  en: {
    title: "Finance & Accounting",
    subtitle: "Financial management, invoicing and accounting",
    backToDashboard: "Back to dashboard",
    exchangeRates: "Exchange rates",
    exchangeRatesDesc: "Manage exchange rates",
    taxReview: "Tax review",
    taxReviewDesc: "Review tax cases",
    invoices: "Invoices",
    invoicesDesc: "View and download invoices",
    transactions: "Transactions",
    transactionsDesc: "View all transactions",
    payouts: "Provider payouts",
    payoutsDesc: "Manage provider payouts",
    exports: "Monthly exports",
    exportsDesc: "Monthly accounting exports",
  },
} as const;

export default function FinancePage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];

  return (
    <div className="bg-gray-50 min-h-screen">
      <AdminPageHeader
        title={t.title}
        description={t.subtitle}
      />

      <div className="px-6 py-8">
        {/* Grille des sous-rubriques */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/finance/rates"
            className="bg-white border border-[#DDDDDD] rounded-xl p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A1B2A] flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#D4A657]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#0A1B2A]">
                  {t.exchangeRates}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {t.exchangeRatesDesc}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/finance/tax-review"
            className="bg-white border border-[#DDDDDD] rounded-xl p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A1B2A] flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#D4A657]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#0A1B2A]">
                  {t.taxReview}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {t.taxReviewDesc}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/finance/invoices"
            className="bg-white border border-[#DDDDDD] rounded-xl p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A1B2A] flex items-center justify-center">
                <Receipt className="w-6 h-6 text-[#D4A657]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#0A1B2A]">
                  {t.invoices}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {t.invoicesDesc}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/finance/transactions"
            className="bg-white border border-[#DDDDDD] rounded-xl p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A1B2A] flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-[#D4A657]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#0A1B2A]">
                  {t.transactions}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {t.transactionsDesc}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/finance/payouts"
            className="bg-white border border-[#DDDDDD] rounded-xl p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A1B2A] flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#D4A657]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#0A1B2A]">
                  {t.payouts}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {t.payoutsDesc}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/finance/exports"
            className="bg-white border border-[#DDDDDD] rounded-xl p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A1B2A] flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#D4A657]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#0A1B2A]">
                  {t.exports}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {t.exportsDesc}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}

