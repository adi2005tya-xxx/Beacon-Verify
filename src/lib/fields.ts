// Canonical field model for the "BEACON PLANNER DETAILS" document (sections 1–10).
// Single source of truth: used by the DOC extractor (label -> key), the
// letterhead PDF renderer (key -> value), and the details form (key -> UI).
// Safe to import from both server and client code (no fs / node-only APIs).

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "select" | "textarea";
  options?: string[];
}
export interface SectionDef {
  n: number;
  heading: string;
  fields: FieldDef[];
  firmOnly?: boolean;
}

export const SECTIONS: SectionDef[] = [
  {
    n: 1,
    heading: "Planner / Firm Details",
    fields: [
      { key: "fullName", label: "Full Name" },
      { key: "firmName", label: "Firm / Business Name" },
      {
        key: "businessType",
        label: "Business Type",
        type: "select",
        options: ["", "Proprietorship", "Partnership", "LLP", "Pvt. Ltd.", "Ltd."],
      },
      { key: "contactNumber", label: "Contact Number" },
      { key: "email", label: "Email ID" },
      { key: "address", label: "Business Address", type: "textarea" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "pinCode", label: "PIN Code" },
      { key: "website", label: "Website" },
      { key: "social", label: "Instagram / Social Media" },
    ],
  },
  {
    n: 2,
    heading: "Authorized / Primary Contact",
    fields: [
      { key: "primaryName", label: "Name" },
      { key: "primaryDesignation", label: "Designation" },
      { key: "primaryContactNumber", label: "Contact Number" },
      { key: "primaryEmail", label: "Email" },
    ],
  },
  {
    n: 3,
    heading: "Emergency Contact",
    fields: [
      { key: "emergencyName", label: "Name" },
      { key: "emergencyRelationship", label: "Relationship" },
      { key: "emergencyContactNumber", label: "Contact Number" },
    ],
  },
  {
    n: 4,
    heading: "Government ID",
    fields: [
      { key: "idType", label: "Document Type", type: "select", options: ["", "Aadhaar", "Passport", "Driving Licence", "Voter ID"] },
      { key: "idNumber", label: "Document Number" },
      { key: "idName", label: "Name as per Document" },
    ],
  },
  {
    n: 5,
    heading: "PAN",
    fields: [
      { key: "panNumber", label: "PAN Number" },
      { key: "panName", label: "Name as per PAN" },
    ],
  },
  {
    n: 6,
    heading: "Address Proof",
    fields: [
      { key: "addrDocType", label: "Document Type", type: "select", options: ["", "Aadhaar", "Passport", "Driving Licence", "Utility Bill"] },
      { key: "addrDocNumber", label: "Document Number" },
      { key: "addrAddress", label: "Address", type: "textarea" },
    ],
  },
  {
    n: 7,
    heading: "Bank Details",
    fields: [
      { key: "bankHolder", label: "Account Holder Name" },
      { key: "bankName", label: "Bank Name" },
      { key: "bankAccount", label: "Account Number" },
      { key: "bankIfsc", label: "IFSC Code" },
    ],
  },
  {
    n: 8,
    heading: "GST",
    fields: [
      { key: "gstRegistered", label: "GST Registered", type: "select", options: ["", "Yes", "No"] },
      { key: "gstin", label: "GSTIN (if applicable)" },
    ],
  },
  {
    n: 9,
    heading: "Business Registration",
    firmOnly: true,
    fields: [
      { key: "regType", label: "Registration Type" },
      { key: "regNumber", label: "Registration Number" },
      { key: "regName", label: "Registered Business Name" },
    ],
  },
];

export const ALL_FIELDS: FieldDef[] = SECTIONS.flatMap((s) => s.fields);
export const FIELD_LABEL: Record<string, string> = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.label]));
export const KNOWN_KEYS = new Set(ALL_FIELDS.map((f) => f.key));

/** Label patterns (case-insensitive) -> canonical key, for the extractor. */
export const LABEL_TO_KEY: { re: RegExp; key: string }[] = [
  { re: /^(your\s+)?full\s*name$/i, key: "fullName" },
  { re: /^(firm|business)\s*\/?\s*(name)?.*name$/i, key: "firmName" },
  { re: /^firm\s*\/\s*business\s*name$/i, key: "firmName" },
  { re: /^business\s*type$/i, key: "businessType" },
  { re: /^(contact|mobile)\s*number$/i, key: "contactNumber" },
  { re: /^(email|email\s*id|email\s*address)$/i, key: "email" },
  { re: /^(business\s*)?address$/i, key: "address" },
  { re: /^city$/i, key: "city" },
  { re: /^state$/i, key: "state" },
  { re: /^pin\s*code$/i, key: "pinCode" },
  { re: /^website$/i, key: "website" },
  { re: /^instagram\s*\/?\s*social\s*media$/i, key: "social" },

  { re: /^designation$/i, key: "primaryDesignation" },

  { re: /^relationship$/i, key: "emergencyRelationship" },

  { re: /^(document\s*type|id\s*type)$/i, key: "idType" },
  { re: /^(document|id)\s*number$/i, key: "idNumber" },
  { re: /^name\s*as\s*per\s*document$/i, key: "idName" },

  { re: /^pan\s*number$/i, key: "panNumber" },
  { re: /^name\s*as\s*per\s*pan$/i, key: "panName" },

  { re: /^address\s*as\s*(per|shown\s*on).*$/i, key: "addrAddress" },

  { re: /^account\s*holder\s*name.*$/i, key: "bankHolder" },
  { re: /^bank\s*name$/i, key: "bankName" },
  { re: /^account\s*number$/i, key: "bankAccount" },
  { re: /^ifsc\s*code$/i, key: "bankIfsc" },

  { re: /^gst\s*registered$/i, key: "gstRegistered" },
  { re: /^gst\s*in$/i, key: "gstin" },
  { re: /^gstin.*$/i, key: "gstin" },

  { re: /^registration\s*type$/i, key: "regType" },
  { re: /^registration\s*number$/i, key: "regNumber" },
  { re: /^registered\s*business\s*name$/i, key: "regName" },
];

/** Section-scoped labels that are ambiguous across sections of the DETAILS doc. */
export const SECTION_LABELS: Record<number, Record<string, string>> = {
  3: {
    name: "primaryName",
    "contact person name": "primaryName",
    designation: "primaryDesignation",
    "contact number": "primaryContactNumber",
    "mobile number": "primaryContactNumber",
    email: "primaryEmail",
    "email address": "primaryEmail",
  },
  4: {
    name: "emergencyName",
    relationship: "emergencyRelationship",
    "contact number": "emergencyContactNumber",
    "mobile number": "emergencyContactNumber",
  },
  5: {
    "document type": "idType",
    "id type": "idType",
    "document number": "idNumber",
    "id number": "idNumber",
    "name as per document": "idName",
    "name as shown on the submitted id": "idName",
    "name as shown on submitted id": "idName",
  },
  6: {
    "pan number": "panNumber",
    "name as per pan": "panName",
    "name as shown on pan card": "panName",
    "name as shown on pan": "panName",
  },
  7: {
    "document type": "addrDocType",
    "document number": "addrDocNumber",
    address: "addrAddress",
    "address as shown on the submitted document": "addrAddress",
    "address as shown on submitted document": "addrAddress",
  },
  8: {
    "account holder name": "bankHolder",
    "account holder name as shown on bank document": "bankHolder",
    "account holder name as shown on the bank document": "bankHolder",
    "bank name": "bankName",
    "account number": "bankAccount",
    "ifsc code": "bankIfsc",
  },
};
