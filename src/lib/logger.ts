import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
  base: {
    env: process.env.NODE_ENV,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Helper functions for common log patterns
export const log = {
  // API request logging
  apiRequest: (method: string, path: string, userId?: string) => {
    logger.info({ type: "api_request", method, path, userId }, `${method} ${path}`);
  },

  // API response logging
  apiResponse: (method: string, path: string, status: number, duration: number) => {
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    logger[level](
      { type: "api_response", method, path, status, duration },
      `${method} ${path} ${status} ${duration}ms`
    );
  },

  // Processing events
  processingStart: (meetingId: string, title: string) => {
    logger.info(
      { type: "processing_start", meetingId, title },
      `Processing started: ${title}`
    );
  },

  processingComplete: (meetingId: string, title: string, duration: number) => {
    logger.info(
      { type: "processing_complete", meetingId, title, duration },
      `Processing completed: ${title} (${duration}ms)`
    );
  },

  processingError: (meetingId: string, error: Error | string) => {
    logger.error(
      { type: "processing_error", meetingId, error: error instanceof Error ? error.message : error },
      `Processing failed: ${error instanceof Error ? error.message : error}`
    );
  },

  // Transcription events
  transcriptionStart: (meetingId: string) => {
    logger.info({ type: "transcription_start", meetingId }, "Transcription started");
  },

  transcriptionComplete: (meetingId: string, utteranceCount: number, speakerCount: number) => {
    logger.info(
      { type: "transcription_complete", meetingId, utteranceCount, speakerCount },
      `Transcription completed: ${utteranceCount} utterances, ${speakerCount} speakers`
    );
  },

  // Analysis events
  analysisStart: (meetingId: string) => {
    logger.info({ type: "analysis_start", meetingId }, "AI analysis started");
  },

  analysisComplete: (meetingId: string, topicCount: number, actionItemCount: number) => {
    logger.info(
      { type: "analysis_complete", meetingId, topicCount, actionItemCount },
      `Analysis completed: ${topicCount} topics, ${actionItemCount} action items`
    );
  },

  // Auth events
  authLogin: (email: string, success: boolean, ip?: string) => {
    const level = success ? "info" : "warn";
    logger[level](
      { type: "auth_login", email, success, ip },
      `Login ${success ? "successful" : "failed"}: ${email}`
    );
  },

  authLogout: (email: string) => {
    logger.info({ type: "auth_logout", email }, `Logout: ${email}`);
  },

  // Rate limiting
  rateLimitExceeded: (ip: string, endpoint: string) => {
    logger.warn(
      { type: "rate_limit_exceeded", ip, endpoint },
      `Rate limit exceeded: ${ip} on ${endpoint}`
    );
  },

  // File operations
  fileUpload: (filename: string, size: number, userId: string) => {
    logger.info(
      { type: "file_upload", filename, size, userId },
      `File uploaded: ${filename} (${Math.round(size / 1024)}KB)`
    );
  },

  fileDelete: (filename: string, userId: string) => {
    logger.info({ type: "file_delete", filename, userId }, `File deleted: ${filename}`);
  },

  // Export events
  exportGenerated: (meetingId: string, format: string) => {
    logger.info(
      { type: "export_generated", meetingId, format },
      `Export generated: ${format}`
    );
  },

  // Generic error logging
  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => {
    logger.error(
      {
        type: "error",
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        ...context,
      },
      message
    );
  },

  // Debug logging
  debug: (message: string, context?: Record<string, unknown>) => {
    logger.debug({ type: "debug", ...context }, message);
  },
};

export default logger;
