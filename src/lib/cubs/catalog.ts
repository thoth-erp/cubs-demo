/**
 * CUBS domain catalog — the manufacturing knowledge base.
 *
 * CUBS makes bags, shoes, slippers and swimwear. Every raw material a factory
 * buys lives in this hierarchy:
 *
 *   Category (bags)  →  Material family / "product type" (Zipper)
 *                    →  Subtype / "type" (Nylon zipper)
 *                    →  Variant (size 9ml · colour Red · unit m)
 *
 * The variant code is composed Shopify-style from the short codes at each level,
 * e.g.  BG · Z · N · 9ML · RED  →  BGZN-9ML-RED.
 *
 * All labels are bilingual (EN / AR).
 */

export type Lang = "en" | "ar";
export interface Bi { en: string; ar: string }

export const tx = (b: Bi | undefined, lang: Lang): string => (b ? (lang === "ar" ? b.ar : b.en) : "");

// ─── Colours ──────────────────────────────────────────────
// The reference cards the user supplied live in /public/cubs. Each named colour
// points at the card it was picked from (shown in the picker) plus an approximate
// hex for the swatch chip.

export interface Colour { id: string; name: Bi; hex: string; card: string; code: string }

export const ZIPPER_CARDS: string[] = [];
export const FABRIC_CARDS: string[] = [];

// ─── Zipper colour codes (from supplier colour index) ──────
export interface ColourCode { colorNo: string; indexNo: string }
export const ZIPPER_COLOR_CODES: ColourCode[] = [
  { colorNo: "S001", indexNo: "B-7" }, { colorNo: "S002", indexNo: "U-10" }, { colorNo: "S003", indexNo: "T-13" },
  { colorNo: "S004", indexNo: "H-5" }, { colorNo: "S005", indexNo: "V-4" }, { colorNo: "S006", indexNo: "A-15" },
  { colorNo: "S007", indexNo: "W-11" }, { colorNo: "S008", indexNo: "X-15" }, { colorNo: "S009", indexNo: "Y-13" },
  { colorNo: "S010", indexNo: "Z-2" }, { colorNo: "S011", indexNo: "D-8" }, { colorNo: "S012", indexNo: "AD-4" },
  { colorNo: "S013", indexNo: "AA-10" }, { colorNo: "S014", indexNo: "Z-16" }, { colorNo: "S015", indexNo: "AB-19" },
  { colorNo: "S016", indexNo: "Q-14" }, { colorNo: "S017", indexNo: "F-18" }, { colorNo: "S018", indexNo: "J-12" },
  { colorNo: "S019", indexNo: "O-11" }, { colorNo: "S020", indexNo: "J-18" }, { colorNo: "S021", indexNo: "Q-17" },
  { colorNo: "S022", indexNo: "C-18" }, { colorNo: "S023", indexNo: "H-13" }, { colorNo: "S024", indexNo: "A-20" },
  { colorNo: "S025", indexNo: "U-19" }, { colorNo: "S026", indexNo: "K-2" }, { colorNo: "S027", indexNo: "M-16" },
  { colorNo: "S028", indexNo: "I-12" }, { colorNo: "S029", indexNo: "O-18" }, { colorNo: "S030", indexNo: "J-1" },
  { colorNo: "S031", indexNo: "W-2" }, { colorNo: "S032", indexNo: "Y-1" }, { colorNo: "S033", indexNo: "W-15" },
  { colorNo: "S034", indexNo: "Y-5" }, { colorNo: "S035", indexNo: "I-4" }, { colorNo: "S036", indexNo: "H-10" },
  { colorNo: "S037", indexNo: "J-16" }, { colorNo: "S038", indexNo: "M-20" }, { colorNo: "S039", indexNo: "M-18" },
  { colorNo: "S040", indexNo: "L-16" }, { colorNo: "S041", indexNo: "F-4" }, { colorNo: "S042", indexNo: "R-6" },
  { colorNo: "S043", indexNo: "A-11" }, { colorNo: "S044", indexNo: "J-5" }, { colorNo: "S045", indexNo: "S-16" },
  { colorNo: "S046", indexNo: "I-11" }, { colorNo: "S047", indexNo: "F-9" }, { colorNo: "S048", indexNo: "Q-18" },
  { colorNo: "S049", indexNo: "J-9" }, { colorNo: "S050", indexNo: "AD-3" }, { colorNo: "S051", indexNo: "Q-7" },
  { colorNo: "S052", indexNo: "F-11" }, { colorNo: "S053", indexNo: "A-18" }, { colorNo: "S054", indexNo: "B-6" },
  { colorNo: "S055", indexNo: "A-2" }, { colorNo: "S056", indexNo: "A-9" }, { colorNo: "S057", indexNo: "U-4" },
  { colorNo: "S058", indexNo: "K-16" }, { colorNo: "S059", indexNo: "T-17" }, { colorNo: "S060", indexNo: "U-14" },
  { colorNo: "S061", indexNo: "U-16" }, { colorNo: "S062", indexNo: "U-17" }, { colorNo: "S063", indexNo: "F-2" },
  { colorNo: "S064", indexNo: "E-9" }, { colorNo: "S065", indexNo: "F-8" }, { colorNo: "S066", indexNo: "L-3" },
  { colorNo: "S067", indexNo: "N-19" }, { colorNo: "S068", indexNo: "O-3" }, { colorNo: "S069", indexNo: "Q-3" },
  { colorNo: "S070", indexNo: "S-7" }, { colorNo: "S071", indexNo: "AD-20" }, { colorNo: "S072", indexNo: "W-20" },
  { colorNo: "S073", indexNo: "S-17" }, { colorNo: "S074", indexNo: "AD-15" }, { colorNo: "S075", indexNo: "K-20" },
  { colorNo: "S076", indexNo: "Z-15" }, { colorNo: "S077", indexNo: "E-17" }, { colorNo: "S078", indexNo: "D-20" },
  { colorNo: "S079", indexNo: "V-11" }, { colorNo: "S080", indexNo: "D-17" }, { colorNo: "S081", indexNo: "F-7" },
  { colorNo: "S082", indexNo: "S-9" }, { colorNo: "S083", indexNo: "L-19" }, { colorNo: "S084", indexNo: "G-13" },
  { colorNo: "S085", indexNo: "X-8" }, { colorNo: "S086", indexNo: "C-16" }, { colorNo: "S087", indexNo: "C-11" },
  { colorNo: "S088", indexNo: "Y-18" }, { colorNo: "S089", indexNo: "B-10" }, { colorNo: "S090", indexNo: "U-6" },
  { colorNo: "S091", indexNo: "AC-19" }, { colorNo: "S092", indexNo: "W-17" }, { colorNo: "S093", indexNo: "W-14" },
  { colorNo: "S094", indexNo: "S-19" }, { colorNo: "S095", indexNo: "AC-1" }, { colorNo: "S096", indexNo: "D-15" },
  { colorNo: "S097", indexNo: "V-15" }, { colorNo: "S098", indexNo: "X-5" }, { colorNo: "S099", indexNo: "A-1" },
  { colorNo: "S100", indexNo: "F-3" }, { colorNo: "S101", indexNo: "X-6" }, { colorNo: "S102", indexNo: "V-10" },
  { colorNo: "S103", indexNo: "H-20" }, { colorNo: "S104", indexNo: "AD-10" }, { colorNo: "S105", indexNo: "H-7" },
  { colorNo: "S106", indexNo: "C-5" }, { colorNo: "S107", indexNo: "AC-10" }, { colorNo: "S108", indexNo: "D-3" },
  { colorNo: "S109", indexNo: "D-5" }, { colorNo: "S110", indexNo: "F-1" }, { colorNo: "S111", indexNo: "J-13" },
  { colorNo: "S112", indexNo: "I-1" }, { colorNo: "S113", indexNo: "O-6" }, { colorNo: "S114", indexNo: "A-10" },
  { colorNo: "S115", indexNo: "K-14" }, { colorNo: "S116", indexNo: "B-12" }, { colorNo: "S117", indexNo: "L-20" },
  { colorNo: "S118", indexNo: "AC-18" }, { colorNo: "S119", indexNo: "AB-10" }, { colorNo: "S120", indexNo: "E-19" },
  { colorNo: "S121", indexNo: "C-1" }, { colorNo: "S122", indexNo: "Z-1" }, { colorNo: "S123", indexNo: "V-2" },
  { colorNo: "S124", indexNo: "B-4" }, { colorNo: "S125", indexNo: "W-6" }, { colorNo: "S126", indexNo: "Z-19" },
  { colorNo: "S127", indexNo: "X-4" }, { colorNo: "S128", indexNo: "X-7" }, { colorNo: "S129", indexNo: "C-3" },
  { colorNo: "S130", indexNo: "A-6" }, { colorNo: "S131", indexNo: "B-14" }, { colorNo: "S132", indexNo: "AB-8" },
  { colorNo: "S133", indexNo: "AB-13" }, { colorNo: "S134", indexNo: "Y-2" }, { colorNo: "S135", indexNo: "AA-4" },
  { colorNo: "S136", indexNo: "U-9" }, { colorNo: "S137", indexNo: "U-11" }, { colorNo: "S138", indexNo: "U-13" },
  { colorNo: "S139", indexNo: "S-12" }, { colorNo: "S140", indexNo: "S-15" }, { colorNo: "S141", indexNo: "V-18" },
  { colorNo: "S142", indexNo: "I-3" }, { colorNo: "S143", indexNo: "K-3" }, { colorNo: "S144", indexNo: "M-8" },
  { colorNo: "S145", indexNo: "L-8" }, { colorNo: "S146", indexNo: "N-20" }, { colorNo: "S147", indexNo: "K-17" },
  { colorNo: "S148", indexNo: "G-8" }, { colorNo: "S149", indexNo: "G-10" }, { colorNo: "S150", indexNo: "F-10" },
  { colorNo: "S151", indexNo: "F-12" }, { colorNo: "S152", indexNo: "G-11" }, { colorNo: "S153", indexNo: "F-17" },
  { colorNo: "S154", indexNo: "AB-4" }, { colorNo: "S155", indexNo: "AC-17" }, { colorNo: "S156", indexNo: "AA-17" },
  { colorNo: "S157", indexNo: "Y-10" }, { colorNo: "S158", indexNo: "AD-19" }, { colorNo: "S159", indexNo: "S-18" },
  { colorNo: "S160", indexNo: "AD-16" }, { colorNo: "S161", indexNo: "W-19" }, { colorNo: "S162", indexNo: "I-14" },
  { colorNo: "S163", indexNo: "K-10" }, { colorNo: "S164", indexNo: "M-14" }, { colorNo: "S165", indexNo: "AB-6" },
  { colorNo: "S166", indexNo: "S-11" }, { colorNo: "S167", indexNo: "W-8" }, { colorNo: "S168", indexNo: "AD-18" },
  { colorNo: "S169", indexNo: "AA-16" }, { colorNo: "S170", indexNo: "D-6" }, { colorNo: "S171", indexNo: "T-20" },
  { colorNo: "S172", indexNo: "Y-20" }, { colorNo: "S173", indexNo: "D-19" }, { colorNo: "S174", indexNo: "P-6" },
  { colorNo: "S175", indexNo: "E-20" }, { colorNo: "S176", indexNo: "Y-19" }, { colorNo: "S177", indexNo: "AA-19" },
  { colorNo: "S178", indexNo: "B-8" }, { colorNo: "S179", indexNo: "AB-16" }, { colorNo: "S180", indexNo: "X-3" },
  { colorNo: "S181", indexNo: "AA-2" }, { colorNo: "S182", indexNo: "AA-14" }, { colorNo: "S183", indexNo: "AA-12" },
  { colorNo: "S184", indexNo: "G-2" }, { colorNo: "S185", indexNo: "V-3" }, { colorNo: "S186", indexNo: "V-1" },
  { colorNo: "S187", indexNo: "X-19" }, { colorNo: "S188", indexNo: "W-13" }, { colorNo: "S189", indexNo: "W-9" },
  { colorNo: "S190", indexNo: "E-16" }, { colorNo: "S191", indexNo: "G-6" }, { colorNo: "S192", indexNo: "AA-9" },
  { colorNo: "S193", indexNo: "S-13" }, { colorNo: "S194", indexNo: "Y-11" }, { colorNo: "S195", indexNo: "P-12" },
  { colorNo: "S196", indexNo: "K-19" }, { colorNo: "S197", indexNo: "G-15" }, { colorNo: "S198", indexNo: "L-11" },
  { colorNo: "S199", indexNo: "U-20" }, { colorNo: "S200", indexNo: "A-16" }, { colorNo: "S201", indexNo: "I-18" },
  { colorNo: "S202", indexNo: "H-1" }, { colorNo: "S203", indexNo: "X-10" }, { colorNo: "S204", indexNo: "AB-14" },
  { colorNo: "S205", indexNo: "AC-8" }, { colorNo: "S206", indexNo: "P-2" }, { colorNo: "S207", indexNo: "R-5" },
  { colorNo: "S208", indexNo: "N-1" }, { colorNo: "S209", indexNo: "V-5" }, { colorNo: "S210", indexNo: "AA-20" },
  { colorNo: "S211", indexNo: "E-10" }, { colorNo: "S212", indexNo: "Q-4" }, { colorNo: "S213", indexNo: "P-1" },
  { colorNo: "S214", indexNo: "S-8" }, { colorNo: "S215", indexNo: "X-20" }, { colorNo: "S216", indexNo: "C-13" },
  { colorNo: "S217", indexNo: "P-9" }, { colorNo: "S218", indexNo: "O-16" }, { colorNo: "S219", indexNo: "X-12" },
  { colorNo: "S220", indexNo: "M-19" }, { colorNo: "S221", indexNo: "S-6" }, { colorNo: "S222", indexNo: "Y-3" },
  { colorNo: "S223", indexNo: "D-18" }, { colorNo: "S224", indexNo: "P-15" }, { colorNo: "S225", indexNo: "AA-3" },
  { colorNo: "S226", indexNo: "AC-7" }, { colorNo: "S227", indexNo: "X-2" }, { colorNo: "S228", indexNo: "N-18" },
  { colorNo: "S229", indexNo: "W-12" }, { colorNo: "S230", indexNo: "R-19" }, { colorNo: "S231", indexNo: "L-5" },
  { colorNo: "S232", indexNo: "AC-4" }, { colorNo: "S233", indexNo: "K-18" }, { colorNo: "S234", indexNo: "A-12" },
  { colorNo: "S235", indexNo: "Z-5" }, { colorNo: "S236", indexNo: "V-14" }, { colorNo: "S237", indexNo: "E-18" },
  { colorNo: "S238", indexNo: "L-13" }, { colorNo: "S239", indexNo: "Q-20" }, { colorNo: "S240", indexNo: "F-20" },
  { colorNo: "S241", indexNo: "C-15" }, { colorNo: "S242", indexNo: "Y-9" }, { colorNo: "S243", indexNo: "AA-7" },
  { colorNo: "S244", indexNo: "O-4" }, { colorNo: "S245", indexNo: "Q-1" }, { colorNo: "S246", indexNo: "N-7" },
  { colorNo: "S247", indexNo: "D-9" }, { colorNo: "S248", indexNo: "N-11" }, { colorNo: "S249", indexNo: "U-15" },
  { colorNo: "S250", indexNo: "H-4" }, { colorNo: "S251", indexNo: "S-14" }, { colorNo: "S252", indexNo: "I-20" },
  { colorNo: "S253", indexNo: "M-15" }, { colorNo: "S254", indexNo: "R-20" }, { colorNo: "S255", indexNo: "N-14" },
  { colorNo: "S256", indexNo: "S-10" }, { colorNo: "S257", indexNo: "AD-7" }, { colorNo: "S258", indexNo: "R-18" },
  { colorNo: "S259", indexNo: "N-3" }, { colorNo: "S260", indexNo: "M-9" }, { colorNo: "S261", indexNo: "R-15" },
  { colorNo: "S262", indexNo: "AC-9" }, { colorNo: "S263", indexNo: "I-9" }, { colorNo: "S264", indexNo: "N-13" },
  { colorNo: "S265", indexNo: "O-15" }, { colorNo: "S266", indexNo: "N-17" }, { colorNo: "S267", indexNo: "Q-9" },
  { colorNo: "S268", indexNo: "N-4" }, { colorNo: "S269", indexNo: "P-3" }, { colorNo: "S270", indexNo: "P-20" },
  { colorNo: "S271", indexNo: "Q-13" }, { colorNo: "S272", indexNo: "P-11" }, { colorNo: "S273", indexNo: "S-20" },
  { colorNo: "S274", indexNo: "S-2" }, { colorNo: "S275", indexNo: "AA-6" }, { colorNo: "S276", indexNo: "Q-5" },
  { colorNo: "S277", indexNo: "AC-14" }, { colorNo: "S278", indexNo: "N-9" }, { colorNo: "S279", indexNo: "A-4" },
  { colorNo: "S280", indexNo: "L-6" }, { colorNo: "S281", indexNo: "N-8" }, { colorNo: "S282", indexNo: "D-16" },
  { colorNo: "S283", indexNo: "T-11" }, { colorNo: "S284", indexNo: "O-12" }, { colorNo: "S285", indexNo: "P-4" },
  { colorNo: "S286", indexNo: "H-14" }, { colorNo: "S287", indexNo: "H-16" }, { colorNo: "S288", indexNo: "Q-15" },
  { colorNo: "S289", indexNo: "Q-8" }, { colorNo: "S290", indexNo: "N-16" }, { colorNo: "S291", indexNo: "Q-12" },
  { colorNo: "S292", indexNo: "Q-6" }, { colorNo: "S293", indexNo: "S-1" }, { colorNo: "S294", indexNo: "M-10" },
  { colorNo: "S295", indexNo: "G-18" }, { colorNo: "S296", indexNo: "X-18" }, { colorNo: "S297", indexNo: "K-6" },
  { colorNo: "S298", indexNo: "K-11" }, { colorNo: "S299", indexNo: "R-17" }, { colorNo: "S300", indexNo: "X-11" },
  { colorNo: "S301", indexNo: "AA-15" }, { colorNo: "S302", indexNo: "N-15" }, { colorNo: "S303", indexNo: "O-13" },
  { colorNo: "S304", indexNo: "Q-11" }, { colorNo: "S305", indexNo: "D-14" }, { colorNo: "S306", indexNo: "AA-13" },
  { colorNo: "S307", indexNo: "AB-17" }, { colorNo: "S308", indexNo: "P-16" }, { colorNo: "S309", indexNo: "N-10" },
  { colorNo: "S310", indexNo: "K-12" }, { colorNo: "S311", indexNo: "AC-15" }, { colorNo: "S312", indexNo: "R-12" },
  { colorNo: "S313", indexNo: "AC-13" }, { colorNo: "S314", indexNo: "J-14" }, { colorNo: "S315", indexNo: "Z-18" },
  { colorNo: "S316", indexNo: "AB-1" }, { colorNo: "S317", indexNo: "P-19" }, { colorNo: "S318", indexNo: "Y-6" },
  { colorNo: "S319", indexNo: "P-18" }, { colorNo: "S320", indexNo: "AD-9" }, { colorNo: "S321", indexNo: "L-12" },
  { colorNo: "S322", indexNo: "T-4" }, { colorNo: "S323", indexNo: "Z-7" }, { colorNo: "S324", indexNo: "Z-10" },
  { colorNo: "S325", indexNo: "Y-4" }, { colorNo: "S326", indexNo: "P-17" }, { colorNo: "S327", indexNo: "X-17" },
  { colorNo: "S328", indexNo: "AD-8" }, { colorNo: "S329", indexNo: "AB-12" }, { colorNo: "S330", indexNo: "AC-3" },
  { colorNo: "S331", indexNo: "V-16" }, { colorNo: "S332", indexNo: "H-11" }, { colorNo: "S333", indexNo: "K-9" },
  { colorNo: "S334", indexNo: "Z-4" }, { colorNo: "S335", indexNo: "R-10" }, { colorNo: "S336", indexNo: "AB-3" },
  { colorNo: "S337", indexNo: "AB-2" }, { colorNo: "S338", indexNo: "T-6" }, { colorNo: "S339", indexNo: "L-4" },
  { colorNo: "S340", indexNo: "AA-1" }, { colorNo: "S341", indexNo: "T-10" }, { colorNo: "S342", indexNo: "D-4" },
  { colorNo: "S343", indexNo: "AB-9" }, { colorNo: "S344", indexNo: "S-3" }, { colorNo: "S345", indexNo: "B-5" },
  { colorNo: "S346", indexNo: "B-11" }, { colorNo: "S347", indexNo: "N-2" }, { colorNo: "S348", indexNo: "T-5" },
  { colorNo: "S349", indexNo: "J-15" }, { colorNo: "S350", indexNo: "M-5" }, { colorNo: "S351", indexNo: "M-3" },
  { colorNo: "S352", indexNo: "M-6" }, { colorNo: "S353", indexNo: "AC-5" }, { colorNo: "S354", indexNo: "R-14" },
  { colorNo: "S355", indexNo: "R-1" }, { colorNo: "S356", indexNo: "J-2" }, { colorNo: "S357", indexNo: "I-5" },
  { colorNo: "S358", indexNo: "I-15" }, { colorNo: "S359", indexNo: "J-11" }, { colorNo: "S360", indexNo: "N-12" },
  { colorNo: "S361", indexNo: "AC-2" }, { colorNo: "S362", indexNo: "AC-20" }, { colorNo: "S363", indexNo: "L-7" },
  { colorNo: "S364", indexNo: "T-1" }, { colorNo: "S365", indexNo: "Y-12" }, { colorNo: "S366", indexNo: "J-3" },
  { colorNo: "S367", indexNo: "D-10" }, { colorNo: "S368", indexNo: "P-10" }, { colorNo: "S369", indexNo: "M-4" },
  { colorNo: "S370", indexNo: "I-10" }, { colorNo: "S371", indexNo: "W-5" }, { colorNo: "S372", indexNo: "S-4" },
  { colorNo: "S373", indexNo: "O-9" }, { colorNo: "S374", indexNo: "N-6" }, { colorNo: "S375", indexNo: "O-5" },
  { colorNo: "S376", indexNo: "O-7" }, { colorNo: "S377", indexNo: "S-5" }, { colorNo: "S378", indexNo: "Q-2" },
  { colorNo: "S379", indexNo: "P-14" }, { colorNo: "S380", indexNo: "P-13" }, { colorNo: "S381", indexNo: "L-14" },
  { colorNo: "S382", indexNo: "AC-12" }, { colorNo: "S383", indexNo: "R-13" }, { colorNo: "S384", indexNo: "AA-8" },
  { colorNo: "S385", indexNo: "I-7" }, { colorNo: "S386", indexNo: "AB-11" }, { colorNo: "S387", indexNo: "Z-17" },
  { colorNo: "S388", indexNo: "L-15" }, { colorNo: "S389", indexNo: "AB-18" }, { colorNo: "S390", indexNo: "H-17" },
  { colorNo: "S391", indexNo: "F-19" }, { colorNo: "S392", indexNo: "Z-13" }, { colorNo: "S393", indexNo: "H-9" },
  { colorNo: "S394", indexNo: "Y-15" }, { colorNo: "S395", indexNo: "AD-17" }, { colorNo: "S396", indexNo: "AB-15" },
  { colorNo: "S397", indexNo: "T-9" }, { colorNo: "S398", indexNo: "L-9" }, { colorNo: "S399", indexNo: "Z-14" },
  { colorNo: "S400", indexNo: "AD-12" }, { colorNo: "S901", indexNo: "K-1" }, { colorNo: "S902", indexNo: "K-4" },
  { colorNo: "S903", indexNo: "L-2" }, { colorNo: "S915", indexNo: "O-20" }, { colorNo: "S916", indexNo: "Y-17" },
  { colorNo: "S917", indexNo: "V-20" }, { colorNo: "S918", indexNo: "K-13" }, { colorNo: "S919", indexNo: "K-15" },
  { colorNo: "S920", indexNo: "L-17" },
];

// Zipper / thread colours — read off the supplier colour-index cards.
export const ZIPPER_COLOURS: Colour[] = [
  { id: "z-black",  code: "BLK", name: { en: "Black",       ar: "أسود" },       hex: "#1b1b1e", card: ZIPPER_CARDS[1] },
  { id: "z-white",  code: "WHT", name: { en: "White",       ar: "أبيض" },       hex: "#f4f4f2", card: ZIPPER_CARDS[1] },
  { id: "z-navy",   code: "NVY", name: { en: "Navy",        ar: "كحلي" },       hex: "#20304f", card: ZIPPER_CARDS[0] },
  { id: "z-red",    code: "RED", name: { en: "Red",         ar: "أحمر" },       hex: "#c0392b", card: ZIPPER_CARDS[0] },
  { id: "z-wine",   code: "WIN", name: { en: "Wine",        ar: "نبيتي" },      hex: "#7d2740", card: ZIPPER_CARDS[0] },
  { id: "z-purple", code: "PUR", name: { en: "Purple",      ar: "بنفسجي" },     hex: "#6b4a86", card: ZIPPER_CARDS[0] },
  { id: "z-pink",   code: "PNK", name: { en: "Pink",        ar: "وردي" },       hex: "#d96b91", card: ZIPPER_CARDS[0] },
  { id: "z-beige",  code: "BEG", name: { en: "Beige",       ar: "بيج" },        hex: "#d8c4a5", card: ZIPPER_CARDS[0] },
  { id: "z-grey",   code: "GRY", name: { en: "Grey",        ar: "رمادي" },      hex: "#8a8d91", card: ZIPPER_CARDS[1] },
  { id: "z-brown",  code: "BRN", name: { en: "Brown",       ar: "بني" },        hex: "#6a4a33", card: ZIPPER_CARDS[1] },
];

// Fabric colours — from the fabric swatch fans.
export const FABRIC_COLOURS: Colour[] = [
  { id: "f-black",   code: "BLK", name: { en: "Black",      ar: "أسود" },       hex: "#1d1d20", card: FABRIC_CARDS[0] },
  { id: "f-white",   code: "WHT", name: { en: "White",      ar: "أبيض" },       hex: "#f2f1ec", card: FABRIC_CARDS[0] },
  { id: "f-red",     code: "RED", name: { en: "Red",        ar: "أحمر" },       hex: "#cf3b3b", card: FABRIC_CARDS[3] },
  { id: "f-teal",    code: "TEL", name: { en: "Teal",       ar: "تركوازي" },    hex: "#2f8f8a", card: FABRIC_CARDS[2] },
  { id: "f-navy",    code: "NVY", name: { en: "Navy",       ar: "كحلي" },       hex: "#26364f", card: FABRIC_CARDS[3] },
  { id: "f-sky",     code: "SKY", name: { en: "Sky Blue",   ar: "سماوي" },      hex: "#7fb2d6", card: FABRIC_CARDS[1] },
  { id: "f-mustard", code: "MST", name: { en: "Mustard",    ar: "خردلي" },      hex: "#d3a13a", card: FABRIC_CARDS[4] },
  { id: "f-sage",    code: "SGE", name: { en: "Sage",       ar: "زيتي فاتح" },  hex: "#9caa82", card: FABRIC_CARDS[2] },
  { id: "f-blush",   code: "BLS", name: { en: "Blush",      ar: "وردي فاتح" },  hex: "#e2b7b0", card: FABRIC_CARDS[1] },
  { id: "f-charcoal",code: "CHR", name: { en: "Charcoal",   ar: "فحمي" },       hex: "#3a3c40", card: FABRIC_CARDS[0] },
  { id: "f-olive",   code: "OLV", name: { en: "Olive",      ar: "زيتوني" },     hex: "#6b6a3a", card: FABRIC_CARDS[2] },
  { id: "f-royal",   code: "RYL", name: { en: "Royal Blue", ar: "أزرق ملكي" },  hex: "#2f5bd0", card: FABRIC_CARDS[1] },
];

// Metal / hardware finishes — no card, just a swatch.
export const HARDWARE_FINISHES: Colour[] = [
  { id: "h-gold",     code: "GLD", name: { en: "Gold",         ar: "ذهبي" },        hex: "#c9a24b", card: "" },
  { id: "h-silver",   code: "SLV", name: { en: "Silver",       ar: "فضي" },         hex: "#c4c7cc", card: "" },
  { id: "h-gunmetal", code: "GUN", name: { en: "Gunmetal",     ar: "رمادي معدني" }, hex: "#4b4e55", card: "" },
  { id: "h-antique",  code: "ANT", name: { en: "Antique Brass",ar: "نحاسي عتيق" },  hex: "#8a6d3b", card: "" },
  { id: "h-rose",     code: "ROS", name: { en: "Rose Gold",    ar: "ذهبي وردي" },   hex: "#c48a7a", card: "" },
  { id: "h-matte",    code: "MTB", name: { en: "Matte Black",  ar: "أسود مطفي" },   hex: "#26262a", card: "" },
];

export type ColourSource = "zipper" | "fabric" | "hardware" | "none";
export function coloursFor(src: ColourSource): Colour[] {
  if (src === "zipper") return ZIPPER_COLOURS;
  if (src === "fabric") return FABRIC_COLOURS;
  if (src === "hardware") return HARDWARE_FINISHES;
  return [];
}
export function cardsFor(_src: ColourSource): string[] {
  return [];
}

// ─── Sizes (the small dimension axis, e.g. zipper gauge) ────
export interface SizeOpt { id: string; label: Bi; code: string }

// ─── Subtype (the "type" dropdown) ──────────────────────────
export interface Subtype {
  id: string;
  code: string;         // short code used in the SKU
  name: Bi;
}

// ─── Material family (the "product type" dropdown) ──────────
export interface Family {
  id: string;
  code: string;         // short code used in the SKU
  name: Bi;
  icon?: string;
  unit: Bi;             // default costing/stocking unit
  units: Bi[];          // selectable units
  colour: ColourSource; // which colour set (and reference card) applies
  sizes: SizeOpt[];     // size axis; empty = no size axis
  sizeLabel?: Bi;       // what "size" means for this family
  subtypes: Subtype[];
}

// ─── Category ───────────────────────────────────────────────
export interface Category {
  id: string;
  code: string;
  name: Bi;
  families: string[];   // family ids available for this category
}

// Reusable unit vocab
const U = {
  m:     { en: "meter (m)", ar: "متر" },
  cm:    { en: "centimeter (cm)", ar: "سنتيمتر" },
  yard:  { en: "yard", ar: "ياردة" },
  pc:    { en: "piece (pc)", ar: "قطعة" },
  pair:  { en: "pair", ar: "زوج" },
  set:   { en: "set", ar: "طقم" },
  roll:  { en: "roll", ar: "لفة" },
  cone:  { en: "cone", ar: "بكرة" },
  kg:    { en: "kilogram (kg)", ar: "كيلوجرام" },
  g:     { en: "gram (g)", ar: "جرام" },
  liter: { en: "liter (L)", ar: "لتر" },
  sheet: { en: "sheet", ar: "لوح" },
  gross: { en: "gross (144)", ar: "جروسة" },
} satisfies Record<string, Bi>;

const ZIP_GAUGES: SizeOpt[] = [
  { id: "3ml", code: "3ML", label: { en: "3 ml", ar: "٣ ملي" } },
  { id: "5ml", code: "5ML", label: { en: "5 ml", ar: "٥ ملي" } },
  { id: "7ml", code: "7ML", label: { en: "7 ml", ar: "٧ ملي" } },
  { id: "9ml", code: "9ML", label: { en: "9 ml", ar: "٩ ملي" } },
];

// ─── Families ───────────────────────────────────────────────
// Keyed by id so categories can reference a shared family and everything stays DRY.

export const FAMILIES: Record<string, Family> = {
  zipper: {
    id: "zipper", code: "Z", name: { en: "Zipper", ar: "سوستة" },
    unit: U.m, units: [U.m, U.pc, U.roll], colour: "zipper",
    sizeLabel: { en: "Gauge", ar: "المقاس" }, sizes: ZIP_GAUGES,
    subtypes: [
      { id: "nylon",  code: "N", name: { en: "Nylon zipper (coil)", ar: "سوستة نايلون" } },
      { id: "metal",  code: "M", name: { en: "Metal zipper", ar: "سوستة معدن" } },
      { id: "vislon", code: "V", name: { en: "Vislon / plastic-tooth", ar: "سوستة بلاستيك" } },
      { id: "invis",  code: "I", name: { en: "Invisible zipper", ar: "سوستة مخفية" } },
      { id: "water",  code: "W", name: { en: "Waterproof zipper", ar: "سوستة مقاومة للماء" } },
    ],
  },
  synfabric: {
    id: "synfabric", code: "F", name: { en: "Synthetic Fabric", ar: "قماش صناعي" },
    unit: U.m, units: [U.m, U.yard, U.roll, U.kg], colour: "fabric",
    sizeLabel: { en: "Weight (denier/GSM)", ar: "الوزن" },
    sizes: [
      { id: "210d", code: "210D", label: { en: "210D", ar: "٢١٠D" } },
      { id: "420d", code: "420D", label: { en: "420D", ar: "٤٢٠D" } },
      { id: "600d", code: "600D", label: { en: "600D", ar: "٦٠٠D" } },
      { id: "1680d", code: "1680D", label: { en: "1680D", ar: "١٦٨٠D" } },
    ],
    subtypes: [
      { id: "nylon",   code: "N", name: { en: "Nylon", ar: "نايلون" } },
      { id: "poly",    code: "P", name: { en: "Polyester", ar: "بوليستر" } },
      { id: "oxford",  code: "O", name: { en: "Oxford", ar: "أوكسفورد" } },
      { id: "cordura", code: "C", name: { en: "Cordura", ar: "كوردورا" } },
      { id: "pvc",     code: "V", name: { en: "PVC-coated", ar: "مغطى PVC" } },
      { id: "pu",      code: "U", name: { en: "PU leather (synthetic)", ar: "جلد صناعي PU" } },
    ],
  },
  lining: {
    id: "lining", code: "L", name: { en: "Lining", ar: "بطانة" },
    unit: U.m, units: [U.m, U.yard, U.roll], colour: "fabric", sizes: [],
    subtypes: [
      { id: "polytaffeta", code: "T", name: { en: "Polyester taffeta", ar: "تفتا بوليستر" } },
      { id: "mesh",        code: "M", name: { en: "Mesh lining", ar: "بطانة شبك" } },
      { id: "satin",       code: "S", name: { en: "Satin lining", ar: "بطانة ساتان" } },
      { id: "microfiber",  code: "F", name: { en: "Microfiber", ar: "ميكروفايبر" } },
    ],
  },
  thread: {
    id: "thread", code: "T", name: { en: "Thread", ar: "خيط" },
    unit: U.cone, units: [U.cone, U.kg, U.pc], colour: "fabric",
    sizeLabel: { en: "Thickness (Tex)", ar: "السماكة" },
    sizes: [
      { id: "tex40", code: "T40", label: { en: "Tex 40", ar: "تكس ٤٠" } },
      { id: "tex60", code: "T60", label: { en: "Tex 60", ar: "تكس ٦٠" } },
      { id: "tex80", code: "T80", label: { en: "Tex 80", ar: "تكس ٨٠" } },
    ],
    subtypes: [
      { id: "poly",  code: "P", name: { en: "Polyester thread", ar: "خيط بوليستر" } },
      { id: "nylon", code: "N", name: { en: "Nylon bonded thread", ar: "خيط نايلون" } },
      { id: "cotton",code: "C", name: { en: "Cotton thread", ar: "خيط قطن" } },
    ],
  },
  buckle: {
    id: "buckle", code: "B", name: { en: "Buckle & Hardware", ar: "إبزيم ومعدن" },
    unit: U.pc, units: [U.pc, U.set, U.gross], colour: "hardware", sizes: [],
    subtypes: [
      { id: "sidereleae", code: "S", name: { en: "Side-release buckle", ar: "إبزيم بلاستيك" } },
      { id: "dring",      code: "D", name: { en: "D-ring", ar: "حلقة D" } },
      { id: "slider",     code: "L", name: { en: "Strap slider / adjuster", ar: "مثبت شريط" } },
      { id: "magnet",     code: "M", name: { en: "Magnetic snap", ar: "قفل مغناطيسي" } },
      { id: "twistlock",  code: "T", name: { en: "Twist lock", ar: "قفل لولبي" } },
      { id: "rivet",      code: "R", name: { en: "Rivet", ar: "برشام" } },
    ],
  },
  handle: {
    id: "handle", code: "H", name: { en: "Handle / Strap", ar: "يد / حزام" },
    unit: U.pc, units: [U.pc, U.pair, U.m], colour: "fabric", sizes: [],
    subtypes: [
      { id: "webbing", code: "W", name: { en: "Webbing strap", ar: "شريط قماش" } },
      { id: "pu",      code: "P", name: { en: "PU / faux-leather handle", ar: "يد جلد صناعي" } },
      { id: "chain",   code: "C", name: { en: "Metal chain strap", ar: "سلسلة معدن" } },
      { id: "rope",    code: "R", name: { en: "Rope / cord handle", ar: "يد حبل" } },
    ],
  },
  foam: {
    id: "foam", code: "P", name: { en: "Foam / Padding", ar: "إسفنج / حشو" },
    unit: U.sheet, units: [U.sheet, U.m, U.roll], colour: "none",
    sizeLabel: { en: "Thickness", ar: "السماكة" },
    sizes: [
      { id: "3mm", code: "3MM", label: { en: "3 mm", ar: "٣ ملم" } },
      { id: "5mm", code: "5MM", label: { en: "5 mm", ar: "٥ ملم" } },
      { id: "10mm", code: "10MM", label: { en: "10 mm", ar: "١٠ ملم" } },
    ],
    subtypes: [
      { id: "eva",  code: "E", name: { en: "EVA foam", ar: "إسفنج EVA" } },
      { id: "pe",   code: "P", name: { en: "PE foam", ar: "إسفنج PE" } },
      { id: "spacer",code: "S", name: { en: "Spacer mesh foam", ar: "إسفنج شبك" } },
    ],
  },
  label: {
    id: "label", code: "X", name: { en: "Label & Trim", ar: "ليبل وإكسسوار" },
    unit: U.pc, units: [U.pc, U.roll, U.gross], colour: "none", sizes: [],
    subtypes: [
      { id: "woven",  code: "W", name: { en: "Woven label", ar: "ليبل منسوج" } },
      { id: "printed",code: "P", name: { en: "Printed care label", ar: "ليبل مطبوع" } },
      { id: "hangtag",code: "H", name: { en: "Hang tag", ar: "تعليقة" } },
      { id: "metal",  code: "M", name: { en: "Metal logo plate", ar: "بلاكة معدن" } },
    ],
  },
  // ── Shoes ──
  sole: {
    id: "sole", code: "S", name: { en: "Sole", ar: "نعل" },
    unit: U.pair, units: [U.pair, U.pc], colour: "hardware",
    sizeLabel: { en: "Shoe size", ar: "المقاس" },
    sizes: [
      { id: "eu38", code: "38", label: { en: "EU 38", ar: "٣٨" } },
      { id: "eu40", code: "40", label: { en: "EU 40", ar: "٤٠" } },
      { id: "eu42", code: "42", label: { en: "EU 42", ar: "٤٢" } },
      { id: "eu44", code: "44", label: { en: "EU 44", ar: "٤٤" } },
    ],
    subtypes: [
      { id: "rubber", code: "R", name: { en: "Rubber sole", ar: "نعل مطاط" } },
      { id: "tpr",    code: "T", name: { en: "TPR sole", ar: "نعل TPR" } },
      { id: "eva",    code: "E", name: { en: "EVA sole", ar: "نعل EVA" } },
      { id: "pu",     code: "U", name: { en: "PU sole", ar: "نعل PU" } },
    ],
  },
  upper: {
    id: "upper", code: "U", name: { en: "Upper Material", ar: "وجه الحذاء" },
    unit: U.m, units: [U.m, U.yard, U.pc], colour: "fabric", sizes: [],
    subtypes: [
      { id: "genleather", code: "G", name: { en: "Genuine leather", ar: "جلد طبيعي" } },
      { id: "puleather",  code: "P", name: { en: "PU leather", ar: "جلد صناعي" } },
      { id: "suede",      code: "S", name: { en: "Suede", ar: "شامواه" } },
      { id: "canvas",     code: "C", name: { en: "Canvas", ar: "كانفاس" } },
      { id: "knit",       code: "K", name: { en: "Knit / flyknit", ar: "تريكو" } },
    ],
  },
  insole: {
    id: "insole", code: "I", name: { en: "Insole", ar: "نعل داخلي" },
    unit: U.pair, units: [U.pair, U.pc], colour: "none", sizes: [],
    subtypes: [
      { id: "memory", code: "M", name: { en: "Memory foam insole", ar: "نعل إسفنج" } },
      { id: "eva",    code: "E", name: { en: "EVA insole", ar: "نعل EVA" } },
      { id: "leather",code: "L", name: { en: "Leather insole", ar: "نعل جلد" } },
    ],
  },
  laces: {
    id: "laces", code: "C", name: { en: "Laces & Eyelets", ar: "رباط وعيون" },
    unit: U.pair, units: [U.pair, U.pc, U.gross], colour: "fabric", sizes: [],
    subtypes: [
      { id: "flat",   code: "F", name: { en: "Flat lace", ar: "رباط مسطح" } },
      { id: "round",  code: "R", name: { en: "Round lace", ar: "رباط دائري" } },
      { id: "eyelet", code: "E", name: { en: "Metal eyelet", ar: "عين معدن" } },
    ],
  },
  // ── Slippers ──
  strap: {
    id: "strap", code: "R", name: { en: "Strap Band", ar: "شريط الشبشب" },
    unit: U.pair, units: [U.pair, U.m, U.pc], colour: "fabric", sizes: [],
    subtypes: [
      { id: "pvc",   code: "V", name: { en: "PVC strap", ar: "شريط PVC" } },
      { id: "pu",    code: "P", name: { en: "PU strap", ar: "شريط PU" } },
      { id: "fabric",code: "F", name: { en: "Fabric strap", ar: "شريط قماش" } },
      { id: "velvet",code: "L", name: { en: "Velvet strap", ar: "شريط قطيفة" } },
    ],
  },
  // ── Swimwear ──
  swimfabric: {
    id: "swimfabric", code: "F", name: { en: "Swim Fabric", ar: "قماش سباحة" },
    unit: U.m, units: [U.m, U.yard, U.kg], colour: "fabric",
    sizeLabel: { en: "Weight (GSM)", ar: "الوزن" },
    sizes: [
      { id: "180g", code: "180G", label: { en: "180 GSM", ar: "١٨٠ جم" } },
      { id: "200g", code: "200G", label: { en: "200 GSM", ar: "٢٠٠ جم" } },
      { id: "220g", code: "220G", label: { en: "220 GSM", ar: "٢٢٠ جم" } },
    ],
    subtypes: [
      { id: "lycra",   code: "L", name: { en: "Nylon-Lycra (spandex)", ar: "لايكرا" } },
      { id: "polyspan",code: "P", name: { en: "Poly-spandex", ar: "بوليستر سباندكس" } },
      { id: "recycled",code: "R", name: { en: "Recycled nylon (Econyl)", ar: "نايلون معاد" } },
    ],
  },
  powermesh: {
    id: "powermesh", code: "M", name: { en: "Power Mesh Lining", ar: "بطانة شبك مطاط" },
    unit: U.m, units: [U.m, U.yard], colour: "fabric", sizes: [],
    subtypes: [
      { id: "std", code: "S", name: { en: "Standard power mesh", ar: "شبك عادي" } },
      { id: "matte", code: "M", name: { en: "Matte power mesh", ar: "شبك مطفي" } },
    ],
  },
  elastic: {
    id: "elastic", code: "E", name: { en: "Elastic & Drawcord", ar: "أستك ورباط" },
    unit: U.m, units: [U.m, U.roll], colour: "fabric",
    sizeLabel: { en: "Width", ar: "العرض" },
    sizes: [
      { id: "6mm", code: "6MM", label: { en: "6 mm", ar: "٦ ملم" } },
      { id: "10mm", code: "10MM", label: { en: "10 mm", ar: "١٠ ملم" } },
      { id: "15mm", code: "15MM", label: { en: "15 mm", ar: "١٥ ملم" } },
    ],
    subtypes: [
      { id: "rubber", code: "R", name: { en: "Rubber elastic", ar: "أستك مطاط" } },
      { id: "picot",  code: "P", name: { en: "Picot / decorative", ar: "أستك مزخرف" } },
      { id: "cord",   code: "C", name: { en: "Drawcord", ar: "رباط سحب" } },
    ],
  },
  cups: {
    id: "cups", code: "C", name: { en: "Bra Cups & Pads", ar: "حشوات الصدر" },
    unit: U.pair, units: [U.pair, U.pc], colour: "none", sizes: [],
    subtypes: [
      { id: "removable", code: "R", name: { en: "Removable pad", ar: "حشوة متحركة" } },
      { id: "sewn",      code: "S", name: { en: "Sewn-in cup", ar: "حشوة مثبتة" } },
    ],
  },
  clasp: {
    id: "clasp", code: "K", name: { en: "Hook & Clasp", ar: "مشبك" },
    unit: U.pc, units: [U.pc, U.gross], colour: "hardware", sizes: [],
    subtypes: [
      { id: "bikini", code: "B", name: { en: "Bikini clasp", ar: "مشبك بكيني" } },
      { id: "slider", code: "S", name: { en: "Adjuster slider", ar: "مثبت" } },
      { id: "ring",   code: "R", name: { en: "O-ring", ar: "حلقة" } },
    ],
  },
};

// ─── Categories ─────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  {
    id: "bags", code: "BG", name: { en: "Bags", ar: "شنط" },
    families: ["zipper", "synfabric", "lining", "thread", "buckle", "handle", "foam", "label"],
  },
  {
    id: "shoes", code: "SH", name: { en: "Shoes", ar: "أحذية" },
    families: ["sole", "upper", "insole", "laces", "thread", "buckle", "foam", "label"],
  },
  {
    id: "slippers", code: "SL", name: { en: "Slippers", ar: "شباشب" },
    families: ["sole", "strap", "foam", "buckle", "label"],
  },
  {
    id: "swimwear", code: "SW", name: { en: "Swimwear", ar: "ملابس سباحة" },
    families: ["swimfabric", "powermesh", "elastic", "cups", "clasp", "thread", "label"],
  },
];

// ─── Lookups ────────────────────────────────────────────────
export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
export const familyById = (id: string): Family | undefined => FAMILIES[id];
export const familiesForCategory = (catId: string): Family[] =>
  (categoryById(catId)?.families ?? []).map((f) => FAMILIES[f]).filter(Boolean);
export const subtypeById = (famId: string, subId: string): Subtype | undefined =>
  FAMILIES[famId]?.subtypes.find((s) => s.id === subId);

// ─── Code generation (Shopify-style) ────────────────────────
// Base code = CATEGORY.code + FAMILY.code + SUBTYPE.code   e.g. BGZN
// Variant SKU = base + [-SIZE] + [-COLOUR]                  e.g. BGZN-9ML-RED

export interface CodeParts {
  categoryId: string;
  familyId: string;
  subtypeId: string;
  sizeCode?: string;   // SizeOpt.code
  colourCode?: string; // Colour.code
}

export function baseCode(categoryId: string, familyId: string, subtypeId: string): string {
  const c = categoryById(categoryId)?.code ?? "";
  const f = FAMILIES[familyId]?.code ?? "";
  const s = subtypeById(familyId, subtypeId)?.code ?? "";
  return `${c}${f}${s}`;
}

export function variantCode(p: CodeParts): string {
  const parts = [baseCode(p.categoryId, p.familyId, p.subtypeId)];
  if (p.sizeCode) parts.push(p.sizeCode);
  if (p.colourCode) parts.push(p.colourCode);
  return parts.join("-");
}

// A short numeric barcode (EAN-13-ish) derived deterministically so demo data is stable-ish.
export function makeBarcode(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const body = String(200000000000 + (h % 799999999999)).slice(0, 12);
  // check digit (EAN-13)
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return body + check;
}
