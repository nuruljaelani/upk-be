export class ApiResponse {
  static success(res, data, message = "Request successful", statusCode = 200) {
    return res.status(statusCode).json({
      status: "success",
      message,
      data,
    });
  }

  static created(res, data, message = "Resource created successfully") {
    return this.success(res, data, message, 201);
  }

  static paginated(res, data, pagination, message = "Request successful", statusCode = 200) {
    return res.status(statusCode).json({
      status: "success",
      message,
      data,
      meta: pagination,
    });
  }

  static error(res, message = "An error occurred", statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      status: "error",
      message,
      errors: errors || undefined,
    });
  }
}
