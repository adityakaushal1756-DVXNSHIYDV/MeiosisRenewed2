function getErrorMessage(error) {
  return String(error?.message || '');
}

function isDatabaseTimeout(error) {
  return error?.code === 'DB_TIMEOUT';
}

function isDatabaseUnavailableError(error) {
  const message = getErrorMessage(error);
  return (
    isDatabaseTimeout(error) ||
    /Can't reach database server/i.test(message) ||
    /\bP1001\b/i.test(message) ||
    /\bP1002\b/i.test(message) ||
    /\bETIMEDOUT\b/i.test(message) ||
    /\bECONNREFUSED\b/i.test(message) ||
    /\bConnection terminated\b/i.test(message)
  );
}

function getDatabaseErrorPayload(error) {
  if (isDatabaseTimeout(error)) {
    return {
      status: 503,
      error: 'Database is taking too long to respond. Please try again in a moment.',
    };
  }

  if (isDatabaseUnavailableError(error)) {
    return {
      status: 503,
      error: 'Backend is running, but the database is unavailable right now.',
    };
  }

  return null;
}

module.exports = {
  getDatabaseErrorPayload,
  isDatabaseUnavailableError,
};
