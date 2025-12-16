// lib/financeStores.ts
// Stores pour le système de finance/comptabilité LeBoy

import { loadFromFile, saveToFileAsync } from "./persistence";
import type {
  ExchangeRate,
  TaxProfile,
  AdminSettings,
  BillingAddress,
  ServiceCategory,
  Quote,
  Payment,
  Invoice,
  Payout,
  FinanceExport,
} from "./financeTypes";
import { v4 as uuidv4 } from "uuid";

// ========== EXCHANGE RATE STORE ==========
type ExchangeRateStore = {
  _exchangeRates?: ExchangeRate[];
  _exchangeRatesLoaded?: boolean;
};

const exchangeRateStore = globalThis as typeof globalThis & ExchangeRateStore;

if (!exchangeRateStore._exchangeRates) {
  exchangeRateStore._exchangeRates = [];
  exchangeRateStore._exchangeRatesLoaded = false;
  
  loadFromFile<ExchangeRate>("exchangeRates.json").then((data) => {
    if (data.length > 0) {
      exchangeRateStore._exchangeRates = data;
    }
    exchangeRateStore._exchangeRatesLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des taux de change:", error);
    exchangeRateStore._exchangeRatesLoaded = true;
  });
}

export const exchangeRatesStore = exchangeRateStore._exchangeRates!;

function saveExchangeRates() {
  saveToFileAsync("exchangeRates.json", exchangeRatesStore);
}

export function addExchangeRate(rate: Omit<ExchangeRate, "id" | "createdAt" | "updatedAt">): ExchangeRate {
  const newRate: ExchangeRate = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...rate,
  };
  exchangeRatesStore.push(newRate);
  saveExchangeRates();
  return newRate;
}

export function getExchangeRate(quoteCurrency: string, effectiveDate: string): ExchangeRate | undefined {
  return exchangeRatesStore.find(
    (r) => r.quoteCurrency === quoteCurrency && r.effectiveDate === effectiveDate
  );
}

export function getLatestExchangeRate(quoteCurrency: string): ExchangeRate | undefined {
  const rates = exchangeRatesStore
    .filter((r) => r.quoteCurrency === quoteCurrency)
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
  return rates[0];
}

// ========== TAX PROFILE STORE ==========
type TaxProfileStore = {
  _taxProfiles?: TaxProfile[];
  _taxProfilesLoaded?: boolean;
};

const taxProfileStore = globalThis as typeof globalThis & TaxProfileStore;

if (!taxProfileStore._taxProfiles) {
  taxProfileStore._taxProfiles = [];
  taxProfileStore._taxProfilesLoaded = false;
  
  loadFromFile<TaxProfile>("taxProfiles.json").then((data) => {
    if (data.length > 0) {
      taxProfileStore._taxProfiles = data;
    } else {
      // Initialiser avec les profils par défaut
      taxProfileStore._taxProfiles = [
        {
          id: uuidv4(),
          country: "CA",
          region: "QC",
          gstRate: 0.05,
          qstRate: 0.09975,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      saveTaxProfiles();
    }
    taxProfileStore._taxProfilesLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des profils fiscaux:", error);
    taxProfileStore._taxProfilesLoaded = true;
  });
}

export const taxProfilesStore = taxProfileStore._taxProfiles!;

function saveTaxProfiles() {
  saveToFileAsync("taxProfiles.json", taxProfilesStore);
}

export function getTaxProfile(country: string, region: string | null): TaxProfile | undefined {
  return taxProfilesStore.find(
    (p) => p.country === country && p.region === region
  );
}

// ========== ADMIN SETTINGS STORE ==========
type AdminSettingsStore = {
  _adminSettings?: AdminSettings | null;
  _adminSettingsLoaded?: boolean;
};

const adminSettingsStore = globalThis as typeof globalThis & AdminSettingsStore;

if (!adminSettingsStore._adminSettings) {
  adminSettingsStore._adminSettings = null;
  adminSettingsStore._adminSettingsLoaded = false;
  
  loadFromFile<AdminSettings>("adminSettings.json").then((data) => {
    if (data.length > 0) {
      adminSettingsStore._adminSettings = data[0];
    } else {
      // Initialiser avec les valeurs par défaut
      adminSettingsStore._adminSettings = {
        id: uuidv4(),
        accountantEmail: "comptable@leboy.com",
        timezone: "America/Toronto",
        defaultClientCurrencyByCountry: {
          CA: "CAD",
          US: "USD",
          FR: "EUR",
          BE: "EUR",
          default: "USD",
        },
        transferFeePolicy: "CLIENT_PAYS",
        companyLegalName: "LeBoy Inc.",
        companyAddressLine1: "",
        companyAddressLine2: null,
        companyCity: "",
        companyRegion: "QC",
        companyPostalCode: "",
        companyCountry: "CA",
        gstNumber: "",
        qstNumber: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveAdminSettings();
    }
    adminSettingsStore._adminSettingsLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des paramètres admin:", error);
    adminSettingsStore._adminSettingsLoaded = true;
  });
}

export const adminSettings = adminSettingsStore._adminSettings!;

function saveAdminSettings() {
  if (adminSettings) {
    saveToFileAsync("adminSettings.json", [adminSettings]);
  }
}

export function updateAdminSettings(updates: Partial<AdminSettings>): AdminSettings {
  if (!adminSettings) {
    throw new Error("Admin settings not initialized");
  }
  Object.assign(adminSettings, updates, { updatedAt: new Date().toISOString() });
  saveAdminSettings();
  return adminSettings;
}

// ========== BILLING ADDRESS STORE ==========
type BillingAddressStore = {
  _billingAddresses?: BillingAddress[];
  _billingAddressesLoaded?: boolean;
};

const billingAddressStore = globalThis as typeof globalThis & BillingAddressStore;

if (!billingAddressStore._billingAddresses) {
  billingAddressStore._billingAddresses = [];
  billingAddressStore._billingAddressesLoaded = false;
  
  loadFromFile<BillingAddress>("billingAddresses.json").then((data) => {
    if (data.length > 0) {
      billingAddressStore._billingAddresses = data;
    }
    billingAddressStore._billingAddressesLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des adresses de facturation:", error);
    billingAddressStore._billingAddressesLoaded = true;
  });
}

export const billingAddressesStore = billingAddressStore._billingAddresses!;

function saveBillingAddresses() {
  saveToFileAsync("billingAddresses.json", billingAddressesStore);
}

export function addBillingAddress(address: Omit<BillingAddress, "id" | "createdAt" | "updatedAt">): BillingAddress {
  const newAddress: BillingAddress = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...address,
  };
  billingAddressesStore.push(newAddress);
  saveBillingAddresses();
  return newAddress;
}

export function getBillingAddressById(id: string): BillingAddress | undefined {
  return billingAddressesStore.find((a) => a.id === id);
}

// ========== SERVICE CATEGORY STORE ==========
type ServiceCategoryStore = {
  _serviceCategories?: ServiceCategory[];
  _serviceCategoriesLoaded?: boolean;
};

const serviceCategoryStore = globalThis as typeof globalThis & ServiceCategoryStore;

if (!serviceCategoryStore._serviceCategories) {
  serviceCategoryStore._serviceCategories = [];
  serviceCategoryStore._serviceCategoriesLoaded = false;
  
  loadFromFile<ServiceCategory>("serviceCategoriesFinance.json").then((data) => {
    if (data.length > 0) {
      serviceCategoryStore._serviceCategories = data;
    } else {
      // Initialiser avec les catégories par défaut
      serviceCategoryStore._serviceCategories = [
        {
          id: uuidv4(),
          code: "ADMIN_DOCS",
          label: "Administratif & Documents officiels",
          isRealPropertyRelated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          code: "DELIVERY_PURCHASES",
          label: "Livraisons & Achats",
          isRealPropertyRelated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          code: "CONSULTING_ONSITE",
          label: "Consultation sur site",
          isRealPropertyRelated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          code: "REAL_ESTATE_LAND",
          label: "Immobilier & Foncier",
          isRealPropertyRelated: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          code: "CONSTRUCTION_SITE",
          label: "Chantier",
          isRealPropertyRelated: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      saveServiceCategories();
    }
    serviceCategoryStore._serviceCategoriesLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des catégories de service:", error);
    serviceCategoryStore._serviceCategoriesLoaded = true;
  });
}

export const serviceCategoriesFinanceStore = serviceCategoryStore._serviceCategories!;

function saveServiceCategories() {
  saveToFileAsync("serviceCategoriesFinance.json", serviceCategoriesFinanceStore);
}

export function getServiceCategoryByCode(code: string): ServiceCategory | undefined {
  return serviceCategoriesFinanceStore.find((c) => c.code === code);
}

// ========== QUOTE STORE ==========
type QuoteStore = {
  _quotes?: Quote[];
  _quotesLoaded?: boolean;
};

const quoteStore = globalThis as typeof globalThis & QuoteStore;

if (!quoteStore._quotes) {
  quoteStore._quotes = [];
  quoteStore._quotesLoaded = false;
  
  loadFromFile<Quote>("quotes.json").then((data) => {
    if (data.length > 0) {
      quoteStore._quotes = data;
    }
    quoteStore._quotesLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des devis:", error);
    quoteStore._quotesLoaded = true;
  });
}

export const quotesStore = quoteStore._quotes!;

function saveQuotes() {
  saveToFileAsync("quotes.json", quotesStore);
}

export function addQuote(quote: Omit<Quote, "id" | "createdAt" | "updatedAt">): Quote {
  const newQuote: Quote = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...quote,
  };
  quotesStore.push(newQuote);
  saveQuotes();
  return newQuote;
}

export function getQuoteById(id: string): Quote | undefined {
  return quotesStore.find((q) => q.id === id);
}

export function updateQuote(id: string, updates: Partial<Quote>): Quote | null {
  const quote = quotesStore.find((q) => q.id === id);
  if (!quote) return null;
  Object.assign(quote, updates, { updatedAt: new Date().toISOString() });
  saveQuotes();
  return quote;
}

// ========== PAYMENT STORE ==========
type PaymentStore = {
  _payments?: Payment[];
  _paymentsLoaded?: boolean;
};

const paymentStore = globalThis as typeof globalThis & PaymentStore;

if (!paymentStore._payments) {
  paymentStore._payments = [];
  paymentStore._paymentsLoaded = false;
  
  loadFromFile<Payment>("payments.json").then((data) => {
    if (data.length > 0) {
      paymentStore._payments = data;
    }
    paymentStore._paymentsLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des paiements:", error);
    paymentStore._paymentsLoaded = true;
  });
}

export const paymentsStore = paymentStore._payments!;

function savePayments() {
  saveToFileAsync("payments.json", paymentsStore);
}

export function addPayment(payment: Omit<Payment, "id" | "createdAt" | "updatedAt">): Payment {
  const newPayment: Payment = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payment,
  };
  paymentsStore.push(newPayment);
  savePayments();
  return newPayment;
}

export function getPaymentById(id: string): Payment | undefined {
  return paymentsStore.find((p) => p.id === id);
}

export function getPaymentByStripePaymentIntentId(stripePaymentIntentId: string): Payment | undefined {
  return paymentsStore.find((p) => p.stripePaymentIntentId === stripePaymentIntentId);
}

export function updatePayment(id: string, updates: Partial<Payment>): Payment | null {
  const payment = paymentsStore.find((p) => p.id === id);
  if (!payment) return null;
  Object.assign(payment, updates, { updatedAt: new Date().toISOString() });
  savePayments();
  return payment;
}

// ========== INVOICE STORE ==========
type InvoiceStore = {
  _invoices?: Invoice[];
  _invoicesLoaded?: boolean;
};

const invoiceStore = globalThis as typeof globalThis & InvoiceStore;

if (!invoiceStore._invoices) {
  invoiceStore._invoices = [];
  invoiceStore._invoicesLoaded = false;
  
  loadFromFile<Invoice>("invoices.json").then((data) => {
    if (data.length > 0) {
      invoiceStore._invoices = data;
    }
    invoiceStore._invoicesLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des factures:", error);
    invoiceStore._invoicesLoaded = true;
  });
}

export const invoicesStore = invoiceStore._invoices!;

function saveInvoices() {
  saveToFileAsync("invoices.json", invoicesStore);
}

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const invoicesThisYear = invoicesStore.filter((i) => i.invoiceNumber.startsWith(`LB-${year}-`));
  const nextNumber = String(invoicesThisYear.length + 1).padStart(6, "0");
  return `LB-${year}-${nextNumber}`;
}

export function addInvoice(invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">): Invoice {
  const newInvoice: Invoice = {
    id: uuidv4(),
    invoiceNumber: generateInvoiceNumber(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...invoice,
  };
  invoicesStore.push(newInvoice);
  saveInvoices();
  return newInvoice;
}

export function getInvoiceById(id: string): Invoice | undefined {
  return invoicesStore.find((i) => i.id === id);
}

export function getInvoiceByInvoiceNumber(invoiceNumber: string): Invoice | undefined {
  return invoicesStore.find((i) => i.invoiceNumber === invoiceNumber);
}

// ========== PAYOUT STORE ==========
type PayoutStore = {
  _payouts?: Payout[];
  _payoutsLoaded?: boolean;
};

const payoutStore = globalThis as typeof globalThis & PayoutStore;

if (!payoutStore._payouts) {
  payoutStore._payouts = [];
  payoutStore._payoutsLoaded = false;
  
  loadFromFile<Payout>("payouts.json").then((data) => {
    if (data.length > 0) {
      payoutStore._payouts = data;
    }
    payoutStore._payoutsLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des paiements prestataires:", error);
    payoutStore._payoutsLoaded = true;
  });
}

export const payoutsStore = payoutStore._payouts!;

function savePayouts() {
  saveToFileAsync("payouts.json", payoutsStore);
}

export function addPayout(payout: Omit<Payout, "id" | "createdAt" | "updatedAt">): Payout {
  const newPayout: Payout = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payout,
  };
  payoutsStore.push(newPayout);
  savePayouts();
  return newPayout;
}

export function getPayoutById(id: string): Payout | undefined {
  return payoutsStore.find((p) => p.id === id);
}

export function updatePayout(id: string, updates: Partial<Payout>): Payout | null {
  const payout = payoutsStore.find((p) => p.id === id);
  if (!payout) return null;
  Object.assign(payout, updates, { updatedAt: new Date().toISOString() });
  savePayouts();
  return payout;
}

// ========== FINANCE EXPORT STORE ==========
type FinanceExportStore = {
  _financeExports?: FinanceExport[];
  _financeExportsLoaded?: boolean;
};

const financeExportStore = globalThis as typeof globalThis & FinanceExportStore;

if (!financeExportStore._financeExports) {
  financeExportStore._financeExports = [];
  financeExportStore._financeExportsLoaded = false;
  
  loadFromFile<FinanceExport>("financeExports.json").then((data) => {
    if (data.length > 0) {
      financeExportStore._financeExports = data;
    }
    financeExportStore._financeExportsLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des exports financiers:", error);
    financeExportStore._financeExportsLoaded = true;
  });
}

export const financeExportsStore = financeExportStore._financeExports!;

function saveFinanceExports() {
  saveToFileAsync("financeExports.json", financeExportsStore);
}

export function addFinanceExport(export_: Omit<FinanceExport, "id" | "createdAt" | "updatedAt">): FinanceExport {
  const newExport: FinanceExport = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...export_,
  };
  financeExportsStore.push(newExport);
  saveFinanceExports();
  return newExport;
}

export function getFinanceExportById(id: string): FinanceExport | undefined {
  return financeExportsStore.find((e) => e.id === id);
}

