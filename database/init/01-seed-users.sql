-- Seed initial users for Family Expense Tracker
-- This script runs automatically when PostgreSQL starts for the first time

-- Insert Leo
INSERT INTO "Users" ("Id", "Name", "Slug", "Initial", "Color", "CreatedAt")
VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Leo',
    'leo',
    'L',
    '#6366f1',
    '2024-01-01 00:00:00+00'::timestamptz
)
ON CONFLICT ("Id") DO NOTHING;

-- Insert Anto
INSERT INTO "Users" ("Id", "Name", "Slug", "Initial", "Color", "CreatedAt")
VALUES (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Anto',
    'anto',
    'A',
    '#ec4899',
    '2024-01-01 00:00:00+00'::timestamptz
)
ON CONFLICT ("Id") DO NOTHING;
