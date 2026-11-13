const parseNumber = (value) => {
  if (typeof value !== 'string') return;

  if (value.trim() === '') return;

  const parsedNumber = Number(value);

  if (!Number.isFinite(parsedNumber)) return;

  return parsedNumber;
};

const parseGender = (gender) => {
  if (typeof gender !== 'string') return;

  const allowedGenders = ['male', 'female', 'other'];

  if (!allowedGenders.includes(gender)) return;

  return gender;
};

export const parseFilterParams = (query) => {
  const { minAge, maxAge, gender, minAvgMark, maxAvgMark } = query;

  return {
    minAge: parseNumber(minAge),
    maxAge: parseNumber(maxAge),
    gender: parseGender(gender),
    minAvgMark: parseNumber(minAvgMark),
    maxAvgMark: parseNumber(maxAvgMark),
  };
};
