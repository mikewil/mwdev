# HostGator deployment discovery

Astro is configured for static output in `dist/`, which can be copied to the document root for the portfolio domain. HostGator documents secure SFTP access for supported Linux plans, with plan-dependent ports; some plans have no SFTP access. Confirm the account details in the HostGator portal before choosing a publisher.

Before adding a production workflow, record:

- Hosting plan and operating system (Linux or Windows).
- The domain’s document root (often `public_html` for a primary cPanel domain, but verify it for this account).
- Whether SFTP or FTPS is available and the correct host, port, and path.
- A dedicated upload account restricted to the site document root.
- The GitHub environment and secret names for the transfer credentials.

Use a deploy workflow that builds the static site and transfers only `dist/`. Keep the production credential out of the issue worker, local config, workflow logs, and Git history. Add production publishing after the account-specific facts above are confirmed.

HostGator reference: [Secure FTP, SFTP and FTPS](https://www.hostgator.com/help/article/secure-ftp-sftp-and-ftps), [SSH access](https://www.hostgator.com/help/article/how-do-i-get-and-use-ssh-access), [public_html](https://www.hostgator.com/help/article/public-html-folder).
