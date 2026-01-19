const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'e-ledger-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// If we're not in production then log to the `console` with the format:
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(err.stack);

  // Send appropriate response based on error type
  switch (err.name) {
    case 'ValidationError':
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: err.message,
        details: err.details || null
      });
      
    case 'UnauthorizedError':
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Access denied. Invalid or expired token.'
      });
      
    case 'NotFoundError':
      return res.status(404).json({ 
        error: 'Not Found', 
        message: err.message 
      });
      
    case 'DuplicateError':
      return res.status(409).json({ 
        error: 'Conflict', 
        message: err.message 
      });
      
    case 'BadRequestError':
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: err.message 
      });
      
    default:
      // For unknown errors, return a generic message in production
      const isProd = process.env.NODE_ENV === 'production';
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: isProd ? 'An unexpected error occurred' : err.message
      });
  }
};

module.exports = errorHandler;