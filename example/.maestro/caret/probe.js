// Talks to the caret probe (caret-probe.mjs on Android). ACTION=measure (the
// default) asks whether the caret is visible; ACTION=paste pastes a block.
// Without CARET_PROBE the checkpoint is only a screenshot.
/* global output, http, json, CARET_PROBE, CARET_SOFT, ACTION, LABEL */
output.caretOk = true;
if (typeof CARET_PROBE !== 'undefined' && CARET_PROBE) {
  const action = typeof ACTION !== 'undefined' && ACTION ? ACTION : 'measure';
  const response = http.get(
    CARET_PROBE + '/' + action + '?label=' + encodeURIComponent(LABEL)
  );
  const result = json(response.body);
  console.log(
    action +
      ' ' +
      LABEL +
      ' ok:' +
      result.ok +
      ' margin:' +
      result.marginDp +
      'dp'
  );
  output.caretOk =
    result.ok || (typeof CARET_SOFT !== 'undefined' && CARET_SOFT === 'true');
}
