// Toplam kayıt, sayfa boyutu ve sayfa numarası alır; Math.ceil ile sayfa sayısını ve gezinme bayraklarını döndürür.
export const calculatePaginationData = (count, perPage, page) => {
  const totalPages = Math.ceil(count / perPage);

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    page,
    perPage,
    totalItems: count,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
};
