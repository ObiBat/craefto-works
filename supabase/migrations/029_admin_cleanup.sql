-- The admin cleanup (October 2026): the tools that were never used, or were
-- replaced by the client portal, Lead Engine and Ask Craefto, leave the
-- database. Every table was exported first (5 October 2026, to
-- "Craefto backups/2026-10-05 admin cleanup" on Obi's Mac).
--
-- No kept table, view or function refers to these. They're dropped without
-- CASCADE so anything unexpected stops the migration instead of going too.

-- Proposals and documents (the DocuSeal signing flow), and invoices.
drop table if exists public.document_signatures;
drop table if exists public.document_versions;
drop table if exists public.document_activities;
drop table if exists public.invoices;
drop table if exists public.documents;

-- Projects, clients, finances and team (the April operations tools), and the
-- lead "intelligence" analysis.
drop table if exists public.time_logs;
drop table if exists public.project_assignments;
drop table if exists public.milestones;
drop table if exists public.tasks;
drop table if exists public.projects;
drop table if exists public.contractors;
drop table if exists public.clients;
drop table if exists public.lead_analysis;

-- The old client portal (its pages went in September; the new portal uses
-- the client_* tables).
drop table if exists public.portal_timeline_events;
drop table if exists public.portal_request_replies;
drop table if exists public.portal_requests;
drop table if exists public.portal_invoices;
drop table if exists public.portal_documents;
drop table if exists public.portal_updates;
drop table if exists public.portal_team_members;
drop table if exists public.portal_tasks;
drop table if exists public.portal_projects;
drop table if exists public.portal_users;

-- The journal's content agents (last run January 2026). The journal stays.
drop table if exists public.content_reviews;
drop table if exists public.content_drafts;
drop table if exists public.content_briefs;
drop table if exists public.content_insights;
drop table if exists public.content_queue;
drop table if exists public.content_agent_runs;
drop table if exists public.agent_feedback;

-- Never used: article A/B tests, and a performance table nothing filled
-- (journal reading figures now come from article_views).
drop table if exists public.article_ab_tests;
drop table if exists public.article_performance;
