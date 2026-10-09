// Which body is loaded. The two bodies are separate scans (Visible Human male and female), so switching
// reloads the page with the other model set. Order of precedence: ?body= in the URL, last choice, male.
let saved = null; try { saved = localStorage.getItem('anatomy-body'); } catch (e) { /* private mode */ }
const asked = new URLSearchParams(location.search).get('body');
export const BODY = (asked || saved) === 'female' ? 'female' : 'male';
export const OTHER_BODY = BODY === 'female' ? 'male' : 'female';
// Pick the wording or data for the current body.
export const by = (male, female) => (BODY === 'female' ? female : male);
export function switchBody() {
  try { localStorage.setItem('anatomy-body', OTHER_BODY); } catch (e) { /* private mode */ }
  const u = new URL(location.href); u.searchParams.set('body', OTHER_BODY); u.hash = ''; location.href = u.toString();
}
