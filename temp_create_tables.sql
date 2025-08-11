CREATE TABLE IF NOT EXISTS call_transcriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id VARCHAR NOT NULL REFERENCES calls(id),
  speaker TEXT NOT NULL,
  transcript TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  confidence REAL,
  duration INTEGER,
  audio_segment_url TEXT
);

CREATE TABLE IF NOT EXISTS call_recordings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id VARCHAR NOT NULL REFERENCES calls(id),
  recording_url TEXT NOT NULL,
  mp4_url TEXT,
  duration INTEGER,
  file_size INTEGER,
  conversion_status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
