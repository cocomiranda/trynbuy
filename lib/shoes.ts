export type Shoe = {
  slug: string;
  brand: string;
  name: string;
  tagline: string;
  description: string;
  runnerType: string;
  cushion: string;
  allowedSurfaces: string;
  availableSizes: string[];
  retailPrice: number;
  keepPrice: number;
  stripeProductId?: string;
  deposit: number;
  trialDailyFee: number;
  trialCount: number;
  isAvailable: boolean;
  gradient: string;
  rules: string[];
  returnControls: {
    title: string;
    description: string;
  }[];
};

export const shoeCatalog: Shoe[] = [
  {
    slug: "nike-vomero-18",
    brand: "Nike",
    name: "Vomero 18",
    tagline: "Soft-mileage comfort for runners who want forgiving daily miles.",
    description:
      "A plush neutral trainer aimed at runners testing long easy runs, steady mileage, and comfort-first recovery sessions.",
    runnerType: "Neutral runners chasing comfort and daily mileage.",
    cushion: "Max cushion",
    allowedSurfaces: "Road, treadmill, smooth gravel",
    availableSizes: ["UK 7", "UK 8", "UK 9", "UK 10"],
    retailPrice: 150,
    keepPrice: 135,
    stripeProductId: "prod_UIrEjcgcqUVjdu",
    deposit: 125,
    trialDailyFee: 5,
    trialCount: 3,
    isAvailable: true,
    gradient: "from-orange-400 via-amber-300 to-yellow-200",
    rules: [
      "Run up to 30 km total during your trial window.",
      "Run only on the surfaces the pair is designed for.",
      "Upload before and after photos so inspection stays fair and fast.",
      "Choose return, keep, or extension before day 5 ends.",
    ],
    returnControls: [
      {
        title: "Photo proof",
        description:
          "Customers submit condition photos before the first run and at return request time.",
      },
      {
        title: "Mileage declaration",
        description:
          "Runners log approximate distance covered so operators can compare against wear.",
      },
      {
        title: "Manual review",
        description:
          "Each pair is inspected before deposit release to verify condition and policy compliance.",
      },
      {
        title: "Deposit protection",
        description:
          "Partial capture covers overuse or damage, while no-return cases trigger full capture.",
      },
    ],
  },
  {
    slug: "asics-gel-nimbus-27",
    brand: "ASICS",
    name: "Gel-Nimbus 27",
    tagline: "Premium cushioning for runners deciding between comfort and control.",
    description:
      "A high-cushion everyday trainer for runners wanting a forgiving fit and enough support for repeat daily sessions.",
    runnerType: "Neutral to mildly guidance-seeking runners.",
    cushion: "High cushion",
    allowedSurfaces: "Road, treadmill",
    availableSizes: ["UK 6", "UK 7", "UK 8", "UK 9"],
    retailPrice: 155,
    keepPrice: 139,
    deposit: 130,
    trialDailyFee: 5,
    trialCount: 7,
    isAvailable: false,
    gradient: "from-sky-500 via-cyan-400 to-teal-200",
    rules: [
      "Keep total trial usage under 30 km.",
      "Return in the provided shoe bag with original insoles and tags.",
      "Run only on the surfaces the pair is designed for.",
      "Inspection determines whether the full deposit hold is released.",
    ],
    returnControls: [
      {
        title: "Condition checklist",
        description:
          "Operators review outsole wear, upper stains, and overall structural shape.",
      },
      {
        title: "Extension request",
        description:
          "Runners can request a paid extension when they need one more long run to decide.",
      },
      {
        title: "Retail incentive",
        description:
          "The discounted keep-price makes purchase more attractive than ignoring the return.",
      },
      {
        title: "Abuse guardrail",
        description:
          "Deposits are set at or above shoe cost to avoid downside on no-return behavior.",
      },
    ],
  },
  {
    slug: "hoka-mach-6",
    brand: "Hoka",
    name: "Mach 6",
    tagline: "Lighter, faster feel for runners choosing between tempo fun and daily versatility.",
    description:
      "A responsive trainer for runners who want one shoe that can handle both daily runs and uptempo sessions.",
    runnerType: "Runners comparing versatility, bounce, and weight.",
    cushion: "Balanced cushion",
    allowedSurfaces: "Road, track, treadmill",
    availableSizes: ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
    retailPrice: 145,
    keepPrice: 129,
    stripeProductId: "prod_UIrEcsICQxMjak",
    deposit: 120,
    trialDailyFee: 5,
    trialCount: 2,
    isAvailable: true,
    gradient: "from-emerald-500 via-lime-400 to-yellow-200",
    rules: [
      "Run only on the surfaces the pair is designed for.",
      "The pair must be cleaned and packed for return pickup.",
      "Mileage and return intent are confirmed in-app before pickup.",
      "Damage or excessive wear may trigger a partial deposit capture.",
    ],
    returnControls: [
      {
        title: "Surface policy",
        description:
          "Approved use cases are stated clearly so the shoes are protected without confusion.",
      },
      {
        title: "Pickup flow",
        description:
          "Scheduled return pickup reduces drop-off friction and improves completion rates.",
      },
      {
        title: "Wear pricing",
        description:
          "Partial capture ranges are visible to runners before checkout, making expectations explicit.",
      },
      {
        title: "Review loop",
        description:
          "Every proper return ends with feedback collection to improve sizing and inventory planning.",
      },
    ],
  },
];

export const shoeMetrics = [
  {
    label: "Return case",
    value: "$25 paid",
    note: "About $10 profit after logistics and expected wear.",
  },
  {
    label: "Buy case",
    value: "$135 total",
    note: "Still profitable while feeling like a customer win.",
  },
  {
    label: "No return case",
    value: "$175 effective",
    note: "Penalty outcome should be unattractive but protective.",
  },
];

export const adminRentals = [
  {
    runner: "Amina R.",
    shoe: "Nike Vomero 18",
    km: "18 km",
    status: "On trial",
    decision: "Needs 2 more days",
  },
  {
    runner: "Jon B.",
    shoe: "ASICS Gel-Nimbus 27",
    km: "27 km",
    status: "Inspection due",
    decision: "Return requested",
  },
  {
    runner: "Sofia K.",
    shoe: "Hoka Mach 6",
    km: "12 km",
    status: "High intent",
    decision: "Likely purchase",
  },
];

export const adminInventory = [
  {
    model: "Nike Vomero 18",
    stock: 6,
    condition: "Fresh rotation",
    bestSize: "UK 9",
    lastInspection: "2026-04-06",
  },
  {
    model: "ASICS Gel-Nimbus 27",
    stock: 5,
    condition: "Watch outsole wear",
    bestSize: "UK 8",
    lastInspection: "2026-04-07",
  },
  {
    model: "Hoka Mach 6",
    stock: 4,
    condition: "High demand",
    bestSize: "UK 10",
    lastInspection: "2026-04-08",
  },
];

export function getShoeBySlug(slug: string) {
  return shoeCatalog.find((shoe) => shoe.slug === slug);
}

export function getTrialPrice(days: number, dailyFee: number) {
  return days * dailyFee;
}
