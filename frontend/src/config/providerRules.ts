import type { ProviderType } from '@/types/providerTypes';

export const providerTypes: ProviderType[] = [
  {
    id: "1",
    name: "Allopathic & Osteopathic Physicians",
    requirements: {
      stateLicense: true,
      deaCds: true,
      boardCertification: true,
    },
  },
  {
    id: "2",
    name: "Behavioral Health & Social Service Providers",
    requirements: {
      stateLicense: true,
      deaCds: false,
      boardCertification: true,
    },
  },
  {
    id: "3",
    name: "Chiropractic Providers",
    requirements: {
      stateLicense: true,
      deaCds: false,
      boardCertification: false,
    },
  },
  {
    id: "4",
    name: "Dental Providers",
    requirements: {
      stateLicense: true,
      deaCds: true,
      boardCertification: true,
    },
  },
  {
    id: "5",
    name: "Dietary & Nutritional Service Providers",
    requirements: {
      stateLicense: true,
      deaCds: false,
      boardCertification: false,
    },
  },
  {
    id: "6",
    name: "Emergency Medical Service Providers",
    requirements: {
      stateLicense: true,
      deaCds: false,
      boardCertification: false,
    },
  },
  {
    id: "7",
    name: "Eye and Vision Services Providers",
    requirements: {
      stateLicense: true,
      deaCds: true,
      boardCertification: true,
    },
  },
  {
    id: "8",
    name: "Nursing Service Providers",
    requirements: {
      stateLicense: true,
      deaCds: false,
      boardCertification: false,
    },
  },
  {
    id: "9",
    name: "Pharmacy Service Providers",
    requirements: {
      stateLicense: true,
      deaCds: true,
      boardCertification: true,
    },
  },
  {
    id: "10",
    name: "Physician Assistants & Advanced Practice Nursing Providers",
    requirements: {
      stateLicense: true,
      deaCds: true,
      boardCertification: true,
    },
  },
  {
    id: "11",
    name: "Podiatric Medicine & Surgery Service Providers",
    requirements: {
      stateLicense: true,
      deaCds: true,
      boardCertification: true,
    },
  },
  {
    id: "12",
    name: "Speech, Language and Hearing Service Providers",
    requirements: {
      stateLicense: true,
      deaCds: false,
      boardCertification: false,
    },
  },
]; 