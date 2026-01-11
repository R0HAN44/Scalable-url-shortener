export const generateMockDataForLinkDetail = () => {
  const link = {
    id: 1,
    short_code: 'abc123',
    original_url: 'https://example.com/very-long-url-path/article/12345',
    title: 'Product Launch Campaign',
    is_active: true,
    expires_at: null,
    total_clicks: 1847,
    created_at: '2025-01-01T10:00:00Z'
  };

  const dailyStats = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toISOString(),
    total_clicks: Math.floor(Math.random() * 200) + 50,
    unique_ips: Math.floor(Math.random() * 150) + 30
  }));

  const analytics = {
    byDevice: [
      { device: 'desktop', clicks: 892 },
      { device: 'mobile', clicks: 743 },
      { device: 'tablet', clicks: 187 },
      { device: 'other', clicks: 25 }
    ],
    byCountry: [
      { country_code: 'US', clicks: 634 },
      { country_code: 'GB', clicks: 298 },
      { country_code: 'CA', clicks: 245 },
      { country_code: 'AU', clicks: 187 },
      { country_code: 'DE', clicks: 156 }
    ],
    byBrowser: [
      { browser: 'Chrome', clicks: 982 },
      { browser: 'Safari', clicks: 456 },
      { browser: 'Firefox', clicks: 234 },
      { browser: 'Edge', clicks: 175 }
    ]
  };

  return { link, dailyStats, analytics };
};