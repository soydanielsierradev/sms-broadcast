const noop = () => {};
const identity = (x) => x;

module.exports = {
  makeMutable: (value) => ({ value }),
  withRepeat: identity,
  withSequence: (...args) => args[0],
  cancelAnimation: noop,
  withTiming: identity,
  withDelay: (_delay, animation) => animation,
  Easing: {
    linear: identity,
    ease: identity,
    bezier: () => identity,
    in: (e) => e,
    out: (e) => e,
    inOut: (e) => e,
  },
};
