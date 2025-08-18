class ApiResponse {
    constructor(statusCode, data, message = "Success", meta = null) {
      this.statusCode = statusCode;
      this.success = statusCode >= 200 && statusCode < 300;
      this.message = message;
      this.data = data || null;
      this.meta = meta || null; // Useful for pagination or extra info
    }
  }
  
  export { ApiResponse };
  