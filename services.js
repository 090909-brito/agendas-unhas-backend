// Fonte única dos serviços, preços e durações (em minutos).
// Editar aqui reflete automaticamente no site, já que o frontend busca essa lista da API.

const CATEGORIES = [
  { id: "maos", label: "Mãos" },
  { id: "pes", label: "Pés" },
  { id: "combo", label: "Combo" },
  { id: "banho", label: "Banho de gel" },
  { id: "alongamento", label: "Alongamento" },
  { id: "manutencao", label: "Retirada / Manutenção" },
  { id: "sobrancelha", label: "Sobrancelha / Buço" },
  { id: "cilios", label: "Cílios" },
];

const SERVICES = [
  { id: "s1", cat: "maos", name: "Mão simples", duration: 60, price: 35 },
  { id: "s2", cat: "maos", name: "Mão decorada", duration: 60, price: 40 },
  { id: "s3", cat: "maos", name: "Esmaltação em gel (mãos)", duration: 90, price: 65 },
  { id: "s4", cat: "maos", name: "Esmaltação decorada (mãos)", duration: 90, price: 70 },

  { id: "s5", cat: "pes", name: "Pedicure simples", duration: 60, price: 40 },
  { id: "s6", cat: "pes", name: "Pé com francesinha", duration: 60, price: 43 },
  { id: "s7", cat: "pes", name: "Esmaltação em gel (pés)", duration: 90, price: 70 },
  { id: "s8", cat: "pes", name: "Esmaltação em gel pés c/ francesinha", duration: 90, price: 73 },

  { id: "s9", cat: "combo", name: "Pés e mãos", duration: 120, price: 75 },

  { id: "s10", cat: "banho", name: "Banho de gel c/ esmalte em gel", duration: 120, price: 150 },
  { id: "s11", cat: "banho", name: "Banho de gel simples", duration: 120, price: 110 },

  { id: "s12", cat: "alongamento", name: "Alongamento de unhas (inclui esmalte simples)", duration: 180, price: 190 },
  { id: "s13", cat: "alongamento", name: "Alongamento c/ decoração ou esmalte em gel", duration: 180, price: 250 },
  { id: "s14", cat: "alongamento", name: "Reposição de unhas", duration: 30, price: 20 },

  { id: "s15", cat: "manutencao", name: "Retirada de esmaltação + mão simples", duration: 90, price: 60 },
  { id: "s16", cat: "manutencao", name: "Reparo de unhas", duration: 30, price: 10 },
  { id: "s17", cat: "manutencao", name: "Manutenção de alongamento", duration: 120, price: 110 },
  { id: "s18", cat: "manutencao", name: "Manutenção de alongamento c/ esmaltação em gel", duration: 120, price: 150 },
  { id: "s19", cat: "manutencao", name: "Retirada de esmaltação", duration: 30, price: 15 },

  { id: "s20", cat: "sobrancelha", name: "Sobrancelha limpeza", duration: 30, price: 30 },
  { id: "s21", cat: "sobrancelha", name: "Buço", duration: 15, price: 15 },
  { id: "s22", cat: "sobrancelha", name: "Buço + sobrancelha", duration: 30, price: 40 },

  { id: "s23", cat: "cilios", name: "Lash lifting", duration: 90, price: 90 },
  { id: "s24", cat: "cilios", name: "Colocação de cílios", duration: 120, price: 130 },
  { id: "s25", cat: "cilios", name: "Manutenção de cílios", duration: 90, price: 90 },
  { id: "s26", cat: "cilios", name: "Retirada de cílios", duration: 30, price: 50 },
];

const PROFESSIONALS = [
  { id: "carol", name: "Carol", initials: "CA", whatsapp: "5551994728357" },
  { id: "suelen", name: "Suelen", initials: "SU", whatsapp: "5551985238712" },
];

module.exports = { CATEGORIES, SERVICES, PROFESSIONALS };
