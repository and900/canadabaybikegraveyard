-- Reporting categories. Every tag made so far is a bike, so the category defaults to 'bikes'.
ALTER TABLE "tags" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'bikes';

-- A problem is now text, a key of PROBLEMS in packages/shared/src/config.ts, as the operator is: each category has its
-- own problems, and adding one should need no migration. The values already stored are unchanged.
ALTER TABLE "tags" ALTER COLUMN "problem" TYPE TEXT USING "problem"::text;

-- DropEnum
DROP TYPE "problem";
