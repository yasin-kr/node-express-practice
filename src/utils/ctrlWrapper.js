// Controller alıp async middleware döndürür; reddedilen Promise/hataları next(err) ile errorHandler’a aktarır.
export const ctrlWrapper = (controller) => {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};
