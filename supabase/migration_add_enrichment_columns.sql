-- Migration: Add AI enrichment columns to slides table
-- Run this in your Supabase project: SQL Editor > New query > paste & run

ALTER TABLE slides
  ADD COLUMN IF NOT EXISTS ai_extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending';
