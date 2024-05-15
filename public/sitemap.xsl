<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>Sitemap — e-pdf.bg</title>
        <meta charset="utf-8"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; color: #333; }
          header { background: #2563eb; color: #fff; padding: 24px 40px; }
          header h1 { font-size: 22px; font-weight: 700; }
          header p { font-size: 14px; opacity: 0.85; margin-top: 4px; }
          .container { max-width: 1100px; margin: 32px auto; padding: 0 20px; }
          .stats { display: flex; gap: 16px; margin-bottom: 24px; }
          .stat { background: #fff; border-radius: 8px; padding: 14px 20px; box-shadow: 0 1px 4px rgba(0,0,0,.08); flex: 1; }
          .stat strong { display: block; font-size: 24px; color: #2563eb; }
          .stat span { font-size: 13px; color: #666; }
          table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
          thead { background: #2563eb; color: #fff; }
          thead th { padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; letter-spacing: .03em; }
          tbody tr:nth-child(odd) { background: #f8f9fa; }
          tbody tr:hover { background: #e8f0fe; }
          td { padding: 10px 16px; font-size: 13px; border-bottom: 1px solid #eee; vertical-align: middle; }
          td a { color: #2563eb; text-decoration: none; }
          td a:hover { text-decoration: underline; }
          .priority { font-weight: 700; }
          .p-high { color: #16a34a; }
          .p-mid { color: #d97706; }
          .p-low { color: #9ca3af; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          .badge-bg { background: #dbeafe; color: #1d4ed8; }
          .badge-en { background: #dcfce7; color: #15803d; }
          footer { text-align: center; padding: 24px; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <header>
          <h1>🗺 Sitemap — e-pdf.bg</h1>
          <p>XML Sitemap с всички индексирани URL адреси</p>
        </header>
        <div class="container">
          <div class="stats">
            <div class="stat">
              <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong>
              <span>Общо URL адреса</span>
            </div>
            <div class="stat">
              <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url[contains(sitemap:loc, 'e-pdf.bg/en')])"/></strong>
              <span>English (EN)</span>
            </div>
            <div class="stat">
              <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url[not(contains(sitemap:loc, '/en'))])"/></strong>
              <span>Bulgarian (BG)</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>URL</th>
                <th>Език</th>
                <th>Приоритет</th>
                <th>Промяна</th>
                <th>Последна промяна</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <xsl:variable name="loc" select="sitemap:loc"/>
                <xsl:variable name="pri" select="sitemap:priority"/>
                <tr>
                  <td><xsl:value-of select="position()"/></td>
                  <td><a href="{$loc}"><xsl:value-of select="$loc"/></a></td>
                  <td>
                    <xsl:choose>
                      <xsl:when test="contains($loc, '/en')">
                        <span class="badge badge-en">EN</span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="badge badge-bg">BG</span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                  <td>
                    <xsl:attribute name="class">
                      <xsl:choose>
                        <xsl:when test="$pri >= 0.9">priority p-high</xsl:when>
                        <xsl:when test="$pri >= 0.6">priority p-mid</xsl:when>
                        <xsl:otherwise>priority p-low</xsl:otherwise>
                      </xsl:choose>
                    </xsl:attribute>
                    <xsl:value-of select="$pri"/>
                  </td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td><xsl:value-of select="sitemap:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
        <footer>e-pdf.bg Sitemap · <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs</footer>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
