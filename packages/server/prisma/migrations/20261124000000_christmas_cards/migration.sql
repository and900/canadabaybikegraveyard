-- Christmas cards: one shared card, and a recipient for each link. Separate from the map's tables.

-- CreateTable
CREATE TABLE "card_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT NOT NULL,
    "signoff" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'midnight',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "card_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "card_settings_one_row" CHECK ("id" = 1)
);

-- CreateTable
CREATE TABLE "card_recipients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "greeting" TEXT,
    "message" TEXT,
    "opened_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "card_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_recipients_code_key" ON "card_recipients"("code");

-- The one settings row, so the card has words before the first edit.
INSERT INTO "card_settings" ("id", "message", "signoff")
VALUES (1, E'Merry Christmas and a Happy New Year!\n\nHope you have an enjoyable Christmas and a prosperous new year.', 'With love, Andrew and Margaret');
