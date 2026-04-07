import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const figures = [
  {
    slug: "bola-ahmed-tinubu",
    name: "Bola Ahmed Tinubu",
    role: "President",
    country: "Nigeria",
    category: "Politics",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCwFjRBTowQqEL5HiKU0dATLXALVwJFxO9eWeippUzWjOjVF0FaSa7jK4qY3wPrcj0kkLMbPXaQiKqocCiHSnSkOScD08JF-6SRdRAUC200dPkVx3VVjImApr6fxFwZZTAd2vm2P10W5LQtd92PacGOq4gocrnQOftLdHBZMJMQd9wEvRXqVX46j1Wuql7H7P8Zq04IPHsHfwmJEaeSnPdxLzJSjyuKxYQkX8VqYA7wvXQhsr-MUwYqQnKMc1rhT052cw-P5U7ABzTE",
    summary: "President of Nigeria and central figure in current economic and infrastructure debates.",
    wikipediaTitle: "Bola Tinubu",
    influenceScore: 97,
    searchBias: 20,
    engagementScore: 86
  },
  {
    slug: "burna-boy",
    name: "Burna Boy",
    role: "Artist",
    country: "Nigeria",
    category: "Music",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDvp6_vx5JOFvMbooBQM1a0yPKuKIjdKNzrbvyAWCGqFCisLID2BTo-1N91G_kRdrmqNT36PkaWu_3AAg712Fi21Txx_mSaBuwSTPfEw9KJVNSx-WeXxQY3WzCK2HGmhh9MpPSleYBkHg_eX0hYjBvI1ClmeM8TNKh3xXrhjCjHn8IxQX9yPDllag-D2MCObaivWmRNRjr3fr6II3rqLK9LLtfnUr9Db57-U6TRgHYtkDhXQj6lo2PpjAOITcJjEhOWj1VHTikemZU8",
    summary: "Grammy-winning Nigerian artist whose public statements and philanthropy trend quickly.",
    wikipediaTitle: "Burna Boy",
    influenceScore: 91,
    searchBias: 18,
    engagementScore: 79
  },
  {
    slug: "davido",
    name: "Davido",
    role: "Artist",
    country: "Nigeria",
    category: "Music",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD_GhZdsJlEEmqa10my2I89bPwoffpFbmkXUIH6QNgfBSsyGv7hi3VFMXUm-BdKcJMeD4XevHFsTJ_qBcEggWpUdMjMKl8VMv6HVCGAa19mchHaBGWis60DSnHkSGz0HoT_e3vfwVuGdkBXYLgPWGbfi9YGAMuiIa3DiMKTK94LljaxqOomx9sTfOH9Myzseosr8GUECQOsXTPjFxZdlqhckUkX_ml6Ta7iLU5VcbXp3c7kpr7kYq_9Tt5vsGYYgU0oHyDCC4b109Qb",
    summary: "One of Nigeria's most visible music stars, frequently at the center of public claims and fan debates.",
    wikipediaTitle: "Davido",
    influenceScore: 89,
    searchBias: 16,
    engagementScore: 77
  },
  {
    slug: "peter-obi",
    name: "Peter Obi",
    role: "Politician",
    country: "Nigeria",
    category: "Politics",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCBvlq7r8QMcG8MS0ysAF6w5rP4Ey6HFJ2g6Y60IYRPYzKTHU1ynA305EUXuP3pWcNCf4S4Q7DkU4RZWBqXwNl3TNwy6OAIV0kG7OSeX_VkXjNsd1aYVNU9LvoTzwmloCUaSgfTsTd-N-Qg3PsPaaJZrl8tXLmRJJu3j1DvGFfJdwWMj1rL8HA289x1_iOAMXQJZA98FkhbMxxZJJgpPB8axk3A4t8Sa8U_E3vtsTzI_GzFXMYxRIH_esRebWwqR6YaNkWhpp9B4eTS",
    summary: "Nigerian political leader closely tracked for governance and economic claims.",
    wikipediaTitle: "Peter Obi",
    influenceScore: 92,
    searchBias: 14,
    engagementScore: 81
  },
  {
    slug: "ursula-von-der-leyen",
    name: "Ursula von der Leyen",
    role: "President",
    country: "Global",
    category: "Governance",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuADxX9Ux-grLPRdWF9B1W2kTe8-OuCeAw-cCBwuEOb_fn0Fn_FavUk0AOi2fsfS92mlFud2MJJZYEVw6w2b5cePrIOhveMKdF49nRv3-fPbLNB289vzNRPoarvevndtGlmgTV9tEtTbSTwgeRxhmkRPqvLD1gVnhcueqeSyiimaXiu8VECHnswUTUeG1z-KTe_UTcNBYbFNCuP6OIc_71fQZznVHQHqbWxzBJTQa6GpNP6MbJpLSrBvm2FHylUOGtrt32hKPWrpyI3F",
    summary: "President of the European Commission and a recurring subject on global policy feeds.",
    wikipediaTitle: "Ursula von der Leyen",
    influenceScore: 88,
    searchBias: 8,
    engagementScore: 70
  },
  {
    slug: "elon-musk",
    name: "Elon Musk",
    role: "Founder",
    country: "USA",
    category: "Business",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Elon_Musk_%2854816836217%29_%28cropped_2%29_%28b%29.jpg/330px-Elon_Musk_%2854816836217%29_%28cropped_2%29_%28b%29.jpg",
    summary: "Founder and CEO whose public statements generate high-volume debate.",
    wikipediaTitle: "Elon Musk",
    influenceScore: 95,
    searchBias: 15,
    engagementScore: 88
  },
  {
    slug: "ruto",
    name: "William Ruto",
    role: "President",
    country: "Kenya",
    category: "Politics",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/de/William_Ruto_2023_%28cropped%29.jpg",
    summary: "President of Kenya, often central to policy and cost-of-living discussions.",
    wikipediaTitle: "William Ruto",
    influenceScore: 86,
    searchBias: 10,
    engagementScore: 74
  },
  {
    slug: "stonebwoy",
    name: "Stonebwoy",
    role: "Artist",
    country: "Ghana",
    category: "Music",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/43/Stonebwoy_in_2024.jpg",
    summary: "Ghanaian artist with strong social impact and brand visibility.",
    wikipediaTitle: "Stonebwoy",
    influenceScore: 80,
    searchBias: 9,
    engagementScore: 63
  },
  {
    slug: "ramaphosa",
    name: "Cyril Ramaphosa",
    role: "President",
    country: "South Africa",
    category: "Politics",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/59/President_Cyril_Ramaphosa_2024.jpg",
    summary: "South African president tracked across governance and economic discussions.",
    wikipediaTitle: "Cyril Ramaphosa",
    influenceScore: 85,
    searchBias: 10,
    engagementScore: 71
  },
  {
    slug: "narendra-modi",
    name: "Narendra Modi",
    role: "Prime Minister",
    country: "India",
    category: "Politics",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Prime_Minister_Shri_Narendra_Modi.jpg",
    summary: "Prime Minister of India with high news volume and cross-border attention.",
    wikipediaTitle: "Narendra Modi",
    influenceScore: 92,
    searchBias: 12,
    engagementScore: 82
  },
  {
    slug: "vinicius-junior",
    name: "Vinicius Junior",
    role: "Footballer",
    country: "Brazil",
    category: "Football",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/58/Vinicius_Junior_2021.jpg",
    summary: "Brazilian footballer whose public controversies and philanthropy travel fast.",
    wikipediaTitle: "Vinícius Júnior",
    influenceScore: 84,
    searchBias: 11,
    engagementScore: 69
  },
  {
    slug: "bukayo-saka",
    name: "Bukayo Saka",
    role: "Footballer",
    country: "UK",
    category: "Football",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Bukayo_Saka_2022.jpg",
    summary: "England footballer relevant to both UK and African audience discovery.",
    wikipediaTitle: "Bukayo Saka",
    influenceScore: 83,
    searchBias: 7,
    engagementScore: 68
  }
];

const users = [
  {
    walletAddress: "0x8ab2f1c04a5e1fB8d1c35A0B7f56B9D2A4D3F2d1",
    displayName: "LedgerScout",
    selectedCountry: "Nigeria"
  },
  {
    walletAddress: "0x12ce34A90d221E1cE033Adf8b5c9B8C4da30E3a1",
    displayName: "FactNorth",
    selectedCountry: "Global"
  }
];

const claims = [
  {
    body: "Promised to improve electricity supply nationwide within his first term.",
    sourceUrl: "https://www.vanguardngr.com/electricity-supply-promise",
    sourceDomain: "vanguardngr.com",
    sourceTitle: "Tinubu outlines electricity reform targets",
    sourcePreviewImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCRuf0ELYWo68GA8Xea85wcftRJI6lCivQGAQ_rnz0x69MO6myblTD-BAkJIzn5dAFt1as38kz2955I5kqwsN4ZWFJC1mwQho6puVdYJQ_ny5gSNgQAGE1lO1hhjEI3S0xUMcAg2U5f_xJQ52NiwY6G9Genrw-46DvHBK3YQDM8qcBEp-FrWf1Hy5vJ_pA6mS2kLOtV0UFE83NE0h6y0baeZA4Wm_YM71tkrrrTB_EnP2n4VngLBrUvhA_NtDN-VLs1q1Ea6sCwFVNQ",
    country: "Nigeria",
    category: "Politics",
    postedByWallet: users[0].walletAddress,
    likesCount: 120,
    dislikesCount: 88,
    commentsCount: 24,
    totalReactions: 208,
    earnedCusd: 14.56,
    createdAt: new Date(Date.now() - 2 * 3600000),
    figures: ["bola-ahmed-tinubu"]
  },
  {
    body: "The EU will commit €50 billion in reliable financial support for Ukraine until 2027.",
    sourceUrl: "https://www.euronews.com/eu-support-ukraine-2027",
    sourceDomain: "euronews.com",
    sourceTitle: "EU support package extends to 2027",
    country: "Global",
    category: "Governance",
    postedByWallet: users[1].walletAddress,
    likesCount: 432,
    dislikesCount: 42,
    commentsCount: 31,
    totalReactions: 474,
    earnedCusd: 28.1,
    createdAt: new Date(Date.now() - 5 * 3600000),
    figures: ["ursula-von-der-leyen"]
  },
  {
    body: "Burna Boy funded emergency food support for flood-displaced families in Bayelsa.",
    sourceUrl: "https://www.pulse.ng/burna-boy-flood-support",
    sourceDomain: "pulse.ng",
    sourceTitle: "Burna Boy backs Bayelsa relief effort",
    country: "Nigeria",
    category: "Music",
    postedByWallet: users[0].walletAddress,
    likesCount: 286,
    dislikesCount: 11,
    commentsCount: 18,
    totalReactions: 297,
    earnedCusd: 20.79,
    createdAt: new Date(Date.now() - 8 * 3600000),
    figures: ["burna-boy"]
  },
  {
    body: "Peter Obi said food inflation can be cut faster with local manufacturing incentives.",
    sourceUrl: "https://www.thisdaylive.com/peter-obi-food-inflation",
    sourceDomain: "thisdaylive.com",
    sourceTitle: "Peter Obi on inflation and local manufacturing",
    country: "Nigeria",
    category: "Politics",
    postedByWallet: users[1].walletAddress,
    likesCount: 188,
    dislikesCount: 39,
    commentsCount: 16,
    totalReactions: 227,
    earnedCusd: 15.89,
    createdAt: new Date(Date.now() - 14 * 3600000),
    figures: ["peter-obi"]
  },
  {
    body: "Davido launched a scholarship round for 300 students across three states.",
    sourceUrl: "https://guardian.ng/davido-scholarship-programme",
    sourceDomain: "guardian.ng",
    sourceTitle: "Davido expands youth education support",
    country: "Nigeria",
    category: "Music",
    postedByWallet: users[0].walletAddress,
    likesCount: 351,
    dislikesCount: 9,
    commentsCount: 40,
    totalReactions: 360,
    earnedCusd: 25.2,
    createdAt: new Date(Date.now() - 22 * 3600000),
    figures: ["davido"]
  }
];

const notifications = [
  {
    type: "reaction",
    title: "Your Tinubu claim is trending",
    body: "208 paid reactions landed on your post in the last 2 hours."
  },
  {
    type: "reward",
    title: "Reward balance increased",
    body: "You earned 1.42 cUSD from new reactions this morning."
  },
  {
    type: "watch",
    title: "New claim on Burna Boy",
    body: "A fresh sourced claim was added to Burna Boy's wall."
  }
];

async function main() {
  await prisma.notification.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.claimFigure.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.figure.deleteMany();
  await prisma.user.deleteMany();

  const userRecords = {};

  for (const user of users) {
    const record = await prisma.user.create({ data: user });
    userRecords[user.walletAddress] = record;
  }

  const figureRecords = {};

  for (const figure of figures) {
    const record = await prisma.figure.create({ data: figure });
    figureRecords[figure.slug] = record;
  }

  for (const claim of claims) {
    const creator = userRecords[claim.postedByWallet];
    const createdClaim = await prisma.claim.create({
      data: {
        body: claim.body,
        sourceUrl: claim.sourceUrl,
        sourceDomain: claim.sourceDomain,
        sourceTitle: claim.sourceTitle,
        sourcePreviewImageUrl: claim.sourcePreviewImageUrl,
        country: claim.country,
        category: claim.category,
        postedByWallet: claim.postedByWallet,
        likesCount: claim.likesCount,
        dislikesCount: claim.dislikesCount,
        commentsCount: claim.commentsCount,
        totalReactions: claim.totalReactions,
        earnedCusd: claim.earnedCusd,
        createdAt: claim.createdAt,
        creatorId: creator.id
      }
    });

    for (const [index, figureSlug] of claim.figures.entries()) {
      await prisma.claimFigure.create({
        data: {
          claimId: createdClaim.id,
          figureId: figureRecords[figureSlug].id,
          primaryFigure: index === 0
        }
      });
    }

    for (let index = 0; index < Math.min(claim.totalReactions, 12); index += 1) {
      const amount = 0.01;
      await prisma.reaction.create({
        data: {
          claimId: createdClaim.id,
          userId: creator.id,
          type: index < Math.min(claim.likesCount, 6) ? "LIKE" : "DISLIKE",
          amountCusd: amount,
          creatorShareCusd: amount * 0.7,
          platformShareCusd: amount * 0.3
        }
      });
    }
  }

  for (const notification of notifications) {
    await prisma.notification.create({
      data: {
        ...notification,
        userId: userRecords[users[0].walletAddress].id
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
