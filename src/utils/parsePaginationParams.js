// Query’den page/perPage alır; pozitif güvenli tamsayı değilse 1/10 varsayılanlarıyla nesne döndürür.
const parseNumber = (value, defaultValue) => {
  if (typeof value !== 'string') return defaultValue;

  const parsedNumber = Number(value);

  if (!Number.isSafeInteger(parsedNumber) || parsedNumber < 1)
    return defaultValue;

  return parsedNumber;
};

export const parsePaginationParams = (query) => {
  const { page, perPage } = query;

  return {
    page: parseNumber(page, 1),
    perPage: parseNumber(perPage, 10),
  };
};
