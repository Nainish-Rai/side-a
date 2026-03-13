ALTER TABLE "DeviceLibraryState"
ADD COLUMN "playlists" JSONB NOT NULL DEFAULT '[]';
