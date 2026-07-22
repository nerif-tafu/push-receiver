const axios = require('axios');

module.exports = sendRequest;

/**
 * Minimal `request-promise` compatible adapter built on axios.
 *
 * `request` and `request-promise` are deprecated and unmaintained, and carry
 * unpatchable advisories (form-data, tough-cookie, qs). This keeps the option
 * shape the rest of the package already passes, so call sites are unchanged.
 *
 * Like request-promise, it resolves with the response *body* rather than the
 * response object, and rejects on a non-2xx status.
 *
 * Supported options: url, method, headers, form, body, qs, encoding.
 * `encoding: null` resolves with a Buffer, matching request's behaviour.
 */
async function sendRequest(options = {}) {
  const {
    url,
    method = 'GET',
    headers = {},
    form,
    body,
    qs,
    encoding,
  } = options;

  const wantsBuffer = encoding === null;

  // request() serialised `form` as application/x-www-form-urlencoded
  let data = body;
  let requestHeaders = headers;
  if (form !== undefined) {
    data = new URLSearchParams(form).toString();
    if (!hasHeader(headers, 'content-type')) {
      requestHeaders = {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      };
    }
  }

  const response = await axios({
    url,
    method,
    headers: requestHeaders,
    params: qs,
    data,
    responseType: wantsBuffer ? 'arraybuffer' : 'text',
    // request-promise only parsed JSON when `json: true` was passed, which this
    // package never does - callers JSON.parse themselves. Keep the body raw.
    transformResponse: [(raw) => raw],
    validateStatus: (status) => status >= 200 && status < 300,
  });

  return wantsBuffer ? Buffer.from(response.data) : response.data;
}

function hasHeader(headers, name) {
  return Object.keys(headers).some((key) => key.toLowerCase() === name);
}
