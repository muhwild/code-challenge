var sum_to_n_a  = function(n) {
    var s = n < 0 ? -1 : 1;
    var m =Math.abs(n);
    var total = m % 2 === 0 ? (m / 2) * (m + 1) : m * ((m + 1) / 2);
    return s * total;
};

var sum_to_n_b = function(n) {
    var sign = n < 0 ? -1 : 1;
    var m = Math.abs(n);
    var total = 0;
    for (var i = 1; i <= m; i++) {
        total += i;
    }
    return sign * total;
};

var sum_to_n_c = function(n) {
    var sign = n < 0 ? -1 : 1;
    var m = Math.abs(n);

    function range(lo, hi) {
        if (lo > hi) return 0;
        if (lo === hi) return lo;
        var mid = Math.floor((lo + hi) / 2);
        return range(lo, mid) + range(mid + 1, hi);
    }

    return sign * range(1, m);
};