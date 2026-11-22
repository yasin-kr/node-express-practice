// Router cevap üretmez ve hata iletmezse en sonda çalışır; eşleşmeyen rotaya 404 JSON yanıtı verir.
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
};
