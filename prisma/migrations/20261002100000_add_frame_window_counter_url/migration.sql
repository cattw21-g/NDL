ALTER TABLE "RecordSubmission" ADD COLUMN "frameWindowCounterRequested" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Record" ADD COLUMN "frameWindowCounterUrl" TEXT;
