# Website Visual Verification Findings

The public landing page now presents a neutral, anonymized case portal and shows verified source metrics: 12 official source pages, 393 source images, and an 87-page dossier. The location remains visible as Tacloban City, Leyte, 6500; protected person names are not shown in the public page copy.

The `/dossier` gallery view renders nine YouTube thumbnails from the extracted source manifest, identifies the source pages as 21 and 24–26, and provides an original-source link to the Google Drive evidence folder. The page remains usable when the live Supabase evidence query returns no records: the source-linked gallery still renders and the dynamic evidence area shows a clear empty state rather than a blank page.

The screenshot also confirms that the existing footer statistic `331+` and the `100% Verified Chain of Custody` label remain stale dashboard copy; these are not used as evidence claims in the new source-linked gallery and should remain a follow-up UI cleanup item until backed by live data.
