# ProcessCanvas v1.0.0 release checklist

- [ ] CI is green on the release commit.
- [ ] Production environment variables are configured with a strong PostgreSQL password and HTTPS URLs.
- [ ] PostgreSQL backups and restore procedure are tested.
- [ ] Frontend and backend container images build from the exact release commit.
- [ ] `/health` and `/ready` are monitored independently.
- [ ] Database migrations are tested on a production-like copy.
- [ ] RU/EN, authentication, autosave, offline recovery, import/export, templates, versions and simulation pass browser QA.
- [ ] 1366×768, 850×700, dark mode and reduced motion pass visual QA.
- [ ] Real product screenshots are added to `docs/screenshots`.
- [ ] No `.env`, credentials, test artifacts or user data are tracked by Git.
- [ ] Deployment rollback steps are written for the selected hosting provider.
- [ ] Create the `v1.0.0` tag and GitHub Release only after explicit owner approval.
