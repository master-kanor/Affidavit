/**
 * Credentials Validation Test
 * Validates all extracted credentials from Excel file
 */

import { describe, it, expect } from 'vitest';

describe('Credentials Validation', () => {
  it('should have all required environment variables set', () => {
    const requiredEnvs = [
      'SUPABASE_STORAGE_URL',
      'GITHUB_TOKEN',
      'OPENROUTER_API_KEY',
      'HUGGING_FACE_TOKEN',
      'NOTION_URL',
      'CLOUDFLARE_R2_BUCKET_URL',
      'CLOUDFLARE_METRICS_URL',
      'TELEGRAM_BOT_TOKEN',
    ];

    requiredEnvs.forEach((env) => {
      expect(import.meta.env[env], `${env} should be defined`).toBeDefined();
    });
  });

  it('should have valid Supabase Storage URL format', () => {
    const url = import.meta.env.VITE_SUPABASE_STORAGE_URL || import.meta.env.SUPABASE_STORAGE_URL;
    expect(url).toMatch(/https:\/\/.*\.storage\.supabase\.co/);
  });

  it('should have valid GitHub token format', () => {
    const token = import.meta.env.GITHUB_TOKEN;
    expect(token).toMatch(/^ghp_/);
  });

  it('should have valid OpenRouter API key format', () => {
    const key = import.meta.env.OPENROUTER_API_KEY;
    expect(key).toMatch(/^sk-or-v1-/);
  });

  it('should have valid Hugging Face token format', () => {
    const token = import.meta.env.HUGGING_FACE_TOKEN;
    expect(token).toMatch(/^hf_/);
  });

  it('should have valid Notion URL format', () => {
    const url = import.meta.env.NOTION_URL;
    expect(url).toMatch(/https:\/\/app\.notion\.com/);
  });

  it('should have valid Cloudflare R2 bucket URL format', () => {
    const url = import.meta.env.CLOUDFLARE_R2_BUCKET_URL;
    expect(url).toMatch(/https:\/\/.*\.r2\.cloudflarestorage\.com/);
  });

  it('should have valid Telegram bot token format', () => {
    const token = import.meta.env.TELEGRAM_BOT_TOKEN;
    expect(token).toMatch(/^\d+:AA[A-Za-z0-9_-]{25,}/);
  });

  it('should validate credential structure', () => {
    const credentials = {
      supabase_storage: import.meta.env.SUPABASE_STORAGE_URL,
      github: import.meta.env.GITHUB_TOKEN,
      openrouter: import.meta.env.OPENROUTER_API_KEY,
      huggingface: import.meta.env.HUGGING_FACE_TOKEN,
      notion: import.meta.env.NOTION_URL,
      cloudflare_r2: import.meta.env.CLOUDFLARE_R2_BUCKET_URL,
      cloudflare_metrics: import.meta.env.CLOUDFLARE_METRICS_URL,
      telegram: import.meta.env.TELEGRAM_BOT_TOKEN,
    };

    Object.entries(credentials).forEach(([key, value]) => {
      expect(value, `${key} should not be empty`).toBeTruthy();
      expect(typeof value, `${key} should be a string`).toBe('string');
    });
  });
});
