export const documentTypes = [
  {
    id: 1,
    name: "Declaración Jurada Simple",
    description: "Documento de declaración personal",
    price: "2500",
    icon: "fas fa-file-contract",
  },
  {
    id: 2,
    name: "Poder Simple",
    description: "Autorización para representación",
    price: "3500",
    icon: "fas fa-handshake",
  },
  {
    id: 3,
    name: "Recibo de Dinero",
    description: "Comprobante de pago",
    price: "1500",
    icon: "fas fa-receipt",
  },
  {
    id: 4,
    name: "Contrato de Prestación de Servicios",
    description: "Acuerdo de servicios profesionales",
    price: "4500",
    icon: "fas fa-file-signature",
  },
  {
    id: 5,
    name: "Carta de Autorización",
    description: "Autorización para trámites específicos",
    price: "2000",
    icon: "fas fa-file-alt",
  },
];

export type DocumentType = typeof documentTypes[0];
