(function () {
  const countries = [
    { name: 'United States', slug: 'usa', flag: '🇺🇸' },
    { name: 'Canada', slug: 'canada', flag: '🇨🇦' },
    { name: 'Brazil', slug: 'brazil', flag: '🇧🇷' },
    { name: 'Mexico', slug: 'mexico', flag: '🇲🇽' },
    { name: 'United Kingdom', slug: 'uk', flag: '🇬🇧' },
    { name: 'France', slug: 'france', flag: '🇫🇷' },
    { name: 'Germany', slug: 'germany', flag: '🇩🇪' },
    { name: 'Spain', slug: 'spain', flag: '🇪🇸' },
    { name: 'Italy', slug: 'italy', flag: '🇮🇹' },
    { name: 'Nigeria', slug: 'nigeria', flag: '🇳🇬' },
    { name: 'South Africa', slug: 'south-africa', flag: '🇿🇦' },
    { name: 'Egypt', slug: 'egypt', flag: '🇪🇬' },
    { name: 'Saudi Arabia', slug: 'saudi-arabia', flag: '🇸🇦' },
    { name: 'India', slug: 'india', flag: '🇮🇳' },
    { name: 'China', slug: 'china', flag: '🇨🇳' },
    { name: 'Japan', slug: 'japan', flag: '🇯🇵' },
    { name: 'Australia', slug: 'australia', flag: '🇦🇺' },
    { name: 'New Zealand', slug: 'new-zealand', flag: '🇳🇿' },
    { name: 'Argentina', slug: 'argentina', flag: '🇦🇷' },
    { name: 'Chile', slug: 'chile', flag: '🇨🇱' },
    { name: 'Russia', slug: 'russia', flag: '🇷🇺' },
    { name: 'Sweden', slug: 'sweden', flag: '🇸🇪' },
    { name: 'Norway', slug: 'norway', flag: '🇳🇴' },
    { name: 'Finland', slug: 'finland', flag: '🇫🇮' }
  ];

  const bySlug = countries.reduce((acc, country) => {
    acc[country.slug] = country;
    return acc;
  }, {});

  const slugByName = countries.reduce((acc, country) => {
    acc[country.name] = country.slug;
    return acc;
  }, {});

  window.countryData = countries;
  window.countryBySlug = bySlug;
  window.countrySlugByName = slugByName;
})();
