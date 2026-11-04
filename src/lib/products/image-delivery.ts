/**
 * CONVERSA PRODUCT IMAGE DELIVERY SERVICE
 * Handles identifying product picture requests and delivering existing product images
 * as native Facebook Messenger image attachments (rather than downloadable file documents).
 */

export interface ProductItem {
  id?: string;
  title: string;
  price?: number;
  stock_quantity?: number;
  description?: string | null;
  is_available?: boolean;
  image_urls?: string[] | null;
}

export interface ChatHistoryMessage {
  role: string;
  content: string;
  mediaUrl?: string | null;
}

export interface ImageDeliveryResult {
  isPictureRequest: boolean;
  product: ProductItem | null;
  imageUrl: string | null;
  isAmbiguous: boolean;
  matchedReason?: string;
}

/**
 * Known product aliases mapped to normalized product keywords.
 * Preserves existing products without changing database structure.
 */
const KNOWN_PRODUCT_ALIASES: Record<string, { aliases: string[]; weight: number }[]> = {
  // Kemei Trimmer
  "kemei": [
    { aliases: ["kemei", "কেমি", "কেমেই", "km-6330", "km6330", "6330"], weight: 10 },
    { aliases: ["trimmer", "ট্রিমার", "grooming", "গ্রুমিং", "শেভার", "shaver"], weight: 5 },
  ],
  // Mini Vacuum Cleaner
  "vacuum": [
    { aliases: ["vacuum", "ভ্যাকুয়াম", "ভ্যাকুয়াম", "ভেকুয়াম", "ভেকুয়াম"], weight: 10 },
    { aliases: ["mini vacuum", "মিনি ভ্যাকুয়াম", "vacuum cleaner", "ক্লিনার"], weight: 10 },
  ],
  // CYXG Q10 / Q102 Earbuds
  "cyxg": [
    { aliases: ["cyxg", "q10", "q102", "q-10", "কিউ১০", "কিউ১০২"], weight: 10 },
    { aliases: ["cyxg earbuds", "q10 earbuds", "q102 earbuds"], weight: 12 },
    { aliases: ["earbuds", "earbud", "ইয়ারবাডস", "ইয়ারবাডস", "ইয়ারফোন", "হেডফোন"], weight: 4 },
  ],
  // XO1 Auto Charge Separator
  "xo1": [
    { aliases: ["xo1", "auto charge", "charge separator", "সেপারেটর", "চার্জ সেপারেটর"], weight: 10 },
  ],
  // Magical Garage Key Hanger
  "garage": [
    { aliases: ["garage", "key hanger", "garage key hanger", "গ্যারেজ", "কী হ্যাঙ্গার", "কি হ্যাঙ্গার", "hanger"], weight: 10 },
  ],
  // MILI MiTag
  "mitag": [
    { aliases: ["mili", "mitag", "mi tag", "মিট্যাগ", "মাইট্যাগ", "tracker", "ট্রেকার"], weight: 10 },
  ],
  // SX21 Wireless Microphone
  "sx21": [
    { aliases: ["sx21", "sx-21", "microphone", "মাইক্রোফোন", "lavalier", "মাইক"], weight: 10 },
  ],
  // Galaxy Star Projector
  "projector": [
    { aliases: ["star projector", "galaxy star projector", "projector", "প্রজেক্টর", "স্টার প্রজেক্টর"], weight: 10 },
  ],
  // USB Juicer
  "juicer": [
    { aliases: ["juicer", "জুসার", "portable juicer", "blender", "ব্লেন্ডার"], weight: 10 },
  ],
  // Galaxy Night Light
  "night light": [
    { aliases: ["galaxy night light", "night light", "নাইট লাইট"], weight: 10 },
  ],
  // Super Bass Earbuds
  "super bass": [
    { aliases: ["super bass", "super bass earbuds"], weight: 10 },
  ],
};

/**
 * Determines whether a message text expresses intent to see or receive a product photo/sample.
 */
export function isPictureRequest(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const clean = text.toLowerCase().trim();

  // Explicit keywords requesting images / photos / samples
  const intentPatterns = [
    // Bengali phrases
    /ছবি/i,
    /পিক/i,
    /পিকচার/i,
    /ফটো/i,
    /স্যাম্পল/i,
    /দেখান/i,
    /দেখাও/i,
    /দেখি/i,
    /দেখতে চাই/i,
    /পাঠান/i,
    /আসল ছবি/i,
    /রিয়েল ছবি/i,
    /রিয়েল ছবি/i,
    // English / Banglish phrases
    /\bchobi\b/i,
    /\bpic\b/i,
    /\bpics\b/i,
    /\bpicture\b/i,
    /\bpictures\b/i,
    /\bphoto\b/i,
    /\bphotos\b/i,
    /\bimage\b/i,
    /\bimages\b/i,
    /\bsample\b/i,
    /\blook like\b/i,
    /\bdekhi\b/i,
    /\bdekhan\b/i,
    /\bdekhao\b/i,
    /\bpathan\b/i,
    /\breal pic\b/i,
    /\breal picture\b/i,
  ];

  return intentPatterns.some((pattern) => pattern.test(clean));
}

/**
 * Matches a specific product from text given the catalog list.
 */
export function matchProductFromText(
  text: string,
  products: ProductItem[]
): ProductItem | null {
  if (!text || !products || products.length === 0) return null;
  const normalizedText = text.toLowerCase();

  let bestMatch: ProductItem | null = null;
  let highestScore = 0;

  for (const product of products) {
    let score = 0;
    const titleLower = product.title.toLowerCase();

    // 1. Exact or partial match with product title
    if (normalizedText.includes(titleLower)) {
      score += 20;
    }

    // 2. Token match with title words (excluding short stopwords)
    const titleTokens = titleLower
      .split(/[\s\-_,]+/)
      .filter((t) => t.length > 2 && !["the", "and", "with", "for", "usb"].includes(t));

    for (const token of titleTokens) {
      if (normalizedText.includes(token)) {
        score += 6;
      }
    }

    // 3. Match against known aliases
    for (const [key, aliasGroups] of Object.entries(KNOWN_PRODUCT_ALIASES)) {
      if (titleLower.includes(key)) {
        for (const group of aliasGroups) {
          for (const alias of group.aliases) {
            if (normalizedText.includes(alias.toLowerCase())) {
              score += group.weight;
            }
          }
        }
      }
    }

    // Earbuds disambiguation: CYXG Q10 vs generic/other earbuds
    if (titleLower.includes("cyxg") && (normalizedText.includes("q10") || normalizedText.includes("q102"))) {
      score += 15;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = product;
    }
  }

  // Minimum threshold score to avoid false positives on generic single words
  return highestScore >= 5 ? bestMatch : null;
}

/**
 * Counts how many different catalog products are mentioned in a text.
 * Used to avoid locking onto a single product if the message was a broadcast list of all products.
 */
function countProductsMentioned(text: string, products: ProductItem[]): number {
  if (!text || !products) return 0;
  const norm = text.toLowerCase();
  let count = 0;
  for (const p of products) {
    const titleTokens = p.title.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    if (titleTokens.some((t) => norm.includes(t))) {
      count++;
    }
  }
  return count;
}

/**
 * Main entrance to detect product image requests and retrieve existing product images.
 *
 * Rules:
 * 1. Checks if customer is requesting a product picture.
 * 2. Identifies product from current message.
 * 3. If not in current message, checks recent conversation context.
 * 4. If product is ambiguous (e.g. "pic den" with no prior product discussed), returns isAmbiguous = true
 *    and does NOT return a random image.
 * 5. Returns existing image URL from Conversa's storage if available.
 */
export function findRequestedProductImage(params: {
  currentMessage: string;
  chatHistory?: ChatHistoryMessage[];
  products: ProductItem[];
}): ImageDeliveryResult {
  const { currentMessage, chatHistory = [], products } = params;

  // 1. Is this a picture request?
  if (!isPictureRequest(currentMessage)) {
    return {
      isPictureRequest: false,
      product: null,
      imageUrl: null,
      isAmbiguous: false,
    };
  }

  // 2. Try identifying product directly from current message
  let matchedProduct = matchProductFromText(currentMessage, products);
  let matchedReason = matchedProduct ? "matched_current_message" : "";

  // 3. If not specified in current message, inspect recent conversation history
  if (!matchedProduct && chatHistory && chatHistory.length > 0) {
    // Scan recent messages from newest to oldest (up to last 5 messages)
    const recent = [...chatHistory].reverse().slice(0, 5);

    for (const msg of recent) {
      if (!msg.content) continue;

      // Skip messages that list 3 or more products (e.g. store catalog summary)
      const mentionedCount = countProductsMentioned(msg.content, products);
      if (mentionedCount >= 3) continue;

      const histProduct = matchProductFromText(msg.content, products);
      if (histProduct) {
        matchedProduct = histProduct;
        matchedReason = `matched_history_${msg.role}`;
        break;
      }
    }
  }

  // 4. If product is still unclear, mark as ambiguous (do NOT send random image)
  if (!matchedProduct) {
    return {
      isPictureRequest: true,
      product: null,
      imageUrl: null,
      isAmbiguous: true,
      matchedReason: "unspecified_product",
    };
  }

  // 5. Retrieve existing image from database storage
  const imageUrl =
    Array.isArray(matchedProduct.image_urls) && matchedProduct.image_urls.length > 0
      ? matchedProduct.image_urls[0]
      : null;

  return {
    isPictureRequest: true,
    product: matchedProduct,
    imageUrl,
    isAmbiguous: false,
    matchedReason,
  };
}

/**
 * Removes raw image URLs from AI text response to ensure Facebook Messenger
 * displays clean text and doesn't generate unwanted external file/download link cards.
 */
export function sanitizeAiReplyText(text: string): string {
  if (!text) return "";
  // Strip raw supabase or http image links from the text body
  let cleaned = text.replace(
    /https?:\/\/[^\s]+?\.(jpg|jpeg|png|webp|gif)(\?[^\s]*)?/gi,
    ""
  );
  // Also clean markdown image tags if any: ![alt](url)
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/gi, "");
  // Clean empty lines created by removing links
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  return cleaned;
}
