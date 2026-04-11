import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@example.com",
      passwordHash,
      city: "Portland, OR",
      isAdmin: true,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@example.com",
      passwordHash,
      city: "Seattle, WA",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {},
    create: {
      name: "Charlie Davis",
      email: "charlie@example.com",
      passwordHash,
      city: "San Francisco, CA",
    },
  });

  const post1 = await prisma.shoePost.create({
    data: {
      userId: alice.id,
      type: "LOST",
      title: "Lost left Nike Air Max 90 - Black",
      description:
        "Lost my left Nike Air Max 90 in black at Pioneer Courthouse Square. It fell out of my bag while catching the MAX. Size 9, slightly worn sole but otherwise great condition.",
      brand: "Nike",
      model: "Air Max 90",
      category: "SNEAKER",
      size: "9",
      primaryColor: "Black",
      secondaryColor: "White",
      side: "LEFT",
      genderCategory: "Men",
      condition: "GOOD",
      locationText: "Portland, OR - Pioneer Courthouse Square",
      dateOccurred: new Date("2025-03-15"),
      status: "OPEN",
      images: {
        create: {
          imageUrl: "/placeholder-shoe.svg",
          sortOrder: 0,
          isPrimary: true,
        },
      },
    },
  });

  const post2 = await prisma.shoePost.create({
    data: {
      userId: bob.id,
      type: "FOUND",
      title: "Found right Nike Air Max - Black/White",
      description:
        "Found a right Nike Air Max near the waterfront in Portland. Black with white sole, size looks like 9 or 9.5. Was sitting on a bench near the food carts.",
      brand: "Nike",
      model: "Air Max",
      category: "SNEAKER",
      size: "9",
      primaryColor: "Black",
      secondaryColor: "White",
      side: "RIGHT",
      genderCategory: "Men",
      condition: "GOOD",
      locationText: "Portland, OR - Waterfront",
      dateOccurred: new Date("2025-03-16"),
      status: "OPEN",
      images: {
        create: {
          imageUrl: "/placeholder-shoe.svg",
          sortOrder: 0,
          isPrimary: true,
        },
      },
    },
  });

  await prisma.shoePost.create({
    data: {
      userId: charlie.id,
      type: "LOST",
      title: "Lost right Converse Chuck Taylor - Red",
      description:
        "Lost my right red Converse Chuck Taylor High Top at Golden Gate Park. Was playing frisbee and left it behind.",
      brand: "Converse",
      model: "Chuck Taylor All Star",
      category: "SNEAKER",
      size: "10",
      primaryColor: "Red",
      side: "RIGHT",
      genderCategory: "Unisex",
      condition: "FAIR",
      locationText: "San Francisco, CA - Golden Gate Park",
      dateOccurred: new Date("2025-03-10"),
      status: "OPEN",
      images: {
        create: {
          imageUrl: "/placeholder-shoe.svg",
          sortOrder: 0,
          isPrimary: true,
        },
      },
    },
  });

  await prisma.shoePost.create({
    data: {
      userId: bob.id,
      type: "FOUND",
      title: "Found left Adidas Superstar - White/Black",
      description:
        "Found a left Adidas Superstar in white with black stripes on the bus. Looks barely worn, maybe size 8.",
      brand: "Adidas",
      model: "Superstar",
      category: "SNEAKER",
      size: "8",
      primaryColor: "White",
      secondaryColor: "Black",
      side: "LEFT",
      condition: "LIKE_NEW",
      locationText: "Seattle, WA - Metro Bus Route 40",
      dateOccurred: new Date("2025-03-20"),
      status: "OPEN",
      images: {
        create: {
          imageUrl: "/placeholder-shoe.svg",
          sortOrder: 0,
          isPrimary: true,
        },
      },
    },
  });

  await prisma.shoePost.create({
    data: {
      userId: alice.id,
      type: "LOST",
      title: "Lost right brown leather boot",
      description:
        "Lost my right Timberland boot while moving apartments. Brown leather, well-worn but sturdy.",
      brand: "Timberland",
      model: "6-Inch Premium",
      category: "BOOT",
      size: "10",
      primaryColor: "Brown",
      side: "RIGHT",
      genderCategory: "Men",
      condition: "WORN",
      locationText: "Portland, OR - Southeast Division",
      dateOccurred: new Date("2025-03-08"),
      reward: "$20",
      status: "OPEN",
      images: {
        create: {
          imageUrl: "/placeholder-shoe.svg",
          sortOrder: 0,
          isPrimary: true,
        },
      },
    },
  });

  // Create an AI match suggestion between the two Nike posts
  await prisma.matchSuggestion.create({
    data: {
      sourcePostId: post1.id,
      candidatePostId: post2.id,
      score: 85,
      explanation:
        "Same brand (Nike Air Max), opposite sides (Left/Right), same size (9), matching colors (Black/White), both in Portland area, posted within 1 day of each other.",
      status: "SUGGESTED",
    },
  });

  console.log("Seed data created successfully!");
  console.log("Users: alice@example.com, bob@example.com, charlie@example.com");
  console.log("Password for all: password123");
  console.log("Alice is an admin user.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
