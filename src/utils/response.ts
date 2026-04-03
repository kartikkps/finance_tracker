// Standardized API response helpers

export const successResponse = <T>(data: T, message = 'Success') => ({
  success: true,
  message,
  data,
});

export const paginatedResponse = <T>(
  data: T[],
  meta: { page: number; limit: number; total: number }
) => ({
  success: true,
  data,
  meta: {
    ...meta,
    totalPages: Math.ceil(meta.total / meta.limit),
  },
});

export const errorResponse = (message: string, errors?: unknown) => ({
  success: false,
  message,
  ...(errors ? { errors } : {}),
});
