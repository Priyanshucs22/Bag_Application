const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * XSS Protection middleware to replace deprecated xss-clean
 */
const xssProtection = () => {
  return (req, res, next) => {
    // Clean request body
    if (req.body && typeof req.body === 'object') {
      req.body = cleanObject(req.body);
    }

    // Clean query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = cleanObject(req.query);
    }

    // Clean URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = cleanObject(req.params);
    }

    next();
  };
};

/**
 * Recursively clean an object
 */
function cleanObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item));
  }

  if (typeof obj === 'object') {
    const cleaned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cleaned[key] = cleanObject(obj[key]);
      }
    }
    return cleaned;
  }

  return obj;
}

module.exports = xssProtection;
