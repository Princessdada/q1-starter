// Seed data for the mock API. This file is intentionally boring and correct.
// If you think you have found a bug in here, you probably have not — the bugs
// for this exercise live in app/components/RepaymentTable.vue.

export interface Loan {
  id: string
  reference: string
  customer_name: string
  description: string
  amount_kobo: number
  status: 'active' | 'overdue' | 'paid'
  due_date: string
}

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export const LOANS: Loan[] = [
  { id: 'ln_01', reference: 'SYC-4417', customer_name: 'Adebayo Okonkwo',   description: 'Working capital top-up',                        amount_kobo: 145_250_33, status: 'active',  due_date: daysFromNow(12) },
  { id: 'ln_02', reference: 'SYC-4418', customer_name: 'Ngozi Eze',          description: 'Inventory restock — <b>priority</b> account',   amount_kobo: 89_400_00,  status: 'overdue', due_date: daysFromNow(-4) },
  { id: 'ln_03', reference: 'SYC-4419', customer_name: 'Chidi Nwosu',        description: 'Equipment purchase',                            amount_kobo: 212_875_67, status: 'active',  due_date: daysFromNow(21) },
  { id: 'ln_04', reference: 'SYC-4420', customer_name: 'Fatima Bello',       description: 'Bridge financing',                              amount_kobo: 67_120_50,  status: 'overdue', due_date: daysFromNow(-11) },
  { id: 'ln_05', reference: 'SYC-4421', customer_name: 'Emeka Obi',          description: 'Seasonal stock <img src=x onerror="document.title=\'xss\'">', amount_kobo: 34_990_99, status: 'active', due_date: daysFromNow(6) },
  { id: 'ln_06', reference: 'SYC-4422', customer_name: 'Aisha Mohammed',     description: 'Vehicle acquisition',                           amount_kobo: 398_000_00, status: 'active',  due_date: daysFromNow(45) },
  { id: 'ln_07', reference: 'SYC-4423', customer_name: 'Tunde Alabi',        description: 'Payroll smoothing',                             amount_kobo: 51_333_33, status: 'overdue', due_date: daysFromNow(-2) },
  { id: 'ln_08', reference: 'SYC-4424', customer_name: 'Blessing Udo',       description: 'Shop expansion',                                amount_kobo: 178_640_12, status: 'active',  due_date: daysFromNow(30) },
  { id: 'ln_09', reference: 'SYC-4425', customer_name: 'Yusuf Ibrahim',      description: 'Raw material import',                           amount_kobo: 265_100_45, status: 'active',  due_date: daysFromNow(18) },
  { id: 'ln_10', reference: 'SYC-4426', customer_name: 'Amaka Nwachukwu',    description: 'Refinance — see note from ops',                 amount_kobo: 92_450_78, status: 'paid',    due_date: daysFromNow(-30) },
  { id: 'ln_11', reference: 'SYC-4427', customer_name: 'Segun Adeyemi',      description: 'Working capital top-up',                        amount_kobo: 120_000_01, status: 'active',  due_date: daysFromNow(9) },
  { id: 'ln_12', reference: 'SYC-4428', customer_name: 'Halima Sani',        description: 'Cold storage unit',                             amount_kobo: 305_720_66, status: 'active',  due_date: daysFromNow(60) },
  { id: 'ln_13', reference: 'SYC-4429', customer_name: 'Ifeanyi Okafor',     description: 'Distribution van',                              amount_kobo: 187_999_99, status: 'overdue', due_date: daysFromNow(-7) },
  { id: 'ln_14', reference: 'SYC-4430', customer_name: 'Zainab Yakubu',      description: 'Bulk purchase discount window',                 amount_kobo: 74_310_10,  status: 'active',  due_date: daysFromNow(14) },
  { id: 'ln_15', reference: 'SYC-4431', customer_name: 'Olumide Balogun',    description: 'Generator replacement',                         amount_kobo: 143_800_25, status: 'active',  due_date: daysFromNow(25) },
  { id: 'ln_16', reference: 'SYC-4432', customer_name: 'Chinwe Okeke',       description: 'Fabric import',                                 amount_kobo: 96_540_87, status: 'paid',    due_date: daysFromNow(-45) },
  { id: 'ln_17', reference: 'SYC-4433', customer_name: 'Musa Danjuma',       description: 'Farm inputs',                                   amount_kobo: 58_275_40,  status: 'active',  due_date: daysFromNow(11) },
  { id: 'ln_18', reference: 'SYC-4434', customer_name: 'Kemi Adeleke',       description: 'Salon fit-out',                                 amount_kobo: 41_990_05,  status: 'overdue', due_date: daysFromNow(-1) },
  { id: 'ln_19', reference: 'SYC-4435', customer_name: 'Obinna Agu',         description: 'Electronics restock',                           amount_kobo: 233_450_91, status: 'active',  due_date: daysFromNow(33) },
  { id: 'ln_20', reference: 'SYC-4436', customer_name: 'Rukayat Lawal',      description: 'Bakery equipment',                              amount_kobo: 109_880_73, status: 'active',  due_date: daysFromNow(19) },
  { id: 'ln_21', reference: 'SYC-4437', customer_name: 'Daniel Etim',        description: 'Logistics fuel float',                          amount_kobo: 88_120_58,  status: 'active',  due_date: daysFromNow(8) },
  { id: 'ln_22', reference: 'SYC-4438', customer_name: 'Grace Effiong',      description: 'Pharmacy stock',                                amount_kobo: 156_700_44, status: 'overdue', due_date: daysFromNow(-16) },
  { id: 'ln_23', reference: 'SYC-4439', customer_name: 'Bashir Aliyu',       description: 'Warehouse deposit',                             amount_kobo: 274_060_29, status: 'active',  due_date: daysFromNow(52) },
  { id: 'ln_24', reference: 'SYC-4440', customer_name: 'Peace Oyelaran',     description: 'Printing press service',                        amount_kobo: 63_415_16,  status: 'active',  due_date: daysFromNow(27) },
  { id: 'ln_25', reference: 'SYC-4441', customer_name: 'Victor Chukwu',      description: 'Trade credit extension',                        amount_kobo: 199_999_98, status: 'active',  due_date: daysFromNow(4) },
]

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
