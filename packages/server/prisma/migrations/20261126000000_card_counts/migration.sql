-- How many open cards are made and opened, by design and day. Counts only: no names, no addresses.

-- CreateTable
CREATE TABLE "card_counts" (
    "day" DATE NOT NULL,
    "style" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "card_counts_pkey" PRIMARY KEY ("day", "style", "event")
);
