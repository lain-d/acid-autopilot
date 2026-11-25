/* Acid Autopilot filter: a four-stage diode ladder low-pass, the topology used in the classic acid bass machines.
   Same model as Squelch 16, plus a "stop" message so a finished track's filter is released instead of running forever.

   Model (stage outputs y1..y4, wc = cutoff, k = feedback amount, x = input):
     u   = tanh(x - k*y4)
     y1' = wc * (u + y2 - y1)
     y2' = wc * ((y1 + y3)/2 - y2)
     y3' = wc * ((y2 + y4)/2 - y3)
     y4' = wc * (y3/2 - y4)
   Integrated with the trapezoidal rule and solved without a delay in the feedback loop, at 2x oversampling. */
var CAL = 1.414;     /* scales the cutoff so the knob's frequency lands on the resonant peak */
var KMAX = 16.4;     /* the linear model self-oscillates at k = 17 */
var RCURVE = 1.5, MAKEUP = 0.9;

class SquelchLadder extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "cutoff", defaultValue: 500, minValue: 1, maxValue: 30000, automationRate: "a-rate" },
      { name: "detune", defaultValue: 0, minValue: -12000, maxValue: 12000, automationRate: "a-rate" },
      { name: "res", defaultValue: 0.5, minValue: -4, maxValue: 4, automationRate: "a-rate" }
    ];
  }
  constructor() {
    super();
    this.s1 = 0; this.s2 = 0; this.s3 = 0; this.s4 = 0; this.xp = 0; this.alive = true;
    var self = this;
    this.port.onmessage = function (e) { if (e.data === "stop") self.alive = false; };
  }
  process(inputs, outputs, params) {
    if (!this.alive) return false;
    var out = outputs[0] && outputs[0][0];
    if (!out) return true;
    var inp = inputs[0] && inputs[0][0];
    /* silent input and a settled filter: nothing to compute (the lead is quiet for most of a track) */
    if (!inp || (Math.abs(this.s1) + Math.abs(this.s2) + Math.abs(this.s3) + Math.abs(this.s4) < 1e-7)) {
      var quiet = true;
      if (inp) for (var q = 0; q < inp.length; q += 4) if (inp[q] > 1e-7 || inp[q] < -1e-7) { quiet = false; break; }
      if (quiet) { out.fill(0); this.xp = 0; return true; }
    }
    var n = out.length, pc = params.cutoff, pd = params.detune, pr = params.res;
    var s1 = this.s1, s2 = this.s2, s3 = this.s3, s4 = this.s4, xp = this.xp;
    var fs2 = sampleRate * 2, fmax = sampleRate * 0.45;
    var g = 0, hg = 0, k = 0, a2 = 0, a3 = 0, a4 = 0, i1 = 0, D2 = 1, D3 = 1, A = 0, den = 1, den0 = 1, og = 1;
    for (var i = 0; i < n; i++) {
      if ((i & 3) === 0) {
        var fc = (pc.length > 1 ? pc[i] : pc[0]) * Math.pow(2, (pd.length > 1 ? pd[i] : pd[0]) / 1200) * CAL;
        if (!(fc > 20)) fc = 20; else if (fc > fmax) fc = fmax;
        var r = pr.length > 1 ? pr[i] : pr[0];
        if (!(r > 0)) r = 0; else if (r > 1) r = 1;
        k = KMAX * (1 - Math.pow(1 - r, RCURVE));
        og = 1.3 * Math.pow(1 + k, MAKEUP);
        g = Math.tan(Math.PI * fc / fs2); hg = g * 0.5;
        i1 = 1 / (1 + g);
        a4 = hg * i1;
        D3 = 1 + g - hg * a4; a3 = hg / D3;
        D2 = 1 + g - hg * a3; a2 = hg / D2;
        A = a4 * a3 * a2;
        den0 = 1 + g - g * a2;
        den = den0 + g * k * A;
      }
      var x = inp ? inp[i] : 0, acc = 0;
      for (var h = 0; h < 2; h++) {
        var xin = (h === 0 ? (xp + x) * 0.5 : x);
        var b4 = s4 * i1;
        var b3 = (s3 + hg * b4) / D3;
        var b2 = (s2 + hg * b3) / D2;
        var B = a4 * a3 * b2 + a4 * b3 + b4;
        var y1 = (g * xin + s1 + g * b2 - g * k * B) / den;
        var u = Math.tanh(xin - k * (A * y1 + B));
        y1 = (g * u + s1 + g * b2) / den0;
        var y2 = a2 * y1 + b2, y3 = a3 * y2 + b3, y4 = a4 * y3 + b4;
        s1 = 2 * y1 - s1; s2 = 2 * y2 - s2; s3 = 2 * y3 - s3; s4 = 2 * y4 - s4;
        acc += y4;
      }
      xp = x;
      out[i] = acc * 0.5 * og;
    }
    if (!(Math.abs(s1) < 1e6)) { s1 = 0; s2 = 0; s3 = 0; s4 = 0; }
    if (Math.abs(s1) < 1e-20) s1 = 0;
    if (Math.abs(s2) < 1e-20) s2 = 0;
    if (Math.abs(s3) < 1e-20) s3 = 0;
    if (Math.abs(s4) < 1e-20) s4 = 0;
    this.s1 = s1; this.s2 = s2; this.s3 = s3; this.s4 = s4; this.xp = xp;
    return true;
  }
}
registerProcessor("squelch-ladder", SquelchLadder);
