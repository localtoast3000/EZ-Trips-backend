export function caseInsensitiveSearchString(searchString) {
  return new RegExp(`^${searchString}$`, 'i');
}

const emailRegEx =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

//validate body with strict number of parameters => use if all the parameters are necessary (i.e.: signup)
export function validateReqBody({ body, expectedPropertys }) {
  if (!body) return false;
  if (Object.keys(body).length !== expectedPropertys.length) return false;
  if (!Object.keys(body).every((key) => expectedPropertys.includes(key))) return false;
  if (!Object.values(body).every((val) => !['', null, undefined, false, 'undefined'].includes(val))) return false;
  return true;
}

export function validateEmail(email) {
  if (emailRegEx.test(email)) return true;
}

export function findHashtags(str) {
  return str.split(' ').filter((x) => x[0] === '#');
}

//validate specific parameters of the body without checking their numbers => use if some parameters are not necessary (i.e.: signin)
export function checkBody(body, keys) {
  let isValid = true;

  for (const field of keys) {
    if (!body[field] || body[field] === '') {
      isValid = false;
    }
  }

  return isValid;
}
