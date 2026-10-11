export class ApiResponse {
  constructor(statusCode, message = 'Success', data = null, meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    if (data !== null && data !== undefined) {
      this.data = data;
    }
    if (meta !== null && meta !== undefined) {
      this.meta = meta;
    }
  }

  static success(res, message = 'Success', data = null, meta = null, statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data, meta));
  }

  static created(res, message = 'Resource created successfully', data = null) {
    return res.status(201).json(new ApiResponse(201, message, data));
  }

  static noContent(res) {
    return res.status(204).send();
  }
}
