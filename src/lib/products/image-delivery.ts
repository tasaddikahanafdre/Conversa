/**
 * CONVERSA PRODUCT IMAGE DELIVERY SERVICE
 * Handles identifying product picture requests and delivering multiple existing product images
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
  imageUrl: string | null;      // Primary photo (imageUrls[0])
  imageUrls: string[];          // All unique photos available for the product
  isAmbiguous: boolean;
  matchedReason?: string;
  wantsAll?: boolean;
}

/**
 * Known product aliases mapped to normalized product keywords.
 * Preserves existing products without changing database structure.
 */
const KNOWN_PRODUCT_ALIASES: Record<string, { aliases: string[]; weight: number }[]> = {
  // Kemei Trimmer
  "kemei": [
    { aliases: ["kemei", "কেমি", "কেমেই", "km-6330", "km6330", "6330"], weight: 12 },
    { aliases: ["trimmer", "ট্রিমার", "grooming", "গ্রুমিং", "শেভার", "shaver"], weight: 6 },
  ],
  // Mini Vacuum Cleaner
  "vacuum": [
    { aliases: ["vacuum", "ভ্যাকুয়াম", "ভ্যাকুয়াম", "ভেকুয়াম", "ভেকুয়াম"], weight: 12 },
    { aliases: ["mini vacuum", "মিনি ভ্যাকুয়াম", "vacuum cleaner", "ক্লিনার"], weight: 12 },
  ],
  // CYXG Q10 / Q102 Earbuds
  "cyxg": [
    { aliases: ["cyxg", "q10", "q102", "q-10", "কিউ১০", "কিউ১০২"], weight: 15 },
    { aliases: ["cyxg earbuds", "q10 earbuds", "q102 earbuds"], weight: 15 },
  ],
  // XO1 Auto Charge Separator
  "xo1": [
    { aliases: ["xo1", "auto charge", "charge separator", "সেপারেটর", "চার্জ সেপারেটর"], weight: 12 },
  ],
  // Magical Garage Key Hanger
  "garage": [
    { aliases: ["garage", "key hanger", "garage key hanger", "গ্যারেজ", "কী হ্যাঙ্গার", "কি হ্যাঙ্গার", "hanger"], weight: 12 },
  ],
  // MILI MiTag
  "mitag": [
    { aliases: ["mili", "mitag", "mi tag", "মিট্যাগ", "মাইট্যাগ", "tracker", "ট্রেকার"], weight: 12 },
  ],
  // SX21 Wireless Microphone
  "sx21": [
    { aliases: ["sx21", "sx-21", "microphone", "মাইক্রোফোন", "lavalier", "মাইক"], weight: 12 },
  ],
  // Galaxy Star Projector
  "projector": [
    { aliases: ["star projector", "galaxy star projector", "projector", "প্রজেক্টর", "স্টার প্রজেক্টর"], weight: 12 },
  ],
  // USB Juicer
  "juicer": [
    { aliases: ["juicer", "জুসার", "portable juicer", "blender", "ব্লেন্ডার"], weight: 12 },
  ],
  // Galaxy Night Light
  "night light": [
    { aliases: ["galaxy night light", "night light", "নাইট লাইট"], weight: 12 },
  ],
  // Super Bass Earbuds
  "super bass": [
    { aliases: ["super bass", "super bass earbuds"], weight: 12 },
  ],
};

/**
 * Determines whether a message text expresses intent to see or receive product photos/samples.
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
    /দেখবো/i,
    /দেখতে চাই/i,
    /পাঠান/i,
    /পাঠাও/i,
    /আসল ছবি/i,
    /রিয়েল ছবি/i,
    /রিয়েল ছবি/i,
    /আরও ছবি/i,
    /আরো ছবি/i,
    /সব ছবি/i,
    /বাকি ছবি/i,
    // English / Banglish phrases
    /\bchobi\b/i,
    /\bchobbi\b/i,
    /\bpic\b/i,
    /\bpics\b/i,
    /\bpick\b/i,
    /\bpicks\b/i,
    /\bpik\b/i,
    /\bpiks\b/i,
    /\bpicture\b/i,
    /\bpictures\b/i,
    /\bphoto\b/i,
    /\bphotos\b/i,
    /\bimage\b/i,
    /\bimages\b/i,
    /\bsample\b/i,
    /\bsamples\b/i,
    /\blook like\b/i,
    /\bdekhi\b/i,
    /\bdekhbo\b/i,
    /\bdekhan\b/i,
    /\bdekhao\b/i,
    /\bpathan\b/i,
    /\bpathao\b/i,
    /\breal pic\b/i,
    /\breal pick\b/i,
    /\breal picture\b/i,
    /\baro chobi\b/i,
    /\bsob chobi\b/i,
    /\bsob pic\b/i,
    /\bsob pick\b/i,
    /\ball pic\b/i,
    /\ball pics\b/i,
    /\ball pick\b/i,
    /\ball picks\b/i,
    /\bmore pic\b/i,
    /\bmore pics\b/i,
    /\bmore pick\b/i,
    /\bmore picks\b/i,
    /\bmore photos\b/i,
    /\bmore pictures\b/i,
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
  let tieCount = 0;

  for (const product of products) {
    let score = 0;
    const titleLower = product.title.toLowerCase();

    // 1. Exact or partial match with product title
    if (normalizedText.includes(titleLower)) {
      score += 25;
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
      score += 20;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = product;
      tieCount = 1;
    } else if (score === highestScore && score > 0) {
      tieCount++;
    }
  }

  // If there's an ambiguous tie between multiple products (e.g. generic "earbuds" matching both CYXG and Super Bass equally)
  if (tieCount > 1 && !normalizedText.includes("cyxg") && !normalizedText.includes("q10") && !normalizedText.includes("super bass")) {
    return null;
  }

  // Minimum threshold score to avoid false positives on generic single words
  return highestScore >= 6 ? bestMatch : null;
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
 * 1. Checks if customer is requesting product pictures.
 * 2. Identifies product from current message.
 * 3. If not in current message, checks recent conversation context.
 * 4. If product is ambiguous (e.g. "pic den" or generic "earbuds pic" with multiple matches and no prior context),
 *    returns isAmbiguous = true and does NOT return a random image.
 * 5. Retrieves all available existing image URLs for the matched product.
 * 6. Deduplicates image URLs.
 * 7. By default, returns all available photos for that product (up to 5) so customer sees the full product collection.
 */
export function findRequestedProductImage(params: {
  currentMessage: string;
  chatHistory?: ChatHistoryMessage[];
  products: ProductItem[];
}): ImageDeliveryResult {
  const { currentMessage, chatHistory = [], products } = params;

  let isDirectPicture = isPictureRequest(currentMessage);
  let matchedProduct: ProductItem | null = null;
  let matchedReason = "";

  if (isDirectPicture) {
    matchedProduct = matchProductFromText(currentMessage, products);
    if (matchedProduct) {
      matchedReason = "matched_current_message";
    }
  }

  // Conversational Context Recognition:
  // If not an explicit direct picture request, check if the customer is responding to a bot question
  if (!isDirectPicture && chatHistory && chatHistory.length > 0) {
    const lastAssistantMessage = [...chatHistory]
      .reverse()
      .find((m) => m.role === "assistant" || m.role === "ai" || m.role === "model");

    if (lastAssistantMessage && lastAssistantMessage.content) {
      // Scenario A: Bot previously asked which product's picture the customer wants to see
      const botAskedWhichProductPic = /(কোন পণ্যটির ছবি|কোন প্রোডাক্টের ছবি|কোনটার ছবি|ছবি দেখতে চান দয়া করে|what product.*picture|which product.*picture)/i.test(
        lastAssistantMessage.content
      );
      if (botAskedWhichProductPic) {
        const productFromAnswer = matchProductFromText(currentMessage, products);
        if (productFromAnswer) {
          isDirectPicture = true;
          matchedProduct = productFromAnswer;
          matchedReason = "customer_answered_which_product_picture";
        }
      }

      // Scenario B: Bot previously offered to send pictures of a product, and customer agreed
      const botOfferedPic = /(ছবি দেখতে চান|ছবি পাঠাবো|ছবি পাঠাব|ছবি দেখাব|ছবি দেখতে চাচ্ছেন|want to see.*(picture|photo|pic)|like to see.*(picture|photo|pic))/i.test(
        lastAssistantMessage.content
      );
      const isAffirmative = /(^|\b)(ha|haa|ji|jee|yes|yeah|yep|sure|ok|accha|achha|dekhan|dekhao|dao|dawo|den|dean|pathan|pathao|send|show|দাও|দেন|দেখান|দেখাও|পাঠান|পাঠাও|হ্যাঁ|হা|হাঁ|জি|আচ্ছা|দেখান তো)(\b|$)/i.test(
        currentMessage
      );

      if (botOfferedPic && isAffirmative) {
        // Retrieve the product discussed in recent history
        for (const msg of [...chatHistory].reverse().slice(0, 5)) {
          const histProduct = matchProductFromText(msg.content, products);
          if (histProduct) {
            isDirectPicture = true;
            matchedProduct = histProduct;
            matchedReason = "customer_confirmed_bot_picture_offer";
            break;
          }
        }
      }
    }
  }

  // 1. Is this a picture request?
  if (!isDirectPicture) {
    return {
      isPictureRequest: false,
      product: null,
      imageUrl: null,
      imageUrls: [],
      isAmbiguous: false,
    };
  }

  // 3. If picture requested but not identified yet, inspect recent conversation history
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

  // Special disambiguation for generic "earbuds" requests without prior context:
  // If customer says "earbuds er pic" and no specific earbuds was discussed in history, mark as ambiguous!
  const lowerMsg = currentMessage.toLowerCase();
  const isGenericEarbuds = (lowerMsg.includes("earbuds") || lowerMsg.includes("ইয়ারবাডস") || lowerMsg.includes("ইয়ারবাডস"))
    && !lowerMsg.includes("cyxg") && !lowerMsg.includes("q10") && !lowerMsg.includes("q102") && !lowerMsg.includes("super bass");

  if (isGenericEarbuds && matchedReason !== "matched_history_user" && matchedReason !== "matched_history_assistant" && matchedReason !== "customer_confirmed_bot_picture_offer") {
    matchedProduct = null;
  }

  // 4. If product is still unclear, mark as ambiguous (do NOT send random image)
  if (!matchedProduct) {
    return {
      isPictureRequest: true,
      product: null,
      imageUrl: null,
      imageUrls: [],
      isAmbiguous: true,
      matchedReason: "unspecified_product",
    };
  }

  // 5. Retrieve existing images from database storage
  const rawUrls = Array.isArray(matchedProduct.image_urls)
    ? matchedProduct.image_urls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];

  // Deduplicate image URLs to prevent sending duplicates
  const uniqueUrls = Array.from(new Set(rawUrls));
  const primaryUrl = uniqueUrls[0] || null;

  // Check if customer asked specifically for single image vs all/multiple
  const wantsSingle = /\b(১টি|একটি|১টা|একটা|one pic|1 pic|only one|single pic)\b/i.test(currentMessage);
  const wantsAll = !wantsSingle;

  // Max 5 images per request to ensure swift delivery and respect Meta limits
  const urlsToSend = wantsSingle && primaryUrl ? [primaryUrl] : uniqueUrls.slice(0, 5);

  return {
    isPictureRequest: true,
    product: matchedProduct,
    imageUrl: primaryUrl,
    imageUrls: urlsToSend,
    isAmbiguous: false,
    matchedReason,
    wantsAll,
  };
}

/**
 * Strips JSON code blocks or raw JSON payload objects if AI hallucinated an attachment structure.
 */
function stripJsonBlocks(text: string): string {
  if (!text) return "";
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  let result = text.replace(/```(?:json)?[\s\S]*?```/gi, "");

  // Match JSON objects containing "attachment" or "payload" with balanced brace extraction
  const match = result.match(/\{[\s\S]*?(?:"attachment"|"payload")[\s\S]*/);
  if (match && typeof match.index === "number") {
    const startIdx = match.index;
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx; i < result.length; i++) {
      if (result[i] === "{") depth++;
      else if (result[i] === "}") {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      result = result.slice(0, startIdx) + result.slice(endIdx + 1);
    }
  }

  return result;
}

/**
 * Removes raw image URLs and accidental JSON attachment structures from AI text response
 * to ensure Facebook Messenger displays clean, natural text and doesn't generate unwanted cards.
 */
export function sanitizeAiReplyText(text: string): string {
  if (!text) return "";
  // Strip JSON attachment objects
  let cleaned = stripJsonBlocks(text);
  // Strip raw supabase or http image links from the text body
  cleaned = cleaned.replace(
    /https?:\/\/[^\s]+?\.(jpg|jpeg|png|webp|gif)(\?[^\s]*)?/gi,
    ""
  );
  // Also clean markdown image tags if any: ![alt](url)
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/gi, "");
  // Clean empty lines created by removing links
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  return cleaned;
}
