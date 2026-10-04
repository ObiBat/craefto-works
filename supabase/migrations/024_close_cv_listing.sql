-- Found while preparing the move to Sydney (4 October 2026): the
-- public_read_job_applications policy let anyone holding the site's public key
-- list the job-applications bucket, and so find and open every applicant's
-- CV and cover letter. Nothing needs it: uploads use signed upload URLs
-- (api/careers/upload-url), and the admin and the notification email open
-- files by their public URL, which a public bucket serves without any policy.

drop policy if exists "public_read_job_applications" on storage.objects;
